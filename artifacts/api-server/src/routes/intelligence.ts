import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, contactTagsTable, interactionsTable, tasksTable } from "@workspace/db/schema";
import { eq, and, desc, gte, sql, inArray } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth.js";
import OpenAI from "openai";
import { nanoid } from "nanoid";

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
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

// ─── RHS: Relationship Health Score calculation ─────────────────────────────
// Score = 100 * e^(-0.035*days) + interaction_bonus + consistency_bonus
function calcRHS(params: {
  daysSinceContact: number;
  interactionCount: number;
  hasNotes: boolean;
  hasFollowUpTask: boolean;
}): number {
  const decay = 100 * Math.exp(-0.035 * Math.min(params.daysSinceContact, 365));
  const interactionBonus = Math.min(params.interactionCount * 2, 20);
  const notesBonus = params.hasNotes ? 5 : 0;
  const taskBonus = params.hasFollowUpTask ? 5 : 0;
  return Math.round(Math.min(100, Math.max(1, decay + interactionBonus + notesBonus + taskBonus)));
}

// GET /api/intelligence/rhs — full RHS list for current user
router.get("/rhs", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    if (!contacts.length) { res.json([]); return; }

    const ids = contacts.map(c => c.id);
    const interactions = await db.select().from(interactionsTable)
      .where(and(eq(interactionsTable.userId, user.id), inArray(interactionsTable.contactId, ids)));
    const tasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.userId, user.id), eq(tasksTable.status, "pending"), inArray(tasksTable.contactId as any, ids)));

    const interByContact: Record<string, { count: number; lastDate: Date | null }> = {};
    for (const ix of interactions) {
      if (!interByContact[ix.contactId]) interByContact[ix.contactId] = { count: 0, lastDate: null };
      interByContact[ix.contactId].count++;
      const d = new Date(ix.occurredAt);
      if (!interByContact[ix.contactId].lastDate || d > interByContact[ix.contactId].lastDate!) {
        interByContact[ix.contactId].lastDate = d;
      }
    }
    const taskByContact = new Set(tasks.map(t => t.contactId).filter(Boolean));

    const result = contacts.map(c => {
      const ci = interByContact[c.id] || { count: 0, lastDate: null };
      const days = daysSince(ci.lastDate ?? c.createdAt);
      const rhs = calcRHS({
        daysSinceContact: days,
        interactionCount: ci.count,
        hasNotes: !!c.notes,
        hasFollowUpTask: taskByContact.has(c.id),
      });
      let status: "healthy" | "warm" | "cooling" | "cold" = "healthy";
      if (rhs < 30) status = "cold";
      else if (rhs < 55) status = "cooling";
      else if (rhs < 75) status = "warm";
      return {
        contactId: c.id,
        name: c.name,
        company: c.company,
        role: c.role,
        avatarUrl: c.avatarUrl,
        rhs,
        status,
        daysSinceContact: days === 999 ? null : days,
        interactionCount: ci.count,
        suggestion: rhs < 40
          ? `It's been ${days} days — reach out to ${c.name.split(" ")[0]} now before the connection goes cold.`
          : rhs < 70
          ? `Check in with ${c.name.split(" ")[0]} — a quick note keeps the relationship warm.`
          : `${c.name.split(" ")[0]} is healthy! Keep up the good work.`,
      };
    }).sort((a, b) => a.rhs - b.rhs);

    // Aggregate network health
    const avg = Math.round(result.reduce((s, r) => s + r.rhs, 0) / result.length);
    res.json({ networkHealth: avg, contacts: result });
  } catch (err) {
    req.log.error({ err }, "rhs error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── GET /api/intelligence/daily-briefing ────────────────────────────────────
// AI Daily Briefing: who to reach out to today + draft messages
router.get("/daily-briefing", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    if (!contacts.length) {
      res.json({ date: new Date().toISOString(), recommendations: [], summary: "Add contacts to get your AI daily briefing." });
      return;
    }

    const ids = contacts.map(c => c.id);
    const interactions = await db.select().from(interactionsTable)
      .where(and(eq(interactionsTable.userId, user.id), inArray(interactionsTable.contactId, ids)));

    const interByContact: Record<string, { count: number; lastDate: Date | null; lastSummary: string }> = {};
    for (const ix of interactions) {
      if (!interByContact[ix.contactId]) interByContact[ix.contactId] = { count: 0, lastDate: null, lastSummary: "" };
      interByContact[ix.contactId].count++;
      const d = new Date(ix.occurredAt);
      if (!interByContact[ix.contactId].lastDate || d > interByContact[ix.contactId].lastDate!) {
        interByContact[ix.contactId].lastDate = d;
        interByContact[ix.contactId].lastSummary = ix.summary;
      }
    }

    // Score and rank contacts
    const ranked = contacts.map(c => {
      const ci = interByContact[c.id] || { count: 0, lastDate: null, lastSummary: "" };
      const days = daysSince(ci.lastDate ?? c.createdAt);
      const rhs = calcRHS({ daysSinceContact: days, interactionCount: ci.count, hasNotes: !!c.notes, hasFollowUpTask: false });
      const urgency = 100 - rhs + (days > 60 ? 30 : days > 30 ? 15 : 0);
      return { c, ci, days, rhs, urgency };
    }).sort((a, b) => b.urgency - a.urgency).slice(0, 5);

    // AI draft messages
    const openai = getOpenAI();
    const recommendations = await Promise.all(ranked.map(async ({ c, ci, days, rhs }) => {
      let reason = "Relationship is cooling down";
      if (days > 60) reason = `Haven't connected in ${days} days`;
      else if (days > 30) reason = `It's been over a month since you last spoke`;
      else reason = `Good time to maintain momentum`;

      let draft = "";
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "Write a casual, 2-sentence check-in message from a professional to a contact. Sound warm, genuine, not salesy." },
            { role: "user", content: `From: ${user.name || "me"}\nTo: ${c.name} (${c.role || "professional"} at ${c.company || "their company"})\nContext: Last contact was ${days === 999 ? "never" : `${days} days ago`}. Last interaction: "${ci.lastSummary || "first reach out"}".\nWrite the 2-sentence check-in.` },
          ],
          max_tokens: 120,
        });
        draft = completion.choices[0]?.message?.content || "";
      } catch { draft = `Hey ${c.name.split(" ")[0]}, hope you're doing great! Just wanted to check in and see how things are going.`; }

      return {
        contactId: c.id,
        name: c.name,
        company: c.company,
        role: c.role,
        avatarUrl: c.avatarUrl,
        rhs,
        daysSinceContact: days === 999 ? null : days,
        reason,
        draftMessage: draft,
        priority: rhs < 30 ? "high" : rhs < 60 ? "medium" : "low",
      };
    }));

    res.json({ date: new Date().toISOString(), recommendations, summary: `${recommendations.length} people need your attention today.` });
  } catch (err) {
    req.log.error({ err }, "daily-briefing error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── GET /api/intelligence/signals ───────────────────────────────────────────
// Signal tracker: simulate live signals for contacts
router.get("/signals", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));

    const SIGNAL_TYPES = [
      { type: "job_change", label: "Changed Jobs", icon: "briefcase", urgency: "high", template: (name: string, co: string) => `${name} started a new role at ${co}. Perfect moment to congratulate and reconnect.` },
      { type: "promotion", label: "Got Promoted", icon: "trending-up", urgency: "high", template: (name: string, co: string) => `${name} was promoted at ${co}. A warm congrats message now would stand out.` },
      { type: "funding", label: "Funding Round", icon: "dollar-sign", urgency: "medium", template: (name: string, co: string) => `${co} (${name}'s company) just raised a funding round — great timing to reconnect.` },
      { type: "hiring", label: "Actively Hiring", icon: "users", urgency: "medium", template: (name: string, co: string) => `${co} is hiring — ${name} might be worth reaching out to explore opportunities.` },
      { type: "new_product", label: "New Product Launch", icon: "zap", urgency: "low", template: (name: string, co: string) => `${name}'s company ${co} just launched something new. Great conversation starter.` },
    ];

    // Seed deterministic signals based on contacts (no external API needed)
    const signals = contacts.slice(0, 8).map((c, i) => {
      const sig = SIGNAL_TYPES[i % SIGNAL_TYPES.length];
      const daysAgo = [1, 2, 3, 5, 7, 10, 14, 20][i] || 7;
      return {
        id: `sig_${c.id}_${sig.type}`,
        contactId: c.id,
        contactName: c.name,
        contactCompany: c.company,
        contactRole: c.role,
        contactAvatarUrl: c.avatarUrl,
        type: sig.type,
        label: sig.label,
        icon: sig.icon,
        urgency: sig.urgency,
        message: sig.template(c.name, c.company || "their company"),
        detectedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        daysAgo,
        actioned: false,
      };
    });

    res.json(signals);
  } catch (err) {
    req.log.error({ err }, "signals error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── GET /api/intelligence/heatmap ───────────────────────────────────────────
// Interaction heatmap: last 52 weeks of activity
router.get("/heatmap", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const since = new Date();
    since.setDate(since.getDate() - 364);

    const rows = await db.select({
      day: sql<string>`date(${interactionsTable.occurredAt})`,
      count: sql<number>`count(*)`,
    }).from(interactionsTable)
      .where(and(eq(interactionsTable.userId, user.id), gte(interactionsTable.occurredAt, since)))
      .groupBy(sql`date(${interactionsTable.occurredAt})`);

    const map: Record<string, number> = {};
    for (const r of rows) map[r.day] = Number(r.count);

    // Build 52-week grid
    const weeks: { date: string; count: number }[][] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 363);
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    let week: { date: string; count: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = cursor.toISOString().split("T")[0];
      week.push({ date: key, count: map[key] || 0 });
      if (week.length === 7) { weeks.push(week); week = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (week.length) weeks.push(week);

    const totalInteractions = rows.reduce((s, r) => s + Number(r.count), 0);
    const activeDays = rows.length;
    res.json({ weeks, totalInteractions, activeDays });
  } catch (err) {
    req.log.error({ err }, "heatmap error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── GET /api/intelligence/diversity ─────────────────────────────────────────
router.get("/diversity", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    const tags = await db.select().from(contactTagsTable)
      .where(inArray(contactTagsTable.contactId, contacts.map(c => c.id)));

    const tagMap: Record<string, number> = {};
    for (const t of tags) { tagMap[t.tag] = (tagMap[t.tag] || 0) + 1; }

    const total = contacts.length || 1;
    const industries = [
      { label: "Tech / Engineering", count: contacts.filter(c => /engineer|dev|tech|software|cto|infra/i.test(`${c.role} ${c.company}`)).length },
      { label: "Finance / VC", count: contacts.filter(c => /finance|vc|capital|invest|banking|fund/i.test(`${c.role} ${c.company}`)).length },
      { label: "Design / Creative", count: contacts.filter(c => /design|creative|ux|art|brand/i.test(`${c.role} ${c.company}`)).length },
      { label: "Sales / Marketing", count: contacts.filter(c => /sales|marketing|growth|seo|ads/i.test(`${c.role} ${c.company}`)).length },
      { label: "Other", count: 0 },
    ];
    industries[4].count = total - industries.slice(0, 4).reduce((s, i) => s + i.count, 0);

    const seniority = [
      { label: "Founders / C-Suite", count: contacts.filter(c => /founder|ceo|cto|coo|cfo|co-founder/i.test(c.role || "")).length },
      { label: "Senior / Director", count: contacts.filter(c => /senior|director|lead|head/i.test(c.role || "")).length },
      { label: "Mid-level", count: contacts.filter(c => /manager|engineer|analyst|associate/i.test(c.role || "")).length },
      { label: "Peers / Early Career", count: 0 },
    ];
    seniority[3].count = total - seniority.slice(0, 3).reduce((s, i) => s + i.count, 0);

    const domainSpread = new Set(contacts.map(c => c.company).filter(Boolean)).size;

    const gaps: string[] = [];
    if (industries[1].count / total < 0.1) gaps.push("Your network lacks Finance/VC contacts — diversify to unlock funding opportunities.");
    if (industries[2].count / total < 0.05) gaps.push("Add more Design & Creative contacts to strengthen cross-functional perspectives.");
    if (seniority[0].count / total < 0.1) gaps.push("Aim to connect with more Founders & C-suite executives for strategic introductions.");
    if (domainSpread < 5) gaps.push("Your network spans few companies — expand your reach to more organizations.");
    if (!gaps.length) gaps.push("Your network is well-diversified! Keep expanding to maintain balance.");

    res.json({ total, industries, seniority, domainSpread, gaps });
  } catch (err) {
    req.log.error({ err }, "diversity error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── GET /api/intelligence/mutual?a=name&b=name ───────────────────────────────
router.get("/mutual", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { a, b } = req.query as { a: string; b: string };
    if (!a || !b) { res.status(400).json({ error: "a and b names required" }); return; }

    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    const nameA = a.toLowerCase(); const nameB = b.toLowerCase();

    const contactA = contacts.find(c => c.name.toLowerCase().includes(nameA));
    const contactB = contacts.find(c => c.name.toLowerCase().includes(nameB));

    // Find contacts who introduced either or share companies
    const bridges = contacts.filter(c => {
      if (c.name.toLowerCase().includes(nameA) || c.name.toLowerCase().includes(nameB)) return false;
      const coA = contactA?.company?.toLowerCase();
      const coB = contactB?.company?.toLowerCase();
      const sharesCoA = coA && c.company?.toLowerCase() === coA;
      const sharesCoB = coB && c.company?.toLowerCase() === coB;
      const introdA = c.name.toLowerCase() === contactA?.introducedBy?.toLowerCase();
      const introdB = c.name.toLowerCase() === contactB?.introducedBy?.toLowerCase();
      return sharesCoA || sharesCoB || introdA || introdB;
    });

    res.json({
      contactA: contactA ? { id: contactA.id, name: contactA.name, company: contactA.company, role: contactA.role } : null,
      contactB: contactB ? { id: contactB.id, name: contactB.name, company: contactB.company, role: contactB.role } : null,
      bridges: bridges.map(b => ({ id: b.id, name: b.name, company: b.company, role: b.role })),
    });
  } catch (err) {
    req.log.error({ err }, "mutual error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── GET /api/intelligence/achievements ──────────────────────────────────────
router.get("/achievements", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [contactCount] = await db.select({ n: sql<number>`count(*)` }).from(contactsTable).where(eq(contactsTable.userId, user.id));
    const [interactionCount] = await db.select({ n: sql<number>`count(*)` }).from(interactionsTable).where(eq(interactionsTable.userId, user.id));

    const contacts = Number(contactCount.n);
    const interactions = Number(interactionCount.n);

    const badges = [
      { id: "first_contact", label: "First Connection", desc: "Added your first contact", icon: "👋", earned: contacts >= 1 },
      { id: "networker_5", label: "Networker", desc: "Added 5+ contacts", icon: "🤝", earned: contacts >= 5 },
      { id: "connector_25", label: "Connector", desc: "Added 25+ contacts", icon: "🌐", earned: contacts >= 25 },
      { id: "hub_100", label: "Hub Builder", desc: "Added 100+ contacts", icon: "🏆", earned: contacts >= 100 },
      { id: "first_interaction", label: "First Interaction", desc: "Logged your first interaction", icon: "💬", earned: interactions >= 1 },
      { id: "active_10", label: "Active Connector", desc: "10+ interactions logged", icon: "⚡", earned: interactions >= 10 },
      { id: "power_50", label: "Power Networker", desc: "50+ interactions logged", icon: "🚀", earned: interactions >= 50 },
    ];

    const xp = contacts * 10 + interactions * 5;
    const level = Math.floor(xp / 100) + 1;
    const xpToNext = 100 - (xp % 100);
    const streak = Math.min(7, Math.ceil(interactions / 3)); // simplified streak

    res.json({ xp, level, xpToNext, streak, badges, contacts, interactions });
  } catch (err) {
    req.log.error({ err }, "achievements error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── GET /api/intelligence/roi ────────────────────────────────────────────────
router.get("/roi", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));

    // ROI based on structured notes containing $ amounts or opportunity tags
    const roiContacts = contacts
      .filter(c => c.notes && /\$[\d,]+|deal|opportunity|revenue|offer|salary|contract/i.test(c.notes))
      .map(c => {
        const match = c.notes?.match(/\$[\d,]+/);
        const amount = match ? parseInt(match[0].replace(/[$,]/g, "")) : 0;
        return { id: c.id, name: c.name, company: c.company, role: c.role, amount, notes: c.notes };
      });

    const totalValue = roiContacts.reduce((s, c) => s + c.amount, 0);
    const pipeline = contacts.filter(c => /intro|referral|pipeline|lead/i.test(c.notes || "")).length;

    res.json({
      totalValue,
      pipeline,
      topContacts: roiContacts.slice(0, 5),
      summary: totalValue > 0
        ? `Your network has generated $${totalValue.toLocaleString()} in tracked value.`
        : "Tag contacts with $ amounts in their notes to track network ROI.",
    });
  } catch (err) {
    req.log.error({ err }, "roi error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── POST /api/intelligence/resume-match ─────────────────────────────────────
router.post("/resume-match", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { resumeText } = req.body;
    if (!resumeText) { res.status(400).json({ error: "resumeText required" }); return; }

    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    if (!contacts.length) { res.json({ matches: [], summary: "Add contacts first." }); return; }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a career coach. Analyze a resume and a contact list, then identify which contacts are most relevant to this person's career goals. Return JSON: { skills: string[], targetRoles: string[], matchedContactIds: string[], summary: string }" },
        { role: "user", content: `Resume:\n${resumeText.slice(0, 2000)}\n\nContacts:\n${contacts.slice(0, 30).map(c => `ID:${c.id} ${c.name} - ${c.role} at ${c.company}`).join("\n")}\n\nReturn JSON only.` },
      ],
      response_format: { type: "json_object" },
    });

    let parsed: any = {};
    try { parsed = JSON.parse(completion.choices[0]?.message?.content || "{}"); } catch { }

    const matchedContacts = contacts.filter(c => (parsed.matchedContactIds || []).includes(c.id))
      .map(c => ({ id: c.id, name: c.name, company: c.company, role: c.role, why: `Relevant to your target: ${parsed.targetRoles?.[0] || "your goals"}` }));

    res.json({ skills: parsed.skills || [], targetRoles: parsed.targetRoles || [], matches: matchedContacts, summary: parsed.summary || "Analysis complete." });
  } catch (err) {
    req.log.error({ err }, "resume-match error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── POST /api/intelligence/event-intel ──────────────────────────────────────
router.post("/event-intel", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { eventName, eventDate } = req.body;
    if (!eventName) { res.status(400).json({ error: "eventName required" }); return; }

    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a networking strategist. Given an event and a contact list, identify the top 5 most relevant contacts to meet at this event. For each, generate a personalized icebreaker. Return JSON: { recommendations: [{contactId, icebreaker, reason}] }" },
        { role: "user", content: `Event: ${eventName}${eventDate ? ` on ${eventDate}` : ""}\n\nContacts:\n${contacts.slice(0, 20).map(c => `ID:${c.id} ${c.name} - ${c.role} at ${c.company}`).join("\n")}\n\nReturn JSON only.` },
      ],
      response_format: { type: "json_object" },
    });

    let parsed: any = {};
    try { parsed = JSON.parse(completion.choices[0]?.message?.content || "{}"); } catch { }

    const recs = (parsed.recommendations || []).map((r: any) => {
      const contact = contacts.find(c => c.id === r.contactId);
      return contact ? { ...r, name: contact.name, company: contact.company, role: contact.role } : null;
    }).filter(Boolean);

    res.json({ eventName, recommendations: recs });
  } catch (err) {
    req.log.error({ err }, "event-intel error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
