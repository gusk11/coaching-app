"use client";
import { useRef, useState } from "react";
import { Athlete, AthleteProfile } from "@/types";
import { AthleteStammdatenForm } from "@/components/athlete/AthleteStammdatenForm";
import { showToast } from "@/components/ui/Toast";
import { cn, copyTextToClipboard } from "@/lib/utils";
import { CopyContextModal } from "@/components/coach/CopyContextModal";
import { Copy, Upload, Loader2 } from "lucide-react";

interface Props {
  athlete: Athlete;
  onSave: (updates: Partial<Athlete>) => void;
  onSaveProfile?: (profile: AthleteProfile) => void;
  onPlansImported?: () => void;
}

async function uploadPlan(athleteId: string, planType: "training" | "meal" | "supplement", file: File): Promise<void> {
  const text = await file.text();
  let plan: unknown;
  try {
    plan = JSON.parse(text);
  } catch {
    throw new Error("Ungültiges JSON-Format");
  }
  const planWithId = (plan as Record<string, unknown>).athleteId
    ? plan
    : { ...(plan as Record<string, unknown>), athleteId };

  const res = await fetch("/api/import-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planType, athleteId, plan: planWithId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.issues?.length) {
      throw new Error(`Validierungsfehler:\n${(data.issues as string[]).join("\n")}`);
    }
    throw new Error(data.error ?? "Import fehlgeschlagen");
  }
}

function PlanUploadButton({
  label,
  planType,
  athleteId,
  onSuccess,
}: {
  label: string;
  planType: "training" | "meal" | "supplement";
  athleteId: string;
  onSuccess?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await uploadPlan(athleteId, planType, file);
      showToast(`${label} erfolgreich hinzugefügt`, "success");
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      showToast(msg, "error");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141d2e] border border-[#1e2d42] text-xs text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {label}
      </button>
    </>
  );
}

export function AthleteProfileEditor({ athlete, onSave, onSaveProfile, onPlansImported }: Props) {
  const [copyingContext, setCopyingContext] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  async function handleCopyContext() {
    setCopyingContext(true);
    let text: string;
    try {
      const res = await fetch(`/api/export-plan-context?athleteId=${encodeURIComponent(athlete.id)}`);
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      ({ text } = await res.json());
    } catch {
      showToast("Export fehlgeschlagen", "error");
      setCopyingContext(false);
      return;
    }
    setCopyingContext(false);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      showToast("Kontext in Zwischenablage kopiert", "success");
    } else {
      setFallbackText(text);
    }
  }

  return (
    <>
    {fallbackText !== null && (
      <CopyContextModal text={fallbackText} onClose={() => setFallbackText(null)} />
    )}
    <div className="flex flex-col gap-4">
      {athlete.athleteNumber && (
        <div className="px-4 py-2.5 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex items-center justify-between text-sm">
          <span className="text-[#5a7090]">Athleten-ID</span>
          <span className="text-[#f0f4ff] font-mono tracking-widest">{athlete.athleteNumber}</span>
        </div>
      )}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#f0f4ff]">Planbearbeitung erlauben</p>
          <p className="text-xs text-[#5a7090] mt-0.5">
            Athlet kann Vorschläge für Trainings- und Ernährungsplan einreichen
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSave({ planBearbeitungErlaubt: !athlete.planBearbeitungErlaubt })}
          aria-label="Planbearbeitung erlauben"
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors shrink-0",
            athlete.planBearbeitungErlaubt ? "bg-[#3b82f6]" : "bg-[#1e2d42]"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
              athlete.planBearbeitungErlaubt ? "left-5" : "left-0.5"
            )}
          />
        </button>
      </div>

      {/* Claude context export + plan import */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-[#f0f4ff]">Pläne mit Claude erstellen</p>
          <p className="text-xs text-[#5a7090] mt-0.5">
            Kontext kopieren, in Claude einfügen, JSON-Plan generieren lassen und hier importieren.
          </p>
        </div>
        <button
          type="button"
          disabled={copyingContext}
          onClick={handleCopyContext}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1d4ed8]/10 border border-[#3b82f6]/30 text-xs text-[#60a5fa] hover:bg-[#1d4ed8]/20 transition-colors disabled:opacity-50 self-start"
        >
          {copyingContext ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
          Kontext für Claude kopieren
        </button>
        <div className="flex flex-wrap gap-2">
          <PlanUploadButton
            label="Ernährungsplan hinzufügen"
            planType="meal"
            athleteId={athlete.id}
            onSuccess={onPlansImported}
          />
          <PlanUploadButton
            label="Trainingsplan hinzufügen"
            planType="training"
            athleteId={athlete.id}
            onSuccess={onPlansImported}
          />
          <PlanUploadButton
            label="Supplementplan hinzufügen"
            planType="supplement"
            athleteId={athlete.id}
            onSuccess={onPlansImported}
          />
        </div>
      </div>

      <AthleteStammdatenForm athlete={athlete} mode="coach" onSave={onSave} onSaveProfile={onSaveProfile} />
    </div>
    </>
  );
}
