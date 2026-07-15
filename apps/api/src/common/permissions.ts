/**
 * Canonical permission keys. The `requirePermission` middleware checks a
 * user's role's permission set against one of these — never against a role
 * name directly — so granting a capability to a role is a data change in
 * `role_permissions`, not a code change here.
 */
export const PERMISSIONS = {
  // Users & roles (Administrator)
  USER_MANAGE: "user:manage",
  ROLE_MANAGE: "role:manage",
  PERMISSION_MANAGE: "permission:manage",

  // Teams
  TEAM_MANAGE: "team:manage",
  TEAM_VIEW: "team:view",

  // Projects
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  PROJECT_ARCHIVE: "project:archive",
  PROJECT_RESTORE: "project:restore",
  PROJECT_VIEW: "project:view",
  PROJECT_MANAGE_MEMBERS: "project:manage_members",

  // Tasks
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_VIEW: "task:view",
  TASK_COMMENT: "task:comment",

  // Analytics & reporting
  ANALYTICS_VIEW: "analytics:view",
  REPORTS_VIEW: "reports:view",

  // System
  ACTIVITY_LOG_VIEW: "activity_log:view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_NAMES = {
  ADMINISTRATOR: "ADMINISTRATOR",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  TEAM_MEMBER: "TEAM_MEMBER",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

/**
 * The default grant matrix seeded on first migration. This is data, not
 * policy carved into the codebase — an Administrator can regrant
 * permissions per role afterward through the admin API without a deploy.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  ADMINISTRATOR: Object.values(PERMISSIONS),
  PROJECT_MANAGER: [
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_ARCHIVE,
    PERMISSIONS.PROJECT_RESTORE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_MANAGE_MEMBERS,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_COMMENT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  TEAM_MEMBER: [
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_COMMENT,
  ],
};
