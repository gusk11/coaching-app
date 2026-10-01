"use client";
import { AutosaveStatus } from "@/lib/useAutosave";

interface Props {
  status: AutosaveStatus;
  className?: string;
}

export function SaveStatusIndicator({ status, className = "" }: Props) {
  if (status === "idle") return null;
  const base = `text-[10px] ${className}`;
  if (status === "saving")  return <span className={`${base} text-[#5a7090]`}>Speichert…</span>;
  if (status === "saved")   return <span className={`${base} text-[#10b981]`}>Gespeichert ✓</span>;
  if (status === "offline") return <span className={`${base} text-[#f59e0b]`}>Offline – lokal gesichert</span>;
  if (status === "error")   return <span className={`${base} text-[#ef4444]`}>Fehler – wird erneut versucht</span>;
  return null;
}
