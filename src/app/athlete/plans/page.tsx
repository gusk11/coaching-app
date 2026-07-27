"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete, MealPlan, TrainingPlan } from "@/types";
import { loadAuth, loadAthletes, createPlanChangeRequest } from "@/lib/store";
import { resolveAthleteWeight } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { MealPlanView } from "@/components/athlete/MealPlanView";
import { MealPlanEditor } from "@/components/coach/MealPlanEditor";
import { TrainingEditor } from "@/components/coach/TrainingEditor";
import { ToolIntroVideo } from "@/components/athlete/ToolIntroVideo";
import { TrainingAccordion } from "@/components/athlete/TrainingAccordion";
import { SupplementList } from "@/components/athlete/SupplementList";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentTransition } from "@/lib/motion";
import { Utensils, Dumbbell, Pill, Pencil, X } from "lucide-react";

type Tab = "Ernährungsplan" | "Trainingsplan" | "Supplementplan";
const TABS: Tab[] = ["Ernährungsplan", "Trainingsplan", "Supplementplan"];
const TAB_ICONS: Record<Tab, React.ReactNode> = {
  "Ernährungsplan": <Utensils className="w-3.5 h-3.5" />,
  "Trainingsplan": <Dumbbell className="w-3.5 h-3.5" />,
  "Supplementplan": <Pill className="w-3.5 h-3.5" />,
};

export default function AthletePlans() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [tab, setTab] = useState<Tab>("Ernährungsplan");
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [editingTraining, setEditingTraining] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    loadAthletes().then((athletes) => {
      const found = athletes.find((a) => a.id === auth.athleteId);
      if (!found) { router.replace("/login"); return; }
      setAthlete(found);
    });
  }, [router]);

  async function handleSaveNutritionProposal(plan: MealPlan) {
    if (!athlete || submitting) return;
    setSubmitting(true);
    try {
      await createPlanChangeRequest(athlete.id, "nutrition", plan);
      showToast("Änderung wurde zur Freigabe an deinen Coach gesendet.", "success");
      setEditingNutrition(false);
    } catch {
      showToast("Fehler beim Senden. Bitte erneut versuchen.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveTrainingProposal(plan: TrainingPlan) {
    if (!athlete || submitting) return;
    setSubmitting(true);
    try {
      await createPlanChangeRequest(athlete.id, "training", plan);
      showToast("Änderung wurde zur Freigabe an deinen Coach gesendet.", "success");
      setEditingTraining(false);
    } catch {
      showToast("Fehler beim Senden. Bitte erneut versuchen.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Pläne">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-28 rounded-lg" />)}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  const canEdit = athlete.planBearbeitungErlaubt === true;

  return (
    <AppShell role="athlete" title="Pläne">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <ToolIntroVideo athleteId={athlete.id} toolKey="plans" title="Einführung: Pläne" position="top" />

        {canEdit && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1d4ed8]/10 border border-[#3b82f6]/20">
            <Pencil size={12} className="text-[#60a5fa] shrink-0" />
            <p className="text-xs text-[#8fa3c0]">
              Du kannst Pläne bearbeiten. Änderungen werden zur Freigabe an deinen Coach gesendet.
            </p>
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setEditingNutrition(false); setEditingTraining(false); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                tab === t
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#141d2e] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
              )}
            >
              {TAB_ICONS[t]}
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {/* Ernährungsplan */}
          {tab === "Ernährungsplan" && (() => {
            const plans = athlete.mealPlans ?? [];
            return (
              <motion.div key="Ernährungsplan" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
                {canEdit && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingNutrition((v) => !v)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                        editingNutrition
                          ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                          : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                      )}
                    >
                      {editingNutrition ? <><X size={12} /> Bearbeitung beenden</> : <><Pencil size={12} /> Bearbeiten</>}
                    </button>
                  </div>
                )}

                {editingNutrition ? (
                  <MealPlanEditor
                    plans={plans}
                    athleteId={athlete.id}
                    onSavePlan={handleSaveNutritionProposal}
                    onDeletePlan={() => showToast("Pläne können nur vom Coach gelöscht werden.", "error")}
                    athleteWeight={resolveAthleteWeight(athlete)}
                  />
                ) : plans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-4xl mb-4">🍽</p>
                    <p className="text-[#8fa3c0] font-medium">Noch kein Ernährungsplan</p>
                    <p className="text-sm text-[#5a7090] mt-1">Gustav arbeitet gerade daran.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-[#f0f4ff]">
                        {plans.length === 1 ? plans[0].title : `${plans.length} Ernährungspläne`}
                      </h2>
                      <p className="text-xs text-[#5a7090]">Erstellt von Gustav</p>
                    </div>
                    <MealPlanView plans={plans} athleteWeight={resolveAthleteWeight(athlete)} />
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* Trainingsplan */}
          {tab === "Trainingsplan" && (
            <motion.div key="Trainingsplan" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
              {canEdit && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setEditingTraining((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                      editingTraining
                        ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                        : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa]"
                    )}
                  >
                    {editingTraining ? <><X size={12} /> Bearbeitung beenden</> : <><Pencil size={12} /> Bearbeiten</>}
                  </button>
                </div>
              )}

              {editingTraining ? (
                <TrainingEditor
                  plan={athlete.trainingPlan}
                  athleteId={athlete.id}
                  onSave={handleSaveTrainingProposal}
                />
              ) : athlete.trainingPlan ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#f0f4ff]">{athlete.trainingPlan.title}</h2>
                    <p className="text-xs text-[#5a7090]">Wochenübersicht — tippe auf einen Tag zum Aufklappen</p>
                  </div>
                  {(athlete.trainingPlan.schritteProTag || athlete.trainingPlan.cardioMinuten) ? (
                    <div className="p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
                      <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Cardio-Vorgaben</p>
                      <p className="text-sm text-[#8fa3c0]">
                        {[
                          athlete.trainingPlan.schritteProTag
                            ? `${athlete.trainingPlan.schritteProTag.toLocaleString("de-DE")} Schritte/Tag`
                            : null,
                          athlete.trainingPlan.cardioMinuten
                            ? `${athlete.trainingPlan.cardioMinuten} Min Cardio ${athlete.trainingPlan.cardioFrequenz === "taeglich" ? "täglich" : "pro Woche"}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  ) : null}
                  <TrainingAccordion plan={athlete.trainingPlan} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-4xl mb-4">🏋️</p>
                  <p className="text-[#8fa3c0] font-medium">Noch kein Trainingsplan</p>
                  <p className="text-sm text-[#5a7090] mt-1">Gustav arbeitet gerade daran.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Supplementplan */}
          {tab === "Supplementplan" && (
            <motion.div key="Supplementplan" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              {athlete.supplementPlan ? (
                <SupplementList plan={athlete.supplementPlan} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-4xl mb-4">💊</p>
                  <p className="text-[#8fa3c0] font-medium">Noch kein Supplementplan</p>
                  <p className="text-sm text-[#5a7090] mt-1">Gustav arbeitet gerade daran.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <ToolIntroVideo athleteId={athlete.id} toolKey="plans" title="Einführung: Pläne" position="bottom" />
      </div>
    </AppShell>
  );
}
