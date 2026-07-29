"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Athlete, WeeklyCheckIn, VideoFeedback } from "@/types";
import { loadAuth, loadAthletes, addDailyCheckIn, addWeeklyCheckIn, deleteDailyCheckIn, deleteWeeklyCheckIn, loadVideoFeedbacks } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { DEFAULT_DAILY_CHECK_CONFIG } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { DailyCheckInForm } from "@/components/athlete/DailyCheckInForm";
import { WeeklyCheckInForm } from "@/components/athlete/WeeklyCheckInForm";
import { WeekBulkBackfill } from "@/components/athlete/WeekBulkBackfill";
import { ToolIntroVideo } from "@/components/athlete/ToolIntroVideo";
import { isCheckInDay, getCheckInWeekStart, todayISO } from "@/lib/utils";
import { ChevronRight, Pencil, Trash2, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { VideoFeedbackCategoryBadge } from "@/components/ui/VideoFeedbackCategoryBadge";

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
  const [videoFeedbacks, setVideoFeedbacks] = useState<VideoFeedback[]>([]);

  // Daily state
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [pastDailyOpen, setPastDailyOpen] = useState(false);

  // Weekly state
  const [editing, setEditing] = useState(false);
  const [pastWeeklyOpen, setPastWeeklyOpen] = useState(false);

  // Delete confirmation (unified — used for current-week weekly delete button)
  const [deleteConfirmCI, setDeleteConfirmCI] = useState<{ type: "daily" | "weekly"; id: string } | null>(null);

  // Edit weekly modal state
  const [editWeeklyCI, setEditWeeklyCI] = useState<WeeklyCheckIn | null>(null);

  // Inline delete confirmation state
  const [confirmDailyDeleteId, setConfirmDailyDeleteId] = useState<string | null>(null);
  const [confirmWeeklyDeleteId, setConfirmWeeklyDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    const athleteId = auth.athleteId;
    Promise.all([loadAthletes(), loadVideoFeedbacks(athleteId)]).then(([athletes, fbs]) => {
      const found = athletes.find((a) => a.id === athleteId);
      if (!found) { router.replace("/login"); return; }
      setAthlete(found);
      setVideoFeedbacks(fbs.filter((f) => f.linkedWeeklyCheckInId));
    });
  }, [router]);

  function linkedFeedbackFor(weeklyCheckInId: string): VideoFeedback | undefined {
    return videoFeedbacks.find((f) => f.linkedWeeklyCheckInId === weeklyCheckInId);
  }

  const today = todayISO();
  const weekStart = getCheckInWeekStart(today, athlete?.checkInDay ?? 1);

  // Days going back from the most recent check-in day
  const checkInDay = athlete?.checkInDay ?? 1;
  const checkInPeriodDays = useMemo(() => {
    const todayDate = new Date(today + "T12:00:00");
    const todayDow = todayDate.getDay();
    const daysSinceCheckInDay = (todayDow - checkInDay + 7) % 7;
    const checkInDayDate = new Date(todayDate);
    checkInDayDate.setDate(todayDate.getDate() - daysSinceCheckInDay);
    const days: string[] = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date(checkInDayDate);
      d.setDate(checkInDayDate.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }, [today, checkInDay]);

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Check-ins">
        <div className="max-w-lg mx-auto flex flex-col gap-5">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-[56px] rounded-2xl" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  // Daily
  const sortedDaily = [...athlete.dailyCheckIns].sort((a, b) => b.date.localeCompare(a.date));
  const pastDailyCheckIns = sortedDaily.filter((ci) => ci.date !== today);

  // Weekly
  const sortedWeekly = [...athlete.weeklyCheckIns].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const existingWeekly = athlete.weeklyCheckIns.find((w) => w.weekStart === weekStart);
  const alreadyDoneThisWeek = !!existingWeekly;
  const isWeeklyDay = isCheckInDay(athlete.checkInDay);
  const pastWeeklyCheckIns = sortedWeekly.filter((ci) => ci.weekStart !== weekStart);

  const dayModalExisting = dayModalDate
    ? athlete.dailyCheckIns.find((ci) => ci.date === dayModalDate)
    : undefined;

  async function handleDayModalSubmit(data: any) {
    try {
      const updated = await addDailyCheckIn(athlete!.id, data);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      setDayModalDate(null);
      showToast("Daily Check-in gespeichert.", "success");
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

  function handleBulkUpdate(athletes: Athlete[]) {
    const found = athletes.find((a) => a.id === athlete!.id);
    if (found) setAthlete(found);
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
        <ToolIntroVideo athleteId={athlete.id} toolKey="checkins" title="Einführung: Check-ins" position="top" seenToolIntros={athlete.seenToolIntros} />

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

            {/* Check-in period tiles — last 14 days */}
            {(() => {
              const renderTile = (day: string) => {
                const hasCI = athlete.dailyCheckIns.some((ci) => ci.date === day);
                const isFuture = day > today;
                const isToday = day === today;
                const d = new Date(day + "T12:00:00");
                return (
                  <button
                    key={day}
                    disabled={isFuture}
                    onClick={() => setDayModalDate(day)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors",
                      isFuture
                        ? "bg-[#0f1624]/60 opacity-40 cursor-default"
                        : hasCI
                        ? "bg-[#022c22] border border-[#10b981]/30 hover:bg-[#033830] cursor-pointer"
                        : isToday
                        ? "bg-[#451a03]/60 border border-[#f59e0b]/20 hover:bg-[#451a03] cursor-pointer"
                        : "bg-[#2d0b0b]/80 border border-[#ef4444]/20 hover:bg-[#3d0b0b] cursor-pointer"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-semibold leading-tight",
                        isFuture ? "text-[#5a7090]" : hasCI ? "text-[#34d399]" : isToday ? "text-[#f59e0b]" : "text-[#f87171]"
                      )}
                    >
                      {d.toLocaleDateString("de-DE", { weekday: "short" })}
                    </span>
                    <span className="text-[9px] text-[#3d5269] leading-tight">
                      {d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                    </span>
                    {isToday && <div className="w-1 h-1 rounded-full bg-[#3b82f6] mt-0.5" />}
                  </button>
                );
              };
              return (
                <div className="flex flex-col gap-1">
                  <div className="grid grid-cols-8 gap-1">
                    {checkInPeriodDays.slice(0, 8).map(renderTile)}
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {checkInPeriodDays.slice(8).map(renderTile)}
                  </div>
                </div>
              );
            })()}

            {/* Bulk retroactive entry */}
            <WeekBulkBackfill athlete={athlete} onUpdate={handleBulkUpdate} />

            {/* Past daily check-ins */}
            {pastDailyCheckIns.length > 0 && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setPastDailyOpen((o) => !o)}
                  className="flex items-center gap-2 px-1 py-0.5 text-left"
                >
                  <ChevronRight
                    size={14}
                    className={cn("text-[#5a7090] transition-transform shrink-0", pastDailyOpen && "rotate-90")}
                  />
                  <p className="text-xs text-[#5a7090] uppercase tracking-widest">
                    Vergangene Check-ins ({pastDailyCheckIns.length})
                  </p>
                </button>
                {pastDailyOpen && pastDailyCheckIns.map((ci) => (
                  <div key={ci.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-[#f0f4ff]">
                        {new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "short" })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-[#3b82f6] mr-1">{ci.weight} kg</span>
                        <button
                          onClick={() => { setConfirmDailyDeleteId(null); setDayModalDate(ci.date); }}
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
                {(() => {
                  const fb = linkedFeedbackFor(existingWeekly!.id);
                  return fb ? (
                    <a
                      href={fb.loomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 text-[#22c55e] text-sm font-medium hover:bg-[#22c55e]/10 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Coach-Feedback zu dieser Woche ansehen
                    </a>
                  ) : null;
                })()}
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
                <button
                  onClick={() => setPastWeeklyOpen((o) => !o)}
                  className="flex items-center gap-3 px-1 pt-2 w-full"
                >
                  <div className="h-px flex-1 bg-[#1e2d42]" />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ChevronRight
                      size={12}
                      className={cn("text-[#5a7090] transition-transform", pastWeeklyOpen && "rotate-90")}
                    />
                    <p className="text-xs text-[#5a7090] uppercase tracking-widest">
                      Vergangene Weekly Check-ins ({pastWeeklyCheckIns.length})
                    </p>
                  </div>
                  <div className="h-px flex-1 bg-[#1e2d42]" />
                </button>

                {pastWeeklyOpen && pastWeeklyCheckIns.map((ci) => (
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
                    {(() => {
                      const fb = linkedFeedbackFor(ci.id);
                      return fb ? (
                        <a
                          href={fb.loomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 text-[#22c55e] text-xs font-medium hover:bg-[#22c55e]/10 transition-colors"
                        >
                          <ExternalLink size={12} />
                          Coach-Feedback zu dieser Woche ansehen
                        </a>
                      ) : null;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <ToolIntroVideo athleteId={athlete.id} toolKey="checkins" title="Einführung: Check-ins" position="bottom" seenToolIntros={athlete.seenToolIntros} />
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

      {/* ── DAY MODAL — opens for any tile click (new or edit) ── */}
      {dayModalDate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDayModalDate(null); }}
        >
          <div className="w-full sm:max-w-lg bg-[#0d1526] border-t sm:border border-[#1e2d42] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42] shrink-0">
              <div>
                <p className="text-sm font-semibold text-[#f0f4ff]">
                  {dayModalExisting ? "Daily Check-in bearbeiten" : "Daily Check-in eintragen"}
                </p>
                <p className="text-xs text-[#5a7090]">
                  {new Date(dayModalDate + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setDayModalDate(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">
              <DailyCheckInForm
                key={dayModalDate}
                athleteId={athlete.id}
                existingToday={dayModalExisting}
                date={dayModalDate}
                onSubmit={handleDayModalSubmit}
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
