"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadAuth, loadAthletes, loadCheckInDone, setCheckInDone, loadLoginHelpRequests, resolveLoginHelpRequest, deleteLoginHelpRequest, approvePlanChangeRequest, rejectPlanChangeRequest, markAthleteSignupSeen } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { Athlete, LoginHelpRequest, PlanChangeRequest } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { AthleteCard } from "@/components/coach/AthleteCard";
import { PlanChangeReviewModal } from "@/components/coach/PlanChangeReviewModal";
import { analyzeWeek, getCheckInWeekStart } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { X, Check, Trash2, ChevronDown, Plus, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { listContainer, listItem, modalOverlay, modalContent } from "@/lib/motion";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

const DEFAULT_TASK_TYPES = ["Technik", "Feedback", "WhatsApp", "Plananpassung", "Sonstiges"];

interface StoredTask { id: string; label: string; checkedAt: string | null; createdAt: string; }

function loadTaskStats(athleteIds: string[]): { total: number; done: number } {
  let total = 0, done = 0;
  for (const id of athleteIds) {
    try {
      const raw = localStorage.getItem(`coach_tasks_v1_${id}`);
      if (!raw) continue;
      const tasks: StoredTask[] = JSON.parse(raw);
      total += tasks.length;
      done += tasks.filter((t) => t.checkedAt !== null).length;
    } catch { }
  }
  return { total, done };
}

function addTaskToStorage(athleteId: string, label: string, today: string) {
  try {
    const raw = localStorage.getItem(`coach_tasks_v1_${athleteId}`);
    const existing: StoredTask[] = raw ? JSON.parse(raw) : [];
    const visible = existing.filter((t) => t.checkedAt === null || t.checkedAt >= today);
    visible.push({ id: crypto.randomUUID(), label, checkedAt: null, createdAt: today });
    localStorage.setItem(`coach_tasks_v1_${athleteId}`, JSON.stringify(visible));
  } catch { }
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getMostRecentCheckInDate(checkInDay: 0|1|2|3|4|5|6, todayDayOfWeek: number, todayStr: string): string {
  const daysAgo = (todayDayOfWeek - checkInDay + 7) % 7;
  if (daysAgo === 0) return todayStr;
  const d = new Date(todayStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export default function CoachDashboard() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [checkInDone, setCheckInDoneState] = useState<Record<string, string>>({});
  const [loginHelpRequests, setLoginHelpRequests] = useState<LoginHelpRequest[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [quickSelectId, setQuickSelectId] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskAthleteId, setTaskAthleteId] = useState("");
  const [taskType, setTaskType] = useState("");
  const [taskCustom, setTaskCustom] = useState("");
  const [taskTypes, setTaskTypes] = useState<string[]>(DEFAULT_TASK_TYPES);
  const [editingTypes, setEditingTypes] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState("");

  // Plan change review
  const [reviewState, setReviewState] = useState<{ athlete: Athlete; request: PlanChangeRequest } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("coach_task_types_v1");
      if (raw) setTaskTypes(JSON.parse(raw));
    } catch { }
  }, []);

  function saveTaskTypes(types: string[]) {
    setTaskTypes(types);
    localStorage.setItem("coach_task_types_v1", JSON.stringify(types));
  }

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") { router.replace("/login"); return; }
    setCheckInDoneState(loadCheckInDone());
    Promise.all([loadAthletes(), loadLoginHelpRequests()]).then(([athletes, helpRequests]) => {
      setAthletes(athletes);
      setLoginHelpRequests(helpRequests);
      setIsLoaded(true);
    });
  }, [router]);

  const todayDayOfWeek = useMemo(() => new Date().getDay() as 0|1|2|3|4|5|6, []);
  const todayStr = useMemo(() => todayDateString(), []);

  const athletesWithStatus = useMemo(() => athletes.map((a) => {
    const mostRecentCheckInDate = getMostRecentCheckInDate(a.checkInDay, todayDayOfWeek, todayStr);
    const joinedDate = a.joinedAt.split("T")[0];
    const isCheckInToday = a.checkInDay === todayDayOfWeek;
    const completedAt = checkInDone[`${a.id}_${mostRecentCheckInDate}`]; // ISO date string or undefined
    const isDone = !!completedAt;
    const hasPendingCheckIn = mostRecentCheckInDate >= joinedDate && !isDone;
    const hasSubmittedCheckIn = a.dailyCheckIns.some((c) => c.date === mostRecentCheckInDate);
    return { athlete: a, mostRecentCheckInDate, isCheckInToday, completedAt, isDone, hasPendingCheckIn, hasSubmittedCheckIn };
  }), [athletes, checkInDone, todayDayOfWeek, todayStr]);

  const weeklyCheckInStats = useMemo(() => {
    let submitted = 0, processed = 0;
    for (const s of athletesWithStatus) {
      const currentWeekStart = getCheckInWeekStart(todayStr, s.athlete.checkInDay);
      const hasSubmittedThisPeriod = s.athlete.weeklyCheckIns.some((ci) => ci.weekStart === currentWeekStart);
      if (hasSubmittedThisPeriod) {
        submitted++;
        if (s.isDone) processed++;
      }
    }
    return { submitted, processed };
  }, [athletesWithStatus, todayStr]);

  const taskStats = useMemo(() => {
    if (!isLoaded) return { total: 0, done: 0 };
    return loadTaskStats(athletes.map((a) => a.id));
  }, [athletes, isLoaded]);

  const sortedAthletes = useMemo(() => {
    const newSignups = athletesWithStatus.filter((s) => s.athlete.isNewSignup);
    const rest = athletesWithStatus.filter((s) => !s.athlete.isNewSignup);
    const pending = rest
      .filter((s) => s.hasPendingCheckIn)
      .sort((a, b) => a.mostRecentCheckInDate.localeCompare(b.mostRecentCheckInDate));
    const todayDone = rest.filter((s) => s.isCheckInToday && s.isDone);
    const others = rest.filter((s) => !s.hasPendingCheckIn && !s.isCheckInToday);
    return [...newSignups, ...pending, ...todayDone, ...others];
  }, [athletesWithStatus]);

  const handleToggleDone = useCallback((athleteId: string, date: string) => {
    const key = `${athleteId}_${date}`;
    const isDoneNow = !!checkInDone[key];
    const today = new Date().toISOString().slice(0, 10);
    const optimistic = { ...checkInDone };
    if (isDoneNow) {
      delete optimistic[key];
    } else {
      optimistic[key] = today;
    }
    setCheckInDoneState(optimistic);
    try {
      const persisted = setCheckInDone(athleteId, date, !isDoneNow);
      setCheckInDoneState(persisted);
    } catch {
      setCheckInDoneState(checkInDone);
      showToast("Check-in konnte nicht aktualisiert werden.", "error");
    }
  }, [checkInDone]);

  const handleSignupSeen = useCallback(async (athleteId: string) => {
    setAthletes((prev) => prev.map((a) => a.id === athleteId ? { ...a, isNewSignup: undefined } : a));
    try {
      await markAthleteSignupSeen(athleteId);
    } catch {
      setAthletes((prev) => prev.map((a) => a.id === athleteId ? { ...a, isNewSignup: true } : a));
    }
  }, []);

  async function handleApprovePlanChange() {
    if (!reviewState) return;
    try {
      const updated = await approvePlanChangeRequest(reviewState.athlete.id, reviewState.request.id);
      setAthletes(updated);
      setReviewState(null);
      showToast("Planänderung übernommen.", "success");
    } catch {
      showToast("Fehler beim Bestätigen.", "error");
    }
  }

  async function handleRejectPlanChange() {
    if (!reviewState) return;
    try {
      const updated = await rejectPlanChangeRequest(reviewState.athlete.id, reviewState.request.id);
      setAthletes(updated);
      setReviewState(null);
      showToast("Planänderung abgelehnt.", "success");
    } catch {
      showToast("Fehler beim Ablehnen.", "error");
    }
  }

  async function handleResolveLoginHelp(id: string) {
    const updated = await resolveLoginHelpRequest(id);
    setLoginHelpRequests(updated);
  }

  async function handleDeleteLoginHelp(id: string) {
    const updated = await deleteLoginHelpRequest(id);
    setLoginHelpRequests(updated);
    setConfirmDeleteId(null);
  }

  function handleAddTask() {
    if (!taskAthleteId || !taskType) return;
    const label = taskCustom.trim() ? `${taskType}: ${taskCustom.trim()}` : taskType;
    addTaskToStorage(taskAthleteId, label, todayStr);
    setShowTaskModal(false);
    setTaskAthleteId(""); setTaskType(""); setTaskCustom("");
    showToast("Aufgabe gesetzt.", "success");
  }

  return (
    <AppShell role="coach" title="Athleten-Übersicht">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Check-Ins"
            value={`${weeklyCheckInStats.processed} von ${weeklyCheckInStats.submitted}`}
            sub="bearbeitet"
          />
          <StatCard
            label={<><span className="sm:hidden">Tag</span><span className="hidden sm:inline">Wochentag</span></>}
            value={DAY_NAMES[todayDayOfWeek]}
            sub={todayStr.split("-").reverse().join(".")}
          />
          <StatCard
            label="Aufgaben"
            value={`${taskStats.done} von ${taskStats.total}`}
            sub="bearbeitet"
          />
        </div>

        {/* Athlete quick-select + Aufgabe setzen */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={quickSelectId}
              onChange={(e) => {
                const id = e.target.value;
                if (id) { router.push(`/coach/athlete/${id}`); setQuickSelectId(""); }
              }}
              className="w-full bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-sm appearance-none cursor-pointer hover:border-[#3b82f6]/40 transition-colors focus:outline-none focus:border-[#3b82f6] text-[#8fa3c0]"
            >
              <option value="" disabled>Athleten-Profil öffnen…</option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id} className="text-[#f0f4ff] bg-[#141d2e]">{a.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7090] pointer-events-none" />
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#141d2e] border border-[#1e2d42] text-[#8fa3c0] text-xs font-medium hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors shrink-0 whitespace-nowrap"
          >
            <Plus size={13} />
            Aufgabe setzen
          </button>
        </div>

        {/* Login help requests */}
        {loginHelpRequests.some((r) => r.status === "open") && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#f0f4ff] flex items-center gap-2">
                Anmeldedaten vergessen
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center">
                  {loginHelpRequests.filter((r) => r.status === "open").length}
                </span>
              </p>
            </div>
            {loginHelpRequests.filter((r) => r.status === "open").map((req) => (
              <div key={req.id} className="rounded-2xl bg-[#1a0a0a] border border-[#ef4444]/20 p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-[#f0f4ff]">{req.enteredName}</p>
                    {req.note && <p className="text-xs text-[#8fa3c0]">{req.note}</p>}
                    <p className="text-[10px] text-[#5a7090] mt-1">
                      {new Date(req.requestedAt).toLocaleString("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-[#ef4444]/10 text-[#f87171] border-[#ef4444]/20 shrink-0 mt-0.5">
                    Offen
                  </span>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleResolveLoginHelp(req.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs font-medium hover:bg-[#10b981]/20 transition-colors"
                  >
                    <Check size={12} /> Als erledigt markieren
                  </button>
                  {confirmDeleteId === req.id ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleDeleteLoginHelp(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#f87171] text-xs font-medium hover:bg-[#ef4444]/25 transition-colors"
                      >
                        Bestätigen
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg border border-[#1e2d42] text-[#5a7090] text-xs hover:text-[#8fa3c0] transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(req.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2d42] text-[#5a7090] text-xs hover:text-[#ef4444] hover:border-[#ef4444]/30 transition-colors"
                    >
                      <Trash2 size={12} /> Löschen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Athlete cards */}
        {!isLoaded ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
        <motion.div
          className="flex flex-col gap-3"
          variants={listContainer}
          initial="hidden"
          animate="visible"
        >
          {sortedAthletes.map((s) => (
            <motion.div key={s.athlete.id} variants={listItem}>
              <AthleteCard
                athlete={s.athlete}
                checkInDate={s.mostRecentCheckInDate}
                isCheckInToday={s.isCheckInToday}
                hasPendingCheckIn={s.hasPendingCheckIn}
                completedAt={s.completedAt}
                onToggleDone={(s.hasPendingCheckIn || s.isCheckInToday || s.completedAt === todayStr)
                  ? () => handleToggleDone(s.athlete.id, s.mostRecentCheckInDate)
                  : undefined}
                onReviewPlanChange={(req) => setReviewState({ athlete: s.athlete, request: req })}
                isNewSignup={!!s.athlete.isNewSignup}
                onSignupSeen={s.athlete.isNewSignup ? () => handleSignupSeen(s.athlete.id) : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
        )}

      </div>

      {/* Set task modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            variants={modalOverlay} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              variants={modalContent} initial="hidden" animate="visible" exit="exit"
              className="w-full max-w-md bg-[#0f1624] border border-[#1e2d42] rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
                <h2 className="text-base font-semibold text-[#f0f4ff]">Aufgabe setzen</h2>
                <button onClick={() => setShowTaskModal(false)} className="p-1 rounded-lg hover:bg-[#141d2e] transition-colors">
                  <X size={18} className="text-[#8fa3c0]" />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                {/* Athlete select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8fa3c0]">Athlet</label>
                  <div className="relative">
                    <select
                      value={taskAthleteId}
                      onChange={(e) => setTaskAthleteId(e.target.value)}
                      className="w-full bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:border-[#3b82f6] transition-colors text-[#f0f4ff]"
                    >
                      <option value="" disabled>Athleten auswählen…</option>
                      {athletes.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7090] pointer-events-none" />
                  </div>
                </div>

                {/* Task type pills */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#8fa3c0]">Aufgabentyp</label>
                    <button
                      type="button"
                      onClick={() => { setEditingTypes((v) => !v); setNewTypeInput(""); }}
                      className="flex items-center gap-1 text-[10px] text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                    >
                      {editingTypes ? <Check size={10} /> : <Pencil size={10} />}
                      {editingTypes ? "Fertig" : "Bearbeiten"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {taskTypes.map((t, i) =>
                      editingTypes ? (
                        <div key={i} className="flex items-center gap-0.5 bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1">
                          <input
                            value={t}
                            onChange={(e) => {
                              const updated = [...taskTypes];
                              updated[i] = e.target.value;
                              saveTaskTypes(updated);
                            }}
                            className="bg-transparent text-xs text-[#f0f4ff] w-20 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveTaskTypes(taskTypes.filter((_, j) => j !== i))}
                            className="ml-0.5 text-[#3b4d6a] hover:text-[#ef4444] transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTaskType(t)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            taskType === t
                              ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                              : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/30"
                          }`}
                        >
                          {t}
                        </button>
                      )
                    )}
                    {editingTypes && (
                      <div className="flex items-center gap-0.5 bg-[#141d2e] border border-dashed border-[#3b82f6]/30 rounded-lg px-2 py-1">
                        <input
                          value={newTypeInput}
                          onChange={(e) => setNewTypeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newTypeInput.trim()) {
                              saveTaskTypes([...taskTypes, newTypeInput.trim()]);
                              setNewTypeInput("");
                            }
                          }}
                          placeholder="Neu…"
                          className="bg-transparent text-xs text-[#f0f4ff] w-16 focus:outline-none placeholder:text-[#3b4d6a]"
                        />
                        <button
                          type="button"
                          onClick={() => { if (newTypeInput.trim()) { saveTaskTypes([...taskTypes, newTypeInput.trim()]); setNewTypeInput(""); } }}
                          className="text-[#3b4d6a] hover:text-[#60a5fa] transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom text (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8fa3c0]">Individuell <span className="text-[#3b4d6a]">(optional)</span></label>
                  <input
                    value={taskCustom}
                    onChange={(e) => setTaskCustom(e.target.value)}
                    placeholder="z.B. Beinpresse Technik überprüfen"
                    className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a]"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowTaskModal(false); setTaskAthleteId(""); setTaskType(""); setTaskCustom(""); }}
                    className="flex-1 py-3 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:border-[#3b82f6]/40 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    disabled={!taskAthleteId || !taskType}
                    onClick={handleAddTask}
                    className="flex-1 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Aufgabe hinzufügen
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan change review modal */}
      <AnimatePresence>
        {reviewState && (
          <PlanChangeReviewModal
            athlete={reviewState.athlete}
            request={reviewState.request}
            onApprove={handleApprovePlanChange}
            onReject={handleRejectPlanChange}
            onClose={() => setReviewState(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
