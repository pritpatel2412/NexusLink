import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, contactTagsTable, interactionsTable, tasksTable, remindersTable } from "@workspace/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
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

// ── GET /api/ai/network-pulse ─────────────────────────────────────────
// Generates AI-powered network intelligence: who to reach out today,
// relationship alerts, and opportunities.
router.post("/network-pulse", async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const contacts = await db.select().from(contactsTable)
      .where(eq(contactsTable.userId, user.id));

    if (contacts.length === 0) {
      res.json({
        priorityContacts: [],
        alerts: [],
        opportunities: [],
        summary: "Add some contacts to get AI-powered network insights.",
      });
      return;
    }

    const recentInteractions = await db.select().from(interactionsTable)
      .where(eq(interactionsTable.userId, user.id))
      .orderBy(desc(interactionsTable.occurredAt))
      .limit(100);

    const lastInteractionByContact: Record<string, { date: Date; summary: string; type: string }> = {};
    for (const i of recentInteractions) {
      if (!lastInteractionByContact[i.contactId]) {
        lastInteractionByContact[i.contactId] = {
          date: new Date(i.occurredAt),
          summary: i.summary,
          type: i.type,
        };
      }
    }

    const contactData = contacts.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      company: c.company,
      whereMet: c.whereMet,
      topicsDiscussed: c.topicsDiscussed,
      notes: c.notes,
      daysSinceLastContact: daysSince(lastInteractionByContact[c.id]?.date),
      lastInteraction: lastInteractionByContact[c.id]
        ? `${lastInteractionByContact[c.id].type}: ${lastInteractionByContact[c.id].summary}`
        : "Never contacted",
    }));

    const contactsSummary = contactData
      .sort((a, b) => a.daysSinceLastContact - b.daysSinceLastContact)
      .map(c =>
        `- ${c.name}${c.role ? ` (${c.role}${c.company ? ` @ ${c.company}` : ""})` : ""}: Last contact ${c.daysSinceLastContact === 999 ? "never" : c.daysSinceLastContact + " days ago"}. ${c.lastInteraction}.${c.topicsDiscussed ? ` Shared topics: ${c.topicsDiscussed}` : ""}`
      )
      .join("\n");

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert relationship intelligence AI for a personal CRM. Analyze the user's network and generate actionable insights. Always respond with valid JSON only, no markdown code blocks.`
        },
        {
          role: "user",
          content: `Analyze this network and return a JSON object with:
- "priorityContacts": array of up to 5 objects, each with { "id": string, "name": string, "reason": string (why reach out now, 1 sentence), "urgency": "high"|"medium"|"low", "suggestedAction": string (specific action, e.g. "Send a quick check-in about their product launch") }
- "alerts": array of up to 3 objects with { "name": string, "message": string (e.g. "45 days since last contact - relationship cooling"), "severity": "warning"|"critical" }
- "opportunities": array of up to 3 objects with { "title": string, "description": string }
- "summary": string (1-2 sentence network health summary)

Contact network:
${contactsSummary}

Today's date: ${new Date().toLocaleDateString()}. Prioritize contacts that haven't been reached in 14-60 days, or ones with upcoming opportunities.`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { priorityContacts: [], alerts: [], opportunities: [], summary: raw };
    }

    res.json(parsed);
  } catch (err: any) {
    req.log.error({ err }, "network-pulse error");
    res.status(500).json({ error: "Internal Server Error", message: "AI is currently unavailable." });
  }
});

// ── POST /api/ai/relationship-score ──────────────────────────────────
// Returns a relationship intelligence analysis for a specific contact.
router.post("/relationship-score", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { contactId } = req.body;

    if (!contactId) {
      res.status(400).json({ error: "Bad Request", message: "contactId required" });
      return;
    }

    const [contact] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, contactId), eq(contactsTable.userId, user.id))
    );
    if (!contact) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const interactions = await db.select().from(interactionsTable)
      .where(eq(interactionsTable.contactId, contactId))
      .orderBy(desc(interactionsTable.occurredAt))
      .limit(20);

    const tasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.contactId, contactId), eq(tasksTable.userId, user.id)));

    const last = interactions[0];
    const daysSinceLast = daysSince(last?.occurredAt);
    const interactionCount = interactions.length;
    const last30Days = interactions.filter(i => daysSince(i.occurredAt) <= 30).length;

    let baseScore = 50;
    if (interactionCount === 0) baseScore = 15;
    else if (daysSinceLast <= 7) baseScore = 90;
    else if (daysSinceLast <= 14) baseScore = 80;
    else if (daysSinceLast <= 30) baseScore = 65;
    else if (daysSinceLast <= 60) baseScore = 45;
    else if (daysSinceLast <= 90) baseScore = 30;
    else baseScore = 15;

    if (interactionCount >= 10) baseScore = Math.min(100, baseScore + 10);
    else if (interactionCount >= 5) baseScore = Math.min(100, baseScore + 5);
    if (last30Days >= 3) baseScore = Math.min(100, baseScore + 10);
    if (contact.notes) baseScore = Math.min(100, baseScore + 3);
    if (contact.linkedinUrl || contact.twitterUrl) baseScore = Math.min(100, baseScore + 2);

    const contextText = `
Contact: ${contact.name}
Role: ${contact.role || "Unknown"} at ${contact.company || "Unknown"}
Where met: ${contact.whereMet || "Unknown"}
Topics discussed: ${contact.topicsDiscussed || "None"}
Notes: ${contact.notes || "None"}
Days since last contact: ${daysSinceLast === 999 ? "Never" : daysSinceLast}
Total interactions: ${interactionCount}
Interactions in last 30 days: ${last30Days}
Recent interactions:
${interactions.slice(0, 5).map(i => `- ${i.type.toUpperCase()} (${daysSince(i.occurredAt)} days ago): ${i.summary}`).join("\n") || "None"}
Open tasks: ${tasks.filter(t => t.status === "pending").map(t => t.title).join(", ") || "None"}
    `.trim();

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a relationship intelligence AI. Analyze the relationship health and return valid JSON only, no markdown."
        },
        {
          role: "user",
          content: `Based on this relationship data, return a JSON object with:
- "score": number ${baseScore} (use this as your base, adjust ±10 based on context quality)
- "label": "Thriving" | "Active" | "Warm" | "Cooling" | "At Risk" | "Dormant"
- "trend": "improving" | "stable" | "declining"
- "insights": array of 3 strings (specific observations about the relationship, be concrete and actionable)
- "nextAction": string (single most important next action, specific and actionable)
- "bestTimeToReach": string (e.g. "Morning emails work well" or "They prefer calls over messages")

Relationship data:
${contextText}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { score: baseScore, label: "Unknown", insights: [], nextAction: "Continue building this relationship." };
    }

    parsed.score = Math.max(0, Math.min(100, parsed.score || baseScore));
    res.json(parsed);
  } catch (err: any) {
    req.log.error({ err }, "relationship-score error");
    res.status(500).json({ error: "Internal Server Error", message: "AI is currently unavailable." });
  }
});

// ── POST /api/ai/summarize ────────────────────────────────────────────
// Summarizes raw notes/text into structured insights.
router.post("/summarize", async (req, res) => {
  try {
    const { text, contactId } = req.body;
    if (!text?.trim()) {
      res.status(400).json({ error: "Bad Request", message: "text is required" });
      return;
    }

    const user = getCurrentUser(req);
    let contactContext = "";
    if (contactId) {
      const [contact] = await db.select().from(contactsTable).where(
        and(eq(contactsTable.id, contactId), eq(contactsTable.userId, user.id))
      );
      if (contact) {
        contactContext = `\nContact this is about: ${contact.name}${contact.role ? `, ${contact.role}` : ""}${contact.company ? ` at ${contact.company}` : ""}`;
      }
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a CRM intelligence assistant. Extract and structure key information from raw notes. Return valid JSON only, no markdown."
        },
        {
          role: "user",
          content: `Analyze these notes and return a JSON object with:
- "keyPoints": array of 3-5 strings (most important takeaways)
- "actionItems": array of strings (specific things to do next)
- "sentiment": "positive" | "neutral" | "negative"  
- "suggestedTags": array of 2-4 tag strings (e.g. "investor", "warm-lead", "follow-up")
- "summary": string (2-3 sentence summary)
- "interactionType": "meeting" | "call" | "email" | "note" | "event" (best guess)
${contactContext}

Raw notes:
${text}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { keyPoints: [], actionItems: [], sentiment: "neutral", suggestedTags: [], summary: raw };
    }
    res.json(parsed);
  } catch (err: any) {
    req.log.error({ err }, "summarize error");
    res.status(500).json({ error: "Internal Server Error", message: "AI unavailable." });
  }
});

// ── POST /api/ai/brief ────────────────────────────────────────────────
router.post("/brief", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { contactId } = req.body;

    if (!contactId) {
      res.status(400).json({ error: "Bad Request", message: "contactId required" });
      return;
    }

    const [contact] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, contactId), eq(contactsTable.userId, user.id))
    );
    if (!contact) {
      res.status(404).json({ error: "Not Found", message: "Contact not found" });
      return;
    }

    const interactions = await db.select().from(interactionsTable)
      .where(eq(interactionsTable.contactId, contactId))
      .orderBy(desc(interactionsTable.occurredAt))
      .limit(5);

    const tasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.contactId, contactId), eq(tasksTable.status, "pending")));

    const contextText = `
Contact: ${contact.name}
Role: ${contact.role || "Unknown"} at ${contact.company || "Unknown company"}
Location: ${contact.location || "Unknown"}
Where we met: ${contact.whereMet || "Unknown"}
Topics discussed: ${contact.topicsDiscussed || "None recorded"}
Notes: ${contact.notes || "None"}

Recent interactions (last 5):
${interactions.map(i => `- ${i.type.toUpperCase()} on ${new Date(i.occurredAt).toLocaleDateString()}: ${i.summary}`).join("\n") || "No interactions recorded"}

Open tasks:
${tasks.map(t => `- [${t.priority.toUpperCase()}] ${t.title} (due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "no date"})`).join("\n") || "No open tasks"}
    `.trim();

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a personal CRM assistant. Given information about a contact and their interaction history, generate a concise pre-meeting brief. Format it with clear sections: Who They Are, Last Topics Discussed, Open Action Items, and Suggested Talking Points. Use markdown formatting with bullet points."
        },
        {
          role: "user",
          content: `Generate a meeting brief for this contact:\n\n${contextText}`
        }
      ]
    });

    const brief = completion.choices[0]?.message?.content || "Unable to generate brief at this time.";
    res.json({ brief, contactId });
  } catch (err: any) {
    req.log.error({ err }, "generate brief error");
    if (err.code === "insufficient_quota" || err.status === 429) {
      res.status(503).json({ error: "Service Unavailable", message: "AI is currently unavailable, please try again." });
    } else {
      res.status(500).json({ error: "Internal Server Error", message: "AI is currently unavailable, please try again." });
    }
  }
});

// ── POST /api/ai/draft-email ──────────────────────────────────────────
router.post("/draft-email", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { contactId, context } = req.body;

    if (!contactId) {
      res.status(400).json({ error: "Bad Request", message: "contactId required" });
      return;
    }

    const [contact] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, contactId), eq(contactsTable.userId, user.id))
    );
    if (!contact) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const interactions = await db.select().from(interactionsTable)
      .where(eq(interactionsTable.contactId, contactId))
      .orderBy(desc(interactionsTable.occurredAt))
      .limit(3);

    const tasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.contactId, contactId), eq(tasksTable.status, "pending")));

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are helping a founder write a professional, warm follow-up email. Provide a subject line followed by the email body. Format: 'Subject: [subject]\\n\\n[email body]'"
        },
        {
          role: "user",
          content: `Draft a follow-up email to ${contact.name}${contact.role ? `, ${contact.role}` : ""}${contact.company ? ` at ${contact.company}` : ""}.
          
Last interaction: ${interactions[0] ? `${interactions[0].type} - ${interactions[0].summary}` : "No previous interaction"}
Open tasks: ${tasks.map(t => t.title).join(", ") || "None"}
Additional context: ${context || "None"}

Write a warm, professional email.`
        }
      ]
    });

    const content = completion.choices[0]?.message?.content || "";
    const lines = content.split("\n");
    const subjectLine = lines.find(l => l.startsWith("Subject:")) || "Subject: Following up";
    const subject = subjectLine.replace("Subject:", "").trim();
    const body = lines.filter(l => !l.startsWith("Subject:")).join("\n").trim();

    res.json({ subject, body });
  } catch (err: any) {
    req.log.error({ err }, "draft email error");
    res.status(500).json({ error: "Internal Server Error", message: "AI is currently unavailable, please try again." });
  }
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────
// Now with FULL CRM context when no specific contact is selected.
router.post("/chat", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { messages, contactId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Bad Request", message: "messages array required" });
      return;
    }

    let systemContext = "";

    if (contactId) {
      const [contact] = await db.select().from(contactsTable).where(
        and(eq(contactsTable.id, contactId), eq(contactsTable.userId, user.id))
      );
      if (contact) {
        const interactions = await db.select().from(interactionsTable)
          .where(eq(interactionsTable.contactId, contactId))
          .orderBy(desc(interactionsTable.occurredAt))
          .limit(5);
        systemContext = `\n\n=== Selected Contact: ${contact.name} ===\nRole: ${contact.role || "N/A"} at ${contact.company || "N/A"}\nTopics: ${contact.topicsDiscussed || "N/A"}\nNotes: ${contact.notes || "N/A"}\nRecent interactions:\n${interactions.map(i => `- ${i.type}: ${i.summary} (${daysSince(i.occurredAt)} days ago)`).join("\n") || "None"}`;
      }
    } else {
      const allContacts = await db.select().from(contactsTable)
        .where(eq(contactsTable.userId, user.id));

      const recentInteractions = await db.select().from(interactionsTable)
        .where(eq(interactionsTable.userId, user.id))
        .orderBy(desc(interactionsTable.occurredAt))
        .limit(50);

      const lastByContact: Record<string, { days: number; summary: string }> = {};
      for (const i of recentInteractions) {
        if (!lastByContact[i.contactId]) {
          lastByContact[i.contactId] = { days: daysSince(i.occurredAt), summary: i.summary };
        }
      }

      const pendingTasks = await db.select().from(tasksTable)
        .where(and(eq(tasksTable.userId, user.id), eq(tasksTable.status, "pending")))
        .limit(10);

      const upcomingReminders = await db.select().from(remindersTable)
        .where(and(eq(remindersTable.userId, user.id), eq(remindersTable.sent, false)))
        .limit(10);

      systemContext = `

=== YOUR FULL CRM NETWORK (${allContacts.length} contacts) ===
${allContacts.map(c =>
  `• ${c.name}${c.role ? ` — ${c.role}` : ""}${c.company ? ` @ ${c.company}` : ""}${c.location ? `, ${c.location}` : ""} | Last contact: ${lastByContact[c.id] ? `${lastByContact[c.id].days} days ago (${lastByContact[c.id].summary.slice(0, 60)}...)` : "never"}`
).join("\n")}

=== PENDING TASKS (${pendingTasks.length}) ===
${pendingTasks.map(t => `• [${t.priority.toUpperCase()}] ${t.title}${t.dueDate ? ` — due ${new Date(t.dueDate).toLocaleDateString()}` : ""}`).join("\n") || "No pending tasks"}

=== UPCOMING REMINDERS ===
${upcomingReminders.map(r => `• ${r.message} — at ${new Date(r.remindAt).toLocaleDateString()}`).join("\n") || "No upcoming reminders"}

Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
Use this real data to answer the user's questions accurately.`;
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are NexusLink AI — an elite personal CRM assistant for founders, freelancers, and creators. You have deep knowledge of the user's entire relationship network. Help them remember people, identify opportunities, draft communications, and manage their network strategically. Use the real data provided. Be specific, insightful, and actionable. Use markdown formatting when appropriate.${systemContext}`
        },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ]
    });

    const responseMessage = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    res.json({ message: responseMessage, role: "assistant" });
  } catch (err: any) {
    req.log.error({ err }, "ai chat error");
    res.status(500).json({ error: "Internal Server Error", message: "AI is currently unavailable, please try again." });
  }
});

export default router;
