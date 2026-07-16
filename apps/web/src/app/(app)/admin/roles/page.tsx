"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldError } from "@/components/ui/FieldError";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Label } from "@/components/ui/Label";
import { useAdminActions, useAdminPermissions, useAdminRoles } from "@/features/admin/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

const GrantSchema = z.object({ roleId: z.string().uuid(), permissionId: z.string().uuid() });

export default function AdminRolesPage() {
  const roles = useAdminRoles();
  const permissions = useAdminPermissions();
  const actions = useAdminActions();
  const form = useForm<z.infer<typeof GrantSchema>>({ resolver: zodResolver(GrantSchema), defaultValues: { roleId: "", permissionId: "" } });

  if (roles.isLoading || permissions.isLoading) return <Skeleton className="h-[600px]" />;
  if (roles.isError || permissions.isError) return <ErrorState message="We couldn't load roles." onRetry={() => { roles.refetch(); permissions.refetch(); }} />;

  async function grant(values: z.infer<typeof GrantSchema>) {
    try {
      await actions.grantPermission.mutateAsync(values);
      form.reset();
    } catch (err) {
      form.setError("root", { message: getApiErrorMessage(err, "Unable to grant permission") });
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Roles" }]} />
      <PageHeader eyebrow="Admin" title="Role permissions" description="Review and adjust permissions using the live role registry." />
      <Card className="p-4">
        <form onSubmit={form.handleSubmit(grant)} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" noValidate>
          <Field label="Role"><Select {...form.register("roleId")} error={form.formState.errors.roleId?.message}><option value="">Select role</option>{roles.data?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></Field>
          <Field label="Permission"><Select {...form.register("permissionId")} error={form.formState.errors.permissionId?.message}><option value="">Select permission</option>{permissions.data?.map((permission) => <option key={permission.id} value={permission.id}>{permission.label}</option>)}</Select></Field>
          <div className="flex items-end"><Button type="submit">Grant permission</Button></div>
        </form>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {roles.data?.map((role) => (
          <Card key={role.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-h2 text-ink">{role.name}</h2>
                <p className="text-body text-slate-mid">{role.description || "Role without description"}</p>
              </div>
              <Badge>{role._count.users} users</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {role.permissions.map((entry) => (
                <button key={entry.permission.id} onClick={() => actions.revokePermission.mutate({ roleId: role.id, permissionId: entry.permission.id })} className="rounded-full border border-hairline bg-cloud px-3 py-1.5 text-caption text-slate-mid hover:border-ember-red/30 hover:text-ember-red">
                  {entry.permission.label}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}<FieldError message={undefined} /></div>;
}
