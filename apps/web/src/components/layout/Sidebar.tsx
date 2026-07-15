"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  CalendarDays,
  BarChart3,
  FileBarChart,
  Bell,
  Users,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "My Tasks", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
] as const;

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role.name === "ADMINISTRATOR";

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink-slate px-4 py-6 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="4" cy="18" r="2.5" fill="#0F9D6E" />
          <circle cx="11" cy="10" r="2.5" fill="#0F9D6E" />
          <circle cx="18" cy="4" r="3" fill="#3730A5" />
          <path d="M6 16.5L9.5 12M13 8.5L16 5.5" stroke="#0F9D6E" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="font-display text-[19px] font-medium text-white">Waypoint</span>
      </Link>

      <NavSection items={NAV_ITEMS} pathname={pathname} />

      {isAdmin && (
        <>
          <p className="mb-2 mt-8 px-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">Admin</p>
          <NavSection items={ADMIN_ITEMS} pathname={pathname} />
        </>
      )}

      <div className="mt-auto">
        <NavSection items={[{ href: "/settings", label: "Settings", icon: Settings }]} pathname={pathname} />
      </div>
    </aside>
  );
}

function NavSection({
  items,
  pathname,
}: {
  items: ReadonlyArray<{ href: string; label: string; icon: typeof LayoutDashboard }>;
  pathname: string;
}) {
  return (
    <nav className="relative">
      <div className="absolute bottom-3 left-[13px] top-3 w-px bg-white/10" aria-hidden="true" />
      <ul className="relative space-y-0.5">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative z-10 flex items-center gap-3 rounded-sm px-2 py-2.5 text-[13px] font-medium transition-colors",
                  isActive ? "text-white" : "text-white/55 hover:text-white/85",
                )}
              >
                <span
                  className={cn(
                    "h-[9px] w-[9px] shrink-0 rounded-full border-2 transition-colors",
                    isActive ? "border-emerald-route bg-emerald-route" : "border-white/25 bg-ink-slate group-hover:border-white/50",
                  )}
                />
                <Icon className="h-[15px] w-[15px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
