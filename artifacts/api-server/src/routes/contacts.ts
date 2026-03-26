import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, contactTagsTable, interactionsTable, tasksTable, remindersTable } from "@workspace/db/schema";
import { eq, and, desc, asc, sql, like, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

async function buildContactList(userId: string, contacts: any[]) {
  if (contacts.length === 0) return [];
  const ids = contacts.map((c) => c.id);

  const tags = await db.select().from(contactTagsTable).where(
    inArray(contactTagsTable.contactId, ids)
  );
  const tagsByContact = tags.reduce((acc: Record<string, any[]>, t) => {
    if (!acc[t.contactId]) acc[t.contactId] = [];
    acc[t.contactId].push({ id: t.id, tag: t.tag, color: t.color });
    return acc;
  }, {});

  const lastInteractions = await db
    .select({ contactId: interactionsTable.contactId, maxDate: sql<string>`max(${interactionsTable.occurredAt})` })
    .from(interactionsTable)
    .where(and(eq(interactionsTable.userId, userId), inArray(interactionsTable.contactId, ids)))
    .groupBy(interactionsTable.contactId);
  const lastByContact: Record<string, string> = {};
  for (const li of lastInteractions) lastByContact[li.contactId] = li.maxDate;

  const taskCounts = await db
    .select({ contactId: tasksTable.contactId, count: sql<number>`count(*)` })
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), eq(tasksTable.status, "pending"), inArray(tasksTable.contactId as any, ids)))
    .groupBy(tasksTable.contactId);
  const tasksByContact: Record<string, number> = {};
  for (const tc of taskCounts) {
    if (tc.contactId) tasksByContact[tc.contactId] = Number(tc.count);
  }

  return contacts.map((c) => ({
    ...c,
    tags: tagsByContact[c.id] || [],
    lastInteractionAt: lastByContact[c.id] || null,
    taskCount: tasksByContact[c.id] || 0,
  }));
}

router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { search, tag, sort = "name", order = "asc" } = req.query as Record<string, string>;

    let query = db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));

    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    let filtered = contacts;

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        (c.email || "").toLowerCase().includes(lower) ||
        (c.company || "").toLowerCase().includes(lower) ||
        (c.role || "").toLowerCase().includes(lower)
      );
    }

    if (tag) {
      const taggedIds = (await db.select().from(contactTagsTable).where(eq(contactTagsTable.tag, tag))).map(t => t.contactId);
      filtered = filtered.filter(c => taggedIds.includes(c.id));
    }

    // sort
    if (sort === "name") {
      filtered.sort((a, b) => order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } else if (sort === "createdAt") {
      filtered.sort((a, b) => order === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const result = await buildContactList(user.id, filtered);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "list contacts error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { tags: tagsInput, ...data } = req.body;

    if (!data.name) {
      res.status(400).json({ error: "Bad Request", message: "Name is required" });
      return;
    }

    const id = nanoid();
    const [contact] = await db.insert(contactsTable).values({
      id,
      userId: user.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      location: data.location || null,
      company: data.company || null,
      role: data.role || null,
      linkedinUrl: data.linkedinUrl || null,
      twitterUrl: data.twitterUrl || null,
      website: data.website || null,
      avatarUrl: data.avatarUrl || null,
      whereMet: data.whereMet || null,
      introducedBy: data.introducedBy || null,
      topicsDiscussed: data.topicsDiscussed || null,
      notes: data.notes || null,
    }).returning();

    if (tagsInput && Array.isArray(tagsInput)) {
      for (const t of tagsInput) {
        const tagName = typeof t === "string" ? t : t.tag;
        const tagColor = typeof t === "string" ? "#6C63FF" : (t.color || "#6C63FF");
        if (!tagName) continue;
        await db.insert(contactTagsTable).values({
          id: nanoid(),
          contactId: id,
          tag: tagName,
          color: tagColor,
        });
      }
    }

    const [result] = await buildContactList(user.id, [contact]);
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "create contact error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [contact] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, req.params.id), eq(contactsTable.userId, user.id))
    );
    if (!contact) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const tags = await db.select().from(contactTagsTable).where(eq(contactTagsTable.contactId, contact.id));
    const interactions = await db.select().from(interactionsTable)
      .where(eq(interactionsTable.contactId, contact.id))
      .orderBy(desc(interactionsTable.occurredAt));
    const tasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.contactId, contact.id), eq(tasksTable.userId, user.id)))
      .orderBy(asc(tasksTable.dueDate));
    const reminders = await db.select().from(remindersTable)
      .where(and(eq(remindersTable.contactId, contact.id), eq(remindersTable.userId, user.id)))
      .orderBy(asc(remindersTable.remindAt));

    res.json({
      ...contact,
      tags: tags.map(t => ({ id: t.id, tag: t.tag, color: t.color })),
      lastInteractionAt: interactions[0]?.occurredAt || null,
      taskCount: tasks.filter(t => t.status === "pending").length,
      interactions,
      tasks,
      reminders,
    });
  } catch (err) {
    req.log.error({ err }, "get contact error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, req.params.id), eq(contactsTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const { tags: tagsInput, ...data } = req.body;
    const [updated] = await db.update(contactsTable).set({
      name: data.name || existing.name,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      location: data.location ?? existing.location,
      company: data.company ?? existing.company,
      role: data.role ?? existing.role,
      linkedinUrl: data.linkedinUrl ?? existing.linkedinUrl,
      twitterUrl: data.twitterUrl ?? existing.twitterUrl,
      website: data.website ?? existing.website,
      avatarUrl: data.avatarUrl ?? existing.avatarUrl,
      whereMet: data.whereMet ?? existing.whereMet,
      introducedBy: data.introducedBy ?? existing.introducedBy,
      topicsDiscussed: data.topicsDiscussed ?? existing.topicsDiscussed,
      notes: data.notes ?? existing.notes,
      updatedAt: new Date(),
    }).where(eq(contactsTable.id, req.params.id)).returning();

    if (tagsInput !== undefined && Array.isArray(tagsInput)) {
      await db.delete(contactTagsTable).where(eq(contactTagsTable.contactId, req.params.id));
      for (const t of tagsInput) {
        await db.insert(contactTagsTable).values({
          id: nanoid(),
          contactId: req.params.id,
          tag: t.tag,
          color: t.color || "#6C63FF",
        });
      }
    }

    const [result] = await buildContactList(user.id, [updated]);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "update contact error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, req.params.id), eq(contactsTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    await db.delete(contactsTable).where(eq(contactsTable.id, req.params.id));
    res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    req.log.error({ err }, "delete contact error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:id/tags", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [contact] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, req.params.id), eq(contactsTable.userId, user.id))
    );
    if (!contact) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const { tag, color = "#6C63FF" } = req.body;
    const [newTag] = await db.insert(contactTagsTable).values({
      id: nanoid(),
      contactId: req.params.id,
      tag,
      color,
    }).returning();
    res.status(201).json({ id: newTag.id, tag: newTag.tag, color: newTag.color });
  } catch (err) {
    req.log.error({ err }, "add tag error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id/tags/:tagId", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [contact] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, req.params.id), eq(contactsTable.userId, user.id))
    );
    if (!contact) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    await db.delete(contactTagsTable).where(eq(contactTagsTable.id, req.params.tagId));
    res.json({ success: true, message: "Tag removed" });
  } catch (err) {
    req.log.error({ err }, "remove tag error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
