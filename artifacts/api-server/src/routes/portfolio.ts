import { Router } from "express";
import { db } from "@workspace/db";
import { workArtifactsTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();

// PUBLIC: Fetch user details and their Proof of Work artifacts
router.get("/public/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      plan: usersTable.plan,
    }).from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "Not Found", message: "Portfolio user not found" });
      return;
    }

    const artifacts = await db.select()
      .from(workArtifactsTable)
      .where(eq(workArtifactsTable.userId, userId));

    res.json({ user, artifacts });
  } catch (err) {
    req.log.error({ err }, "public portfolio error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PROTECTED: Requires auth for all subsequent endpoints
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const artifacts = await db.select()
      .from(workArtifactsTable)
      .where(eq(workArtifactsTable.userId, user.id));
    res.json(artifacts);
  } catch (err) {
    req.log.error({ err }, "list artifacts error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { title, description, type, artifactUrl, metrics, skills } = req.body;

    if (!title || !artifactUrl) {
      res.status(400).json({ error: "Bad Request", message: "Title and artifactUrl are required" });
      return;
    }

    const id = nanoid();
    const [artifact] = await db.insert(workArtifactsTable).values({
      id,
      userId: user.id,
      title,
      description: description || null,
      type: type || "github",
      artifactUrl,
      metrics: metrics || null,
      skills: typeof skills === "object" ? JSON.stringify(skills) : (skills || null),
    }).returning();

    res.status(201).json(artifact);
  } catch (err) {
    req.log.error({ err }, "create artifact error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;
    const { title, description, type, artifactUrl, metrics, skills } = req.body;

    const [existing] = await db.select().from(workArtifactsTable)
      .where(and(eq(workArtifactsTable.id, id), eq(workArtifactsTable.userId, user.id)));

    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const [updated] = await db.update(workArtifactsTable).set({
      title: title ?? existing.title,
      description: description ?? existing.description,
      type: type ?? existing.type,
      artifactUrl: artifactUrl ?? existing.artifactUrl,
      metrics: metrics ?? existing.metrics,
      skills: typeof skills === "object" ? JSON.stringify(skills) : (skills ?? existing.skills),
    }).where(eq(workArtifactsTable.id, id)).returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "update artifact error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const [existing] = await db.select().from(workArtifactsTable)
      .where(and(eq(workArtifactsTable.id, id), eq(workArtifactsTable.userId, user.id)));

    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    await db.delete(workArtifactsTable).where(eq(workArtifactsTable.id, id));
    res.json({ success: true, message: "Artifact deleted" });
  } catch (err) {
    req.log.error({ err }, "delete artifact error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
