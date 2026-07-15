"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@waypoint/types";
import { authApi } from "@/features/auth/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FieldError } from "@/components/ui/FieldError";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    await authApi.forgotPassword(values);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-soft">
          <CheckCircle2 className="h-5 w-5 text-emerald-route" />
        </div>
        <h1 className="font-display text-h1 text-ink">Check your email</h1>
        <p className="mt-1.5 text-body text-slate-mid">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-caption font-semibold text-indigo-deep hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-h1 text-ink">Reset your password</h1>
      <p className="mt-1.5 text-body text-slate-mid">Enter your email and we&apos;ll send you a reset link.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-caption text-slate-mid">
        <Link href="/login" className="font-semibold text-indigo-deep hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
