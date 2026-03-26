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

export default router;
