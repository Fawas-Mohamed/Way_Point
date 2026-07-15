"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { tokenStore } from "@/lib/tokenStore";
import type { AuthUser } from "./types";
import type { LoginInput, RegisterInput } from "@waypoint/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // The access token lives only in memory (see lib/tokenStore) and is
    // lost on a hard reload — this silently exchanges the httpOnly refresh
    // cookie for a fresh access token on first load, so a signed-in user
    // reloading the page doesn't get bounced to the login screen.
    authApi
      .refresh()
      .then((restoredUser) => setUser(restoredUser))
      .finally(() => setIsLoading(false));

    tokenStore.onUnauthorized(() => {
      setUser(null);
      router.push("/login");
    });
  }, [router]);

  const login = useCallback(async (input: LoginInput) => {
    const loggedInUser = await authApi.login(input);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const newUser = await authApi.register(input);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
