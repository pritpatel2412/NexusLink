import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import contactsRouter from "./contacts.js";
import interactionsRouter from "./interactions.js";
import tasksRouter from "./tasks.js";
import remindersRouter from "./reminders.js";
import aiRouter from "./ai.js";
import dashboardRouter from "./dashboard.js";
import importExportRouter from "./importExport.js";

// NexusLink advanced feature routes
import portfolioRouter from "./portfolio.js";
import networkRouter from "./network.js";
import assignmentsRouter from "./assignments.js";
import opportunitiesRouter from "./opportunities.js";
import sequencesRouter from "./sequences.js";
import intelligenceRouter from "./intelligence.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/contacts", contactsRouter);
router.use("/interactions", interactionsRouter);
router.use("/tasks", tasksRouter);
router.use("/reminders", remindersRouter);
router.use("/ai", aiRouter);
router.use("/dashboard", dashboardRouter);
router.use(importExportRouter);

// Register NexusLink advanced routes
router.use("/portfolio", portfolioRouter);
router.use("/network", networkRouter);
router.use("/assignments", assignmentsRouter);
router.use("/opportunities", opportunitiesRouter);
router.use("/sequences", sequencesRouter);
router.use("/intelligence", intelligenceRouter);

export default router;

