"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSettings, useSettingsActions } from "@/features/settings/hooks";
import { ChangePasswordSchema, UpdateNotificationPreferencesSchema, UpdateProfileSchema, type ChangePasswordInput, type UpdateNotificationPreferencesInput, type UpdateProfileInput } from "@waypoint/types";
import { getApiErrorMessage } from "@/lib/api-client";

export default function SettingsPage() {
  const { user, preferences } = useSettings();
  const actions = useSettingsActions();
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const profileForm = useForm<UpdateProfileInput>({ resolver: zodResolver(UpdateProfileSchema), values: user.data ? { firstName: user.data.firstName, lastName: user.data.lastName, jobTitle: user.data.jobTitle, timezone: user.data.timezone } : undefined });
  const prefsForm = useForm<UpdateNotificationPreferencesInput>({ resolver: zodResolver(UpdateNotificationPreferencesSchema), values: preferences.data ?? undefined });
  const passwordForm = useForm<ChangePasswordInput>({ resolver: zodResolver(ChangePasswordSchema), defaultValues: { currentPassword: "", newPassword: "" } });

  if (user.isLoading || preferences.isLoading) return <SettingsSkeleton />;
  if (user.isError || preferences.isError) return <ErrorState message="We couldn't load settings." onRetry={() => { user.refetch(); preferences.refetch(); }} />;

  async function saveProfile(values: UpdateProfileInput) {
    setFormMessage(null);
    try {
      await actions.updateProfile.mutateAsync(values);
      setFormMessage("Profile updated.");
    } catch (err) {
      profileForm.setError("root", { message: getApiErrorMessage(err, "Unable to update profile") });
    }
  }

  async function savePreferences(values: UpdateNotificationPreferencesInput) {
    setFormMessage(null);
    try {
      await actions.updatePreferences.mutateAsync(values);
      setFormMessage("Notification preferences updated.");
    } catch (err) {
      prefsForm.setError("root", { message: getApiErrorMessage(err, "Unable to update preferences") });
    }
  }

  async function changePassword(values: ChangePasswordInput) {
    setFormMessage(null);
    try {
      await actions.changePassword.mutateAsync(values);
      passwordForm.reset();
      setFormMessage("Password changed successfully.");
    } catch (err) {
      passwordForm.setError("root", { message: getApiErrorMessage(err, "Unable to change password") });
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />
      <PageHeader eyebrow="Settings" title="Account settings" description="Update your profile, notification preferences, and password from one place." />
      {formMessage && <div className="rounded-sm border border-hairline bg-cloud px-4 py-3 text-caption text-ink">{formMessage}</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-h2 text-ink">Profile</h2>
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="mt-4 space-y-4" noValidate>
            <Field label="First name"><Input {...profileForm.register("firstName")} error={profileForm.formState.errors.firstName?.message} /></Field>
            <Field label="Last name"><Input {...profileForm.register("lastName")} error={profileForm.formState.errors.lastName?.message} /></Field>
            <Field label="Job title"><Input {...profileForm.register("jobTitle")} error={profileForm.formState.errors.jobTitle?.message} /></Field>
            <Field label="Timezone"><Input {...profileForm.register("timezone")} error={profileForm.formState.errors.timezone?.message} /></Field>
            <Button type="submit" isLoading={actions.updateProfile.isPending}>Save profile</Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-h2 text-ink">Notifications</h2>
          <form onSubmit={prefsForm.handleSubmit(savePreferences)} className="mt-4 space-y-4" noValidate>
            <Field label="Email on assignment"><input type="checkbox" className="h-4 w-4 rounded border-hairline text-indigo-deep focus-visible:ring-2 focus-visible:ring-indigo-deep" {...prefsForm.register("emailOnAssignment")} /></Field>
            <Field label="Email on comment"><input type="checkbox" className="h-4 w-4 rounded border-hairline text-indigo-deep focus-visible:ring-2 focus-visible:ring-indigo-deep" {...prefsForm.register("emailOnComment")} /></Field>
            <Field label="Email on due soon"><input type="checkbox" className="h-4 w-4 rounded border-hairline text-indigo-deep focus-visible:ring-2 focus-visible:ring-indigo-deep" {...prefsForm.register("emailOnDueSoon")} /></Field>
            <Field label="In-app notifications"><input type="checkbox" className="h-4 w-4 rounded border-hairline text-indigo-deep focus-visible:ring-2 focus-visible:ring-indigo-deep" {...prefsForm.register("inAppEnabled")} /></Field>
            <Button type="submit" isLoading={actions.updatePreferences.isPending}>Save preferences</Button>
          </form>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-h2 text-ink">Change password</h2>
          <form onSubmit={passwordForm.handleSubmit(changePassword)} className="mt-4 grid gap-4 md:grid-cols-3" noValidate>
            <Field label="Current password"><Input type="password" {...passwordForm.register("currentPassword")} error={passwordForm.formState.errors.currentPassword?.message} /></Field>
            <Field label="New password"><Input type="password" {...passwordForm.register("newPassword")} error={passwordForm.formState.errors.newPassword?.message} /></Field>
            <div className="flex items-end"><Button type="submit" isLoading={actions.changePassword.isPending}>Update password</Button></div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}<FieldError message={undefined} /></div>;
}

function SettingsSkeleton() {
  return <Skeleton className="h-[500px]" />;
}
