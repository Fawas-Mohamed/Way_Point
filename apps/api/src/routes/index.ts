import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { projectsRouter } from "../modules/projects/projects.routes";
import { tasksRouter } from "../modules/tasks/tasks.routes";
import { teamsRouter } from "../modules/teams/teams.routes";
import { usersRouter } from "../modules/users/users.routes";
import { rolesRouter } from "../modules/users/roles.routes";
import { notificationsRouter } from "../modules/notifications/notifications.routes";
import { activityRouter } from "../modules/activity/activity.routes";
import { analyticsRouter } from "../modules/analytics/analytics.routes";
import { dashboardRouter } from "../modules/analytics/dashboard.routes";

/**
 * Single mount point for every module's router, under /api/v1. Adding a
 * new module means adding exactly one line here — the router itself owns
 * its own middleware, validation, and permission checks.
 */
export const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/projects", projectsRouter);
v1Router.use("/tasks", tasksRouter);
v1Router.use("/teams", teamsRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/roles", rolesRouter);
v1Router.use("/notifications", notificationsRouter);
v1Router.use("/activity", activityRouter);
v1Router.use("/analytics", analyticsRouter);
v1Router.use("/dashboard", dashboardRouter);
