"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes, saveCalorieTrackerDay } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { CalorieTracker } from "@/components/athlete/CalorieTracker";
import { todayISO } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalorieTrackerPage() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === auth.athleteId);
    if (!found) { router.replace("/login"); return; }
    setAthlete(found);
  }, [router]);

  if (!athlete) return null;

  const existing = (athlete.calorieTrackerDays ?? []).find((d) => d.date === date);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }

  function handleSave(day: Parameters<typeof saveCalorieTrackerDay>[1]) {
    const updated = saveCalorieTrackerDay(athlete!.id, day);
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
  }

  const displayDate = new Date(date).toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long",
  });
  const isToday = date === todayISO();

  return (
    <AppShell role="athlete" title="Kalorientracker">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        {/* Date navigator */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl hover:bg-[#1e2d42] transition-colors"
          >
            <ChevronLeft size={16} className="text-[#8fa3c0]" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-[#f0f4ff]">{displayDate}</p>
            {isToday && <p className="text-xs text-[#3b82f6]">Heute</p>}
          </div>
          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl hover:bg-[#1e2d42] transition-colors"
          >
            <ChevronRight size={16} className="text-[#8fa3c0]" />
          </button>
        </div>

        {/* Manual date input */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
        />

        <CalorieTracker
          key={date}
          initialDay={existing}
          mealPlan={athlete.mealPlan}
          date={date}
          athleteId={athlete.id}
          onSave={handleSave}
        />
      </div>
    </AppShell>
  );
}
