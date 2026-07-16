"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminCreateUserSchema, AdminUpdateUserSchema, type AdminCreateUserInput, type AdminUpdateUserInput } from "@waypoint/types";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminActions, useAdminRoles, useAdminUsers } from "@/features/admin/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const roles = useAdminRoles();
  const users = useAdminUsers({ page: 1, pageSize: 100, search: search || undefined, roleId: roleId || undefined, isActive: isActive === "" ? undefined : isActive === "true" });
  const actions = useAdminActions();
  const selectedUser = useMemo(() => users.data?.items.find((item) => item.id === editUserId) ?? null, [users.data?.items, editUserId]);

  const createForm = useForm<AdminCreateUserInput>({ resolver: zodResolver(AdminCreateUserSchema), defaultValues: { firstName: "", lastName: "", email: "", password: "", roleId: "" } });
  const editForm = useForm<AdminUpdateUserInput>({ resolver: zodResolver(AdminUpdateUserSchema), values: selectedUser ? { firstName: selectedUser.firstName, lastName: selectedUser.lastName, roleId: selectedUser.role.id, isActive: selectedUser.isActive } : undefined });

  if (roles.isLoading || users.isLoading) return <Skeleton className="h-[600px]" />;
  if (roles.isError || users.isError) return <ErrorState message="We couldn't load admin users." onRetry={() => { roles.refetch(); users.refetch(); }} />;

  async function saveCreate(values: AdminCreateUserInput) {
    try {
      await actions.createUser.mutateAsync(values);
      createForm.reset();
      setCreateOpen(false);
    } catch (err) {
      createForm.setError("root", { message: getApiErrorMessage(err, "Unable to create user") });
    }
  }

  async function saveEdit(values: AdminUpdateUserInput) {
    if (!selectedUser) return;
    try {
      await actions.updateUser.mutateAsync({ userId: selectedUser.id, input: values });
      setEditUserId(null);
    } catch (err) {
      editForm.setError("root", { message: getApiErrorMessage(err, "Unable to update user") });
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Users" }]} />
      <PageHeader eyebrow="Admin" title="User administration" description="Manage roles, activity, and account status using the existing user service." action={<Button onClick={() => setCreateOpen(true)}>Create user</Button>} />
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}><option value="">All roles</option>{roles.data?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select>
          <Select value={isActive} onChange={(e) => setIsActive(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></Select>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr] border-b border-hairline bg-cloud px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-slate-mid"><span>User</span><span>Role</span><span>Status</span><span>Timezone</span><span>Actions</span></div>
        <div className="divide-y divide-hairline">
          {users.data?.items.map((user) => (
            <div key={user.id} className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr] items-center px-4 py-3">
              <div>
                <p className="font-medium text-ink">{user.firstName} {user.lastName}</p>
                <p className="text-caption text-slate-mid">{user.email}</p>
              </div>
              <span className="text-caption text-slate-mid">{user.role.name}</span>
              <span className="text-caption text-slate-mid">{user.isActive ? "Active" : "Inactive"}</span>
              <span className="text-caption text-slate-mid">{user.timezone}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditUserId(user.id)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => actions.deactivateUser.mutate(user.id)}>Deactivate</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create user" description="Provision a new account and assign a role." className="max-w-2xl">
        <form onSubmit={createForm.handleSubmit(saveCreate)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name"><Input {...createForm.register("firstName")} error={createForm.formState.errors.firstName?.message} /></Field>
            <Field label="Last name"><Input {...createForm.register("lastName")} error={createForm.formState.errors.lastName?.message} /></Field>
          </div>
          <Field label="Email"><Input type="email" {...createForm.register("email")} error={createForm.formState.errors.email?.message} /></Field>
          <Field label="Password"><Input type="password" {...createForm.register("password")} error={createForm.formState.errors.password?.message} /></Field>
          <Field label="Role"><Select {...createForm.register("roleId")} error={createForm.formState.errors.roleId?.message}><option value="">Select role</option>{roles.data?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" isLoading={actions.createUser.isPending}>Create</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(editUserId)} onClose={() => setEditUserId(null)} title="Edit user" description="Update profile details or change the role." className="max-w-2xl">
        <form onSubmit={editForm.handleSubmit(saveEdit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name"><Input {...editForm.register("firstName")} error={editForm.formState.errors.firstName?.message} /></Field>
            <Field label="Last name"><Input {...editForm.register("lastName")} error={editForm.formState.errors.lastName?.message} /></Field>
          </div>
          <Field label="Role"><Select {...editForm.register("roleId")}><option value="">Keep current</option>{roles.data?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></Field>
          <Field label="Active status"><input type="checkbox" className="h-4 w-4 rounded border-hairline text-indigo-deep focus-visible:ring-2 focus-visible:ring-indigo-deep" {...editForm.register("isActive")} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditUserId(null)}>Cancel</Button><Button type="submit" isLoading={actions.updateUser.isPending}>Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}<FieldError message={undefined} /></div>;
}
