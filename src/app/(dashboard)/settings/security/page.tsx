"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Shield, Key } from "lucide-react";

export default function SecurityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  async function handleResetPassword() {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      (document.getElementById("email") as HTMLInputElement)?.value || ""
    );
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent");
    }
    setIsLoading(false);
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-text-primary mb-8">Security</h1>

      <div className="space-y-8">
        <section className="p-4 bg-bg-surface border border-border-light rounded-md">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-accent" />
            <h2 className="font-serif text-lg text-text-primary">Password</h2>
          </div>
          <p className="font-sans text-sm text-text-secondary mb-4">
            Send a password reset email to change your password.
          </p>
          <Button
            onClick={handleResetPassword}
            disabled={isLoading}
            variant="outline"
            className="border-border text-text-secondary hover:text-text-primary font-sans"
          >
            {isLoading ? "Sending..." : "Send Reset Email"}
          </Button>
        </section>

        <section className="p-4 bg-bg-surface border border-border-light rounded-md">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green" />
            <h2 className="font-serif text-lg text-text-primary">
              Privacy
            </h2>
          </div>
          <p className="font-sans text-sm text-text-secondary">
            Your journal is private. All data is stored securely with encryption
            at rest. Row Level Security ensures no one else can access your
            entries.
          </p>
        </section>
      </div>
    </div>
  );
}
