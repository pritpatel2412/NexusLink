import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, interactionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth.js";
import OpenAI from "openai";

const router = Router();
router.use(requireAuth);

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

function daysSince(date: Date | string | null | undefined): number {
  if (!date) return 999;
  const d = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// Calculate relationship score based on decay equation: S(t) = 100 * e^(-0.05 * t)
function calculateDecayScore(days: number): number {
  if (days === 999) return 10; // default base score for never contacted
  const score = Math.round(100 * Math.exp(-0.05 * days));
  return Math.max(10, score);
}

router.get("/paths", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { company } = req.query;

    if (!company || typeof company !== "string") {
      res.status(400).json({ error: "Bad Request", message: "company query parameter is required" });
      return;
    }

    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    const recentInteractions = await db.select().from(interactionsTable)
      .where(eq(interactionsTable.userId, user.id))
      .orderBy(desc(interactionsTable.occurredAt));

    // Map last interactions
    const lastInteractionByContact: Record<string, Date> = {};
    for (const i of recentInteractions) {
      if (!lastInteractionByContact[i.contactId]) {
        lastInteractionByContact[i.contactId] = new Date(i.occurredAt);
      }
    }

    const targetCompanyLower = company.toLowerCase();

    // 1st Degree Paths (directly works or worked at the target company)
    const firstDegree = contacts.filter((c) => {
      const currentMatch = c.company?.toLowerCase().includes(targetCompanyLower);
      const pastMatch = c.pastCompanies?.toLowerCase().includes(targetCompanyLower);
      return currentMatch || pastMatch;
    });

    const paths: any[] = [];

    // Process 1st degree paths
    for (const c of firstDegree) {
      const days = daysSince(lastInteractionByContact[c.id]);
      const score = calculateDecayScore(days);
      const isPast = !c.company?.toLowerCase().includes(targetCompanyLower) && !!c.pastCompanies?.toLowerCase().includes(targetCompanyLower);

      paths.push({
        degree: 1,
        path: [
          {
            id: c.id,
            name: c.name,
            company: c.company,
            role: c.role,
            pastCompanies: c.pastCompanies,
            relationshipScore: score,
            lastContactedDaysAgo: days === 999 ? null : days,
          },
        ],
        score,
        targetContact: c.name,
        company: company,
        description: isPast ? `${c.name} formerly worked at ${company}` : `${c.name} currently works at ${company}`,
      });
    }

    // 2nd Degree Paths (traversing introduced_by)
    // A -> B where B works at the target company, and A introduced B to us (or B introduced A)
    for (const c of contacts) {
      const worksAtTarget = c.company?.toLowerCase().includes(targetCompanyLower) || c.pastCompanies?.toLowerCase().includes(targetCompanyLower);
      if (worksAtTarget) {
        // Look for contacts who introduced c, or whom c introduced
        const connectors = contacts.filter((conn) => {
          if (c.introducedBy && conn.name.toLowerCase() === c.introducedBy.toLowerCase()) return true;
          if (conn.introducedBy && c.name.toLowerCase() === conn.introducedBy.toLowerCase()) return true;
          return false;
        });

        for (const conn of connectors) {
          const daysConn = daysSince(lastInteractionByContact[conn.id]);
          const scoreConn = calculateDecayScore(daysConn);
          
          const daysTarget = daysSince(lastInteractionByContact[c.id]);
          const scoreTarget = calculateDecayScore(daysTarget);

          // Path score is the conservative minimum score of the connection
          const pathScore = Math.min(scoreConn, scoreTarget);

          paths.push({
            degree: 2,
            path: [
              {
                id: conn.id,
                name: conn.name,
                company: conn.company,
                role: conn.role,
                relationshipScore: scoreConn,
                lastContactedDaysAgo: daysConn === 999 ? null : daysConn,
              },
              {
                id: c.id,
                name: c.name,
                company: c.company,
                role: c.role,
                relationshipScore: scoreTarget,
                lastContactedDaysAgo: daysTarget === 999 ? null : daysTarget,
              },
            ],
            score: pathScore,
            targetContact: c.name,
            company: company,
            description: `Connect through ${conn.name} who introduced or has high affinity with ${c.name}`,
          });
        }
      }
    }

    // Sort paths by highest affinity/relationship score
    paths.sort((a, b) => b.score - a.score);

    res.json(paths);
  } catch (err) {
    req.log.error({ err }, "network paths error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI: Generate forwardable intro text
router.post("/intro-hook", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { connectorName, targetName, targetCompany, targetRole } = req.body;

    if (!connectorName || !targetName || !targetCompany) {
      res.status(400).json({ error: "Bad Request", message: "connectorName, targetName, and targetCompany are required" });
      return;
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional outreach assistant. Write a short, warm, and highly effective 3-line warm intro request that a builder can send to their connector (contact A) to get introduced to a target lead (contact B). Make it sound natural, respectful, and value-focused.",
        },
        {
          role: "user",
          content: `Write a 3-line intro request.
Connector: ${connectorName}
Target Name: ${targetName}
Target Company: ${targetCompany}
Target Role: ${targetRole || "representative"}
Founder/Builder Name: ${user.name || "Alex"}`,
        },
      ],
    });

    const hook = completion.choices[0]?.message?.content || "";
    res.json({ hook });
  } catch (err) {
    req.log.error({ err }, "intro-hook error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
