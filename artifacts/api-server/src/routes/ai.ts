import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, interactionsTable, tasksTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
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
      model: "gpt-5-mini",
      temperature: 0.7,
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
      model: "gpt-5-mini",
      temperature: 0.7,
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

router.post("/chat", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { messages, contactId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Bad Request", message: "messages array required" });
      return;
    }

    let contactContext = "";
    if (contactId) {
      const [contact] = await db.select().from(contactsTable).where(
        and(eq(contactsTable.id, contactId), eq(contactsTable.userId, user.id))
      );
      if (contact) {
        const interactions = await db.select().from(interactionsTable)
          .where(eq(interactionsTable.contactId, contactId))
          .orderBy(desc(interactionsTable.occurredAt))
          .limit(5);
        contactContext = `\n\nSelected contact context:\nName: ${contact.name}\nRole: ${contact.role || "N/A"} at ${contact.company || "N/A"}\nLast interaction: ${interactions[0]?.summary || "None"}`;
      }
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are NexusLink, an AI assistant for a personal CRM. You help the user remember people, draft communications, and manage relationships. You have access to their contacts data when provided. Be helpful, concise, and use markdown formatting when appropriate.${contactContext}`
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
