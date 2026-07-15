import { apiClient } from "@/lib/api-client";
import { tokenStore } from "@/lib/tokenStore";
import type { AuthUser } from "./types";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "@waypoint/types";

interface AuthResponse {
  data: { user: AuthUser; accessToken: string };
}

export const authApi = {
  async login(input: LoginInput): Promise<AuthUser> {
    const res = await apiClient.post<AuthResponse>("/auth/login", input);
    tokenStore.set(res.data.data.accessToken);
    return res.data.data.user;
  },

  async register(input: RegisterInput): Promise<AuthUser> {
    const res = await apiClient.post<AuthResponse>("/auth/register", input);
    tokenStore.set(res.data.data.accessToken);
    return res.data.data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    tokenStore.set(null);
  },

  async me(): Promise<AuthUser> {
    const res = await apiClient.get<{ data: { user: AuthUser } }>("/auth/me");
    return res.data.data.user;
  },

  async refresh(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.post<AuthResponse>("/auth/refresh");
      tokenStore.set(res.data.data.accessToken);
      return res.data.data.user;
    } catch {
      return null;
    }
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    await apiClient.post("/auth/forgot-password", input);
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await apiClient.post("/auth/reset-password", input);
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient.post("/auth/change-password", input);
  },
};
