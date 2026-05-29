"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes, addWeeklyCheckIn } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { WeeklyCheckInForm } from "@/components/athlete/WeeklyCheckInForm";
import { isCheckInDay, getWeekDates, todayISO } from "@/lib/utils";

export default function WeeklyCheckInPage() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const found = loadAthletes().find((a) => a.id === auth.athleteId);
    if (!found) { router.replace("/login"); return; }
    setAthlete(found);
  }, [router]);

  if (!athlete) return null;

  const today = todayISO();
  const { start: weekStart } = getWeekDates(today);
  const existingCheckIn = athlete.weeklyCheckIns.find((w) => w.weekStart === weekStart);
  const alreadyDoneThisWeek = !!existingCheckIn;
  const isDay = isCheckInDay(athlete.checkInDay);
  const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function handleSubmit(data: any) {
    const updated = addWeeklyCheckIn(athlete!.id, data);
    setAthlete(updated.find((a) => a.id === athlete!.id)!);
    setEditing(false);
  }

  return (
    <AppShell role="athlete" title="Wochen-Check-in">
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        {!isDay && (
          <div className="p-4 rounded-2xl bg-[#451a03] border border-[#f59e0b]/20">
            <p className="text-sm text-[#f59e0b]">
              Dein Check-in-Tag ist <strong>{dayNames[athlete.checkInDay]}</strong>.
              Du kannst den Check-in trotzdem jetzt ausfüllen.
            </p>
          </div>
        )}

        {alreadyDoneThisWeek && !editing ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#064e3b] flex items-center justify-center text-3xl">✓</div>
            <p className="text-lg font-semibold text-[#f0f4ff]">Diese Woche bereits abgeschlossen</p>
            <p className="text-sm text-[#8fa3c0]">Nächster Check-in: {dayNames[athlete.checkInDay]}</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-2 px-5 py-2.5 rounded-xl border border-[#1e2d42] bg-[#141d2e] text-[#8fa3c0] text-sm font-medium hover:border-[#3b82f6] hover:text-[#60a5fa] transition-colors"
            >
              Check-in bearbeiten
            </button>
          </div>
        ) : (
          <WeeklyCheckInForm
            athlete={athlete}
            onSubmit={handleSubmit}
            initialValues={editing ? existingCheckIn : undefined}
            isEdit={editing}
          />
        )}
      </div>
    </AppShell>
  );
}
