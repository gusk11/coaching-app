"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { TrainingPlan, TrainingLog, TrainingExerciseLog, TrainingSetLog, ExerciseDBItem } from "@/types";
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  ActiveSession,
  loadExerciseDB,
  addExerciseDBItem,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Play, Pause, RotateCcw, Timer, X, Search } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

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
          <Tooltip label="-10 Sekunden">
            <button
              onClick={() => adjust(-10)}
              aria-label="-10 Sekunden"
              className="w-6 h-6 flex items-center justify-center rounded bg-[#1e2d42] text-[#8fa3c0] text-xs hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors"
            >
              ▼
            </button>
          </Tooltip>
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
          <Tooltip label="+10 Sekunden">
            <button
              onClick={() => adjust(10)}
              aria-label="+10 Sekunden"
              className="w-6 h-6 flex items-center justify-center rounded bg-[#1e2d42] text-[#8fa3c0] text-xs hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors"
            >
              ▲
            </button>
          </Tooltip>
        </div>

        <Tooltip label={running ? "Pausentimer stoppen" : "Pausentimer starten"}>
          <button
            onClick={toggle}
            aria-label={running ? "Pausentimer stoppen" : "Pausentimer starten"}
            className="p-1.5 rounded-lg bg-[#1e2d42] hover:bg-[#243650] transition-colors"
          >
            {running ? (
              <Pause size={11} className="text-[#f0f4ff]" />
            ) : (
              <Play size={11} className="text-[#f0f4ff]" />
            )}
          </button>
        </Tooltip>
        <Tooltip label="Zurücksetzen">
          <button
            onClick={reset}
            aria-label="Zurücksetzen"
            className="p-1.5 rounded-lg bg-[#1e2d42] hover:bg-[#243650] transition-colors"
          >
            <RotateCcw size={11} className="text-[#8fa3c0]" />
          </button>
        </Tooltip>
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

function getPrevExerciseLog(
  logs: TrainingLog[],
  trainingDayId: string,
  currentDate: string,
  exerciseId: string,
  exerciseName: string
): TrainingExerciseLog | null {
  const sorted = logs
    .filter((l) => l.trainingDayId === trainingDayId && l.date < currentDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sorted) {
    const ex = log.exercises.find(
      (e) => e.exerciseId === exerciseId || e.exerciseName === exerciseName
    );
    if (ex) return ex;
  }
  return null;
}

// Sticky Notiz: letzte Notiz mit "immer anzeigen" für diese Übung, unabhängig vom Tag
function getStickyExerciseNote(
  logs: TrainingLog[],
  exerciseId: string,
  exerciseName: string
): string | null {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sorted) {
    const ex = log.exercises.find(
      (e) =>
        (e.exerciseId === exerciseId || e.exerciseName === exerciseName) &&
        e.alwaysShowNote &&
        e.note
    );
    if (ex) return ex.note!;
  }
  return null;
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

  // Exercise DB + add/remove state
  const [dbExercises, setDbExercises] = useState<ExerciseDBItem[]>([]);
  const [removeConfirmIdx, setRemoveConfirmIdx] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExMuscleGroup, setNewExMuscleGroup] = useState("");
  const [isCreatingEx, setIsCreatingEx] = useState(false);

  // Übungsdatenbank einmalig laden
  useEffect(() => {
    loadExerciseDB().then(setDbExercises);
  }, []);

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
    return (day?.exercises ?? []).map((ex) => {
      const isUnilateral = ex.laterality === "unilateral";
      const stickyNote = getStickyExerciseNote(existingLogs, ex.id, ex.name);
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        laterality: ex.laterality ?? "bilateral",
        sets: Array.from({ length: ex.sets }, (_, i) => isUnilateral
          ? { setNumber: i + 1, weight: null, reps: null, rir: null, weightLeft: null, repsLeft: null, weightRight: null, repsRight: null }
          : { setNumber: i + 1, weight: null, reps: null, rir: null }
        ),
        note: stickyNote ?? undefined,
        alwaysShowNote: stickyNote ? true : undefined,
      };
    });
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
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const isUnilateral = ex.laterality === "unilateral";
        const newSet = isUnilateral
          ? { setNumber: ex.sets.length + 1, weight: null, reps: null, rir: null, weightLeft: null, repsLeft: null, weightRight: null, repsRight: null }
          : { setNumber: ex.sets.length + 1, weight: null, reps: null, rir: null };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  }

  function updateExerciseNote(exIdx: number, note: string) {
    updateExercises((prev) =>
      prev.map((ex, i) => (i !== exIdx ? ex : { ...ex, note: note || undefined }))
    );
  }

  function toggleAlwaysShowNote(exIdx: number, value: boolean) {
    updateExercises((prev) =>
      prev.map((ex, i) => (i !== exIdx ? ex : { ...ex, alwaysShowNote: value }))
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

  // ─── Übung aus Training entfernen ────────────────────────────────────────────
  function removeExercise(exIdx: number) {
    updateExercises((prev) => prev.filter((_, i) => i !== exIdx));
    setRemoveConfirmIdx(null);
  }

  // ─── Übung aus DB zum Training hinzufügen ────────────────────────────────────
  function addExerciseFromDB(item: ExerciseDBItem) {
    const exerciseId = `ex-adhoc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const isUnilateral = (item.laterality ?? "bilateral") === "unilateral";
    const stickyNote = getStickyExerciseNote(existingLogs, exerciseId, item.name);
    updateExercises((prev) => [
      ...prev,
      {
        exerciseId,
        exerciseName: item.name,
        laterality: item.laterality ?? "bilateral",
        sets: [isUnilateral
          ? { setNumber: 1, weight: null, reps: null, rir: null, weightLeft: null, repsLeft: null, weightRight: null, repsRight: null }
          : { setNumber: 1, weight: null, reps: null, rir: null }
        ],
        note: stickyNote ?? undefined,
        alwaysShowNote: stickyNote ? true : undefined,
      },
    ]);
    setShowAddModal(false);
    setAddSearch("");
  }

  // ─── Neue Übung erstellen und zum Training hinzufügen ────────────────────────
  async function handleCreateAndAdd() {
    const name = newExName.trim();
    if (!name) return;
    setIsCreatingEx(true);
    try {
      const updatedItems = await addExerciseDBItem({
        name,
        muscleGroup: newExMuscleGroup.trim() || "Sonstige",
      });
      setDbExercises(updatedItems);
    } catch {
      // Fehler beim DB-Speichern ignorieren – Übung trotzdem zum Training hinzufügen
    } finally {
      setIsCreatingEx(false);
    }
    const exerciseId = `ex-adhoc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    updateExercises((prev) => [
      ...prev,
      {
        exerciseId,
        exerciseName: name,
        laterality: "bilateral",
        sets: [{ setNumber: 1, weight: null, reps: null, rir: null }],
      },
    ]);
    setShowAddModal(false);
    setShowCreateForm(false);
    setAddSearch("");
    setNewExName("");
    setNewExMuscleGroup("");
  }

  function closeAddModal() {
    setShowAddModal(false);
    setShowCreateForm(false);
    setAddSearch("");
    setNewExName("");
    setNewExMuscleGroup("");
  }

  const filteredDbExercises = dbExercises.filter(
    (e) =>
      addSearch === "" ||
      e.name.toLowerCase().includes(addSearch.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(addSearch.toLowerCase()) ||
      (e.equipment ?? "").toLowerCase().includes(addSearch.toLowerCase())
  );

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
            // ID-basierter Plan-Abgleich – korrekt auch nach Entfernen/Hinzufügen
            const planEx = activeDay?.exercises.find((e) => e.id === ex.exerciseId);
            const isUnilateral = ex.laterality === "unilateral";
            const prevEx = getPrevExerciseLog(
              existingLogs,
              session.trainingDayId,
              session.date,
              ex.exerciseId,
              ex.exerciseName
            );
            return (
              <div
                key={ex.exerciseId}
                className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#1e2d42] flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#f0f4ff]">
                        {ex.exerciseName}
                      </p>
                      {isUnilateral && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 shrink-0">
                          1-seitig
                        </span>
                      )}
                    </div>
                    {planEx && (
                      <p className="text-xs text-[#5a7090] mt-0.5">
                        {planEx.sets} × {planEx.reps}
                        {planEx.rir !== undefined && ` · RIR ${planEx.rir}`}
                      </p>
                    )}
                  </div>
                  <Tooltip label="Übung entfernen">
                    <button
                      type="button"
                      onClick={() => {
                        const hasData = ex.sets.some(
                          (s) => s.weight !== null || s.reps !== null ||
                            s.weightLeft !== null || s.repsLeft !== null ||
                            s.weightRight !== null || s.repsRight !== null
                        );
                        if (hasData) {
                          setRemoveConfirmIdx(exIdx);
                        } else {
                          removeExercise(exIdx);
                        }
                      }}
                      aria-label="Übung entfernen"
                      className="p-1.5 rounded-lg text-[#5a7090] hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-colors shrink-0 mt-0.5"
                    >
                      <X size={13} />
                    </button>
                  </Tooltip>
                </div>

                <div className="p-3 flex flex-col gap-2">
                  {ex.laterality === "unilateral" ? (
                    <>
                      {/* Unilateral: pairwise L + R per set */}
                      <div className="grid grid-cols-12 gap-1 text-xs text-[#5a7090] px-1">
                        <span className="col-span-1" />
                        <span className="col-span-5 text-center">Links (kg × Wdh)</span>
                        <span className="col-span-5 text-center">Rechts (kg × Wdh)</span>
                        <span className="col-span-1" />
                      </div>
                      {ex.sets.map((set, setIdx) => {
                        const prev = prevEx?.sets[setIdx];
                        const hasPrevL = prev && (prev.weightLeft !== null || prev.repsLeft !== null);
                        const hasPrevR = prev && (prev.weightRight !== null || prev.repsRight !== null);
                        return (
                        <div key={setIdx} className="grid grid-cols-12 gap-1 items-center">
                          <span className="col-span-1 flex flex-col items-center gap-0.5">
                            <span className="text-xs text-[#5a7090]">{set.setNumber}</span>
                            {(hasPrevL || hasPrevR) && (
                              <span className="text-[8px] text-[#3a5070] leading-none text-center">
                                {hasPrevL && <span className="block">L{prev!.weightLeft ?? "?"}</span>}
                                {hasPrevR && <span className="block">R{prev!.weightRight ?? "?"}</span>}
                              </span>
                            )}
                          </span>
                          <input
                            type="number" min={0} step={0.5}
                            value={set.weightLeft ?? ""}
                            onChange={(e) => updateSet(exIdx, setIdx, "weightLeft", e.target.value)}
                            placeholder="kg"
                            className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                          />
                          <span className="col-span-1 text-xs text-[#5a7090] text-center">×</span>
                          <input
                            type="number" min={0}
                            value={set.repsLeft ?? ""}
                            onChange={(e) => updateSet(exIdx, setIdx, "repsLeft", e.target.value)}
                            placeholder="Wdh"
                            className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                          />
                          <input
                            type="number" min={0} step={0.5}
                            value={set.weightRight ?? ""}
                            onChange={(e) => updateSet(exIdx, setIdx, "weightRight", e.target.value)}
                            placeholder="kg"
                            className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                          />
                          <span className="col-span-1 text-xs text-[#5a7090] text-center">×</span>
                          <input
                            type="number" min={0}
                            value={set.repsRight ?? ""}
                            onChange={(e) => updateSet(exIdx, setIdx, "repsRight", e.target.value)}
                            placeholder="Wdh"
                            className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                          />
                          <Tooltip label="Satz entfernen">
                            <button type="button" onClick={() => removeSet(exIdx, setIdx)} aria-label="Satz entfernen"
                              className="col-span-1 flex items-center justify-center p-1 rounded hover:bg-[#ef4444]/10 transition-colors">
                              <Trash2 size={11} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                            </button>
                          </Tooltip>
                        </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {/* Bilateral: standard weight/reps/RIR */}
                      <div className="grid grid-cols-12 gap-1.5 text-xs text-[#5a7090] px-1">
                        <span className="col-span-1">Satz</span>
                        <span className="col-span-4">kg</span>
                        <span className="col-span-3">Wdh</span>
                        <span className="col-span-3">RIR</span>
                        <span className="col-span-1" />
                      </div>
                      {ex.sets.map((set, setIdx) => {
                        const prev = prevEx?.sets[setIdx];
                        const hasPrev = prev && (prev.weight !== null || prev.reps !== null);
                        return (
                        <div key={setIdx} className="grid grid-cols-12 gap-1.5 items-center">
                          <span className="col-span-1 flex flex-col items-center gap-0.5">
                            <span className="text-xs text-[#5a7090]">{set.setNumber}</span>
                            {hasPrev && (
                              <span className="text-[9px] text-[#3a5070] leading-none whitespace-nowrap">
                                {prev.weight ?? "?"}&times;{prev.reps ?? "?"}
                              </span>
                            )}
                          </span>
                          <input
                            type="number" min={0} step={0.5}
                            value={set.weight ?? ""}
                            onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                            placeholder="–"
                            className="col-span-4 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                          />
                          <input
                            type="number" min={0}
                            value={set.reps ?? ""}
                            onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                            placeholder="–"
                            className="col-span-3 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                          />
                          <input
                            type="number" min={0} max={10}
                            value={set.rir ?? ""}
                            onChange={(e) => updateSet(exIdx, setIdx, "rir", e.target.value)}
                            placeholder="–"
                            className="col-span-3 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center"
                          />
                          <Tooltip label="Satz entfernen">
                            <button type="button" onClick={() => removeSet(exIdx, setIdx)} aria-label="Satz entfernen"
                              className="col-span-1 flex items-center justify-center p-1 rounded hover:bg-[#ef4444]/10 transition-colors">
                              <Trash2 size={11} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                            </button>
                          </Tooltip>
                        </div>
                        );
                      })}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => addSet(exIdx)}
                    className="flex items-center gap-1 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors mt-1 self-start"
                  >
                    <Plus size={11} /> Satz
                  </button>

                  {/* Notiz zu dieser Übung */}
                  <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-[#1e2d42]/60">
                    <input
                      value={ex.note ?? ""}
                      onChange={(e) => updateExerciseNote(exIdx, e.target.value)}
                      placeholder="Notiz zu dieser Übung (optional)"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2.5 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                    <label className="flex items-center gap-1.5 text-[10px] text-[#5a7090] cursor-pointer select-none w-fit">
                      <input
                        type="checkbox"
                        checked={ex.alwaysShowNote ?? false}
                        onChange={(e) => toggleAlwaysShowNote(exIdx, e.target.checked)}
                        className="accent-[#3b82f6] w-3 h-3"
                      />
                      Notiz immer anzeigen
                    </label>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Übung hinzufügen */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-[#1e2d42] text-[#5a7090] hover:border-[#3b82f6]/40 hover:text-[#3b82f6] transition-colors text-sm"
          >
            <Plus size={13} />
            Übung hinzufügen
          </button>

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
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="flex-1 py-2.5 rounded-xl bg-[#ef4444]/10 text-[#ef4444] font-medium text-sm hover:bg-[#ef4444]/20 transition-colors border border-[#ef4444]/20"
              >
                Training abbrechen
              </button>

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

        {/* Übung entfernen – Bestätigung */}
        {removeConfirmIdx !== null && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4">
              <h3 className="text-base font-semibold text-[#f0f4ff]">
                Übung entfernen?
              </h3>
              <p className="text-sm text-[#8fa3c0]">
                „{session.exercises[removeConfirmIdx]?.exerciseName}" inklusive
                eingetragener Sätze aus diesem Training entfernen?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRemoveConfirmIdx(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2d42] text-[#8fa3c0] font-medium text-sm hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => removeExercise(removeConfirmIdx)}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors"
                >
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Übung hinzufügen – Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-4 max-w-sm w-full flex flex-col gap-3 max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#f0f4ff]">
                  {showCreateForm ? "Neue Übung" : "Übung hinzufügen"}
                </h3>
                <button
                  type="button"
                  onClick={closeAddModal}
                  aria-label="Schließen"
                  className="p-1.5 rounded-lg text-[#5a7090] hover:bg-[#1e2d42] hover:text-[#f0f4ff] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {!showCreateForm ? (
                <>
                  {/* Suche */}
                  <div className="relative">
                    <Search
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a7090] pointer-events-none"
                    />
                    <input
                      autoFocus
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="Übung suchen..."
                      className="w-full bg-[#0f1624] border border-[#1e2d42] rounded-lg pl-7 pr-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>

                  {/* Übungsliste */}
                  <div className="flex flex-col gap-0.5 overflow-y-auto max-h-56 -mx-1 px-1">
                    {dbExercises.length === 0 ? (
                      <p className="text-xs text-[#5a7090] text-center py-4">
                        Keine Übungen in der Datenbank vorhanden.
                      </p>
                    ) : filteredDbExercises.length === 0 ? (
                      <p className="text-xs text-[#5a7090] text-center py-4">
                        Keine Übungen gefunden.
                      </p>
                    ) : (
                      filteredDbExercises.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addExerciseFromDB(item)}
                          className="text-left px-3 py-2.5 rounded-xl hover:bg-[#1e2d42] transition-colors"
                        >
                          <span className="text-sm font-medium text-[#f0f4ff] block">
                            {item.name}
                          </span>
                          <span className="text-xs text-[#5a7090]">
                            {item.muscleGroup}
                            {item.equipment && (
                              <span className="text-[#3a5070]">
                                {" "}· {item.equipment}
                              </span>
                            )}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Neue Übung erstellen */}
                  <div className="border-t border-[#1e2d42] pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#1e2d42] transition-colors text-[#3b82f6] text-sm"
                    >
                      <Plus size={13} />
                      Neue Übung erstellen
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Zurück-Link */}
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors self-start"
                  >
                    ← Zurück zur Auswahl
                  </button>

                  {/* Formular */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#5a7090]">Name *</label>
                      <input
                        autoFocus
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        placeholder="z.B. Schrägbankdrücken"
                        className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#5a7090]">
                        Muskelgruppe
                      </label>
                      <input
                        value={newExMuscleGroup}
                        onChange={(e) => setNewExMuscleGroup(e.target.value)}
                        placeholder="z.B. Brust"
                        className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!newExName.trim() || isCreatingEx}
                      onClick={handleCreateAndAdd}
                      className="w-full py-2.5 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingEx
                        ? "Wird gespeichert…"
                        : "Übung erstellen & hinzufügen"}
                    </button>
                  </div>
                </>
              )}
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
