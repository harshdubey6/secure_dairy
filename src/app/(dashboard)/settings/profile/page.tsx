"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validations/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  async function onSubmit() {
    setIsLoading(true);
    // Profile update - placeholder
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Profile updated");
    setIsLoading(false);
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-text-primary mb-8">Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label className="font-sans text-sm text-text-primary">
            Display Name
          </Label>
          <Input
            {...register("displayName")}
            placeholder="Your name"
            className="bg-bg-surface border-border text-text-primary font-sans"
          />
          {errors.displayName && (
            <p className="font-sans text-xs text-red">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="font-sans text-sm text-text-primary">Bio</Label>
          <Textarea
            {...register("bio")}
            placeholder="A short description..."
            rows={3}
            className="bg-bg-surface border-border text-text-primary font-sans resize-none"
          />
          {errors.bio && (
            <p className="font-sans text-xs text-red">
              {errors.bio.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-accent hover:bg-accent-hover text-white font-sans"
        >
          {isLoading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
