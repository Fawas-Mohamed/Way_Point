/**
 * Turns an activity_logs `action` key (e.g. "task.status_changed") into a
 * human sentence fragment for the timeline strip. Centralized so adding a
 * new loggable action anywhere in the backend only needs one new line here.
 */
const ACTION_LABELS: Record<string, string> = {
  "project.created": "created a project",
  "project.updated": "updated a project",
  "project.archived": "archived a project",
  "project.restored": "restored a project",
  "project.status_changed": "changed a project's status",
  "project.member_added": "added a member to a project",
  "project.member_removed": "removed a member from a project",
  "task.created": "created a task",
  "task.updated": "updated a task",
  "task.status_changed": "moved a task",
  "task.commented": "commented on a task",
  "task.deleted": "deleted a task",
  "task.dependency_added": "added a task dependency",
  "milestone.created": "added a milestone",
  "milestone.completed": "completed a milestone",
  "team.member_added": "added a team member",
  "team.member_removed": "removed a team member",
  "user.registered": "joined Waypoint",
  "user.logged_in": "signed in",
};

export function describeActivity(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, " ");
}
