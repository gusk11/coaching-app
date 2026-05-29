"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { TrainingPlan, TrainingLog, TrainingExerciseLog, TrainingSetLog } from "@/types";
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  ActiveSession,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Play, Pause, RotateCcw, Timer } from "lucide-react";

interface Props {
  trainingPlan: TrainingPlan;
  existingLogs: TrainingLog[];
  today: string;
  athleteId: string;
  onSave: (log: Omit<TrainingLog, "id" | "athleteId">) => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ─── Pause-Stoppuhr ────────────────────────────────────────────────────────────
function RestTimerWidget() {
  const [seconds, setSeconds] = useState(180);
  const [initial, setInitial] = useState(180);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setRunning(false);
            setDone(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function adjust(delta: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setDone(false);
    setInitial((prev) => {
      const next = Math.max(10, prev + delta);
      setSeconds(next);
      return next;
    });
  }

  function toggle() {
    if (done) {
      setSeconds(initial);
      setDone(false);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(initial);
    setDone(false);
  }

  const progress = initial > 0 ? seconds / initial : 0;

  return (
    <div className="rounded-xl bg-[#0f1624] border border-[#1e2d42] p-3">
      <div className="flex items-center gap-2">
        <Timer size={12} className="text-[#5a7090] shrink-0" />
        <span className="text-xs text-[#5a7090]">Pause</span>

        {/* −10s / Zeit / +10s */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => adjust(-10)}
            className="w-6 h-6 flex items-center justify-center rounded bg-[#1e2d42] text-[#8fa3c0] text-xs hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors"
          >
            ▼
          </button>
          <span
            className={cn(
              "text-sm font-mono font-bold w-14 text-center tabular-nums",
              done
                ? "text-[#10b981]"
                : seconds <= 10 && running
                ? "text-[#ef4444]"
                : "text-[#f0f4ff]"
            )}
          >
            {done ? "Fertig!" : formatDuration(seconds)}
          </span>
          <button
            onClick={() => adjust(10)}
            className="w-6 h-6 flex items-center justify-center rounded bg-[#1e2d42] text-[#8fa3c0] text-xs hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors"
          >
            ▲
          </button>
        </div>

        <button
          onClick={toggle}
          className="p-1.5 rounded-lg bg-[#1e2d42] hover:bg-[#243650] transition-colors"
        >
          {running ? (
            <Pause size={11} className="text-[#f0f4ff]" />
          ) : (
            <Play size={11} className="text-[#f0f4ff]" />
          )}
        </button>
        <button
          onClick={reset}
          className="p-1.5 rounded-lg bg-[#1e2d42] hover:bg-[#243650] transition-colors"
        >
          <RotateCcw size={11} className="text-[#8fa3c0]" />
        </button>
      </div>

      <div className="mt-2 h-0.5 bg-[#1e2d42] rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            done ? "bg-[#10b981]" : "bg-[#3b82f6]"
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Haupt-Logger ──────────────────────────────────────────────────────────────
export function TrainingLogger({
  trainingPlan,
  existingLogs,
  today,
  athleteId,
  onSave,
}: Props) {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDayId, setSelectedDayId] = useState(
    trainingPlan.days[0]?.id ?? ""
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Aktive Session beim Start laden
  useEffect(() => {
    const active = loadActiveSession();
    if (active && active.athleteId === athleteId) {
      const dayExists = trainingPlan.days.some(
        (d) => d.id === active.trainingDayId
      );
      if (dayExists) {
        setSession(active);
      } else {
        clearActiveSession();
      }
    }
  }, [athleteId, trainingPlan]);

  // Trainingstimer – berechnet aktive Zeit (ohne Pausen), überlebt Reloads
  useEffect(() => {
    if (!session) {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (session.pausedAt) {
      // Eingefroren: Zeit zum Pausierzeitpunkt anzeigen
      if (timerRef.current) clearInterval(timerRef.current);
      const frozenMs =
        new Date(session.pausedAt).getTime() -
        new Date(session.startedAt).getTime() -
        session.totalPausedMs;
      setElapsedSeconds(Math.max(0, Math.floor(frozenMs / 1000)));
      return;
    }

    const startedAtMs = new Date(session.startedAt).getTime();
    const totalPausedMs = session.totalPausedMs;
    const update = () => {
      const activeMs = Date.now() - startedAtMs - totalPausedMs;
      setElapsedSeconds(Math.max(0, Math.floor(activeMs / 1000)));
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.startedAt, session?.pausedAt, session?.totalPausedMs]);

  // Debounced Auto-Save in localStorage
  const triggerAutoSave = useCallback((sess: ActiveSession) => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        saveActiveSession(sess);
        setSaveStatus("saved");
        setTimeout(
          () => setSaveStatus((s) => (s === "saved" ? "idle" : s)),
          2000
        );
      } catch {
        setSaveStatus("error");
      }
    }, 750);
  }, []);

  function updateExercises(
    updater: (prev: TrainingExerciseLog[]) => TrainingExerciseLog[]
  ) {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, exercises: updater(prev.exercises) };
      triggerAutoSave(updated);
      return updated;
    });
  }

  function updateNote(note: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, note };
      triggerAutoSave(updated);
      return updated;
    });
  }

  function buildEmptyExercises(dayId: string): TrainingExerciseLog[] {
    const day = trainingPlan.days.find((d) => d.id === dayId);
    return (day?.exercises ?? []).map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: null,
        reps: null,
        rir: null,
      })),
    }));
  }

  function handleStartSession() {
    const existing = existingLogs.find(
      (l) =>
        l.date === selectedDate && l.trainingDayId === selectedDayId
    );
    const newSession: ActiveSession = {
      athleteId,
      date: selectedDate,
      trainingDayId: selectedDayId,
      exercises: existing?.exercises ?? buildEmptyExercises(selectedDayId),
      note: existing?.note ?? "",
      startedAt: new Date().toISOString(),
      pausedAt: null,
      totalPausedMs: 0,
    };
    saveActiveSession(newSession);
    setSession(newSession);
  }

  function handleEndSession() {
    if (!session) return;
    const day = trainingPlan.days.find((d) => d.id === session.trainingDayId);
    if (!day) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    onSave({
      date: session.date,
      trainingDayId: session.trainingDayId,
      trainingDayName: day.dayName,
      exercises: session.exercises,
      note: session.note || undefined,
      durationSeconds: elapsedSeconds,
    });
    clearActiveSession();
    if (timerRef.current) clearInterval(timerRef.current);
    setSession(null);
    setElapsedSeconds(0);
    setSaveStatus("idle");
  }

  function handlePauseSession() {
    if (!session || session.pausedAt) return;
    const updated: ActiveSession = { ...session, pausedAt: new Date().toISOString() };
    saveActiveSession(updated);
    setSession(updated);
  }

  function handleResumeSession() {
    if (!session || !session.pausedAt) return;
    const additionalPausedMs =
      Date.now() - new Date(session.pausedAt).getTime();
    const updated: ActiveSession = {
      ...session,
      pausedAt: null,
      totalPausedMs: session.totalPausedMs + additionalPausedMs,
    };
    saveActiveSession(updated);
    setSession(updated);
  }

  function handleCancelSession() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    clearActiveSession();
    setSession(null);
    setElapsedSeconds(0);
    setSaveStatus("idle");
    setShowCancelConfirm(false);
  }

  function updateSet(
    exIdx: number,
    setIdx: number,
    field: keyof TrainingSetLog,
    value: string
  ) {
    updateExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j !== setIdx
                  ? s
                  : { ...s, [field]: value === "" ? null : Number(value) }
              ),
            }
      )
    );
  }

  function addSet(exIdx: number) {
    updateExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  setNumber: ex.sets.length + 1,
                  weight: null,
                  reps: null,
                  rir: null,
                },
              ],
            }
      )
    );
  }

  function removeSet(exIdx: number, setIdx: number) {
    updateExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets
                .filter((_, j) => j !== setIdx)
                .map((s, j) => ({ ...s, setNumber: j + 1 })),
            }
      )
    );
  }

  if (!trainingPlan.days.length) {
    return (
      <p className="text-sm text-[#5a7090] text-center py-6">
        Kein Trainingsplan vorhanden.
      </p>
    );
  }

  // ─── Aktive Session ──────────────────────────────────────────────────────────
  if (session) {
    const activeDay = trainingPlan.days.find(
      (d) => d.id === session.trainingDayId
    );
    const dateLabel = session.date.split("-").reverse().join(".");
    const isPaused = !!session.pausedAt;

    return (
      <>
        <div className="flex flex-col gap-4">
          {/* Timer-Leiste */}
          <div className={cn(
            "rounded-xl border px-4 py-3 flex items-center justify-between transition-colors",
            isPaused
              ? "bg-[#1a1a0f] border-[#f59e0b]/30"
              : "bg-[#141d2e] border-[#1e2d42]"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isPaused
                  ? "bg-[#f59e0b]"
                  : "bg-[#10b981] animate-pulse"
              )} />
              <span className="text-xs text-[#5a7090]">
                {isPaused ? "Pausiert" : "Trainingszeit"}
              </span>
              <span className="text-base font-mono font-bold text-[#f0f4ff] tabular-nums">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === "saving" && (
                <span className="text-[10px] text-[#5a7090]">Speichert…</span>
              )}
              {saveStatus === "saved" && (
                <span className="text-[10px] text-[#10b981]">Gespeichert</span>
              )}
              {saveStatus === "error" && (
                <span className="text-[10px] text-[#ef4444]">Fehler</span>
              )}
              <span className="text-xs text-[#5a7090]">
                {activeDay?.dayName} · {dateLabel}
              </span>
            </div>
          </div>

          {/* Pause-Stoppuhr */}
          <RestTimerWidget />

          {/* Cardio-Hinweis */}
          {activeDay?.cardioNote && (
            <div className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
              <p className="text-xs text-[#5a7090] mb-1">Cardio</p>
              <p className="text-sm text-[#8fa3c0]">{activeDay.cardioNote}</p>
            </div>
          )}

          {/* Übungen */}
          {session.exercises.map((ex, exIdx) => {
            const planEx = activeDay?.exercises[exIdx];
            return (
              <div
                key={ex.exerciseId}
                className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#1e2d42]">
                  <p className="text-sm font-semibold text-[#f0f4ff]">
                    {ex.exerciseName}
                  </p>
                  {planEx && (
                    <p className="text-xs text-[#5a7090] mt-0.5">
                      {planEx.sets} × {planEx.reps}
                      {planEx.rir !== undefined && ` · RIR ${planEx.rir}`}
                    </p>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-1.5 text-xs text-[#5a7090] px-1">
                    <span className="col-span-1">Satz</span>
                    <span className="col-span-4">kg</span>
                    <span className="col-span-3">Wdh</span>
                    <span className="col-span-3">RIR</span>
                    <span className="col-span-1" />
                  </div>

                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="grid grid-cols-12 gap-1.5 items-center"
                    >
                      <span className="col-span-1 text-xs text-[#5a7090] text-center">
                        {set.setNumber}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={set.weight ?? ""}
                        onChange={(e) =>
                          updateSet(exIdx, setIdx, "weight", e.target.value)
                        }
                        placeholder="–"
                        className="col-span-4 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                      />
                      <input
                        type="number"
                        min={0}
                        value={set.reps ?? ""}
                        onChange={(e) =>
                          updateSet(exIdx, setIdx, "reps", e.target.value)
                        }
                        placeholder="–"
                        className="col-span-3 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                      />
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={set.rir ?? ""}
                        onChange={(e) =>
                          updateSet(exIdx, setIdx, "rir", e.target.value)
                        }
                        placeholder="–"
                        className="col-span-3 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(exIdx, setIdx)}
                        className="col-span-1 flex items-center justify-center p-1 rounded hover:bg-[#ef4444]/10 transition-colors"
                      >
                        <Trash2
                          size={11}
                          className="text-[#ef4444]/50 hover:text-[#ef4444]"
                        />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSet(exIdx)}
                    className="flex items-center gap-1 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors mt-1 self-start"
                  >
                    <Plus size={11} /> Satz
                  </button>
                </div>
              </div>
            );
          })}

          {/* Notiz */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#5a7090]">
              Trainingsnotiz (optional)
            </label>
            <textarea
              value={session.note}
              onChange={(e) => updateNote(e.target.value)}
              rows={2}
              placeholder="Wie lief das Training? PRs, Besonderheiten..."
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Pause / Fortsetzen */}
            <button
              type="button"
              onClick={isPaused ? handleResumeSession : handlePauseSession}
              className={cn(
                "w-full py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 border",
                isPaused
                  ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/20"
                  : "bg-[#1e2d42] border-[#1e2d42] text-[#8fa3c0] hover:bg-[#243650] hover:text-[#f0f4ff]"
              )}
            >
              {isPaused ? (
                <><Play size={14} /> Training fortsetzen</>
              ) : (
                <><Pause size={14} /> Training pausieren</>
              )}
            </button>

            <div className="flex gap-2">
              {/* Abbrechen */}
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="flex-1 py-2.5 rounded-xl bg-[#ef4444]/10 text-[#ef4444] font-medium text-sm hover:bg-[#ef4444]/20 transition-colors border border-[#ef4444]/20"
              >
                Training abbrechen
              </button>

              {/* Beenden */}
              <button
                type="button"
                onClick={handleEndSession}
                className="flex-1 py-2.5 rounded-xl bg-[#10b981] text-white font-semibold text-sm hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
              >
                Beenden · {formatDuration(elapsedSeconds)}
              </button>
            </div>
          </div>
        </div>

        {/* Abbrechen-Bestätigung */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4">
              <h3 className="text-base font-semibold text-[#f0f4ff]">
                Training wirklich abbrechen?
              </h3>
              <p className="text-sm text-[#8fa3c0]">
                Alle bisher gespeicherten Daten dieser Trainingseinheit werden
                gelöscht.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2d42] text-[#8fa3c0] font-medium text-sm hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors"
                >
                  Zurück
                </button>
                <button
                  onClick={handleCancelSession}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors"
                >
                  Ja, abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── Vor dem Start ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Datumauswahl */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#5a7090]">Datum</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>

      {/* Tagauswahl */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {trainingPlan.days.map((day) => {
          const logged = existingLogs.some(
            (l) => l.date === selectedDate && l.trainingDayId === day.id
          );
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              className={cn(
                "flex flex-col items-center px-3 py-2 rounded-xl border transition-all whitespace-nowrap shrink-0",
                selectedDayId === day.id
                  ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                  : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
              )}
            >
              <span className="text-xs font-medium">{day.dayName}</span>
              <span className="text-xs text-[#5a7090]">{day.label}</span>
              {logged && (
                <span className="text-[#10b981] text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleStartSession}
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
      >
        <Play size={15} />
        Training starten
      </button>
    </div>
  );
}
