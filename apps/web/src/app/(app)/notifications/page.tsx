"use client";

import { useMemo, useState } from "react";
import { Archive, Bell, CheckCheck, Search } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useNotificationActions, useNotifications } from "@/features/notifications/hooks";

const CATEGORY_LABELS: Record<string, string> = {
  TASK_ASSIGNED: "Task assigned",
  TASK_DUE_SOON: "Due soon",
  TASK_COMMENTED: "Comment",
  PROJECT_STATUS_CHANGED: "Project update",
  MENTIONED: "Mention",
  MEMBER_ADDED: "Team update",
};

export default function NotificationsPage() {
  const [search, setSearch] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [category, setCategory] = useState<string>("");
  const { data, isLoading, isError, refetch } = useNotifications({ page: 1, pageSize: 100, unreadOnly: showUnreadOnly });
  const actions = useNotificationActions();

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((item) => {
      const matchesSearch = `${item.title} ${item.body}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || item.type === category;
      return matchesSearch && matchesCategory;
    });
  }, [data?.items, search, category]);

  if (isLoading) return <NotificationsSkeleton />;
  if (isError) return <ErrorState message="We couldn't load your notifications." onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]} />
      <PageHeader
        eyebrow="Notifications"
        title="Notification center"
        description="Review task mentions, project updates, and reminders without leaving the workspace."
        action={<Button variant="secondary" onClick={() => actions.markAllRead.mutate()}> <CheckCheck className="h-4 w-4" /> Mark all read</Button>}
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-mid" />
            <Input className="pl-9" placeholder="Search notifications" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-sm border border-hairline bg-paper px-3 text-body text-ink" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {Object.keys(CATEGORY_LABELS).map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}
          </select>
          <Button variant={showUnreadOnly ? "primary" : "secondary"} onClick={() => setShowUnreadOnly((value) => !value)}>
            <Bell className="h-4 w-4" /> {showUnreadOnly ? "Showing unread" : "Show unread only"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h2 text-ink">Inbox</h2>
            <Badge>{data?.unreadCount ?? 0} unread</Badge>
          </div>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" description="New updates, comments, and reminders will show up here." />
            ) : filtered.map((item) => (
              <div key={item.id} className={`rounded-md border px-4 py-4 ${item.readAt ? "border-hairline bg-paper" : "border-indigo-deep/20 bg-indigo-soft/20"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-body font-medium text-ink">{item.title}</p>
                    <p className="mt-1 text-caption text-slate-mid">{item.body}</p>
                  </div>
                  <Badge>{CATEGORY_LABELS[item.type] ?? item.type}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.link && <Link href={item.link} className="text-caption font-semibold text-indigo-deep hover:underline">Open</Link>}
                  {!item.readAt && <Button size="sm" variant="secondary" onClick={() => actions.markRead.mutate(item.id)}>Mark as read</Button>}
                  <Button size="sm" variant="ghost" onClick={() => actions.markRead.mutate(item.id)}><Archive className="h-4 w-4" /> Archive</Button>
                  <span className="text-caption text-slate-mid">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-h2 text-ink">Summary</h2>
          <div className="mt-4 space-y-3 text-body text-slate-mid">
            <p><strong className="text-ink">Unread</strong> {data?.unreadCount ?? 0}</p>
            <p><strong className="text-ink">Total</strong> {data?.meta.totalItems ?? 0}</p>
            <p><strong className="text-ink">Mode</strong> {showUnreadOnly ? "Unread only" : "All notifications"}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-16" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-[700px]" />
        <Skeleton className="h-[700px]" />
      </div>
    </div>
  );
}
