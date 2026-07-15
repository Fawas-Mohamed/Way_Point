"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterInput } from "@waypoint/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { getApiErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FieldError } from "@/components/ui/FieldError";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await registerUser(values);
      router.push("/dashboard");
    } catch (err) {
      setFormError(getApiErrorMessage(err, "We couldn't create your account"));
    }
  }

  return (
    <div>
      <h1 className="font-display text-h1 text-ink">Create your account</h1>
      <p className="mt-1.5 text-body text-slate-mid">Start mapping your team&apos;s work in minutes.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        {formError && (
          <div role="alert" className="rounded-sm border border-ember-red/25 bg-ember-soft px-3 py-2.5 text-caption text-ember-red">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <FieldError message={errors.password?.message} />
          <p className="mt-1.5 text-[12px] text-slate-mid">At least 8 characters, with an uppercase letter, a lowercase letter, and a number.</p>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-caption text-slate-mid">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-deep hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
