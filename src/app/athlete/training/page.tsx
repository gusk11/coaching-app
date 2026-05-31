"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes, saveTrainingLog } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { TrainingAccordion } from "@/components/athlete/TrainingAccordion";
import { TrainingLogger } from "@/components/athlete/TrainingLogger";
import { TrainingProgressView } from "@/components/athlete/TrainingProgressView";
import { todayISO } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentTransition } from "@/lib/motion";

type Tab = "log" | "plan" | "progress";

export default function AthleteTraining() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [tab, setTab] = useState<Tab>("log");

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === auth.athleteId);
    if (!found) { router.replace("/login"); return; }
    setAthlete(found);
  }, [router]);

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Trainingstracker">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  const today = todayISO();

  function handleSaveLog(log: Parameters<typeof saveTrainingLog>[1]) {
    try {
      const updated = saveTrainingLog(athlete!.id, log);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Training gespeichert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  function handleUpdateLogs(athletes: Athlete[]) {
    const updated = athletes.find((a) => a.id === athlete!.id);
    if (updated) setAthlete(updated);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "log", label: "Training tracken" },
    { key: "plan", label: "Trainingsplan" },
    { key: "progress", label: "Trainingsfortschritt" },
  ];

  const noplan = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl mb-4">🏋️</p>
      <p className="text-[#8fa3c0] font-medium">Noch kein Trainingsplan</p>
      <p className="text-sm text-[#5a7090] mt-1">Dein Coach arbeitet gerade daran.</p>
    </div>
  );

  return (
    <AppShell role="athlete" title="Trainingstracker">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        {/* Tab selector */}
        <div className="flex rounded-xl bg-[#0f1624] border border-[#1e2d42] p-1 gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium transition-colors leading-tight px-1",
                tab === key
                  ? "bg-[#1e2d42] text-[#f0f4ff]"
                  : "text-[#5a7090] hover:text-[#8fa3c0]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {tab === "log" && (
            <motion.div key="log" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              {athlete.trainingPlan ? (
                <TrainingLogger
                  trainingPlan={athlete.trainingPlan}
                  existingLogs={athlete.trainingLogs ?? []}
                  today={today}
                  athleteId={athlete.id}
                  onSave={handleSaveLog}
                />
              ) : noplan}
            </motion.div>
          )}

          {tab === "plan" && (
            <motion.div key="plan" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              {athlete.trainingPlan ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#f0f4ff]">{athlete.trainingPlan.title}</h2>
                    <p className="text-xs text-[#5a7090]">Wochenübersicht — tippe auf einen Tag zum Aufklappen</p>
                  </div>
                  <TrainingAccordion plan={athlete.trainingPlan} />
                </div>
              ) : noplan}
            </motion.div>
          )}

          {tab === "progress" && (
            <motion.div key="progress" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              <TrainingProgressView athlete={athlete} onUpdate={handleUpdateLogs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
