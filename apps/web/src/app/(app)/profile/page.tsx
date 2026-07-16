"use client";

import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSettings } from "@/features/settings/hooks";

export default function ProfilePage() {
  const { user } = useSettings();
  if (user.isLoading) return <Skeleton className="h-80" />;
  if (user.isError || !user.data) return <ErrorState message="We couldn't load your profile." onRetry={() => user.refetch()} />;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />
      <PageHeader eyebrow="Profile" title="Your profile" description="Review your identity, role, and workspace settings." action={<Link href="/settings"><Button variant="secondary">Edit settings</Button></Link>} />
      <Card className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar firstName={user.data.firstName} lastName={user.data.lastName} avatarUrl={user.data.avatarUrl} size="lg" />
          <div>
            <h2 className="font-display text-h2 text-ink">{user.data.firstName} {user.data.lastName}</h2>
            <p className="text-body text-slate-mid">{user.data.jobTitle || "No job title set"}</p>
            <p className="mt-2 text-caption text-slate-mid">{user.data.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Role" value={user.data.role.name} />
          <Info label="Timezone" value={user.data.timezone} />
          <Info label="Email verified" value={user.data.emailVerified ? "Yes" : "No"} />
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-hairline bg-cloud px-4 py-3">
      <p className="text-caption text-slate-mid">{label}</p>
      <p className="mt-1 text-body font-medium text-ink">{value}</p>
    </div>
  );
}
