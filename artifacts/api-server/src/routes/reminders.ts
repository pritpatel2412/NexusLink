import { Router } from "express";
import { db } from "@workspace/db";
import { remindersTable, contactsTable } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const reminders = await db.select().from(remindersTable)
      .where(eq(remindersTable.userId, user.id))
      .orderBy(asc(remindersTable.remindAt));

    const contactIds = [...new Set(reminders.filter(r => r.contactId).map(r => r.contactId!))];
    let contactMap: Record<string, any> = {};
    if (contactIds.length > 0) {
      const contacts = await db.select({ id: contactsTable.id, name: contactsTable.name }).from(contactsTable);
      contactMap = Object.fromEntries(contacts.filter(c => contactIds.includes(c.id)).map(c => [c.id, c]));
    }

    const result = reminders.map(r => ({
      ...r,
      contactName: r.contactId ? (contactMap[r.contactId]?.name || null) : null,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "list reminders error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { contactId, taskId, message, remindAt } = req.body;

    if (!message || !remindAt) {
      res.status(400).json({ error: "Bad Request", message: "message and remindAt are required" });
      return;
    }

    const [reminder] = await db.insert(remindersTable).values({
      id: nanoid(),
      userId: user.id,
      contactId: contactId || null,
      taskId: taskId || null,
      message,
      remindAt: new Date(remindAt),
      sent: false,
    }).returning();

    let contactName = null;
    if (reminder.contactId) {
      const [c] = await db.select({ name: contactsTable.name }).from(contactsTable).where(eq(contactsTable.id, reminder.contactId));
      contactName = c?.name || null;
    }

    res.status(201).json({ ...reminder, contactName });
  } catch (err) {
    req.log.error({ err }, "create reminder error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(remindersTable).where(
      and(eq(remindersTable.id, req.params.id), eq(remindersTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const { contactId, message, remindAt } = req.body;
    const [updated] = await db.update(remindersTable).set({
      contactId: contactId ?? existing.contactId,
      message: message || existing.message,
      remindAt: remindAt ? new Date(remindAt) : existing.remindAt,
    }).where(eq(remindersTable.id, req.params.id)).returning();

    let contactName = null;
    if (updated.contactId) {
      const [c] = await db.select({ name: contactsTable.name }).from(contactsTable).where(eq(contactsTable.id, updated.contactId));
      contactName = c?.name || null;
    }

    res.json({ ...updated, contactName });
  } catch (err) {
    req.log.error({ err }, "update reminder error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(remindersTable).where(
      and(eq(remindersTable.id, req.params.id), eq(remindersTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    await db.delete(remindersTable).where(eq(remindersTable.id, req.params.id));
    res.json({ success: true, message: "Reminder deleted" });
  } catch (err) {
    req.log.error({ err }, "delete reminder error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
