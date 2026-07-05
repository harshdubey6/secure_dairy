"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useJournalStore } from "@/stores/journal-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useOnlineStatus } from "./use-online-status";
import { useDebounce } from "./use-debounce";

type AutosaveData = {
  content: Record<string, unknown>;
  contentText: string;
};

export function useAutosave(
  data: AutosaveData,
  saveFn: (data: AutosaveData) => Promise<void>
) {
  const isOnline = useOnlineStatus();
  const { autosaveInterval } = useSettingsStore();
  const { setIsDirty, setLastSaved, isDirty } = useJournalStore();
  const savingLock = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedData = useDebounce(data, autosaveInterval * 1000);

  const save = useCallback(async () => {
    if (savingLock.current || !isDirty) return;

    savingLock.current = true;
    setIsSaving(true);
    try {
      if (isOnline) {
        await saveFn(debouncedData);
      } else {
        const { set } = await import("idb-keyval");
        await set("pending-entry", {
          ...debouncedData,
          timestamp: Date.now(),
        });
      }
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      console.error("Autosave failed:", err);
    } finally {
      savingLock.current = false;
      setIsSaving(false);
    }
  }, [debouncedData, isOnline, isDirty, saveFn, setLastSaved, setIsDirty]);

  useEffect(() => {
    if (isDirty) {
      save();
    }
  }, [debouncedData, save, isDirty]);

  useEffect(() => {
    if (!isOnline) return;

    async function syncPending() {
      try {
        const { get, del } = await import("idb-keyval");
        const pending = await get("pending-entry");
        if (pending) {
          await saveFn(pending);
          await del("pending-entry");
        }
      } catch (err) {
        console.error("Offline sync failed:", err);
      }
    }

    syncPending();
  }, [isOnline, saveFn]);

  return { isSaving };
}
