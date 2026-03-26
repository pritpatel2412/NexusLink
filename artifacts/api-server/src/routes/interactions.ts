import { Router } from "express";
import { db } from "@workspace/db";
import { interactionsTable, contactsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { contactId, type, limit = "50", offset = "0" } = req.query as Record<string, string>;

    let conditions = [eq(interactionsTable.userId, user.id)];
    if (contactId) conditions.push(eq(interactionsTable.contactId, contactId));
    if (type) conditions.push(eq(interactionsTable.type, type));

    const rows = await db.select().from(interactionsTable)
      .where(and(...conditions))
      .orderBy(desc(interactionsTable.occurredAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Enrich with contact info
    const contactIds = [...new Set(rows.map(r => r.contactId))];
    const contacts = contactIds.length > 0
      ? await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id))
      : [];
    const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));

    const enriched = rows.map(r => ({
      ...r,
      contactName: contactMap[r.contactId]?.name || null,
      contactAvatarUrl: contactMap[r.contactId]?.avatarUrl || null,
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "list interactions error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { contactId, type, summary, occurredAt, source = "manual" } = req.body;

    if (!contactId || !type || !summary || !occurredAt) {
      res.status(400).json({ error: "Bad Request", message: "contactId, type, summary, occurredAt required" });
      return;
    }

    const [contact] = await db.select().from(contactsTable).where(
      and(eq(contactsTable.id, contactId), eq(contactsTable.userId, user.id))
    );
    if (!contact) {
      res.status(404).json({ error: "Not Found", message: "Contact not found" });
      return;
    }

    const [interaction] = await db.insert(interactionsTable).values({
      id: nanoid(),
      contactId,
      userId: user.id,
      type,
      summary,
      source,
      occurredAt: new Date(occurredAt),
    }).returning();

    // Update contact updatedAt
    await db.update(contactsTable).set({ updatedAt: new Date() }).where(eq(contactsTable.id, contactId));

    res.status(201).json({
      ...interaction,
      contactName: contact.name,
      contactAvatarUrl: contact.avatarUrl,
    });
  } catch (err) {
    req.log.error({ err }, "create interaction error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(interactionsTable).where(
      and(eq(interactionsTable.id, req.params.id), eq(interactionsTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const { type, summary, occurredAt, source } = req.body;
    const [updated] = await db.update(interactionsTable).set({
      type: type || existing.type,
      summary: summary || existing.summary,
      occurredAt: occurredAt ? new Date(occurredAt) : existing.occurredAt,
      source: source || existing.source,
    }).where(eq(interactionsTable.id, req.params.id)).returning();

    const [contact] = await db.select().from(contactsTable).where(eq(contactsTable.id, updated.contactId));
    res.json({ ...updated, contactName: contact?.name || null, contactAvatarUrl: contact?.avatarUrl || null });
  } catch (err) {
    req.log.error({ err }, "update interaction error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const [existing] = await db.select().from(interactionsTable).where(
      and(eq(interactionsTable.id, req.params.id), eq(interactionsTable.userId, user.id))
    );
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    await db.delete(interactionsTable).where(eq(interactionsTable.id, req.params.id));
    res.json({ success: true, message: "Interaction deleted" });
  } catch (err) {
    req.log.error({ err }, "delete interaction error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
