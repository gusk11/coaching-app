"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

interface Options<T> {
  value: T;
  save: (value: T) => Promise<void>;
  debounceMs?: number;
  isValid: boolean;
}

export interface AutosaveResult {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  flush: () => Promise<void>;
}

export function useAutosave<T>({ value, save, debounceMs = 1500, isValid }: Options<T>): AutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);

  const isValidRef = useRef(isValid);
  useEffect(() => { isValidRef.current = isValid; }, [isValid]);

  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const lastSavedJsonRef = useRef(JSON.stringify(value));
  const prevJsonRef = useRef(JSON.stringify(value));
  const pendingValueRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const statusRef = useRef<AutosaveStatus>("idle");
  const executeSaveRef = useRef<((v: T) => Promise<void>) | null>(null);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const executeSave = useCallback(async (valueToSave: T): Promise<void> => {
    if (!mountedRef.current || isSavingRef.current) {
      if (isSavingRef.current) pendingValueRef.current = valueToSave;
      return;
    }
    isSavingRef.current = true;
    if (mountedRef.current) setStatus("saving");

    const attempt = async (val: T): Promise<void> => {
      await saveRef.current(val);
      if (!mountedRef.current) return;
      lastSavedJsonRef.current = JSON.stringify(val);
      setLastSavedAt(new Date());
      setStatus("saved");
      setTimeout(() => {
        if (mountedRef.current) setStatus((s) => (s === "saved" ? "idle" : s));
      }, 3000);
    };

    try {
      await attempt(valueToSave);

      // Drain any pending value that arrived while we were saving
      if (pendingValueRef.current !== null) {
        const next = pendingValueRef.current;
        pendingValueRef.current = null;
        const nextJson = JSON.stringify(next);
        if (nextJson !== lastSavedJsonRef.current && isValidRef.current) {
          isSavingRef.current = false;
          await executeSaveRef.current!(next);
          return;
        }
      }
    } catch {
      if (!mountedRef.current) return;
      setStatus("error");
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        if (!navigator.onLine) { if (mountedRef.current) setStatus("offline"); isSavingRef.current = false; return; }
        try {
          await attempt(valueToSave);
        } catch {
          if (mountedRef.current) setStatus("error");
        } finally {
          isSavingRef.current = false;
        }
      }, 2000);
      return;
    }
    isSavingRef.current = false;
  }, []);

  useEffect(() => { executeSaveRef.current = executeSave; }, [executeSave]);

  // Debounced save on value/isValid change
  useEffect(() => {
    const currentJson = JSON.stringify(value);
    if (currentJson === prevJsonRef.current) return;
    prevJsonRef.current = currentJson;

    if (!isValid) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      return;
    }
    if (currentJson === lastSavedJsonRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const v = valueRef.current;
      if (JSON.stringify(v) === lastSavedJsonRef.current || !isValidRef.current) return;
      executeSave(v);
    }, debounceMs);
  }, [value, isValid, debounceMs, executeSave]);

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const current = valueRef.current;
    if (JSON.stringify(current) === lastSavedJsonRef.current || !isValidRef.current) return;
    await executeSave(current);
  }, [executeSave]);

  // Flush on page hide / tab switch
  useEffect(() => {
    const onPageHide = () => void flush();
    const onVisibility = () => { if (document.visibilityState === "hidden") void flush(); };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  // beforeunload warning when unsaved changes exist
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const unsaved = statusRef.current === "saving" || JSON.stringify(valueRef.current) !== lastSavedJsonRef.current;
      if (unsaved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return { status, lastSavedAt, flush };
}
