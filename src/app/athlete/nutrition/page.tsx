"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { MealPlanView } from "@/components/athlete/MealPlanView";

export default function AthleteNutrition() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === auth.athleteId);
    if (!found) { router.replace("/login"); return; }
    setAthlete(found);
  }, [router]);

  if (!athlete) return null;

  return (
    <AppShell role="athlete" title="Ernährungsplan">
      <div className="max-w-lg mx-auto">
        {athlete.mealPlan ? (
          <div className="flex flex-col gap-2">
            <div className="mb-2">
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
        )}
      </div>
    </AppShell>
  );
}
