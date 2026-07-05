"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { rememberMe: false },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/journal");
  }

  async function sendMagicLink() {
    const email = (document.getElementById("email") as HTMLInputElement)?.value;
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    setIsMagicLinkLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Magic link sent! Check your email.");
    }

    setIsMagicLinkLoading(false);
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
          Welcome back
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="font-sans text-sm text-text-primary"
            >
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="font-sans text-xs text-accent hover:text-accent-hover"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="bg-bg-surface border-border text-text-primary font-sans pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="font-sans text-xs text-red">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            className="rounded border-border accent-accent"
            {...register("rememberMe")}
          />
          <Label
            htmlFor="rememberMe"
            className="font-sans text-sm text-text-secondary"
          >
            Remember me
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent hover:bg-accent-hover text-white font-sans"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-light" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-bg-page px-3 font-sans text-xs text-text-muted">
            or
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isMagicLinkLoading}
        onClick={sendMagicLink}
        className="w-full border-border text-text-secondary hover:text-text-primary font-sans"
      >
        {isMagicLinkLoading ? "Sending..." : "Send Magic Link"}
      </Button>

      <p className="font-sans text-sm text-text-secondary text-center mt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-accent hover:text-accent-hover"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
