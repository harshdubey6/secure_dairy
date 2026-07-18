"use client";

import { useState, useCallback, useEffect } from "react";
import { useMasterPassword } from "../hooks/use-master-password";
import { useVault } from "../hooks/use-vault";
import { MasterPasswordDialog } from "./MasterPasswordDialog";
import { PasswordGenerator } from "./PasswordGenerator";
import { PasswordStrength } from "./PasswordStrength";
import { evaluateStrength } from "../services/password-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Star,
  Key,
  Globe,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  Shield,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { VaultItem } from "../types";

export function VaultPage() {
  const masterPassword = useMasterPassword();
  const vault = useVault(masterPassword.getMasterPassword);

  const [, setShowSetup] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (!masterPassword.isLoading && !masterPassword.isSetup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSetup(true);
    }
  }, [masterPassword.isLoading, masterPassword.isSetup]);

  const { unlock: mpUnlock } = masterPassword;
  const handleUnlock = useCallback(
    async (password: string) => {
      const ok = await mpUnlock(password);
      if (ok) setShowSetup(false);
      return ok;
    },
    [mpUnlock]
  );

  const { setupMasterPassword: mpSetup } = masterPassword;
  const handleSetup = useCallback(
    async (password: string) => {
      const ok = await mpSetup(password);
      if (ok) setShowSetup(false);
      return ok;
    },
    [mpSetup]
  );

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  if (masterPassword.isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-border-light rounded animate-pulse" />
        <div className="h-64 bg-border-light rounded animate-pulse" />
      </div>
    );
  }

  if (!masterPassword.isUnlocked) {
    return (
      <>
        {vault.isLoading ? null : (
          <MasterPasswordDialog
            isOpen={true}
            isSetup={!masterPassword.isSetup}
            onUnlock={handleUnlock}
            onSetup={handleSetup}
            onClose={() => {}}
          />
        )}
        {masterPassword.isSetup && (
          <div className="p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-accent/10 mb-4">
              <Lock className="w-8 h-8 text-accent" />
            </div>
            <p className="font-serif text-lg text-text-secondary">
              Enter your master password to access the vault
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-page">
      <div className="border-b border-border-light bg-bg-surface">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-accent" />
              <h1 className="font-serif text-2xl text-text-primary">Password Vault</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-text-secondary hover:text-text-primary font-sans text-sm"
              >
                <Key className="w-4 h-4 mr-1" />
                Generator
              </Button>
              <Button
                onClick={() => setShowNewForm(true)}
                className="bg-accent hover:bg-accent-hover text-white font-sans text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Password
              </Button>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              value={vault.filter.search}
              onChange={(e) => vault.setFilter({ ...vault.filter, search: e.target.value })}
              placeholder="Search passwords..."
              className="pl-10 bg-bg-page border-border-light text-text-primary font-sans"
            />
          </div>

          {vault.weakPasswordItems.length > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-md bg-red/5 border border-red/20">
              <AlertTriangle className="w-4 h-4 text-red shrink-0" />
              <span className="font-sans text-xs text-red">
                {vault.weakPasswordItems.length} weak {vault.weakPasswordItems.length === 1 ? "password" : "passwords"} detected
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6">
        {showGenerator && (
          <div className="mb-6">
            <PasswordGenerator
              onSelect={() => {
                toast.success("Password generated! Use it in the form.");
                setShowGenerator(false);
              }}
            />
          </div>
        )}

        {showNewForm && (
          <NewItemForm
            categories={vault.categories}
            onSave={async (data) => {
              await vault.createItem(data);
              setShowNewForm(false);
              toast.success("Password saved securely");
            }}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {selectedItem ? (
          <ItemDetail
            item={selectedItem}
            categories={vault.categories}
            decryptedPassword={vault.decryptedPasswords[selectedItem.id]}
            onReveal={() => vault.revealPassword(selectedItem.id)}
            onHide={() => vault.hidePassword(selectedItem.id)}
            onCopy={handleCopy}
            onDelete={async () => {
              await vault.deleteItem(selectedItem.id);
              setSelectedItem(null);
              toast.success("Password deleted");
            }}
            onBack={() => setSelectedItem(null)}
          />
        ) : (
          <div className="space-y-2">
            {vault.items.length === 0 && !vault.isLoading && (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="font-serif text-text-secondary">No passwords yet</p>
                <p className="font-sans text-sm text-text-muted mt-1">
                  Click &ldquo;New Password&rdquo; to add your first entry
                </p>
              </div>
            )}

            {vault.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full flex items-center gap-4 p-4 rounded-lg bg-bg-surface border border-border-light hover:border-accent/30 transition-colors text-left"
              >
                <div className="p-2 rounded-full bg-accent/5">
                  <Globe className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-medium text-text-primary truncate">
                      {item.name}
                    </span>
                    {item.isFavorite && <Star className="w-3 h-3 text-accent fill-accent" />}
                  </div>
                  <p className="font-sans text-xs text-text-muted truncate mt-0.5">
                    {item.username}
                    {item.username && item.url && " · "}
                    {item.url && <span className="text-accent">{item.url}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-xs font-sans px-1.5 py-0.5 rounded",
                    item.strength === "strong" || item.strength === "very-strong"
                      ? "text-green bg-green/10"
                      : item.strength === "medium"
                      ? "text-yellow-500 bg-yellow-500/10"
                      : "text-red bg-red/10"
                  )}>
                    {item.strength}
                  </span>
                  {vault.decryptedPasswords[item.id] && (
                    <span className="text-xs text-text-muted font-sans">Decrypted</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewItemForm({
  categories,
  onSave,
  onCancel,
}: {
  categories: { id: string; name: string }[];
  onSave: (data: {
    name: string;
    password: string;
    username?: string;
    url?: string;
    email?: string;
    categoryId?: string;
    tags?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !password) return;
    setSaving(true);
    try {
      await onSave({
        name,
        password,
        username: username || undefined,
        url: url || undefined,
        email: email || undefined,
        categoryId: categoryId || undefined,
        notes: notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const strength = evaluateStrength(password);

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-6 rounded-lg bg-bg-surface border border-border-light space-y-4">
      <h3 className="font-serif text-lg text-text-primary">New Password</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-sans text-xs text-text-secondary">Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GitHub" className="bg-bg-page border-border-light text-text-primary font-sans" required />
        </div>
        <div className="space-y-1">
          <label className="font-sans text-xs text-text-secondary">URL</label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com" className="bg-bg-page border-border-light text-text-primary font-sans" />
        </div>
        <div className="space-y-1">
          <label className="font-sans text-xs text-text-secondary">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="bg-bg-page border-border-light text-text-primary font-sans" />
        </div>
        <div className="space-y-1">
          <label className="font-sans text-xs text-text-secondary">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="bg-bg-page border-border-light text-text-primary font-sans" />
        </div>
        <div className="space-y-1">
          <label className="font-sans text-xs text-text-secondary">Password *</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="bg-bg-page border-border-light text-text-primary font-sans" required />
        </div>
        <div className="space-y-1">
          <label className="font-sans text-xs text-text-secondary">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-bg-page border border-border-light text-text-primary font-sans text-sm"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {password && <PasswordStrength strength={strength} />}

      <div className="space-y-1">
        <label className="font-sans text-xs text-text-secondary">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-md bg-bg-page border border-border-light text-text-primary font-sans text-sm resize-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-text-secondary font-sans text-sm">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name || !password} className="bg-accent hover:bg-accent-hover text-white font-sans text-sm">
          {saving ? "Saving..." : "Save Password"}
        </Button>
      </div>
    </form>
  );
}

function ItemDetail({
  item,
  categories,
  decryptedPassword,
  onReveal,
  onHide,
  onCopy,
  onDelete,
  onBack,
}: {
  item: VaultItem;
  categories: { id: string; name: string }[];
  decryptedPassword?: string;
  onReveal: () => void;
  onHide: () => void;
  onCopy: (text: string, label: string) => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const category = categories.find((c) => c.id === item.categoryId);

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 font-sans text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to vault
      </button>

      <div className="p-6 rounded-lg bg-bg-surface border border-border-light space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl text-text-primary">{item.name}</h2>
            {category && (
              <Badge variant="secondary" className="mt-1 font-sans text-xs bg-accent/5 text-accent border-accent/20">
                {category.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-text-muted hover:text-red">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <DetailField label="Username" value={item.username} onCopy={() => onCopy(item.username, "Username")} />
          <DetailField label="Email" value={item.email || ""} onCopy={() => item.email && onCopy(item.email, "Email")} />

          <div className="space-y-1">
            <label className="font-sans text-xs text-text-muted">Password</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-bg-page border border-border-light font-mono text-sm text-text-primary">
                {decryptedPassword || "••••••••••••"}
              </code>
              <Button variant="ghost" size="icon" onClick={decryptedPassword ? onHide : onReveal} className="text-text-secondary hover:text-text-primary">
                {decryptedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {decryptedPassword && (
                <Button variant="ghost" size="icon" onClick={() => onCopy(decryptedPassword!, "Password")} className="text-text-secondary hover:text-text-primary">
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
            <PasswordStrength strength={item.strength} />
          </div>

          {item.url && (
            <div className="space-y-1">
              <label className="font-sans text-xs text-text-muted">URL</label>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-sans text-sm text-accent hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {item.url}
              </a>
            </div>
          )}

          {item.notes && (
            <div className="space-y-1">
              <label className="font-sans text-xs text-text-muted">Notes</label>
              <p className="font-sans text-sm text-text-secondary bg-bg-page rounded-md p-3 border border-border-light">
                {item.notes}
              </p>
            </div>
          )}

          {item.tags.length > 0 && (
            <div className="flex items-center gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-sans text-xs text-text-muted border-border-light">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-border-light font-sans text-xs text-text-muted">
          <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
          {item.lastAccessedAt && <span>Last accessed: {new Date(item.lastAccessedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <label className="font-sans text-xs text-text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <span className="flex-1 font-sans text-sm text-text-primary">{value}</span>
        <Button variant="ghost" size="icon" onClick={onCopy} className="text-text-muted hover:text-text-primary">
          <Copy className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function Lock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
