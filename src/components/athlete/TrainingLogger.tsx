"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { TrainingPlan, TrainingLog, TrainingExerciseLog, TrainingSetLog, ExerciseDBItem, VideoFeedback } from "@/types";
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  ActiveSession,
  loadExerciseDB,
  addExerciseDBItem,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Play, Pause, RotateCcw, Timer, X, Search, MoreVertical, FileText, Pin, Hourglass, ChevronLeft, ChevronRight, ExternalLink, Info } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { FloatingSaveButton } from "@/components/ui/FloatingSaveButton";
import { SliderInput } from "@/components/ui/SliderInput";

interface Props {
  trainingPlan: TrainingPlan;
  existingLogs: TrainingLog[];
  today: string;
  athleteId: string;
  onSave: (log: Omit<TrainingLog, "id" | "athleteId">) => void;
  videoFeedbacks?: VideoFeedback[];
}

const MAX_TRAINING_DURATION_SECONDS = 3 * 60 * 60;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

type TrackedFields = NonNullable<TrainingPlan["trackedFields"]>;

function getEffectiveTrackedFields(plan: TrainingPlan): TrackedFields {
  return plan.trackedFields ?? { weight: true, reps: true, rir: true, cadence: false };
}

function isSetComplete(set: TrainingSetLog, isUnilateral: boolean, fields: TrackedFields): boolean {
  const anyActive = fields.weight || fields.reps || fields.rir || fields.cadence || fields.custom?.enabled;
  if (!anyActive) return false;
  if (isUnilateral) {
    if (fields.weight && (set.weightLeft == null || set.weightRight == null)) return false;
    if (fields.reps && (set.repsLeft == null || set.repsRight == null)) return false;
  } else {
    if (fields.weight && set.weight == null) return false;
    if (fields.reps && set.reps == null) return false;
  }
  if (fields.rir && set.rir == null) return false;
  if (fields.custom?.enabled && set.customValue == null) return false;
  return true;
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
          if (prev <= 1) { setRunning(false); setDone(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function adjust(delta: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false); setDone(false);
    setInitial((prev) => { const next = Math.max(10, prev + delta); setSeconds(next); return next; });
  }

  function toggle() {
    if (done) { setSeconds(initial); setDone(false); setRunning(true); }
    else { setRunning((r) => !r); }
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false); setSeconds(initial); setDone(false);
  }

  const progress = initial > 0 ? seconds / initial : 0;

  return (
    <div className="rounded-xl bg-[#0f1624] border border-[#1e2d42] p-3">
      <div className="flex items-center gap-2">
        <Timer size={12} className="text-[#5a7090] shrink-0" />
        <span className="text-xs text-[#5a7090]">Pause</span>
        <div className="flex items-center gap-1">
          <Tooltip label="-10 Sekunden">
            <button onClick={() => adjust(-10)} aria-label="-10 Sekunden"
              className="w-6 h-6 flex items-center justify-center rounded bg-[#1e2d42] text-[#8fa3c0] text-xs hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors">▼</button>
          </Tooltip>
          <span className={cn("text-sm font-mono font-bold w-14 text-center tabular-nums",
            done ? "text-[#10b981]" : seconds <= 10 && running ? "text-[#ef4444]" : "text-[#f0f4ff]")}>
            {done ? "Fertig!" : formatDuration(seconds)}
          </span>
          <Tooltip label="+10 Sekunden">
            <button onClick={() => adjust(10)} aria-label="+10 Sekunden"
              className="w-6 h-6 flex items-center justify-center rounded bg-[#1e2d42] text-[#8fa3c0] text-xs hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors">▲</button>
          </Tooltip>
        </div>
        <Tooltip label={running ? "Stoppen" : "Starten"}>
          <button onClick={toggle} aria-label={running ? "Stoppen" : "Starten"}
            className="p-1.5 rounded-lg bg-[#1e2d42] hover:bg-[#243650] transition-colors">
            {running ? <Pause size={11} className="text-[#f0f4ff]" /> : <Play size={11} className="text-[#f0f4ff]" />}
          </button>
        </Tooltip>
        <Tooltip label="Zurücksetzen">
          <button onClick={reset} aria-label="Zurücksetzen"
            className="p-1.5 rounded-lg bg-[#1e2d42] hover:bg-[#243650] transition-colors">
            <RotateCcw size={11} className="text-[#8fa3c0]" />
          </button>
        </Tooltip>
      </div>
      <div className="mt-2 h-0.5 bg-[#1e2d42] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", done ? "bg-[#10b981]" : "bg-[#3b82f6]")}
          style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function getPrevExerciseLog(
  logs: TrainingLog[], trainingDayId: string, currentDate: string,
  exerciseId: string, exerciseName: string
): TrainingExerciseLog | null {
  const sorted = logs
    .filter((l) => l.trainingDayId === trainingDayId && l.date < currentDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sorted) {
    const ex = log.exercises.find((e) => e.exerciseId === exerciseId || e.exerciseName === exerciseName);
    if (ex) return ex;
  }
  return null;
}

function getPersistentExerciseNote(logs: TrainingLog[], exerciseId: string, exerciseName: string): string | null {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sorted) {
    const ex = log.exercises.find(
      (e) => (e.exerciseId === exerciseId || e.exerciseName === exerciseName) && e.note
    );
    if (ex) return ex.note!;
  }
  return null;
}

// ─── Haupt-Logger ──────────────────────────────────────────────────────────────
export function TrainingLogger({ trainingPlan, existingLogs, today, athleteId, onSave, videoFeedbacks = [] }: Props) {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDayId, setSelectedDayId] = useState(trainingPlan.days[0]?.id ?? "");
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoEndedRef = useRef(false);

  const checkScroll = useCallback(() => {
    const el = dayScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = dayScrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [checkScroll]);

  function scrollDays(dir: "left" | "right") {
    const el = dayScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  }

  const [dbExercises, setDbExercises] = useState<ExerciseDBItem[]>([]);
  const [removeConfirmIdx, setRemoveConfirmIdx] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExMuscleGroup, setNewExMuscleGroup] = useState("");
  const [isCreatingEx, setIsCreatingEx] = useState(false);

  const [noteMenuOpenId, setNoteMenuOpenId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string; type: "note" | "sessionNote" } | null>(null);

  useEffect(() => { loadExerciseDB().then(setDbExercises); }, []);

  useEffect(() => {
    const active = loadActiveSession();
    if (active && active.athleteId === athleteId) {
      const dayExists = trainingPlan.days.some((d) => d.id === active.trainingDayId);
      if (dayExists) { setSession(active); } else { clearActiveSession(); }
    }
  }, [athleteId, trainingPlan]);

  useEffect(() => {
    if (!session) { setElapsedSeconds(0); if (timerRef.current) clearInterval(timerRef.current); return; }
    if (session.pausedAt) {
      if (timerRef.current) clearInterval(timerRef.current);
      const frozenMs = new Date(session.pausedAt).getTime() - new Date(session.startedAt).getTime() - session.totalPausedMs;
      setElapsedSeconds(Math.max(0, Math.floor(frozenMs / 1000)));
      return;
    }
    const startedAtMs = new Date(session.startedAt).getTime();
    const totalPausedMs = session.totalPausedMs;
    const update = () => { const activeMs = Date.now() - startedAtMs - totalPausedMs; setElapsedSeconds(Math.max(0, Math.floor(activeMs / 1000))); };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.startedAt, session?.pausedAt, session?.totalPausedMs]);

  useEffect(() => {
    if (!session) { autoEndedRef.current = false; return; }
    if (!autoEndedRef.current && elapsedSeconds >= MAX_TRAINING_DURATION_SECONDS) {
      autoEndedRef.current = true;
      handleEndSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, elapsedSeconds]);

  const triggerAutoSave = useCallback((sess: ActiveSession) => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        saveActiveSession(sess);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
      } catch { setSaveStatus("error"); }
    }, 750);
  }, []);

  function updateExercises(updater: (prev: TrainingExerciseLog[]) => TrainingExerciseLog[]) {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, exercises: updater(prev.exercises) };
      triggerAutoSave(updated);
      return updated;
    });
  }

  function updateNote(note: string) {
    setSession((prev) => { if (!prev) return prev; const updated = { ...prev, note }; triggerAutoSave(updated); return updated; });
  }

  function updateTrainingBewertung(trainingBewertung: number) {
    setSession((prev) => { if (!prev) return prev; const updated = { ...prev, trainingBewertung }; triggerAutoSave(updated); return updated; });
  }

  function buildEmptyExercises(dayId: string): TrainingExerciseLog[] {
    const day = trainingPlan.days.find((d) => d.id === dayId);
    return (day?.exercises ?? []).map((ex) => {
      const isUnilateral = ex.laterality === "unilateral";
      const persistentNote = getPersistentExerciseNote(existingLogs, ex.id, ex.name);
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        laterality: ex.laterality ?? "bilateral",
        sets: Array.from({ length: ex.sets }, (_, i) =>
          isUnilateral
            ? { setNumber: i + 1, weight: null, reps: null, rir: null, weightLeft: null, repsLeft: null, weightRight: null, repsRight: null }
            : { setNumber: i + 1, weight: null, reps: null, rir: null }
        ),
        note: persistentNote ?? undefined,
      };
    });
  }

  function handleStartSession() {
    const existing = existingLogs.find((l) => l.date === selectedDate && l.trainingDayId === selectedDayId);
    const newSession: ActiveSession = {
      athleteId, date: selectedDate, trainingDayId: selectedDayId,
      exercises: existing?.exercises ?? buildEmptyExercises(selectedDayId),
      note: existing?.note ?? "", trainingBewertung: existing?.trainingBewertung ?? 3,
      startedAt: new Date().toISOString(), pausedAt: null, totalPausedMs: 0,
    };
    saveActiveSession(newSession);
    setSession(newSession);
  }

  function handleEndSession() {
    if (!session) return;
    const day = trainingPlan.days.find((d) => d.id === session.trainingDayId);
    if (!day) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    onSave({ date: session.date, trainingDayId: session.trainingDayId, trainingDayName: day.dayName, exercises: session.exercises, note: session.note || undefined, trainingBewertung: session.trainingBewertung, durationSeconds: elapsedSeconds });
    clearActiveSession();
    if (timerRef.current) clearInterval(timerRef.current);
    setSession(null); setElapsedSeconds(0); setSaveStatus("idle"); setNoteMenuOpenId(null); setEditingNote(null);
  }

  function handlePauseSession() {
    if (!session || session.pausedAt) return;
    const updated: ActiveSession = { ...session, pausedAt: new Date().toISOString() };
    saveActiveSession(updated); setSession(updated);
  }

  function handleResumeSession() {
    if (!session || !session.pausedAt) return;
    const additionalPausedMs = Date.now() - new Date(session.pausedAt).getTime();
    const updated: ActiveSession = { ...session, pausedAt: null, totalPausedMs: session.totalPausedMs + additionalPausedMs };
    saveActiveSession(updated); setSession(updated);
  }

  function handleCancelSession() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    clearActiveSession(); setSession(null); setElapsedSeconds(0); setSaveStatus("idle");
    setShowCancelConfirm(false); setNoteMenuOpenId(null); setEditingNote(null);
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof TrainingSetLog, value: string) {
    updateExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx ? ex : {
          ...ex,
          sets: ex.sets.map((s, j) =>
            j !== setIdx ? s : { ...s, [field]: value === "" ? null : Number(value) }
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

  function updatePersistentNote(exIdx: number, note: string) {
    updateExercises((prev) => prev.map((ex, i) => (i !== exIdx ? ex : { ...ex, note })));
  }

  function removePersistentNote(exIdx: number) {
    updateExercises((prev) => prev.map((ex, i) => (i !== exIdx ? ex : { ...ex, note: undefined })));
  }

  function updateSessionNote(exIdx: number, sessionNote: string) {
    updateExercises((prev) => prev.map((ex, i) => (i !== exIdx ? ex : { ...ex, sessionNote })));
  }

  function removeSessionNote(exIdx: number) {
    updateExercises((prev) => prev.map((ex, i) => (i !== exIdx ? ex : { ...ex, sessionNote: undefined })));
  }

  function removeSet(exIdx: number, setIdx: number) {
    updateExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx ? ex : {
          ...ex,
          sets: ex.sets.filter((_, j) => j !== setIdx).map((s, j) => ({ ...s, setNumber: j + 1 })),
        }
      )
    );
  }

  function removeExercise(exIdx: number) {
    updateExercises((prev) => prev.filter((_, i) => i !== exIdx));
    setRemoveConfirmIdx(null);
  }

  function addExerciseFromDB(item: ExerciseDBItem) {
    const exerciseId = `ex-adhoc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const isUnilateral = (item.laterality ?? "bilateral") === "unilateral";
    const persistentNote = getPersistentExerciseNote(existingLogs, exerciseId, item.name);
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
        note: persistentNote ?? undefined,
        addedByAthlete: true,
      },
    ]);
    setShowAddModal(false); setAddSearch("");
  }

  async function handleCreateAndAdd() {
    const name = newExName.trim();
    if (!name) return;
    setIsCreatingEx(true);
    try {
      const updatedItems = await addExerciseDBItem({ name, muscleGroup: newExMuscleGroup.trim() || "Sonstige" });
      setDbExercises(updatedItems);
    } catch { /* ignore DB error — still add to session */ } finally { setIsCreatingEx(false); }
    const exerciseId = `ex-adhoc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    updateExercises((prev) => [
      ...prev,
      {
        exerciseId,
        exerciseName: name,
        laterality: "bilateral",
        sets: [{ setNumber: 1, weight: null, reps: null, rir: null }],
        addedByAthlete: true,
      },
    ]);
    setShowAddModal(false); setShowCreateForm(false); setAddSearch(""); setNewExName(""); setNewExMuscleGroup("");
  }

  function closeAddModal() {
    setShowAddModal(false); setShowCreateForm(false); setAddSearch(""); setNewExName(""); setNewExMuscleGroup("");
  }

  const filteredDbExercises = dbExercises.filter(
    (e) => addSearch === "" || e.name.toLowerCase().includes(addSearch.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(addSearch.toLowerCase()) ||
      (e.equipmentType ?? "").toLowerCase().includes(addSearch.toLowerCase())
  );

  if (!trainingPlan.days.length) {
    return <p className="text-sm text-[#5a7090] text-center py-6">Kein Trainingsplan vorhanden.</p>;
  }

  // ─── Aktive Session ──────────────────────────────────────────────────────────
  if (session) {
    const activeDay = trainingPlan.days.find((d) => d.id === session.trainingDayId);
    const dateLabel = session.date.split("-").reverse().join(".");
    const isPaused = !!session.pausedAt;
    const fields = getEffectiveTrackedFields(trainingPlan);

    return (
      <>
        <div className="flex flex-col gap-4">
          {/* Kadenz-Erklärung (nur wenn Kadenz aktiv) */}
          {fields.cadence && (
            <div className="flex items-start gap-2 rounded-xl bg-[#0f1624] border border-[#1e2d42] px-3 py-2.5">
              <Info size={13} className="text-[#5a7090] shrink-0 mt-0.5" />
              <div className="text-xs text-[#5a7090]">
                <span className="text-[#8fa3c0] font-medium">Kadenz</span>
                <span> (alle Angaben in Sekunden)</span>
                <ul className="mt-1 flex flex-col gap-0.5">
                  <li><span className="text-[#f0f4ff] font-medium">E</span> — Länge der exzentrischen Phase</li>
                  <li><span className="text-[#f0f4ff] font-medium">U</span> — Haltezeit im unteren Umkehrpunkt</li>
                  <li><span className="text-[#f0f4ff] font-medium">K</span> — Zeit der konzentrischen Phase</li>
                  <li><span className="text-[#f0f4ff] font-medium">O</span> — Halten im oberen Umkehrpunkt</li>
                </ul>
              </div>
            </div>
          )}

          {/* Timer-Leiste */}
          <div className={cn(
            "rounded-xl border px-4 py-3 flex items-center justify-between transition-colors",
            isPaused ? "bg-[#1a1a0f] border-[#f59e0b]/30" : "bg-[#141d2e] border-[#1e2d42]"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full shrink-0", isPaused ? "bg-[#f59e0b]" : "bg-[#10b981] animate-pulse")} />
              <span className="text-xs text-[#5a7090]">{isPaused ? "Pausiert" : "Trainingszeit"}</span>
              <span className="text-base font-mono font-bold text-[#f0f4ff] tabular-nums">{formatDuration(elapsedSeconds)}</span>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === "saving" && <span className="text-[10px] text-[#5a7090]">Speichert…</span>}
              {saveStatus === "saved" && <span className="text-[10px] text-[#10b981]">Gespeichert</span>}
              {saveStatus === "error" && <span className="text-[10px] text-[#ef4444]">Fehler</span>}
              <span className="text-xs text-[#5a7090]">{activeDay?.dayName} · {dateLabel}</span>
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
            const planEx = activeDay?.exercises.find((e) => e.id === ex.exerciseId);
            const isUnilateral = ex.laterality === "unilateral";
            const prevEx = getPrevExerciseLog(existingLogs, session.trainingDayId, session.date, ex.exerciseId, ex.exerciseName);

            // Tech-Feedback lookup
            const dbItem = planEx?.exerciseDbId ? dbExercises.find((d) => d.id === planEx.exerciseDbId) : null;
            const techVideoId = dbItem?.currentTechFeedbackVideoId;
            const techVideo = techVideoId ? videoFeedbacks.find((v) => v.id === techVideoId) : null;

            return (
              <div key={ex.exerciseId} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[#1e2d42] flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#f0f4ff]">{ex.exerciseName}</p>
                      {isUnilateral && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 shrink-0">
                          1-seitig
                        </span>
                      )}
                      {ex.addedByAthlete && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2d42] text-[#5a7090] shrink-0">+ eigen</span>
                      )}
                    </div>
                    {planEx && (
                      <p className="text-xs text-[#5a7090] mt-0.5">
                        {planEx.sets} × {planEx.reps}
                        {planEx.rir !== undefined && ` · RIR ${planEx.rir}`}
                        {planEx.cadence && (
                          <span className="font-mono"> · {planEx.cadence.eccentric}-{planEx.cadence.bottomHold}-{planEx.cadence.concentric}-{planEx.cadence.topHold}</span>
                        )}
                      </p>
                    )}
                    {techVideo && (
                      <a
                        href={techVideo.loomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {/* markVideoFeedbackSeen handled in page */}}
                        className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 transition-colors"
                      >
                        <ExternalLink size={9} />
                        Technik-Feedback ansehen
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 mt-0.5 relative">
                    <Tooltip label="Notizen">
                      <button type="button"
                        onClick={() => setNoteMenuOpenId(noteMenuOpenId === ex.exerciseId ? null : ex.exerciseId)}
                        aria-label="Notizen"
                        className="p-1.5 rounded-lg text-[#5a7090] hover:bg-[#1e2d42] hover:text-[#f0f4ff] transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </Tooltip>

                    {noteMenuOpenId === ex.exerciseId && (
                      <>
                        <button type="button" aria-label="Menü schließen"
                          onClick={() => setNoteMenuOpenId(null)}
                          className="fixed inset-0 z-40 cursor-default" />
                        <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl bg-[#1a2436] border border-[#243650] shadow-xl overflow-hidden py-1">
                          <button type="button"
                            onClick={() => {
                              if (ex.note === undefined) updatePersistentNote(exIdx, "");
                              setEditingNote({ id: ex.exerciseId, type: "note" });
                              setNoteMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#f0f4ff] hover:bg-[#243650] transition-colors text-left">
                            <Pin size={13} className="text-[#f59e0b] shrink-0" />
                            {ex.note !== undefined ? "Notiz bearbeiten" : "Notiz hinzufügen"}
                            <span className="text-[9px] text-[#5a7090] ml-auto shrink-0">jedes Mal</span>
                          </button>
                          <button type="button"
                            onClick={() => {
                              if (ex.sessionNote === undefined) updateSessionNote(exIdx, "");
                              setEditingNote({ id: ex.exerciseId, type: "sessionNote" });
                              setNoteMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#f0f4ff] hover:bg-[#243650] transition-colors text-left">
                            <Hourglass size={13} className="text-[#60a5fa] shrink-0" />
                            {ex.sessionNote !== undefined ? "Einmal-Notiz bearbeiten" : "Einmal-Notiz hinzufügen"}
                            <span className="text-[9px] text-[#5a7090] ml-auto shrink-0">nur heute</span>
                          </button>
                        </div>
                      </>
                    )}

                    <Tooltip label="Übung entfernen">
                      <button type="button"
                        onClick={() => {
                          const hasData = ex.sets.some((s) =>
                            s.weight !== null || s.reps !== null ||
                            s.weightLeft !== null || s.repsLeft !== null ||
                            s.weightRight !== null || s.repsRight !== null
                          );
                          if (hasData) { setRemoveConfirmIdx(exIdx); } else { removeExercise(exIdx); }
                        }}
                        aria-label="Übung entfernen"
                        className="p-1.5 rounded-lg text-[#5a7090] hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-colors">
                        <X size={13} />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Notiz-Chips */}
                {(ex.note !== undefined || ex.sessionNote !== undefined) && (
                  <div className="px-4 pt-3 flex flex-col gap-1.5">
                    {ex.note !== undefined && (
                      editingNote?.id === ex.exerciseId && editingNote.type === "note" ? (
                        <div className="flex items-center gap-1.5">
                          <Pin size={12} className="text-[#f59e0b] shrink-0" />
                          <input autoFocus value={ex.note}
                            onChange={(e) => updatePersistentNote(exIdx, e.target.value)}
                            onBlur={() => setEditingNote(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingNote(null)}
                            placeholder="Notiz für jedes Training..."
                            className="flex-1 bg-[#0f1624] border border-[#f59e0b]/40 rounded-lg px-2.5 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#f59e0b] transition-colors" />
                          <Tooltip label="Notiz löschen">
                            <button type="button" onClick={() => { removePersistentNote(exIdx); setEditingNote(null); }}
                              aria-label="Notiz löschen" className="p-1 text-[#5a7090] hover:text-[#ef4444] transition-colors shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/25 w-full">
                          <button type="button" onClick={() => setEditingNote({ id: ex.exerciseId, type: "note" })}
                            className="flex items-start gap-1.5 text-left flex-1 min-w-0">
                            <Pin size={12} className="text-[#f59e0b] mt-0.5 shrink-0" />
                            <span className="text-xs text-[#fbbf6d] break-words min-w-0 flex-1">{ex.note || "Notiz…"}</span>
                          </button>
                          <Tooltip label="Notiz löschen">
                            <button type="button" onClick={() => removePersistentNote(exIdx)}
                              aria-label="Notiz löschen" className="p-1 text-[#f59e0b]/50 hover:text-[#ef4444] transition-colors shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </Tooltip>
                        </div>
                      )
                    )}

                    {ex.sessionNote !== undefined && (
                      editingNote?.id === ex.exerciseId && editingNote.type === "sessionNote" ? (
                        <div className="flex items-center gap-1.5">
                          <Hourglass size={12} className="text-[#60a5fa] shrink-0" />
                          <input autoFocus value={ex.sessionNote}
                            onChange={(e) => updateSessionNote(exIdx, e.target.value)}
                            onBlur={() => setEditingNote(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingNote(null)}
                            placeholder="Einmal-Notiz für heute..."
                            className="flex-1 bg-[#0f1624] border border-[#3b82f6]/40 rounded-lg px-2.5 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors" />
                          <Tooltip label="Einmal-Notiz löschen">
                            <button type="button" onClick={() => { removeSessionNote(exIdx); setEditingNote(null); }}
                              aria-label="Einmal-Notiz löschen" className="p-1 text-[#5a7090] hover:text-[#ef4444] transition-colors shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e2d42] border border-dashed border-[#3b82f6]/30 w-fit max-w-full">
                          <button type="button" onClick={() => setEditingNote({ id: ex.exerciseId, type: "sessionNote" })}
                            className="flex items-start gap-1.5 text-left min-w-0">
                            <Hourglass size={11} className="text-[#60a5fa] mt-0.5 shrink-0" />
                            <span className="block text-[11px] text-[#8fa3c0] break-words min-w-0">
                              {ex.sessionNote || "Einmal-Notiz…"}
                            </span>
                          </button>
                          <Tooltip label="Einmal-Notiz löschen">
                            <button type="button" onClick={() => removeSessionNote(exIdx)}
                              aria-label="Einmal-Notiz löschen" className="p-1 text-[#5a7090] hover:text-[#ef4444] transition-colors shrink-0">
                              <Trash2 size={11} />
                            </button>
                          </Tooltip>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Sätze */}
                <div className="p-3 flex flex-col gap-2">
                  {isUnilateral ? (
                    <>
                      {/* Unilateral: L + R per set */}
                      <div className="grid grid-cols-12 gap-1 text-xs text-[#5a7090] px-1">
                        <span className="col-span-1" />
                        <span className="col-span-5 text-center">Links (kg × Wdh)</span>
                        <span className="col-span-5 text-center">Rechts (kg × Wdh)</span>
                        <span className="col-span-1" />
                      </div>
                      {ex.sets.map((set, setIdx) => {
                        const prev = prevEx?.sets[setIdx];
                        const complete = isSetComplete(set, true, fields);
                        return (
                          <div key={setIdx} className={cn("rounded-lg px-1 py-0.5", complete && "bg-[#10b981]/10")}>
                            <div className="grid grid-cols-12 gap-1 items-center">
                              <span className="col-span-1 text-xs text-[#5a7090] text-center">{set.setNumber}</span>
                              <input type="number" min={0} step={0.5} value={set.weightLeft ?? ""}
                                onChange={(e) => updateSet(exIdx, setIdx, "weightLeft", e.target.value)}
                                placeholder="kg"
                                className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                              <span className="col-span-1 text-xs text-[#5a7090] text-center">×</span>
                              <input type="number" min={0} value={set.repsLeft ?? ""}
                                onChange={(e) => updateSet(exIdx, setIdx, "repsLeft", e.target.value)}
                                placeholder="Wdh"
                                className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                              <input type="number" min={0} step={0.5} value={set.weightRight ?? ""}
                                onChange={(e) => updateSet(exIdx, setIdx, "weightRight", e.target.value)}
                                placeholder="kg"
                                className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                              <span className="col-span-1 text-xs text-[#5a7090] text-center">×</span>
                              <input type="number" min={0} value={set.repsRight ?? ""}
                                onChange={(e) => updateSet(exIdx, setIdx, "repsRight", e.target.value)}
                                placeholder="Wdh"
                                className="col-span-2 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                              <Tooltip label="Satz entfernen">
                                <button type="button" onClick={() => removeSet(exIdx, setIdx)} aria-label="Satz entfernen"
                                  className="col-span-1 flex items-center justify-center p-1 rounded hover:bg-[#ef4444]/10 transition-colors">
                                  <Trash2 size={11} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                                </button>
                              </Tooltip>
                            </div>
                            {/* prev values + extra tracked fields for unilateral */}
                            {(prev || fields.rir || fields.custom?.enabled) && (
                              <div className="pl-5 mt-1 flex flex-wrap items-center gap-2">
                                {prev && (prev.weightLeft != null || prev.weightRight != null) && (
                                  <span className="text-[9px] text-[#3a5070]">
                                    L{prev.weightLeft ?? "?"}×{prev.repsLeft ?? "?"} · R{prev.weightRight ?? "?"}×{prev.repsRight ?? "?"}
                                  </span>
                                )}
                                {fields.rir && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-[#5a7090]">RIR</span>
                                    <input type="number" min={0} max={10} value={set.rir ?? ""}
                                      onChange={(e) => updateSet(exIdx, setIdx, "rir", e.target.value)}
                                      placeholder="–"
                                      className="w-10 bg-[#0f1624] border border-[#1e2d42] rounded-md px-1 py-1 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] text-center" />
                                  </div>
                                )}
                                {fields.custom?.enabled && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-[#5a7090]">{fields.custom.label || "Custom"}</span>
                                    <input type="number" min={0} value={set.customValue ?? ""}
                                      onChange={(e) => updateSet(exIdx, setIdx, "customValue", e.target.value)}
                                      placeholder="–"
                                      className="w-10 bg-[#0f1624] border border-[#1e2d42] rounded-md px-1 py-1 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] text-center" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {/* Bilateral: dynamic tracked fields */}
                      <div className="flex items-center gap-1.5 text-xs text-[#5a7090] px-1">
                        <span className="w-5 text-center shrink-0">Satz</span>
                        {fields.weight && <span className="w-14 text-center shrink-0">kg</span>}
                        {fields.reps && <span className="w-12 text-center shrink-0">Wdh</span>}
                        {fields.rir && <span className="w-12 text-center shrink-0">RIR</span>}
                        {fields.custom?.enabled && (
                          <span className="w-12 text-center shrink-0 truncate">{fields.custom.label || "Custom"}</span>
                        )}
                        <span className="w-5 shrink-0" />
                      </div>

                      {ex.sets.map((set, setIdx) => {
                        const prev = prevEx?.sets[setIdx];
                        const complete = isSetComplete(set, false, fields);
                        return (
                          <div key={setIdx} className={cn("rounded-lg px-1 py-0.5", complete && "bg-[#10b981]/10")}>
                            <div className="flex items-start gap-1.5">
                              <span className="w-5 shrink-0 text-xs text-[#5a7090] text-center pt-2">{set.setNumber}</span>

                              {fields.weight && (
                                <div className="flex flex-col gap-0.5 w-14 shrink-0">
                                  <input type="number" min={0} step={0.5}
                                    value={set.weight ?? ""}
                                    onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                                    placeholder="–"
                                    className="w-full bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                                  {prev?.weight != null && (
                                    <span className="text-[9px] text-[#3a5070] text-center tabular-nums leading-none">{prev.weight}</span>
                                  )}
                                </div>
                              )}

                              {fields.reps && (
                                <div className="flex flex-col gap-0.5 w-12 shrink-0">
                                  <input type="number" min={0}
                                    value={set.reps ?? ""}
                                    onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                                    placeholder="–"
                                    className="w-full bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                                  {prev?.reps != null && (
                                    <span className="text-[9px] text-[#3a5070] text-center tabular-nums leading-none">{prev.reps}</span>
                                  )}
                                </div>
                              )}

                              {fields.rir && (
                                <div className="flex flex-col gap-0.5 w-12 shrink-0">
                                  <input type="number" min={0} max={10}
                                    value={set.rir ?? ""}
                                    onChange={(e) => updateSet(exIdx, setIdx, "rir", e.target.value)}
                                    placeholder="–"
                                    className="w-full bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                                  {prev?.rir != null && (
                                    <span className="text-[9px] text-[#3a5070] text-center tabular-nums leading-none">{prev.rir}</span>
                                  )}
                                </div>
                              )}

                              {fields.custom?.enabled && (
                                <div className="flex flex-col gap-0.5 w-12 shrink-0">
                                  <input type="number" min={0}
                                    value={set.customValue ?? ""}
                                    onChange={(e) => updateSet(exIdx, setIdx, "customValue", e.target.value)}
                                    placeholder="–"
                                    className="w-full bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] text-center" />
                                  {prev?.customValue != null && (
                                    <span className="text-[9px] text-[#3a5070] text-center tabular-nums leading-none">{prev.customValue}</span>
                                  )}
                                </div>
                              )}

                              <Tooltip label="Satz entfernen">
                                <button type="button" onClick={() => removeSet(exIdx, setIdx)} aria-label="Satz entfernen"
                                  className="w-5 shrink-0 mt-1 flex items-center justify-center p-1 rounded hover:bg-[#ef4444]/10 transition-colors">
                                  <Trash2 size={11} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                                </button>
                              </Tooltip>
                            </div>

                          </div>
                        );
                      })}
                    </>
                  )}

                  <button type="button" onClick={() => addSet(exIdx)}
                    className="flex items-center gap-1 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors mt-1 self-start">
                    <Plus size={11} /> Satz
                  </button>
                </div>
              </div>
            );
          })}

          {/* Übung hinzufügen */}
          <button type="button" onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-[#1e2d42] text-[#5a7090] hover:border-[#3b82f6]/40 hover:text-[#3b82f6] transition-colors text-sm">
            <Plus size={13} />
            Übung hinzufügen
          </button>

          {/* Trainingsnotiz + Bewertung */}
          <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-4">
            <SliderInput
              label="Wie war das Training heute?"
              value={session.trainingBewertung ?? 3}
              onChange={updateTrainingBewertung}
              labelMin="Sehr schlecht"
              labelMax="Ausgezeichnet"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#5a7090]">Notiz (optional)</label>
              <textarea value={session.note} onChange={(e) => updateNote(e.target.value)} rows={2}
                placeholder="PRs, Besonderheiten, Anmerkungen..."
                className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button type="button"
              onClick={isPaused ? handleResumeSession : handlePauseSession}
              className={cn(
                "w-full py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 border",
                isPaused
                  ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/20"
                  : "bg-[#1e2d42] border-[#1e2d42] text-[#8fa3c0] hover:bg-[#243650] hover:text-[#f0f4ff]"
              )}>
              {isPaused ? <><Play size={14} /> Training fortsetzen</> : <><Pause size={14} /> Training pausieren</>}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCancelConfirm(true)}
                className="flex-1 py-2.5 rounded-xl bg-[#ef4444]/10 text-[#ef4444] font-medium text-sm hover:bg-[#ef4444]/20 transition-colors border border-[#ef4444]/20">
                Training abbrechen
              </button>
              <button type="button" onClick={handleEndSession}
                className="flex-1 py-2.5 rounded-xl bg-[#10b981] text-white font-semibold text-sm hover:bg-[#059669] transition-colors flex items-center justify-center gap-2">
                Beenden · {formatDuration(elapsedSeconds)}
              </button>
            </div>
          </div>
        </div>

        {/* Übung entfernen – Bestätigung */}
        {removeConfirmIdx !== null && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4">
              <h3 className="text-base font-semibold text-[#f0f4ff]">Übung entfernen?</h3>
              <p className="text-sm text-[#8fa3c0]">
                „{session.exercises[removeConfirmIdx]?.exerciseName}" inklusive eingetragener Sätze aus diesem Training entfernen?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setRemoveConfirmIdx(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2d42] text-[#8fa3c0] font-medium text-sm hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors">
                  Abbrechen
                </button>
                <button onClick={() => removeExercise(removeConfirmIdx)}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors">
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
              <h3 className="text-base font-semibold text-[#f0f4ff]">Training wirklich abbrechen?</h3>
              <p className="text-sm text-[#8fa3c0]">Alle bisher gespeicherten Daten dieser Trainingseinheit werden gelöscht.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2d42] text-[#8fa3c0] font-medium text-sm hover:bg-[#243650] hover:text-[#f0f4ff] transition-colors">
                  Zurück
                </button>
                <button onClick={handleCancelSession}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors">
                  Ja, abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        <FloatingSaveButton onClick={handleEndSession} label="Training beenden" />

        {/* Übung hinzufügen – Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-4 max-w-sm w-full flex flex-col gap-3 max-h-[80vh]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#f0f4ff]">{showCreateForm ? "Neue Übung" : "Übung hinzufügen"}</h3>
                <button type="button" onClick={closeAddModal} aria-label="Schließen"
                  className="p-1.5 rounded-lg text-[#5a7090] hover:bg-[#1e2d42] hover:text-[#f0f4ff] transition-colors">
                  <X size={14} />
                </button>
              </div>

              {!showCreateForm ? (
                <>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a7090] pointer-events-none" />
                    <input autoFocus value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="Übung suchen..."
                      className="w-full bg-[#0f1624] border border-[#1e2d42] rounded-lg pl-7 pr-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]" />
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-y-auto max-h-56 -mx-1 px-1">
                    {dbExercises.length === 0 ? (
                      <p className="text-xs text-[#5a7090] text-center py-4">Keine Übungen in der Datenbank vorhanden.</p>
                    ) : filteredDbExercises.length === 0 ? (
                      <p className="text-xs text-[#5a7090] text-center py-4">Keine Übungen gefunden.</p>
                    ) : (
                      filteredDbExercises.map((item) => (
                        <button key={item.id} type="button" onClick={() => addExerciseFromDB(item)}
                          className="text-left px-3 py-2.5 rounded-xl hover:bg-[#1e2d42] transition-colors">
                          <span className="text-sm font-medium text-[#f0f4ff] block">{item.name}</span>
                          <span className="text-xs text-[#5a7090]">
                            {item.muscleGroup}
                            {item.equipmentType && <span className="text-[#3a5070]"> · {item.equipmentType}</span>}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="border-t border-[#1e2d42] pt-2">
                    <button type="button" onClick={() => setShowCreateForm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#1e2d42] transition-colors text-[#3b82f6] text-sm">
                      <Plus size={13} />
                      Neue Übung erstellen
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setShowCreateForm(false)}
                    className="text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors self-start">
                    ← Zurück zur Auswahl
                  </button>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#5a7090]">Name *</label>
                      <input autoFocus value={newExName} onChange={(e) => setNewExName(e.target.value)}
                        placeholder="z.B. Schrägbankdrücken"
                        className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#5a7090]">Muskelgruppe</label>
                      <input value={newExMuscleGroup} onChange={(e) => setNewExMuscleGroup(e.target.value)}
                        placeholder="z.B. Brust"
                        className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]" />
                    </div>
                    <button type="button" disabled={!newExName.trim() || isCreatingEx} onClick={handleCreateAndAdd}
                      className="w-full py-2.5 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {isCreatingEx ? "Wird gespeichert…" : "Übung erstellen & hinzufügen"}
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
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#5a7090]">Datum</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors" />
      </div>

      <div className="relative flex items-center gap-1">
        <button type="button" onClick={() => scrollDays("left")} aria-label="Nach links scrollen"
          className={cn(
            "shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-[#1e2d42] bg-[#0f1624] text-[#5a7090] hover:text-[#f0f4ff] hover:border-[#3b82f6]/40 transition-all",
            !canScrollLeft && "opacity-0 pointer-events-none"
          )}>
          <ChevronLeft size={14} />
        </button>

        <div ref={dayScrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          {trainingPlan.days.map((day) => {
            const logged = existingLogs.some((l) => l.date === selectedDate && l.trainingDayId === day.id);
            return (
              <button key={day.id} onClick={() => setSelectedDayId(day.id)}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-xl border transition-all whitespace-nowrap shrink-0",
                  selectedDayId === day.id
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
                )}>
                <span className="text-xs font-medium">{day.dayName}</span>
                <span className="text-xs text-[#5a7090]">{day.label}</span>
                {logged && <span className="text-[#10b981] text-xs">✓</span>}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => scrollDays("right")} aria-label="Nach rechts scrollen"
          className={cn(
            "shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-[#1e2d42] bg-[#0f1624] text-[#5a7090] hover:text-[#f0f4ff] hover:border-[#3b82f6]/40 transition-all",
            !canScrollRight && "opacity-0 pointer-events-none"
          )}>
          <ChevronRight size={14} />
        </button>
      </div>

      <button type="button" onClick={handleStartSession}
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2">
        <Play size={15} />
        Training starten
      </button>
    </div>
  );
}
