"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const AUTO_LOCK_MINUTES = 5;

type MasterPasswordState = {
  isUnlocked: boolean;
  isSetup: boolean;
  isLoading: boolean;
};

export function useMasterPassword() {
  const [state, setState] = useState<MasterPasswordState>({
    isUnlocked: false,
    isSetup: false,
    isLoading: true,
  });
  const masterPasswordRef = useRef<string | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkMasterPasswordSetup();
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  async function checkMasterPasswordSetup() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({ isUnlocked: false, isSetup: false, isLoading: false });
        return;
      }

      const res = await fetch("/api/vault/setup");
      const json = await res.json();
      setState({
        isUnlocked: false,
        isSetup: json.data?.hasMasterPassword || false,
        isLoading: false,
      });
    } catch {
      setState({ isUnlocked: false, isSetup: false, isLoading: false });
    }
  }

  const setupMasterPassword = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/vault/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterPassword }),
        });
        if (!res.ok) return false;

        masterPasswordRef.current = masterPassword;
        setState({ isUnlocked: true, isSetup: true, isLoading: false });
        startLockTimer();
        return true;
      } catch {
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const unlock = useCallback(
    async (masterPassword: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/vault/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterPassword }),
        });
        if (!res.ok) return false;

        masterPasswordRef.current = masterPassword;
        setState((s) => ({ ...s, isUnlocked: true }));
        startLockTimer();
        return true;
      } catch {
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const lock = useCallback(() => {
    masterPasswordRef.current = null;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    setState((s) => ({ ...s, isUnlocked: false }));
  }, []);

  const getMasterPassword = useCallback((): string | null => {
    return masterPasswordRef.current;
  }, []);

  function startLockTimer() {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      lock();
    }, AUTO_LOCK_MINUTES * 60 * 1000);
  }

  const resetLockTimer = useCallback(() => {
    if (masterPasswordRef.current) {
      startLockTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    setupMasterPassword,
    unlock,
    lock,
    getMasterPassword,
    resetLockTimer,
  };
}
