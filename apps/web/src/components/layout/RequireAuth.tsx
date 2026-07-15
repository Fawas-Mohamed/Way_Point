"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { RouteLine } from "@/components/ui/RouteLine";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-cloud">
        <div className="w-48">
          <RouteLine total={3} completed={1} />
        </div>
        <p className="text-caption text-slate-mid">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
