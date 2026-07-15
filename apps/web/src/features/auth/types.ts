export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  timezone: string;
  emailVerified: boolean;
  role: { id: string; name: "ADMINISTRATOR" | "PROJECT_MANAGER" | "TEAM_MEMBER" };
}
