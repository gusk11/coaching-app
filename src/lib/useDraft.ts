"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface DraftMeta {
  savedAt: string;
  baseUpdatedAt?: string;
}

interface StoredDraft<T> {
  data: T;
  savedAt: string;
  baseUpdatedAt?: string;
}

function readStored<T>(key: string): StoredDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft<T>;
  } catch {
    return null;
  }
}

export function cleanupOldDrafts(maxAgeDays = 14): void {
  if (typeof window === "undefined") return;
  try {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("draft:v1:")) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) { toRemove.push(key); continue; }
        const entry = JSON.parse(raw) as { savedAt?: string };
        if (!entry.savedAt || new Date(entry.savedAt).getTime() < cutoff) toRemove.push(key);
      } catch {
        toRemove.push(key);
      }
    }
    for (const k of toRemove) {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export function clearUserDrafts(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const prefix = `draft:v1:${userId}:`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) toRemove.push(key);
    }
    for (const k of toRemove) {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export function useDraft<T>(
  key: string,
  state: T,
  options?: { debounceMs?: number; enabled?: boolean; baseUpdatedAt?: string }
) {
  const { debounceMs = 800, enabled = true, baseUpdatedAt } = options ?? {};

  // Captured exactly once at mount — the restorable snapshot
  const [mountDraft] = useState<StoredDraft<T> | null>(() => readStored<T>(key));
  const [hasDraft, setHasDraft] = useState(() => !!readStored(key));
  const [draftMeta, setDraftMeta] = useState<DraftMeta | null>(() => {
    const d = readStored<T>(key);
    return d ? { savedAt: d.savedAt, baseUpdatedAt: d.baseUpdatedAt } : null;
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const baseUpdatedAtRef = useRef(baseUpdatedAt);
  useEffect(() => { baseUpdatedAtRef.current = baseUpdatedAt; }, [baseUpdatedAt]);

  const initialJsonRef = useRef(JSON.stringify(state));
  const prevJsonRef = useRef(JSON.stringify(state));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(enabled && JSON.stringify(state) !== initialJsonRef.current);
  }, [state, enabled]);

  const immediateWrite = useCallback(() => {
    if (!enabled) return;
    try {
      const entry: StoredDraft<T> = {
        data: stateRef.current,
        savedAt: new Date().toISOString(),
        baseUpdatedAt: baseUpdatedAtRef.current,
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch { /* Safari Private Mode or quota */ }
  }, [key, enabled]);

  // Debounced write on state change
  useEffect(() => {
    if (!enabled) return;
    const currentJson = JSON.stringify(state);
    if (currentJson === prevJsonRef.current) return;
    prevJsonRef.current = currentJson;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(immediateWrite, debounceMs);
  }, [state, enabled, debounceMs, immediateWrite]);

  // Flush on page hide / tab switch
  useEffect(() => {
    if (!enabled) return;
    const onPageHide = () => immediateWrite();
    const onVisibility = () => { if (document.visibilityState === "hidden") immediateWrite(); };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, immediateWrite]);

  // beforeunload warning when dirty
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const restoreDraft = useCallback((): T | null => mountDraft?.data ?? null, [mountDraft]);

  const discardDraft = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    setHasDraft(false);
    setDraftMeta(null);
  }, [key]);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    setHasDraft(false);
    setDraftMeta(null);
    initialJsonRef.current = JSON.stringify(stateRef.current);
    prevJsonRef.current = initialJsonRef.current;
  }, [key]);

  return { hasDraft, draftMeta, restoreDraft, discardDraft, clearDraft, isDirty };
}
