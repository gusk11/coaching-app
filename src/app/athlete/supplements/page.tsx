"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { SupplementList } from "@/components/athlete/SupplementList";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AthleteSupplements() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === auth.athleteId);
    if (!found) { router.replace("/login"); return; }
    setAthlete(found);
  }, [router]);

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Supplementplan">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="athlete" title="Supplementplan">
      <div className="max-w-lg mx-auto">
        {athlete.supplementPlan ? (
          <SupplementList plan={athlete.supplementPlan} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-4">💊</p>
            <p className="text-[#8fa3c0] font-medium">Noch kein Supplementplan</p>
            <p className="text-sm text-[#5a7090] mt-1">Dein Coach arbeitet gerade daran.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
