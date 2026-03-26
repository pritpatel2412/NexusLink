import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { generateToken, requireAuth, getCurrentUser } from "../lib/auth.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Bad Request", message: "Name, email, and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Bad Request", message: "Password must be at least 6 characters" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(409).json({ error: "Conflict", message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = nanoid();
    const [user] = await db.insert(usersTable).values({
      id,
      name,
      email,
      password: hashedPassword,
      plan: "free",
      timezone: "UTC",
    }).returning();

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    req.log.error({ err }, "signup error");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || !user.password) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    req.log.error({ err }, "login error");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to login" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = getCurrentUser(req);
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

router.put("/me/update", requireAuth, async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { name, timezone, password, currentPassword } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (timezone !== undefined) updates.timezone = timezone;

    if (password) {
      if (!currentPassword) {
        res.status(400).json({ error: "Bad Request", message: "Current password required" });
        return;
      }
      const valid = await bcrypt.compare(currentPassword, user.password || "");
      if (!valid) {
        res.status(400).json({ error: "Bad Request", message: "Current password is incorrect" });
        return;
      }
      updates.password = await bcrypt.hash(password, 12);
    }

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    req.log.error({ err }, "update user error");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update profile" });
  }
});

export default router;
