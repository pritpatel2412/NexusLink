import { Router } from "express";
import { db } from "@workspace/db";
import {
  contactsTable, contactTagsTable, interactionsTable, tasksTable, remindersTable
} from "@workspace/db/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/stats", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [{ count: totalContacts }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactsTable)
      .where(eq(contactsTable.userId, user.id));

    const [{ count: interactionsThisWeek }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(interactionsTable)
      .where(and(eq(interactionsTable.userId, user.id), gte(interactionsTable.occurredAt, startOfWeek)));

    const [{ count: tasksDueToday }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasksTable)
      .where(and(
        eq(tasksTable.userId, user.id),
        eq(tasksTable.status, "pending"),
        gte(tasksTable.dueDate, startOfToday),
        lte(tasksTable.dueDate, endOfToday)
      ));

    const upcomingMeetings = 0; // placeholder — would count calendar events

    const recentActivity = await db.select().from(interactionsTable)
      .where(eq(interactionsTable.userId, user.id))
      .orderBy(desc(interactionsTable.occurredAt))
      .limit(10);

    // Enrich recent activity with contact info
    const contactIds = [...new Set(recentActivity.map(i => i.contactId))];
    const contacts = contactIds.length > 0
      ? await db.select({ id: contactsTable.id, name: contactsTable.name, avatarUrl: contactsTable.avatarUrl }).from(contactsTable).where(eq(contactsTable.userId, user.id))
      : [];
    const contactMap = Object.fromEntries(contacts.filter(c => contactIds.includes(c.id)).map(c => [c.id, c]));
    const enrichedActivity = recentActivity.map(i => ({
      ...i,
      contactName: contactMap[i.contactId]?.name || null,
      contactAvatarUrl: contactMap[i.contactId]?.avatarUrl || null,
    }));

    // Today's focus: pending tasks due today or overdue
    const todaysFocus = await db.select().from(tasksTable)
      .where(and(
        eq(tasksTable.userId, user.id),
        eq(tasksTable.status, "pending"),
        lte(tasksTable.dueDate, endOfToday)
      ))
      .orderBy(asc(tasksTable.dueDate))
      .limit(10);

    const focusContactIds = [...new Set(todaysFocus.filter(t => t.contactId).map(t => t.contactId!))];
    const focusContacts = focusContactIds.length > 0
      ? contacts.filter(c => focusContactIds.includes(c.id))
      : [];
    const focusContactMap = Object.fromEntries(focusContacts.map(c => [c.id, c]));
    const enrichedFocus = todaysFocus.map(t => ({
      ...t,
      contactName: t.contactId ? (focusContactMap[t.contactId]?.name || null) : null,
      contactAvatarUrl: t.contactId ? (focusContactMap[t.contactId]?.avatarUrl || null) : null,
    }));

    // Upcoming reminders
    const upcomingReminders = await db.select().from(remindersTable)
      .where(and(eq(remindersTable.userId, user.id), gte(remindersTable.remindAt, now)))
      .orderBy(asc(remindersTable.remindAt))
      .limit(5);

    const reminderContactIds = [...new Set(upcomingReminders.filter(r => r.contactId).map(r => r.contactId!))];
    const reminderContacts = reminderContactIds.length > 0
      ? contacts.filter(c => reminderContactIds.includes(c.id))
      : [];
    const reminderContactMap = Object.fromEntries(reminderContacts.map(c => [c.id, c]));
    const enrichedReminders = upcomingReminders.map(r => ({
      ...r,
      contactName: r.contactId ? (reminderContactMap[r.contactId]?.name || null) : null,
    }));

    // Interactions by day (last 14 days)
    const interactionsByDay: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(interactionsTable)
        .where(and(
          eq(interactionsTable.userId, user.id),
          gte(interactionsTable.occurredAt, day),
          lte(interactionsTable.occurredAt, dayEnd)
        ));

      interactionsByDay.push({
        date: day.toISOString().split("T")[0],
        count: Number(count),
      });
    }

    // Tag distribution
    const allContacts = await db.select({ id: contactsTable.id }).from(contactsTable).where(eq(contactsTable.userId, user.id));
    const allContactIds = allContacts.map(c => c.id);
    let tagDistribution: { tag: string; count: number; color: string }[] = [];

    if (allContactIds.length > 0) {
      const allTags = await db.select().from(contactTagsTable);
      const userTags = allTags.filter(t => allContactIds.includes(t.contactId));
      const tagCount: Record<string, { count: number; color: string }> = {};
      for (const t of userTags) {
        if (!tagCount[t.tag]) tagCount[t.tag] = { count: 0, color: t.color };
        tagCount[t.tag].count++;
      }
      tagDistribution = Object.entries(tagCount).map(([tag, { count, color }]) => ({ tag, count, color }));
    }

    res.json({
      totalContacts: Number(totalContacts),
      interactionsThisWeek: Number(interactionsThisWeek),
      tasksDueToday: Number(tasksDueToday),
      upcomingMeetings,
      recentActivity: enrichedActivity,
      todaysFocus: enrichedFocus,
      upcomingReminders: enrichedReminders,
      interactionsByDay,
      tagDistribution,
    });
  } catch (err) {
    req.log.error({ err }, "dashboard stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
