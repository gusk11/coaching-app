"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes, addDailyCheckIn, addWeeklyCheckIn, deleteDailyCheckIn, deleteWeeklyCheckIn } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { DEFAULT_DAILY_CHECK_CONFIG } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { DailyCheckInForm } from "@/components/athlete/DailyCheckInForm";
import { WeeklyCheckInForm } from "@/components/athlete/WeeklyCheckInForm";
import { isCheckInDay, getWeekDates, todayISO } from "@/lib/utils";
import { ClipboardCheck, CalendarPlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function minBackfillISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().split("T")[0];
}

function getWeekday(isoDate: string): string {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long" });
}

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default function CheckInsPage() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

  // Daily state
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showBackfill, setShowBackfill] = useState(false);
  const [backfillDate, setBackfillDate] = useState(yesterdayISO);

  // Weekly state
  const [editing, setEditing] = useState(false);

  // Delete confirmation
  const [deleteConfirmCI, setDeleteConfirmCI] = useState<{ type: "daily" | "weekly"; id: string } | null>(null);

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
      <AppShell role="athlete" title="Check-ins">
        <div className="max-w-lg mx-auto flex flex-col gap-5">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-[72px] rounded-2xl" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  const today = todayISO();
  const { start: weekStart } = getWeekDates(today);

  // Daily
  const sortedDaily = [...athlete.dailyCheckIns].sort((a, b) => b.date.localeCompare(a.date));
  const lastCI = sortedDaily[0];
  const alreadyCheckedIn = lastCI?.date === today;
  const backfillExisting = athlete.dailyCheckIns.find((c) => c.date === backfillDate);

  // Weekly
  const existingWeekly = athlete.weeklyCheckIns.find((w) => w.weekStart === weekStart);
  const alreadyDoneThisWeek = !!existingWeekly;
  const isWeeklyDay = isCheckInDay(athlete.checkInDay);

  async function handleDailySubmit(data: any) {
    try {
      const updated = await addDailyCheckIn(athlete!.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setShowCheckIn(false);
      showToast("Daily Check-in gespeichert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleBackfillSubmit(data: any) {
    try {
      const updated = await addDailyCheckIn(athlete!.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setShowBackfill(false);
      showToast("Check-in nachgetragen.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleDeleteCheckIn() {
    if (!deleteConfirmCI) return;
    try {
      let updated: Awaited<ReturnType<typeof loadAthletes>>;
      if (deleteConfirmCI.type === "daily") {
        updated = await deleteDailyCheckIn(athlete!.id, deleteConfirmCI.id);
      } else {
        updated = await deleteWeeklyCheckIn(athlete!.id, deleteConfirmCI.id);
      }
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setDeleteConfirmCI(null);
    } catch {
      setDeleteConfirmCI(null);
    }
  }

  async function handleWeeklySubmit(data: any) {
    try {
      const updated = await addWeeklyCheckIn(athlete!.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditing(false);
      showToast("Weekly Check-in gespeichert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  return (
    <AppShell role="athlete" title="Check-ins">
      <div className="max-w-lg mx-auto flex flex-col gap-5">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-[#0f1624] rounded-xl border border-[#1e2d42]">
          <button
            onClick={() => setActiveTab("daily")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "daily"
                ? "bg-[#1e2d42] text-[#f0f4ff]"
                : "text-[#5a7090] hover:text-[#8fa3c0]"
            )}
          >
            Daily Check-in
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "weekly"
                ? "bg-[#1e2d42] text-[#f0f4ff]"
                : "text-[#5a7090] hover:text-[#8fa3c0]"
            )}
          >
            Weekly Check-in
          </button>
        </div>

        {/* Daily tab */}
        {activeTab === "daily" && (
          <div
            className={cn(
              "rounded-2xl border overflow-hidden transition-all",
              alreadyCheckedIn
                ? "bg-[#141d2e] border-[#1e2d42]"
                : "bg-[#1a1209]/30 border-[#ca8a04]/25 ring-1 ring-[#ca8a04]/10"
            )}
          >
            <button
              onClick={() => setShowCheckIn(!showCheckIn)}
              className={cn(
                "w-full flex items-center justify-between px-5 py-4 transition-colors",
                alreadyCheckedIn ? "hover:bg-[#192236]" : "hover:bg-[#1a1209]/50"
              )}
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck
                  size={18}
                  className={alreadyCheckedIn ? "text-[#10b981]" : "text-[#ca8a04]"}
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#f0f4ff]">Daily Check-in</p>
                  <p className={cn("text-xs", alreadyCheckedIn ? "text-[#5a7090]" : "text-[#ca8a04]/80")}>
                    {alreadyCheckedIn ? "Heute bereits eingetragen — bearbeiten?" : "Heute noch nicht eingetragen"}
                  </p>
                </div>
              </div>
              <span className={cn("text-lg", alreadyCheckedIn ? "text-[#3b82f6]" : "text-[#ca8a04]")}>
                {showCheckIn ? "−" : "+"}
              </span>
            </button>

            {showCheckIn && (
              <div className="border-t border-[#1e2d42] p-5">
                <DailyCheckInForm
                  athleteId={athlete.id}
                  existingToday={alreadyCheckedIn ? lastCI : undefined}
                  onSubmit={handleDailySubmit}
                  checkConfig={{ ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig }}
                  mealPlans={athlete.mealPlans ?? []}
                />
              </div>
            )}

            {/* Nachtragen */}
            <div className="border-t border-[#1e2d42]">
              <button
                onClick={() => setShowBackfill(!showBackfill)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#192236] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarPlus size={14} className="text-[#5a7090]" />
                  <span className="text-xs text-[#5a7090]">Früheren Tag nachtragen</span>
                </div>
                <span className="text-xs text-[#5a7090]">{showBackfill ? "−" : "+"}</span>
              </button>

              {showBackfill && (
                <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[#1e2d42]">
                  <div className="flex flex-col gap-2 pt-4">
                    <label className="text-xs font-medium text-[#8fa3c0]">Datum wählen</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="date"
                        value={backfillDate}
                        max={yesterdayISO()}
                        min={minBackfillISO()}
                        onChange={(e) => setBackfillDate(e.target.value)}
                        className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                      />
                      {backfillDate && (
                        <span className="text-sm text-[#8fa3c0]">{getWeekday(backfillDate)}</span>
                      )}
                    </div>
                    {backfillExisting && (
                      <p className="text-xs text-[#60a5fa]">
                        Für diesen Tag existiert bereits ein Eintrag — Daten sind vorausgefüllt.
                      </p>
                    )}
                  </div>
                  {backfillDate && (
                    <DailyCheckInForm
                      key={backfillDate}
                      athleteId={athlete.id}
                      existingToday={backfillExisting}
                      date={backfillDate}
                      onSubmit={handleBackfillSubmit}
                      checkConfig={{ ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig }}
                      mealPlans={athlete.mealPlans ?? []}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Past daily check-ins list */}
        {activeTab === "daily" && sortedDaily.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-[#5a7090] px-1">Vergangene Daily Check-ins</p>
            {sortedDaily.map((ci) => (
              <div
                key={ci.id}
                className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-[#f0f4ff]">
                    {new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-xs text-[#5a7090]">
                    {ci.weight} kg · Energie {ci.energyLevel}/5 · Schlaf {ci.sleepHours}h
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmCI({ type: "daily", id: ci.id })}
                  aria-label="Check-in löschen"
                  className="p-2 rounded-lg hover:bg-[#ef4444]/10 transition-colors shrink-0"
                >
                  <Trash2 size={14} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Weekly tab */}
        {activeTab === "weekly" && (
          <div className="flex flex-col gap-4">
            {!isWeeklyDay && (
              <div className="p-4 rounded-2xl bg-[#451a03] border border-[#f59e0b]/20">
                <p className="text-sm text-[#f59e0b]">
                  Dein Check-in-Tag ist <strong>{DAY_NAMES[athlete.checkInDay]}</strong>.
                  Du kannst den Check-in trotzdem jetzt ausfüllen.
                </p>
              </div>
            )}

            {alreadyDoneThisWeek && !editing ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#064e3b] flex items-center justify-center text-3xl">✓</div>
                <p className="text-lg font-semibold text-[#f0f4ff]">Diese Woche bereits abgeschlossen</p>
                <p className="text-sm text-[#8fa3c0]">Nächster Check-in: {DAY_NAMES[athlete.checkInDay]}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-5 py-2.5 rounded-xl border border-[#1e2d42] bg-[#141d2e] text-[#8fa3c0] text-sm font-medium hover:border-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                  >
                    Check-in bearbeiten
                  </button>
                  <button
                    onClick={() => setDeleteConfirmCI({ type: "weekly", id: existingWeekly!.id })}
                    className="px-5 py-2.5 rounded-xl border border-[#ef4444]/20 bg-[#141d2e] text-[#ef4444]/60 text-sm font-medium hover:border-[#ef4444]/40 hover:text-[#ef4444] transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ) : (
              <WeeklyCheckInForm
                athlete={athlete}
                onSubmit={handleWeeklySubmit}
                initialValues={editing ? existingWeekly : undefined}
                isEdit={editing}
              />
            )}

            {/* Past weekly check-ins */}
            {athlete.weeklyCheckIns.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-xs font-medium text-[#5a7090] px-1">Vergangene Weekly Check-ins</p>
                {[...athlete.weeklyCheckIns]
                  .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
                  .map((ci) => {
                    const ws = new Date(ci.weekStart + "T12:00:00");
                    const we = new Date(ws);
                    we.setDate(ws.getDate() + 6);
                    const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                    return (
                      <div
                        key={ci.id}
                        className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-medium text-[#f0f4ff]">
                            {fmt(ws)} – {fmt(we)}
                          </span>
                          <span className="text-xs text-[#5a7090]">
                            {"★".repeat(ci.overallWeekRating)}{"☆".repeat(5 - ci.overallWeekRating)} · Training {ci.trainingRating}/5
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmCI({ type: "weekly", id: ci.id })}
                          aria-label="Check-in löschen"
                          className="p-2 rounded-lg hover:bg-[#ef4444]/10 transition-colors shrink-0"
                        >
                          <Trash2 size={14} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmCI && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-semibold text-[#f0f4ff] mb-1.5">Check-in löschen</h3>
            <p className="text-xs text-[#8fa3c0] mb-5">
              Diesen {deleteConfirmCI.type === "daily" ? "Daily" : "Weekly"} Check-in unwiderruflich löschen?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmCI(null)}
                className="px-4 py-2 text-xs rounded-lg border border-[#1e2d42] text-[#8fa3c0] hover:bg-[#1e2d42] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteCheckIn}
                className="px-4 py-2 text-xs rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors font-medium"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
