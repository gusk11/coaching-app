"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete, DailyCheckIn, WeeklyCheckIn } from "@/types";
import { loadAuth, loadAthletes, addDailyCheckIn, addWeeklyCheckIn, deleteDailyCheckIn, deleteWeeklyCheckIn } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { DEFAULT_DAILY_CHECK_CONFIG } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { DailyCheckInForm } from "@/components/athlete/DailyCheckInForm";
import { WeeklyCheckInForm } from "@/components/athlete/WeeklyCheckInForm";
import { isCheckInDay, getWeekDates, todayISO } from "@/lib/utils";
import { ClipboardCheck, CalendarPlus, Pencil, Trash2, X } from "lucide-react";
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

function fmtWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

const iconBtn = "w-7 h-7 rounded-lg flex items-center justify-center transition-colors";

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

  // Delete confirmation (unified — used for current-week weekly delete button)
  const [deleteConfirmCI, setDeleteConfirmCI] = useState<{ type: "daily" | "weekly"; id: string } | null>(null);

  // Edit modal state
  const [editDailyCI, setEditDailyCI] = useState<DailyCheckIn | null>(null);
  const [editWeeklyCI, setEditWeeklyCI] = useState<WeeklyCheckIn | null>(null);

  // Inline delete confirmation state
  const [confirmDailyDeleteId, setConfirmDailyDeleteId] = useState<string | null>(null);
  const [confirmWeeklyDeleteId, setConfirmWeeklyDeleteId] = useState<string | null>(null);

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
  const pastDailyCheckIns = sortedDaily.filter((ci) => ci.date !== today);

  // Weekly
  const sortedWeekly = [...athlete.weeklyCheckIns].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const existingWeekly = athlete.weeklyCheckIns.find((w) => w.weekStart === weekStart);
  const alreadyDoneThisWeek = !!existingWeekly;
  const isWeeklyDay = isCheckInDay(athlete.checkInDay);
  const pastWeeklyCheckIns = sortedWeekly.filter((ci) => ci.weekStart !== weekStart);

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

  async function handleEditDailySubmit(data: any) {
    try {
      const updated = await addDailyCheckIn(athlete!.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditDailyCI(null);
      showToast("Check-in aktualisiert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleEditWeeklySubmit(data: any) {
    try {
      const updated = await addWeeklyCheckIn(athlete!.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setEditWeeklyCI(null);
      showToast("Weekly Check-in aktualisiert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleDeleteDaily(checkInId: string) {
    try {
      const updated = await deleteDailyCheckIn(athlete!.id, checkInId);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setConfirmDailyDeleteId(null);
      showToast("Check-in gelöscht.", "success");
    } catch {
      showToast("Fehler beim Löschen.", "error");
    }
  }

  async function handleDeleteWeekly(checkInId: string) {
    try {
      const updated = await deleteWeeklyCheckIn(athlete!.id, checkInId);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setConfirmWeeklyDeleteId(null);
      showToast("Weekly Check-in gelöscht.", "success");
    } catch {
      showToast("Fehler beim Löschen.", "error");
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
              activeTab === "daily" ? "bg-[#1e2d42] text-[#f0f4ff]" : "text-[#5a7090] hover:text-[#8fa3c0]"
            )}
          >
            Daily Check-in
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "weekly" ? "bg-[#1e2d42] text-[#f0f4ff]" : "text-[#5a7090] hover:text-[#8fa3c0]"
            )}
          >
            Weekly Check-in
          </button>
        </div>

        {/* ── DAILY TAB ── */}
        {activeTab === "daily" && (
          <div className="flex flex-col gap-4">

            {/* Today's check-in */}
            <div className={cn(
              "rounded-2xl border overflow-hidden transition-all",
              alreadyCheckedIn
                ? "bg-[#141d2e] border-[#1e2d42]"
                : "bg-[#1a1209]/30 border-[#ca8a04]/25 ring-1 ring-[#ca8a04]/10"
            )}>
              <button
                onClick={() => setShowCheckIn(!showCheckIn)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 transition-colors",
                  alreadyCheckedIn ? "hover:bg-[#192236]" : "hover:bg-[#1a1209]/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={18} className={alreadyCheckedIn ? "text-[#10b981]" : "text-[#ca8a04]"} />
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

              {/* Backfill */}
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

            {/* Past daily check-ins */}
            {pastDailyCheckIns.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#5a7090] uppercase tracking-widest px-1">
                  Vergangene Check-ins ({pastDailyCheckIns.length})
                </p>
                {pastDailyCheckIns.map((ci) => (
                  <div key={ci.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-[#f0f4ff]">
                        {new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "short" })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-[#3b82f6] mr-1">{ci.weight} kg</span>
                        <button
                          onClick={() => { setConfirmDailyDeleteId(null); setEditDailyCI(ci); }}
                          className={cn(iconBtn, "text-[#5a7090] hover:text-[#60a5fa] hover:bg-[#1e2d42]")}
                          title="Bearbeiten"
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmDailyDeleteId === ci.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteDaily(ci.id)}
                              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                            >
                              Löschen
                            </button>
                            <button
                              onClick={() => setConfirmDailyDeleteId(null)}
                              className="w-5 h-5 rounded flex items-center justify-center text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDailyDeleteId(ci.id)}
                            className={cn(iconBtn, "text-[#5a7090] hover:text-red-400 hover:bg-red-500/10")}
                            title="Löschen"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Energie</span>
                        <span className="text-[#f0f4ff]">{ci.energyLevel}/5</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Stress</span>
                        <span className="text-[#f0f4ff]">{ci.stressLevel}/5</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Schlaf</span>
                        <span className="text-[#f0f4ff]">{ci.sleepHours}h</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Schritte</span>
                        <span className="text-[#f0f4ff]">{ci.steps.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Training</span>
                        <span className={ci.training ? "text-[#10b981]" : "text-[#5a7090]"}>
                          {ci.training ? `✓ (${ci.trainingQuality}/5)` : "–"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Cardio</span>
                        <span className={ci.cardio ? "text-[#10b981]" : "text-[#5a7090]"}>
                          {ci.cardio ? `✓${ci.cardioDuration ? ` ${ci.cardioDuration} min` : ""}` : "–"}
                        </span>
                      </div>
                    </div>
                    {ci.note && (
                      <p className="text-xs text-[#8fa3c0] mt-2 italic border-t border-[#1e2d42] pt-2 line-clamp-2">
                        {ci.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WEEKLY TAB ── */}
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
            {pastWeeklyCheckIns.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-1 pt-2">
                  <div className="h-px flex-1 bg-[#1e2d42]" />
                  <p className="text-xs text-[#5a7090] uppercase tracking-widest shrink-0">
                    Vergangene Weekly Check-ins ({pastWeeklyCheckIns.length})
                  </p>
                  <div className="h-px flex-1 bg-[#1e2d42]" />
                </div>

                {pastWeeklyCheckIns.map((ci) => (
                  <div key={ci.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-[#f0f4ff]">
                        {fmtWeekLabel(ci.weekStart)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-[#3b82f6] mr-1">
                          {"★".repeat(ci.overallWeekRating)}{"☆".repeat(5 - ci.overallWeekRating)}
                        </span>
                        <button
                          onClick={() => { setConfirmWeeklyDeleteId(null); setEditWeeklyCI(ci); }}
                          className={cn(iconBtn, "text-[#5a7090] hover:text-[#60a5fa] hover:bg-[#1e2d42]")}
                          title="Bearbeiten"
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmWeeklyDeleteId === ci.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteWeekly(ci.id)}
                              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                            >
                              Löschen
                            </button>
                            <button
                              onClick={() => setConfirmWeeklyDeleteId(null)}
                              className="w-5 h-5 rounded flex items-center justify-center text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmWeeklyDeleteId(ci.id)}
                            className={cn(iconBtn, "text-[#5a7090] hover:text-red-400 hover:bg-red-500/10")}
                            title="Löschen"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Training</span>
                        <span className="text-[#f0f4ff]">{ci.trainingRating}/5</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Ernährung</span>
                        <span className="text-[#f0f4ff]">{ci.nutritionAdherence}/5</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Energie Ø</span>
                        <span className="text-[#f0f4ff]">{ci.energyAvg}/5</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#5a7090]">Stress Ø</span>
                        <span className="text-[#f0f4ff]">{ci.stressAvg}/5</span>
                      </div>
                      {ci.sleepAvg != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Schlaf Ø</span>
                          <span className="text-[#f0f4ff]">{ci.sleepAvg}h</span>
                        </div>
                      )}
                      {ci.recoveryRating != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#5a7090]">Erholung</span>
                          <span className="text-[#f0f4ff]">{ci.recoveryRating}/5</span>
                        </div>
                      )}
                    </div>
                    {ci.freeNote && (
                      <p className="text-xs text-[#8fa3c0] mt-2 italic border-t border-[#1e2d42] pt-2 line-clamp-2">
                        {ci.freeNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Delete confirmation modal (for current-week weekly) */}
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

      {/* ── EDIT DAILY MODAL ── */}
      {editDailyCI && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditDailyCI(null); }}
        >
          <div className="w-full sm:max-w-lg bg-[#0d1526] border-t sm:border border-[#1e2d42] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42] shrink-0">
              <div>
                <p className="text-sm font-semibold text-[#f0f4ff]">Daily Check-in bearbeiten</p>
                <p className="text-xs text-[#5a7090]">
                  {new Date(editDailyCI.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setEditDailyCI(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">
              <DailyCheckInForm
                key={editDailyCI.id}
                athleteId={athlete.id}
                existingToday={editDailyCI}
                date={editDailyCI.date}
                onSubmit={handleEditDailySubmit}
                checkConfig={{ ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig }}
                mealPlans={athlete.mealPlans ?? []}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT WEEKLY MODAL ── */}
      {editWeeklyCI && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditWeeklyCI(null); }}
        >
          <div className="w-full sm:max-w-lg bg-[#0d1526] border-t sm:border border-[#1e2d42] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42] shrink-0">
              <div>
                <p className="text-sm font-semibold text-[#f0f4ff]">Weekly Check-in bearbeiten</p>
                <p className="text-xs text-[#5a7090]">{fmtWeekLabel(editWeeklyCI.weekStart)}</p>
              </div>
              <button
                onClick={() => setEditWeeklyCI(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">
              <WeeklyCheckInForm
                key={editWeeklyCI.id}
                athlete={athlete}
                onSubmit={handleEditWeeklySubmit}
                initialValues={editWeeklyCI}
                isEdit={true}
                weekStartOverride={editWeeklyCI.weekStart}
              />
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
