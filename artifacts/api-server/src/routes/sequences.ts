import { Router } from "express";
import { db } from "@workspace/db";
import { sequencesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
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

router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const list = await db.select().from(sequencesTable)
      .where(eq(sequencesTable.userId, user.id));
    res.json(list);
  } catch (err) {
    req.log.error({ err }, "list sequences error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { name, steps, status } = req.body;

    if (!name) {
      res.status(400).json({ error: "Bad Request", message: "Sequence name is required" });
      return;
    }

    const id = nanoid();
    const [seq] = await db.insert(sequencesTable).values({
      id,
      userId: user.id,
      name,
      steps: typeof steps === "object" ? JSON.stringify(steps) : (steps || "[]"),
      status: status || "active",
    }).returning();

    res.status(201).json(seq);
  } catch (err) {
    req.log.error({ err }, "create sequence error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { name, steps, status } = req.body;

    const [existing] = await db.select().from(sequencesTable)
      .where(and(eq(sequencesTable.id, id), eq(sequencesTable.userId, user.id)));

    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const [updated] = await db.update(sequencesTable).set({
      name: name ?? existing.name,
      steps: typeof steps === "object" ? JSON.stringify(steps) : (steps ?? existing.steps),
      status: status ?? existing.status,
      updatedAt: new Date(),
    }).where(eq(sequencesTable.id, id)).returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "update sequence error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const [existing] = await db.select().from(sequencesTable)
      .where(and(eq(sequencesTable.id, id), eq(sequencesTable.userId, user.id)));

    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    await db.delete(sequencesTable).where(eq(sequencesTable.id, id));
    res.json({ success: true, message: "Sequence deleted" });
  } catch (err) {
    req.log.error({ err }, "delete sequence error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// AI: Desperation-Alert score and recovery tone validation
router.post("/analyze-message", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Bad Request", message: "message string is required in request body" });
      return;
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert executive communications coach. Analyze outreach/follow-up email drafts for desperation indicators (pleading, excessive exclamation marks, apologies for following up, offering to work for free, over-explaining, self-deprecation). Return valid JSON only, no markdown."
        },
        {
          role: "user",
          content: `Analyze this outreach message draft:
"${message}"

Return a JSON object with:
- "desperationScore": number (0 = extremely confident & value-first, 100 = desperate/pleading)
- "triggers": array of strings (exact phrases or structural elements triggering the desperation score)
- "suggestions": array of strings (how to improve the tone to project high-value authority)
- "rewrittenMessage": string (a confident, concise, high-value, forwardable rewrite of the user's message)`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { desperationScore: 30, triggers: ["Error parsing"], suggestions: [], rewrittenMessage: message };
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "analyze-message error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
