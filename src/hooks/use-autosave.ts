"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useJournalStore } from "@/stores/journal-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useOnlineStatus } from "./use-online-status";
import { useDebounce } from "./use-debounce";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

type AutosaveData = {
  content: Record<string, unknown>;
  contentText: string;
};

export function useAutosave(
  data: AutosaveData,
  saveFn: (data: AutosaveData) => Promise<void>
): SaveStatus {
  const isOnline = useOnlineStatus();
  const { autosaveInterval } = useSettingsStore();
  const { setIsDirty, setLastSaved } = useJournalStore();
  const savingLock = useRef(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedKeyRef = useRef("");
  const saveVersionRef = useRef(0);
  const mountedRef = useRef(true);

  const debouncedData = useDebounce(data, autosaveInterval * 1000);

  const save = useCallback(async () => {
    if (savingLock.current) return;

    const contentKey = JSON.stringify(debouncedData);
    if (contentKey === lastSavedKeyRef.current) return;

    savingLock.current = true;
    const thisVersion = ++saveVersionRef.current;

    try {
      if (isOnline) {
        setSaveStatus("saving");
        await saveFn(debouncedData);
        if (mountedRef.current && thisVersion === saveVersionRef.current) {
          setSaveStatus("saved");
          lastSavedKeyRef.current = contentKey;
          setLastSaved(new Date());
          setIsDirty(false);
          setTimeout(() => {
            if (mountedRef.current) setSaveStatus("idle");
          }, 2000);
        }
      } else {
        const { set } = await import("idb-keyval");
        await set("pending-entry", {
          ...debouncedData,
          timestamp: Date.now(),
        });
        if (mountedRef.current && thisVersion === saveVersionRef.current) {
          setSaveStatus("offline");
          lastSavedKeyRef.current = contentKey;
          setLastSaved(new Date());
          setIsDirty(false);
        }
      }
    } catch (err) {
      console.error("Autosave failed:", err);
      if (mountedRef.current) setSaveStatus("error");
    } finally {
      savingLock.current = false;
    }
  }, [debouncedData, isOnline, saveFn, setLastSaved, setIsDirty]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    save();
  }, [debouncedData, save]);

  useEffect(() => {
    if (!isOnline) return;

    async function syncPending() {
      try {
        const { get, del } = await import("idb-keyval");
        const pending = await get("pending-entry");
        if (pending) {
          setSaveStatus("saving");
          await saveFn(pending);
          await del("pending-entry");
          if (mountedRef.current) {
            setSaveStatus("saved");
            setLastSaved(new Date());
          }
        }
      } catch (err) {
        console.error("Offline sync failed:", err);
      }
    }

    syncPending();
  }, [isOnline, saveFn, setLastSaved]);

  return saveStatus;
}
