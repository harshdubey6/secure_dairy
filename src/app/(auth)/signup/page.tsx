"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(data: SignUpInput) {
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { display_name: data.displayName },
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Check your email to verify your account!");
    router.push("/verify-email");
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
          Create your private journal
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="displayName"
            className="font-sans text-sm text-text-primary"
          >
            Name
          </Label>
          <Input
            id="displayName"
            placeholder="Your name"
            className="bg-bg-surface border-border text-text-primary font-sans"
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="font-sans text-xs text-red">
              {errors.displayName.message}
            </p>
          )}
        </div>

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
          <Label
            htmlFor="password"
            className="font-sans text-sm text-text-primary"
          >
            Password
          </Label>
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent hover:bg-accent-hover text-white font-sans"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="font-sans text-sm text-text-secondary text-center mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          Sign In
        </Link>
      </p>
    </div>
  );
}
