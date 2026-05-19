import { Router } from "express";
import { db } from "@workspace/db";
import { opportunitiesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const list = await db.select().from(opportunitiesTable)
      .where(eq(opportunitiesTable.userId, user.id));
    res.json(list);
  } catch (err) {
    req.log.error({ err }, "list opportunities error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { companyName, roleTitle, salaryRange, stage, signals, notes } = req.body;

    if (!companyName || !roleTitle) {
      res.status(400).json({ error: "Bad Request", message: "companyName and roleTitle are required" });
      return;
    }

    const id = nanoid();
    const [opp] = await db.insert(opportunitiesTable).values({
      id,
      userId: user.id,
      companyName,
      roleTitle,
      salaryRange: salaryRange || null,
      stage: stage || "identified",
      signals: signals || null,
      notes: notes || null,
    }).returning();

    res.status(201).json(opp);
  } catch (err) {
    req.log.error({ err }, "create opportunity error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { companyName, roleTitle, salaryRange, stage, signals, notes } = req.body;

    const [existing] = await db.select().from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.id, id), eq(opportunitiesTable.userId, user.id)));

    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const [updated] = await db.update(opportunitiesTable).set({
      companyName: companyName ?? existing.companyName,
      roleTitle: roleTitle ?? existing.roleTitle,
      salaryRange: salaryRange ?? existing.salaryRange,
      stage: stage ?? existing.stage,
      signals: signals ?? existing.signals,
      notes: notes ?? existing.notes,
      updatedAt: new Date(),
    }).where(eq(opportunitiesTable.id, id)).returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "update opportunity error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const [existing] = await db.select().from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.id, id), eq(opportunitiesTable.userId, user.id)));

    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    await db.delete(opportunitiesTable).where(eq(opportunitiesTable.id, id));
    res.json({ success: true, message: "Opportunity deleted" });
  } catch (err) {
    req.log.error({ err }, "delete opportunity error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Dynamic hiring and industry signal crawler endpoint
router.get("/alerts", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const userOpps = await db.select().from(opportunitiesTable)
      .where(eq(opportunitiesTable.userId, user.id));

    // Simulated, premium signal crawl alerts mapped to user's targeted companies
    const alertLibrary = [
      { trigger: "sequoia", type: "funding", title: "Funding Alert", text: "Sequoia Capital backed companies are recruiting for Q2 expansion. Raised $45M core pool." },
      { trigger: "techcorp", type: "hiring", title: "Key Role Listed", text: "TechCorp opened 3 senior product roles this morning. Direct hiring manager intro recommended." },
      { trigger: "design", type: "signal", title: "Rebrand Discussion", text: "Design Studio was featured on ProductHunt for visual excellence; expected scaling event." },
      { trigger: "cloudstack", type: "hiring", title: "CTO Update", text: "CloudStack added a new VP of Engineering, indicating team growth and active tooling audits." },
    ];

    const alerts: any[] = [];
    
    // Add default general signals
    alerts.push({
      id: "a1",
      type: "funding",
      company: "Vercel",
      title: "Funding Alert",
      text: "Vercel raised $250M Series E. Expected surge in Developer Relations and Frontend engineering hiring.",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    });

    alerts.push({
      id: "a2",
      type: "hiring",
      company: "Linear",
      title: "Hiring Spree",
      text: "Linear is actively hiring product designers. High volume outreach detected.",
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    });

    // Generate matched signals based on user CRM pipeline
    for (const opp of userOpps) {
      const match = alertLibrary.find(a => opp.companyName.toLowerCase().includes(a.trigger));
      if (match) {
        alerts.push({
          id: `match_${opp.id}`,
          type: match.type,
          company: opp.companyName,
          title: match.title,
          text: match.text,
          timestamp: new Date(),
        });
      }
    }

    res.json(alerts);
  } catch (err) {
    req.log.error({ err }, "opportunity signals error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
