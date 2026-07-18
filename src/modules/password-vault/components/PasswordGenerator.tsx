"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generatePassword } from "../services/password-utils";
import { PasswordStrength } from "./PasswordStrength";
import { evaluateStrength } from "../services/password-utils";
import { RefreshCw, Copy, Check } from "lucide-react";
import type { PasswordGeneratorOptions } from "../types";

type Props = {
  onSelect: (password: string) => void;
};

export function PasswordGenerator({ onSelect }: Props) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
  });
  const [generated, setGenerated] = useState(() => generatePassword(options));
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setGenerated(generatePassword(options));
  }, [options]);

  function updateOption<K extends keyof PasswordGeneratorOptions>(
    key: K,
    value: PasswordGeneratorOptions[K]
  ) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  function handleCopy() {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const strength = evaluateStrength(generated);

  return (
    <div className="space-y-4 p-4 bg-bg-page rounded-lg border border-border-light">
      <div className="flex items-center gap-2">
        <Input
          value={generated}
          readOnly
          className="font-mono text-sm bg-bg-surface border-border-light text-text-primary"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={regenerate}
          className="text-text-secondary hover:text-text-primary"
          title="Generate new password"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="text-text-secondary hover:text-text-primary"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      <PasswordStrength strength={strength} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="font-sans text-xs text-text-secondary">Length: {options.length}</Label>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) => updateOption("length", parseInt(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
        <div />
        <ToggleOption label="Uppercase (A-Z)" checked={options.uppercase} onChange={(v) => updateOption("uppercase", v)} />
        <ToggleOption label="Lowercase (a-z)" checked={options.lowercase} onChange={(v) => updateOption("lowercase", v)} />
        <ToggleOption label="Numbers (0-9)" checked={options.numbers} onChange={(v) => updateOption("numbers", v)} />
        <ToggleOption label="Symbols (!@#)" checked={options.symbols} onChange={(v) => updateOption("symbols", v)} />
        <ToggleOption label="Exclude Ambiguous" checked={options.excludeAmbiguous} onChange={(v) => updateOption("excludeAmbiguous", v)} />
      </div>

      <Button
        onClick={() => onSelect(generated)}
        className="w-full bg-accent hover:bg-accent-hover text-white font-sans"
      >
        Use This Password
      </Button>
    </div>
  );
}

function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-accent w-4 h-4"
      />
      <span className="font-sans text-xs text-text-secondary">{label}</span>
    </label>
  );
}
