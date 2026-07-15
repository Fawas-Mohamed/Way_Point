"use client";

import { useState, useRef, useEffect } from "react";
import { Search, LogOut, User as UserIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";

export function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-paper px-6">
      <button
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-sm border border-hairline bg-cloud px-3 text-caption text-slate-mid transition-colors hover:border-slate-mid/40"
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search projects, tasks, people…</span>
        <kbd className="ml-auto rounded border border-hairline bg-paper px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-cloud"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar firstName={user.firstName} lastName={user.lastName} avatarUrl={user.avatarUrl} size="sm" />
            <span className="text-caption font-medium text-ink">{user.firstName}</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-2 w-56 animate-slide-up rounded-md border border-hairline bg-paper p-1.5 shadow-lifted"
            >
              <div className="px-3 py-2">
                <p className="text-caption font-semibold text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[12px] text-slate-mid">{user.email}</p>
              </div>
              <div className="my-1 h-px bg-hairline" />
              <Link
                href="/profile"
                role="menuitem"
                className="flex items-center gap-2 rounded-sm px-3 py-2 text-caption text-ink hover:bg-cloud"
                onClick={() => setMenuOpen(false)}
              >
                <UserIcon className="h-3.5 w-3.5" /> Profile
              </Link>
              <Link
                href="/settings"
                role="menuitem"
                className="flex items-center gap-2 rounded-sm px-3 py-2 text-caption text-ink hover:bg-cloud"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </Link>
              <div className="my-1 h-px bg-hairline" />
              <button
                role="menuitem"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-caption text-ember-red hover:bg-ember-soft"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
