"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="font-serif text-2xl font-semibold text-text-primary mb-4">
          Check your email
        </div>
        <p className="font-sans text-sm text-text-secondary mb-8">
          We sent a password reset link to your email address.
        </p>
        <Link
          href="/login"
          className="font-sans text-sm text-accent hover:text-accent-hover"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <Link
          href="/"
          className="font-serif text-2xl font-semibold text-text-primary"
        >
          {APP_NAME}
        </Link>
        <p className="font-sans text-sm text-text-secondary mt-2">
          Reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-sans text-sm text-text-primary">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="bg-bg-surface border-border text-text-primary font-sans"
            {...register("email")}
          />
          {errors.email && (
            <p className="font-sans text-xs text-red">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent hover:bg-accent-hover text-white font-sans"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="font-sans text-sm text-text-secondary text-center mt-8">
        Remember your password?{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          Sign In
        </Link>
      </p>
    </div>
  );
}
