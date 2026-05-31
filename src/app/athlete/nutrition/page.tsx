"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete, MealPlan } from "@/types";
import { loadAuth, loadAthletes } from "@/lib/store";
import { resolveAthleteWeight } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { MealPlanView } from "@/components/athlete/MealPlanView";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AthleteNutrition() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    loadAthletes().then((athletes) => {
      const found = athletes.find((a) => a.id === auth.athleteId);
      if (!found) { router.replace("/login"); return; }
      setAthlete(found);
    });
  }, [router]);

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Ernährungsplan">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </AppShell>
    );
  }

  const plans: MealPlan[] = athlete.mealPlans ?? [];

  return (
    <AppShell role="athlete" title="Ernährungsplan">
      <div className="max-w-lg mx-auto">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-4">🍽</p>
            <p className="text-[#8fa3c0] font-medium">Noch kein Ernährungsplan</p>
            <p className="text-sm text-[#5a7090] mt-1">Dein Coach arbeitet gerade daran.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-[#f0f4ff]">
                {plans.length === 1 ? plans[0].title : `${plans.length} Ernährungspläne`}
              </h2>
              <p className="text-xs text-[#5a7090]">Erstellt von deinem Coach</p>
            </div>
            <MealPlanView plans={plans} athleteWeight={resolveAthleteWeight(athlete)} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
