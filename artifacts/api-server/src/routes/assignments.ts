import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, assignmentJournalTable, contactsTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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

// Get all assignments + journal logs
router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const assignments = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.userId, user.id), eq(tasksTable.type, "assignment")));

    if (assignments.length === 0) {
      res.json([]);
      return;
    }

    const taskIds = assignments.map((t) => t.id);
    const journals = await db.select().from(assignmentJournalTable)
      .where(inArray(assignmentJournalTable.taskId, taskIds));

    const journalsMap = journals.reduce((acc: Record<string, any>, j) => {
      acc[j.taskId] = j;
      return acc;
    }, {});

    // Join contact name if present
    const contactIds = assignments.map(a => a.contactId).filter(Boolean) as string[];
    let contactsMap: Record<string, string> = {};
    if (contactIds.length > 0) {
      const contacts = await db.select().from(contactsTable).where(inArray(contactsTable.id, contactIds));
      contactsMap = contacts.reduce((acc: Record<string, string>, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {});
    }

    const merged = assignments.map((t) => ({
      ...t,
      contactName: t.contactId ? contactsMap[t.contactId] : null,
      journal: journalsMap[t.id] || null,
    }));

    res.json(merged);
  } catch (err) {
    req.log.error({ err }, "list assignments error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create new assignment
router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { title, description, dueDate, priority, contactId, thoughtFootprint, notes } = req.body;

    if (!title) {
      res.status(400).json({ error: "Bad Request", message: "Assignment title is required" });
      return;
    }

    const taskId = nanoid();
    const journalId = nanoid();

    const [task] = await db.insert(tasksTable).values({
      id: taskId,
      userId: user.id,
      contactId: contactId || null,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "medium",
      status: "pending",
      type: "assignment",
    }).returning();

    const [journal] = await db.insert(assignmentJournalTable).values({
      id: journalId,
      taskId: taskId,
      thoughtFootprint: thoughtFootprint || "",
      notes: notes || "",
      status: "pending",
      redFlagScore: 0,
      redFlags: "[]",
    }).returning();

    res.status(201).json({ ...task, journal });
  } catch (err) {
    req.log.error({ err }, "create assignment error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update assignment / journal
router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params; // taskId
    const { title, description, dueDate, priority, status, thoughtFootprint, notes, feedback, journalStatus, redFlagScore, redFlags } = req.body;

    const [task] = await db.select().from(tasksTable).where(
      and(eq(tasksTable.id, id), eq(tasksTable.userId, user.id))
    );

    if (!task) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    // Update Task
    const [updatedTask] = await db.update(tasksTable).set({
      title: title ?? task.title,
      description: description ?? task.description,
      dueDate: dueDate ? new Date(dueDate) : task.dueDate,
      priority: priority ?? task.priority,
      status: status ?? task.status,
      completedAt: status === "done" ? new Date() : task.completedAt,
    }).where(eq(tasksTable.id, id)).returning();

    // Check if Journal exists, if not create, else update
    const [journal] = await db.select().from(assignmentJournalTable).where(eq(assignmentJournalTable.taskId, id));
    let updatedJournal;
    
    if (!journal) {
      [updatedJournal] = await db.insert(assignmentJournalTable).values({
        id: nanoid(),
        taskId: id,
        thoughtFootprint: thoughtFootprint || "",
        notes: notes || "",
        feedback: feedback || null,
        status: journalStatus || "pending",
        redFlagScore: redFlagScore || 0,
        redFlags: redFlags || "[]",
      }).returning();
    } else {
      [updatedJournal] = await db.update(assignmentJournalTable).set({
        thoughtFootprint: thoughtFootprint ?? journal.thoughtFootprint,
        notes: notes ?? journal.notes,
        feedback: feedback ?? journal.feedback,
        status: journalStatus ?? journal.status,
        redFlagScore: redFlagScore ?? journal.redFlagScore,
        redFlags: redFlags ?? journal.redFlags,
        updatedAt: new Date(),
      }).where(eq(assignmentJournalTable.taskId, id)).returning();
    }

    res.json({ ...updatedTask, journal: updatedJournal });
  } catch (err) {
    req.log.error({ err }, "update assignment error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Run AI autopsy & Red Flag scoring
router.post("/:id/autopsy", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params; // taskId

    const [task] = await db.select().from(tasksTable).where(
      and(eq(tasksTable.id, id), eq(tasksTable.userId, user.id))
    );

    if (!task) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const [journal] = await db.select().from(assignmentJournalTable).where(eq(assignmentJournalTable.taskId, id));
    if (!journal) {
      res.status(400).json({ error: "Bad Request", message: "No assignment journal found to analyze." });
      return;
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an elite candidate advocate and interview consultant. Analyze technical interview assignments to detect unfair company demands, spec creep, timeline slippage, and ghosting. Calculate a Red Flag Score from 0 (perfect, respectful process) to 100 (highly toxic/unprofessional). Return valid JSON only, no markdown."
        },
        {
          role: "user",
          content: `Analyze this technical assignment and interview journal:
Assignment: ${task.title}
Instructions/Description: ${task.description || "N/A"}
Developer Thought Log (Progress & Spec Creep): ${journal.thoughtFootprint || "None logged"}
Additional Notes: ${journal.notes || "None logged"}
Interviewer/Company Feedback: ${journal.feedback || "None logged"}

Return a JSON object with:
- "redFlagScore": number (0 to 100)
- "redFlagsList": array of strings (concrete red flags detected, e.g. "Unreasonable workload (>20 hours requested)", "Spec creep after starting", "Cold/generic automated rejection", "Ghosted for over 10 days")
- "whatWentWrong": array of strings (diagnostic of failures in communication or process)
- "candidateLearnings": array of strings (positive, protective advice for future interviews)
- "autopsySummary": string (2-3 sentences summarizing the process health and final verdict)`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { redFlagScore: 40, redFlagsList: ["Analysis failed"], whatWentWrong: [], candidateLearnings: [], autopsySummary: "AI autopsy failed." };
    }

    // Save autopsy results to database
    const [updatedJournal] = await db.update(assignmentJournalTable).set({
      redFlagScore: parsed.redFlagScore,
      redFlags: JSON.stringify(parsed),
      updatedAt: new Date(),
    }).where(eq(assignmentJournalTable.taskId, id)).returning();

    res.json({ ...task, journal: updatedJournal });
  } catch (err) {
    req.log.error({ err }, "assignment autopsy error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
