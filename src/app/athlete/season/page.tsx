"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { SeasonPlanView } from "@/components/athlete/SeasonPlanView";

export default function AthleteSeasonPage() {
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
      <AppShell role="athlete" title="Jahresplan">
        <div className="max-w-lg mx-auto flex flex-col gap-5">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="athlete" title="Jahresplan">
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        <SeasonPlanView athlete={athlete} />
      </div>
    </AppShell>
  );
}
