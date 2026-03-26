import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, contactsTable } from "@workspace/db/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

async function enrichTasks(tasks: any[]) {
  if (tasks.length === 0) return [];
  const contactIds = [...new Set(tasks.filter(t => t.contactId).map(t => t.contactId!))];
  let contacts: any[] = [];
  if (contactIds.length > 0) {
    contacts = await db.select({ id: contactsTable.id, name: contactsTable.name, avatarUrl: contactsTable.avatarUrl })
      .from(contactsTable)
      .where(sql`${contactsTable.id} = ANY(${sql.raw(`ARRAY[${contactIds.map(id => `'${id}'`).join(",")}]`)}`);
  }
  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));
  return tasks.map(t => ({
    ...t,
    contactName: t.contactId ? (contactMap[t.contactId]?.name || null) : null,
    contactAvatarUrl: t.contactId ? (contactMap[t.contactId]?.avatarUrl || null) : null,
  }));
}

router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { status, contactId, dueSoon } = req.query as Record<string, string>;

    let allTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, user.id));

    if (status && status !== "all") allTasks = allTasks.filter(t => t.status === status);
    if (contactId) allTasks = allTasks.filter(t => t.contactId === contactId);
    if (dueSoon === "true") {
      const threeDays = new Date();
      threeDays.setDate(threeDays.getDate() + 3);
      allTasks = allTasks.filter(t => t.dueDate && new Date(t.dueDate) <= threeDays);
    }

    // Sort by dueDate asc, then createdAt
    allTasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Enrich manually to avoid SQL injection
    const contactIds = [...new Set(allTasks.filter(t => t.contactId).map(t => t.contactId!))];
    let contactMap: Record<string, any> = {};
    if (contactIds.length > 0) {
      const contacts = await db.select({ id: contactsTable.id, name: contactsTable.name, avatarUrl: contactsTable.avatarUrl }).from(contactsTable);
      contactMap = Object.fromEntries(contacts.filter(c => contactIds.includes(c.id)).map(c => [c.id, c]));
    }

    const result = allTasks.map(t => ({
      ...t,
      contactName: t.contactId ? (contactMap[t.contactId]?.name || null) : null,
      contactAvatarUrl: t.contactId ? (contactMap[t.contactId]?.avatarUrl || null) : null,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "list tasks error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { contactId, title, description, dueDate, priority = "medium" } = req.body;

    if (!title) {
      res.status(400).json({ error: "Bad Request", message: "Title is required" });
      return;
    }

    const [task] = await db.insert(tasksTable).values({
      id: nanoid(),
      userId: user.id,
      contactId: contactId || null,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      status: "pending",
    }).returning();

    const contactMap: Record<string, any> = {};
    if (task.contactId) {
      const [c] = await db.select({ id: contactsTable.id, name: contactsTable.name, avatarUrl: contactsTable.avatarUrl }).from(contactsTable).where(eq(contactsTable.id, task.contactId));
      if (c) contactMap[c.id] = c;
    }

    res.status(201).json({
      ...task,
      contactName: task.contactId ? (contactMap[task.contactId]?.name || null) : null,
      contactAvatarUrl: task.contactId ? (contactMap[task.contactId]?.avatarUrl || null) : null,
    });
  } catch (err) {
    req.log.error({ err }, "create task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(tasksTable).where(
      and(eq(tasksTable.id, req.params.id), eq(tasksTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const { title, description, dueDate, priority, status, contactId } = req.body;
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updates.priority = priority;
    if (contactId !== undefined) updates.contactId = contactId;
    if (status !== undefined) {
      updates.status = status;
      if (status === "done" && existing.status !== "done") {
        updates.completedAt = new Date();
      } else if (status === "pending") {
        updates.completedAt = null;
      }
    }

    const [updated] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, req.params.id)).returning();

    let contactName = null;
    let contactAvatarUrl = null;
    if (updated.contactId) {
      const [c] = await db.select({ name: contactsTable.name, avatarUrl: contactsTable.avatarUrl }).from(contactsTable).where(eq(contactsTable.id, updated.contactId));
      contactName = c?.name || null;
      contactAvatarUrl = c?.avatarUrl || null;
    }

    res.json({ ...updated, contactName, contactAvatarUrl });
  } catch (err) {
    req.log.error({ err }, "update task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(tasksTable).where(
      and(eq(tasksTable.id, req.params.id), eq(tasksTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    await db.delete(tasksTable).where(eq(tasksTable.id, req.params.id));
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    req.log.error({ err }, "delete task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
