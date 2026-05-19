import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, passwordResetTokensTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { generateToken, requireAuth, getCurrentUser } from "../lib/auth.js";
import { sendEmail, buildPasswordResetEmail, buildWelcomeEmail } from "../lib/email.js";
import crypto from "crypto";

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

    try {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      await sendEmail({
        to: email,
        subject: "Welcome to NexusLink 🎉",
        html: buildWelcomeEmail({ userName: name, loginUrl: `${appUrl}/login` }),
      });
    } catch (emailErr) {
      req.log.warn({ emailErr }, "Failed to send welcome email (non-fatal)");
    }

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
    const { name, timezone, password, currentPassword, linkedinUrl, githubUrl, portfolioUrl } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (timezone !== undefined) updates.timezone = timezone;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;
    if (portfolioUrl !== undefined) updates.portfolioUrl = portfolioUrl;

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

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Bad Request", message: "Email is required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (!user) {
      res.json({ success: true, message: "If that email exists, a reset link has been sent." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.delete(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.userId, user.id));

    await db.insert(passwordResetTokensTable).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your NexusLink password",
      html: buildPasswordResetEmail({
        userName: user.name || "there",
        resetUrl,
      }),
    });

    req.log.info({ email, resetUrl }, "Password reset email sent");
    res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    req.log.error({ err }, "forgot-password error");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to send reset email" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: "Bad Request", message: "Token and new password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Bad Request", message: "Password must be at least 6 characters" });
      return;
    }

    const [resetToken] = await db.select().from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.token, token),
          eq(passwordResetTokensTable.used, false),
          gt(passwordResetTokensTable.expiresAt, new Date()),
        )
      );

    if (!resetToken) {
      res.status(400).json({ error: "Bad Request", message: "This reset link is invalid or has expired." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await db.update(usersTable)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(usersTable.id, resetToken.userId));

    await db.update(passwordResetTokensTable)
      .set({ used: true })
      .where(eq(passwordResetTokensTable.id, resetToken.id));

    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    req.log.error({ err }, "reset-password error");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to reset password" });
  }
});

export default router;
