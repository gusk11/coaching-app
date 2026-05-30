"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes, updateAthlete } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { AthleteStammdatenForm } from "@/components/athlete/AthleteStammdatenForm";

export default function AthleteStammdatenPage() {
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

  function handleSave(updates: Partial<Athlete>) {
    const updated = updateAthlete(athlete!.id, updates);
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
  }

  return (
    <AppShell role="athlete" title="Stammdaten">
      <div className="max-w-lg mx-auto">
        <AthleteStammdatenForm athlete={athlete} mode="athlete" onSave={handleSave} />
      </div>
    </AppShell>
  );
}
