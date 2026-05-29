"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { MealPlanView } from "@/components/athlete/MealPlanView";
import { TrainingAccordion } from "@/components/athlete/TrainingAccordion";
import { SupplementList } from "@/components/athlete/SupplementList";
import { cn } from "@/lib/utils";

type Tab = "Ernährungsplan" | "Trainingsplan" | "Supplementplan";
const TABS: Tab[] = ["Ernährungsplan", "Trainingsplan", "Supplementplan"];

export default function AthletePlans() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [tab, setTab] = useState<Tab>("Ernährungsplan");

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === auth.athleteId);
    if (!found) { router.replace("/login"); return; }
    setAthlete(found);
  }, [router]);

  if (!athlete) return null;

  return (
    <AppShell role="athlete" title="Pläne">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        {/* Tab bar */}
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                tab === t
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#141d2e] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Ernährungsplan */}
        {tab === "Ernährungsplan" && (
          athlete.mealPlan ? (
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#f0f4ff]">{athlete.mealPlan.title}</h2>
                <p className="text-xs text-[#5a7090]">Erstellt von deinem Coach</p>
              </div>
              <MealPlanView plan={athlete.mealPlan} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-4xl mb-4">🍽</p>
              <p className="text-[#8fa3c0] font-medium">Noch kein Ernährungsplan</p>
              <p className="text-sm text-[#5a7090] mt-1">Dein Coach arbeitet gerade daran.</p>
            </div>
          )
        )}

        {/* Trainingsplan */}
        {tab === "Trainingsplan" && (
          athlete.trainingPlan ? (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#f0f4ff]">{athlete.trainingPlan.title}</h2>
                <p className="text-xs text-[#5a7090]">Wochenübersicht — tippe auf einen Tag zum Aufklappen</p>
              </div>
              {athlete.trainingPlan.generalCardio && (
                <div className="p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
                  <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Cardio-Vorgaben</p>
                  <p className="text-sm text-[#8fa3c0]">{athlete.trainingPlan.generalCardio}</p>
                </div>
              )}
              <TrainingAccordion plan={athlete.trainingPlan} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-4xl mb-4">🏋️</p>
              <p className="text-[#8fa3c0] font-medium">Noch kein Trainingsplan</p>
              <p className="text-sm text-[#5a7090] mt-1">Dein Coach arbeitet gerade daran.</p>
            </div>
          )
        )}

        {/* Supplementplan */}
        {tab === "Supplementplan" && (
          athlete.supplementPlan ? (
            <SupplementList plan={athlete.supplementPlan} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-4xl mb-4">💊</p>
              <p className="text-[#8fa3c0] font-medium">Noch kein Supplementplan</p>
              <p className="text-sm text-[#5a7090] mt-1">Dein Coach arbeitet gerade daran.</p>
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
