"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes, updateAthlete } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { AthleteStammdatenForm } from "@/components/athlete/AthleteStammdatenForm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AthleteStammdatenPage() {
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
      <AppShell role="athlete" title="Stammdaten">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            ))}
          </div>
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  async function handleSave(updates: Partial<Athlete>) {
    const previous = athlete;
    try {
      const updated = await updateAthlete(athlete!.id, updates);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
    } catch {
      setAthlete(previous);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  return (
    <AppShell role="athlete" title="Stammdaten">
      <div className="max-w-lg mx-auto">
        <AthleteStammdatenForm athlete={athlete} mode="athlete" onSave={handleSave} />
      </div>
    </AppShell>
  );
}
