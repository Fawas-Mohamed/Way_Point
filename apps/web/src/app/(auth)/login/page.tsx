"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@waypoint/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { getApiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FieldError } from "@/components/ui/FieldError";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      await login(values);
      router.push("/dashboard");
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Incorrect email or password"));
    }
  }

  return (
    <div>
      <h1 className="font-display text-h1 text-ink">Welcome back</h1>
      <p className="mt-1.5 text-body text-slate-mid">Sign in to pick up where you left off.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {formError && (
          <div role="alert" className="rounded-sm border border-ember-red/25 bg-ember-soft px-3 py-2.5 text-caption text-ember-red">
            {formError}
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="mb-1.5 text-[12px] font-semibold text-indigo-deep hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>

        <label className="flex items-center gap-2 text-caption text-slate-mid">
          <input type="checkbox" className="h-4 w-4 rounded border-hairline text-indigo-deep focus-visible:ring-2 focus-visible:ring-indigo-deep" {...register("rememberMe")} />
          Remember me on this device
        </label>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-caption text-slate-mid">
        New to Waypoint?{" "}
        <Link href="/register" className="font-semibold text-indigo-deep hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-sm border border-hairline bg-cloud px-4 py-3 text-[12px] text-slate-mid">
        Demo accounts (password: <span className="font-mono">Password123!</span>): admin@waypoint.app · priya@waypoint.app · jonas@waypoint.app
      </div>
    </div>
  );
}
