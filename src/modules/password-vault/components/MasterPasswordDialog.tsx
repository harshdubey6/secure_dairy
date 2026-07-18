"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Shield } from "lucide-react";

type Props = {
  isOpen: boolean;
  isSetup: boolean;
  onUnlock: (password: string) => Promise<boolean>;
  onSetup: (password: string) => Promise<boolean>;
  onClose: () => void;
};

export function MasterPasswordDialog({ isOpen, isSetup, onUnlock, onSetup, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSetup) {
        if (password.length < 4) {
          setError("Master password must be at least 4 characters");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const success = await onSetup(password);
        if (!success) {
          setError("Failed to set up master password");
        }
      } else {
        const success = await onUnlock(password);
        if (!success) {
          setError("Incorrect master password");
        }
      }
    } catch {
      setError("An error occurred");
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-bg-surface border-border-light">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-accent/10">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl text-text-primary">
                {isSetup ? "Set Up Vault" : "Unlock Vault"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="font-sans text-sm text-text-secondary">
            {isSetup
              ? "Create a master password to protect your vault. This will be required to access your passwords."
              : "Enter your master password to access the password vault."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="font-sans text-sm text-text-secondary">Master Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master password"
              className="bg-bg-page border-border-light text-text-primary font-sans"
              autoFocus
            />
          </div>

          {isSetup && (
            <div className="space-y-2">
              <label className="font-sans text-sm text-text-secondary">Confirm Master Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm master password"
                className="bg-bg-page border-border-light text-text-primary font-sans"
              />
            </div>
          )}

          {error && (
            <p className="font-sans text-xs text-red flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="font-sans text-xs text-text-muted">
              <Shield className="w-3 h-3 inline mr-1" />
              Your master password is never stored in plain text
            </p>
            <Button
              type="submit"
              disabled={loading || !password}
              className="bg-accent hover:bg-accent-hover text-white font-sans"
            >
              {loading ? "Processing..." : isSetup ? "Create Vault" : "Unlock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
