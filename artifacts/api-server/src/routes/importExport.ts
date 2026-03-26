import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable, contactTagsTable, interactionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

// Export contacts as CSV
router.get("/export/csv", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const contacts = await db.select().from(contactsTable).where(eq(contactsTable.userId, user.id));
    const tags = await db.select().from(contactTagsTable);
    const tagsByContact = tags.reduce((acc: Record<string, string[]>, t) => {
      if (!acc[t.contactId]) acc[t.contactId] = [];
      acc[t.contactId].push(t.tag);
      return acc;
    }, {});

    const headers = ["Name", "Email", "Phone", "Location", "Company", "Role", "LinkedIn", "Twitter", "Website", "Where Met", "Introduced By", "Tags", "Notes", "Created At"];
    const rows = contacts.map(c => [
      c.name,
      c.email || "",
      c.phone || "",
      c.location || "",
      c.company || "",
      c.role || "",
      c.linkedinUrl || "",
      c.twitterUrl || "",
      c.website || "",
      c.whereMet || "",
      c.introducedBy || "",
      (tagsByContact[c.id] || []).join(";"),
      (c.notes || "").replace(/,/g, ";"),
      c.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=nexuslink-contacts.csv");
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "export csv error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Import contacts from CSV (already parsed rows)
router.post("/import/csv", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows)) {
      res.status(400).json({ error: "Bad Request", message: "rows array required" });
      return;
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const name = row.Name || row.name || row["Full Name"] || row["full_name"];
        if (!name) {
          failed++;
          errors.push(`Row missing name: ${JSON.stringify(row)}`);
          continue;
        }

        const id = nanoid();
        await db.insert(contactsTable).values({
          id,
          userId: user.id,
          name,
          email: row.Email || row.email || null,
          phone: row.Phone || row.phone || null,
          location: row.Location || row.location || null,
          company: row.Company || row.company || null,
          role: row.Role || row.role || null,
          linkedinUrl: row.LinkedIn || row.linkedin || null,
          twitterUrl: row.Twitter || row.twitter || null,
          website: row.Website || row.website || null,
          whereMet: row["Where Met"] || row.where_met || null,
          introducedBy: row["Introduced By"] || row.introduced_by || null,
          notes: row.Notes || row.notes || null,
        });

        const tagsStr = row.Tags || row.tags || "";
        if (tagsStr) {
          const tagList = tagsStr.split(";").map((t: string) => t.trim()).filter(Boolean);
          for (const tag of tagList) {
            await db.insert(contactTagsTable).values({
              id: nanoid(),
              contactId: id,
              tag,
              color: "#6C63FF",
            });
          }
        }

        imported++;
      } catch (rowErr) {
        failed++;
        errors.push(`Failed to import row: ${String(rowErr)}`);
      }
    }

    res.json({ imported, failed, errors });
  } catch (err) {
    req.log.error({ err }, "import csv error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
