"use client";
import { useRef, useState } from "react";
import { Athlete, MealPlan, TrainingPlan, SupplementPlan } from "@/types";
import { MealPlanEditor } from "@/components/coach/MealPlanEditor";
import { TrainingEditor } from "@/components/coach/TrainingEditor";
import { SupplementEditor } from "@/components/coach/SupplementEditor";
import { MealPlanView } from "@/components/athlete/MealPlanView";
import { TrainingAccordion } from "@/components/athlete/TrainingAccordion";
import { SupplementList } from "@/components/athlete/SupplementList";
import { showToast } from "@/components/ui/Toast";
import { cn, resolveAthleteWeight } from "@/lib/utils";
import { copyMealPlan, copyTrainingPlan, copySupplementPlan } from "@/lib/planClipboard";
import { Upload, Loader2, Pencil, X, Check, Copy, ClipboardPaste } from "lucide-react";

type PlanSubTab = "Ernährung" | "Training" | "Supplements";

async function uploadPlan(
  athleteId: string,
  planType: "training" | "meal" | "supplement",
  file: File,
): Promise<void> {
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
  planType,
  athleteId,
  onSuccess,
}: {
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
      showToast("Plan erfolgreich hinzugefügt", "success");
      onSuccess?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unbekannter Fehler", "error");
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        Hinzufügen
      </button>
    </>
  );
}

interface Props {
  athlete: Athlete;
  onSaveMealPlan: (plan: MealPlan) => Promise<void>;
  onDeleteMealPlan: (planId: string) => Promise<void>;
  onSaveTrainingPlan: (plan: TrainingPlan) => Promise<void>;
  onSaveSupplementPlan: (plan: SupplementPlan) => Promise<void>;
  onToggleMealPlanActive: (planId: string) => Promise<void>;
  onToggleTrainingPlanActive: (planId: string) => Promise<void>;
  onToggleSupplementPlanActive: (planId: string) => Promise<void>;
  onPlansImported: () => Promise<void>;
}

function PlanToggleRow({
  title,
  isActive,
  onToggle,
  onCopy,
}: {
  title: string;
  isActive: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-xl border",
        isActive ? "bg-[#141d2e] border-[#1e2d42]" : "bg-[#141d2e]/60 border-[#1e2d42]/50",
      )}
    >
      <div className={cn("flex items-center gap-2 min-w-0", !isActive && "opacity-50")}>
        <span className="text-sm text-[#f0f4ff] truncate">{title}</span>
        {isActive ? (
          <span className="px-1.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#60a5fa] text-[10px] shrink-0">
            aktiv
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-full bg-[#1e2d42] text-[#5a7090] text-[10px] shrink-0">
            inaktiv
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onCopy}
          title="Kopieren"
          className="p-1.5 rounded-lg text-[#5a7090] hover:text-[#60a5fa] hover:bg-[#1e2d42] transition-colors"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={onToggle}
          title={isActive ? "Deaktivieren" : "Aktivieren"}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isActive
              ? "text-[#5a7090] hover:text-[#ef4444] hover:bg-[#ef4444]/10"
              : "text-[#5a7090] hover:text-[#10b981] hover:bg-[#10b981]/10",
          )}
        >
          {isActive ? <X size={14} /> : <Check size={14} />}
        </button>
      </div>
    </div>
  );
}

export function GeneralPlansView({
  athlete,
  onSaveMealPlan,
  onDeleteMealPlan,
  onSaveTrainingPlan,
  onSaveSupplementPlan,
  onToggleMealPlanActive,
  onToggleTrainingPlanActive,
  onToggleSupplementPlanActive,
  onPlansImported,
}: Props) {
  const [subTab, setSubTab] = useState<PlanSubTab>("Ernährung");
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [editingTraining, setEditingTraining] = useState(false);
  const [editingSupplements, setEditingSupplements] = useState(false);
  const [clipboardMeal, setClipboardMeal] = useState<MealPlan | null>(null);
  const [clipboardTraining, setClipboardTraining] = useState<TrainingPlan | null>(null);
  const [clipboardSupplement, setClipboardSupplement] = useState<SupplementPlan | null>(null);

  const mealPlans = athlete.mealPlans ?? [];
  const trainingPlans = athlete.trainingPlans?.length
    ? athlete.trainingPlans
    : athlete.trainingPlan
      ? [athlete.trainingPlan]
      : [];
  const suppPlans = athlete.supplementPlans?.length
    ? athlete.supplementPlans
    : athlete.supplementPlan
      ? [athlete.supplementPlan]
      : [];

  const activeMealPlans = mealPlans.filter((p) => p.isActive !== false);
  const activeTrainingPlans = trainingPlans.filter((p) => p.isActive !== false);
  const activeSuppPlans = suppPlans.filter((p) => p.isActive !== false);

  function handleCopyMealPlan(plan: MealPlan) {
    copyMealPlan(plan);
    setClipboardMeal(plan);
    showToast(`"${plan.title}" kopiert.`, "success");
  }

  async function handlePasteMealPlan() {
    if (!clipboardMeal) return;
    await onSaveMealPlan({ ...clipboardMeal, id: crypto.randomUUID(), athleteId: athlete.id });
  }

  function handleCopyTrainingPlan(plan: TrainingPlan) {
    copyTrainingPlan(plan);
    setClipboardTraining(plan);
    showToast(`"${plan.title}" kopiert.`, "success");
  }

  async function handlePasteTrainingPlan() {
    if (!clipboardTraining) return;
    await onSaveTrainingPlan({ ...clipboardTraining, id: crypto.randomUUID(), athleteId: athlete.id });
  }

  function handleCopySupplementPlan(plan: SupplementPlan) {
    copySupplementPlan(plan);
    setClipboardSupplement(plan);
    showToast("Supplementplan kopiert.", "success");
  }

  async function handlePasteSupplementPlan() {
    if (!clipboardSupplement) return;
    await onSaveSupplementPlan({ ...clipboardSupplement, id: crypto.randomUUID(), athleteId: athlete.id });
  }

  async function handleSaveTrainingPlan(plan: TrainingPlan) {
    await onSaveTrainingPlan(plan);
    setEditingTraining(false);
  }

  async function handleSaveSupplementPlan(plan: SupplementPlan) {
    await onSaveSupplementPlan(plan);
    setEditingSupplements(false);
  }

  const subTabs: PlanSubTab[] = ["Ernährung", "Training", "Supplements"];

  const headerBtn = (editing: boolean, onToggle: () => void) => (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
        editing
          ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
          : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]",
      )}
    >
      {editing ? <><X size={12} /> Bearbeitung beenden</> : <><Pencil size={12} /> Bearbeiten</>}
    </button>
  );

  const emptyState = (label: string, onEdit: () => void) => (
    <div className="text-center py-8">
      <p className="text-[#5a7090] mb-4">{label}</p>
      <button
        onClick={onEdit}
        className="px-4 py-2 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa] text-sm hover:bg-[#3b82f6]/20 transition-colors"
      >
        Plan erstellen
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1">
        {subTabs.map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              subTab === t ? "bg-[#1e2d42] text-[#f0f4ff]" : "text-[#5a7090] hover:text-[#8fa3c0]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Ernährung ── */}
      {subTab === "Ernährung" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#f0f4ff]">Ernährungspläne</p>
            <div className="flex items-center gap-1.5">
              {clipboardMeal && !editingNutrition && (
                <button
                  onClick={handlePasteMealPlan}
                  title={`"${clipboardMeal.title}" einfügen`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-[#141d2e] border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/10 transition-all"
                >
                  <ClipboardPaste size={12} /> Einfügen
                </button>
              )}
              {!editingNutrition && (
                <PlanUploadButton planType="meal" athleteId={athlete.id} onSuccess={onPlansImported} />
              )}
              {headerBtn(editingNutrition, () => setEditingNutrition((v) => !v))}
            </div>
          </div>

          {editingNutrition ? (
            <MealPlanEditor
              plans={mealPlans}
              athleteId={athlete.id}
              onSavePlan={onSaveMealPlan}
              onDeletePlan={onDeleteMealPlan}
              athleteWeight={resolveAthleteWeight(athlete)}
            />
          ) : mealPlans.length > 0 ? (
            <>
              <div className="flex flex-col gap-1.5">
                {mealPlans.map((plan) => (
                  <PlanToggleRow
                    key={plan.id}
                    title={plan.title}
                    isActive={plan.isActive !== false}
                    onToggle={() => onToggleMealPlanActive(plan.id)}
                    onCopy={() => handleCopyMealPlan(plan)}
                  />
                ))}
              </div>
              {activeMealPlans.length > 0 && (
                <MealPlanView plans={activeMealPlans} athleteWeight={resolveAthleteWeight(athlete)} />
              )}
            </>
          ) : (
            emptyState("Noch kein Ernährungsplan zugewiesen.", () => setEditingNutrition(true))
          )}
        </div>
      )}

      {/* ── Training ── */}
      {subTab === "Training" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#f0f4ff]">Trainingspläne</p>
            <div className="flex items-center gap-1.5">
              {clipboardTraining && !editingTraining && (
                <button
                  onClick={handlePasteTrainingPlan}
                  title={`"${clipboardTraining.title}" einfügen`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-[#141d2e] border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/10 transition-all"
                >
                  <ClipboardPaste size={12} /> Einfügen
                </button>
              )}
              {!editingTraining && (
                <PlanUploadButton planType="training" athleteId={athlete.id} onSuccess={onPlansImported} />
              )}
              {headerBtn(editingTraining, () => setEditingTraining((v) => !v))}
            </div>
          </div>

          {editingTraining ? (
            <TrainingEditor
              plan={athlete.trainingPlan}
              athleteId={athlete.id}
              onSave={handleSaveTrainingPlan}
            />
          ) : trainingPlans.length > 0 ? (
            <>
              <div className="flex flex-col gap-1.5">
                {trainingPlans.map((plan) => (
                  <PlanToggleRow
                    key={plan.id}
                    title={plan.title}
                    isActive={plan.isActive !== false}
                    onToggle={() => onToggleTrainingPlanActive(plan.id)}
                    onCopy={() => handleCopyTrainingPlan(plan)}
                  />
                ))}
              </div>
              {(() => {
                const ap = activeTrainingPlans[0];
                return ap && (ap.schritteProTag || ap.cardioMinuten) ? (
                  <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
                    <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Cardio-Vorgaben</p>
                    <p className="text-sm text-[#8fa3c0]">
                      {[
                        ap.schritteProTag
                          ? `${ap.schritteProTag.toLocaleString("de-DE")} Schritte/Tag`
                          : null,
                        ap.cardioMinuten
                          ? `${ap.cardioMinuten} Min Cardio ${ap.cardioFrequenz === "taeglich" ? "täglich" : "pro Woche"}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                ) : null;
              })()}
              <TrainingAccordion
                plans={activeTrainingPlans.length > 0 ? activeTrainingPlans : trainingPlans}
              />
            </>
          ) : (
            emptyState("Noch kein Trainingsplan zugewiesen.", () => setEditingTraining(true))
          )}
        </div>
      )}

      {/* ── Supplements ── */}
      {subTab === "Supplements" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#f0f4ff]">Supplementpläne</p>
            <div className="flex items-center gap-1.5">
              {clipboardSupplement && !editingSupplements && (
                <button
                  onClick={handlePasteSupplementPlan}
                  title="Supplementplan einfügen"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-[#141d2e] border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/10 transition-all"
                >
                  <ClipboardPaste size={12} /> Einfügen
                </button>
              )}
              {!editingSupplements && (
                <PlanUploadButton planType="supplement" athleteId={athlete.id} onSuccess={onPlansImported} />
              )}
              {headerBtn(editingSupplements, () => setEditingSupplements((v) => !v))}
            </div>
          </div>

          {editingSupplements ? (
            <SupplementEditor
              plan={athlete.supplementPlan}
              athleteId={athlete.id}
              onSave={handleSaveSupplementPlan}
            />
          ) : suppPlans.length > 0 ? (
            <>
              <div className="flex flex-col gap-1.5">
                {suppPlans.map((plan) => (
                  <PlanToggleRow
                    key={plan.id}
                    title={plan.title ?? "Supplementplan"}
                    isActive={plan.isActive !== false}
                    onToggle={() => onToggleSupplementPlanActive(plan.id)}
                    onCopy={() => handleCopySupplementPlan(plan)}
                  />
                ))}
              </div>
              {activeSuppPlans.length > 0 && <SupplementList plans={activeSuppPlans} />}
            </>
          ) : (
            emptyState("Noch kein Supplementplan zugewiesen.", () => setEditingSupplements(true))
          )}
        </div>
      )}
    </div>
  );
}
