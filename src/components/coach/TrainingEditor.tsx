"use client";
import { useState, useEffect, Fragment } from "react";
import { TrainingPlan, TrainingDay, Exercise, TrainingPlanMode, ExerciseDBItem } from "@/types";
import { loadExerciseDB } from "@/lib/store";
import { Trash2, Plus, ChevronDown, ChevronUp, GripVertical, ExternalLink, Database, X, ArrowUp, ArrowDown } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { CadenceInput } from "@/components/ui/CadenceInput";
import { FloatingSaveButton } from "@/components/ui/FloatingSaveButton";
import { cn } from "@/lib/utils";

interface Props {
  plan?: TrainingPlan;
  athleteId: string;
  onSave: (plan: TrainingPlan) => void;
}

const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

type TrackedFields = NonNullable<TrainingPlan["trackedFields"]>;

function emptyExercise(): Exercise {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    sets: 3,
    reps: "8-12",
  };
}

function exerciseFromDB(item: ExerciseDBItem): Exercise {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: item.name,
    sets: 3,
    reps: item.isTimeBased ? "20-30 Sek." : "8-12",
    muscleGroup: item.muscleGroup,
    laterality: item.laterality ?? "bilateral",
    isTimeBased: item.isTimeBased,
    exerciseDbNote: item.notes,
    videoUrl: item.executionLink,
    exerciseDbId: item.id,
  };
}

function emptyDay(mode: TrainingPlanMode, index: number): TrainingDay {
  const dayName = mode === "weekday"
    ? WEEKDAYS[index % WEEKDAYS.length]
    : `Training ${String.fromCharCode(65 + index)}`;
  return {
    id: `day-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    dayName,
    label: "",
    exercises: [],
    cardioNote: "",
  };
}

// ─── Exercise DB Picker ───────────────────────────────────────────────────────

interface DBPickerProps {
  exercises: ExerciseDBItem[];
  onSelect: (item: ExerciseDBItem) => void;
  onClose: () => void;
}

function ExerciseDBPicker({ exercises, onSelect, onClose }: DBPickerProps) {
  const [search, setSearch] = useState("");
  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-[#3b82f6]/30 bg-[#0a1120] p-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Übung suchen..."
          className="flex-1 bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2.5 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
        />
        <Tooltip label="Schließen">
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="p-1.5 rounded-lg hover:bg-[#1e2d42] text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
          >
            <X size={12} />
          </button>
        </Tooltip>
      </div>
      {exercises.length === 0 ? (
        <p className="text-xs text-[#5a7090] text-center py-3 leading-relaxed">
          Noch keine Übungen in der ÜbungenDB vorhanden.{" "}
          <span className="text-[#3b82f6]">Bitte zuerst Übungen in der Übungsdatenbank anlegen.</span>
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-[#5a7090] text-center py-2">Keine Übungen gefunden</p>
      ) : (
        <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="text-left px-2.5 py-2 rounded-lg hover:bg-[#1e2d42] transition-colors"
            >
              <span className="text-xs font-medium text-[#f0f4ff] block">{item.name}</span>
              <span className="text-[10px] text-[#5a7090]">
                {item.muscleGroup}
                {item.equipmentType && <span className="text-[#3a5070]"> · {item.equipmentType}</span>}
                {item.isTimeBased && <span className="text-[#a78bfa]"> · Zeitübung</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Insert Button (between exercises) ───────────────────────────────────────

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-1.5 group py-0.5">
      <div className="flex-1 h-px bg-transparent group-hover:bg-[#3b82f6]/20 transition-colors" />
      <button
        type="button"
        onClick={onClick}
        aria-label="Übung hier einfügen"
        className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-all"
      >
        <Plus size={10} />
      </button>
      <div className="flex-1 h-px bg-transparent group-hover:bg-[#3b82f6]/20 transition-colors" />
    </div>
  );
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  exercise: Exercise;
  onChange: (updated: Exercise) => void;
  onDelete: () => void;
  trackedFields: TrackedFields;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  isDragging: boolean;
}

function ExerciseRow({
  exercise,
  onChange,
  onDelete,
  trackedFields,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
  isDragging,
}: ExerciseRowProps) {
  const isFromDB = !!exercise.exerciseDbId;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={onDrop}
      className={cn(
        "flex items-start gap-2 py-2 rounded-lg transition-all",
        isDragging && "opacity-40",
        isDragOver && "ring-1 ring-[#3b82f6]/50 bg-[#3b82f6]/5"
      )}
    >
      {/* Drag handle */}
      <div
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        className="mt-1.5 shrink-0 cursor-grab active:cursor-grabbing"
        aria-label="Übung verschieben"
      >
        <GripVertical size={14} className="text-[#2a3d54] hover:text-[#5a7090] transition-colors" />
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        {/* Name */}
        {isFromDB ? (
          <div className="bg-[#0a1120] rounded-lg px-2.5 py-2 border border-[#1e2d42] flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-[#f0f4ff]">{exercise.name}</span>
              <span className="text-[9px] bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20 rounded px-1.5 py-0.5 font-medium leading-none">DB</span>
              {exercise.muscleGroup && (
                <span className="text-[9px] bg-[#1e2d42] text-[#8fa3c0] rounded px-1.5 py-0.5 leading-none">{exercise.muscleGroup}</span>
              )}
              {exercise.laterality === "unilateral" && (
                <span className="text-[9px] bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded px-1.5 py-0.5 font-medium leading-none">Uni</span>
              )}
              {exercise.isTimeBased && (
                <span className="text-[9px] bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 rounded px-1.5 py-0.5 font-medium leading-none">Zeit</span>
              )}
            </div>
            {exercise.exerciseDbNote && (
              <p className="text-[10px] text-[#5a7090] italic">{exercise.exerciseDbNote}</p>
            )}
            {exercise.videoUrl ? (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1 w-fit mt-0.5"
              >
                <ExternalLink size={9} /> Ausführung öffnen
              </a>
            ) : (
              <span className="text-[10px] text-[#2a3d54]">Kein Link</span>
            )}
          </div>
        ) : (
          <input
            value={exercise.name}
            onChange={(e) => onChange({ ...exercise, name: e.target.value })}
            placeholder="Übungsname"
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2.5 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
        )}

        {/* Tracked inputs */}
        <div className="flex flex-wrap gap-1.5">
          {/* Sets — always visible */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-[#5a7090] shrink-0">Sätze</label>
            <input
              type="number"
              min={1}
              max={20}
              value={exercise.sets}
              onChange={(e) => onChange({ ...exercise, sets: Number(e.target.value) })}
              className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-16"
            />
          </div>

          {/* Reps / Zeit */}
          {trackedFields.reps && (
            <div className="flex items-center gap-1">
              <label className="text-xs text-[#5a7090] shrink-0">
                {exercise.isTimeBased ? "Zeit" : "Wdh."}
              </label>
              <input
                value={exercise.reps}
                onChange={(e) => onChange({ ...exercise, reps: e.target.value })}
                placeholder={exercise.isTimeBased ? "20-30 Sek." : "8-12"}
                className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-24"
              />
            </div>
          )}

          {/* RIR */}
          {trackedFields.rir && (
            <div className="flex items-center gap-1">
              <label className="text-xs text-[#5a7090] shrink-0">RIR</label>
              <input
                type="number"
                min={0}
                max={5}
                value={exercise.rir ?? ""}
                onChange={(e) => onChange({ ...exercise, rir: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="–"
                className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-16"
              />
            </div>
          )}

          {/* Custom field */}
          {trackedFields.custom?.enabled && (
            <div className="flex items-center gap-1">
              <label className="text-xs text-[#5a7090] shrink-0">
                {trackedFields.custom.label || "Custom"}
              </label>
              <input
                type="number"
                value={exercise.customValue ?? ""}
                onChange={(e) => onChange({ ...exercise, customValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="–"
                className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-20"
              />
            </div>
          )}
        </div>

        {/* Cadence */}
        {trackedFields.cadence && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[10px] text-[#5a7090] shrink-0">Kadenz (E–B–K–O, Sek.)</label>
            <CadenceInput
              value={exercise.cadence}
              onChange={(cadence) => onChange({ ...exercise, cadence })}
            />
          </div>
        )}

        {/* Note */}
        <input
          value={exercise.note ?? ""}
          onChange={(e) => onChange({ ...exercise, note: e.target.value || undefined })}
          placeholder={isFromDB ? "Weitere Anmerkungen (individuell)" : "Notiz (optional)"}
          className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2.5 py-1.5 text-[#5a7090] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>

      <Tooltip label="Übung entfernen">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Übung entfernen"
          className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors mt-1 shrink-0"
        >
          <Trash2 size={12} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
        </button>
      </Tooltip>
    </div>
  );
}

// ─── Training Editor ──────────────────────────────────────────────────────────

export function TrainingEditor({ plan, athleteId, onSave }: Props) {
  const initPlan = plan ?? {
    id: `tp-${Date.now()}`,
    athleteId,
    title: "Trainingsplan",
    days: [],
    coachNote: "",
    createdAt: new Date().toISOString(),
    mode: "weekday" as TrainingPlanMode,
    schritteProTag: 0,
    cardioMinuten: 0,
    cardioFrequenz: "woche" as const,
  };

  const [title, setTitle] = useState(initPlan.title);
  const [coachNote, setCoachNote] = useState(initPlan.coachNote ?? "");
  const [mode, setMode] = useState<TrainingPlanMode>(initPlan.mode ?? "weekday");
  const [schritteProTag, setSchritteProTag] = useState(initPlan.schritteProTag ?? 0);
  const [cardioMinuten, setCardioMinuten] = useState(initPlan.cardioMinuten ?? 0);
  const [cardioFrequenz, setCardioFrequenz] = useState<"woche" | "taeglich">(initPlan.cardioFrequenz ?? "woche");
  const [cardioIntensity, setCardioIntensity] = useState(initPlan.cardioIntensity ?? "");
  const [trackedFields, setTrackedFields] = useState<TrackedFields>(
    initPlan.trackedFields ?? { weight: true, reps: true, rir: true, cadence: false, custom: { label: "", enabled: false } }
  );
  const [days, setDays] = useState<TrainingDay[]>(initPlan.days);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(initPlan.days.map((d) => d.id)));
  const [dbExercises, setDbExercises] = useState<ExerciseDBItem[]>([]);
  const [pickerOpenDayId, setPickerOpenDayId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ dayId: string; exId: string } | null>(null);

  // Drag & drop state (exercise reordering within a day)
  const [dragSrc, setDragSrc] = useState<{ dayId: string; idx: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ dayId: string; idx: number } | null>(null);

  useEffect(() => {
    loadExerciseDB().then(setDbExercises);
  }, []);

  function toggleDay(id: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addDay() {
    const d = emptyDay(mode, days.length);
    setDays((prev) => [...prev, d]);
    setExpandedDays((prev) => new Set([...prev, d.id]));
  }

  function deleteDay(id: string) {
    setDays((prev) => prev.filter((d) => d.id !== id));
    if (pickerOpenDayId === id) setPickerOpenDayId(null);
  }

  function moveDay(id: string, dir: -1 | 1) {
    setDays((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  function updateDayField<K extends keyof TrainingDay>(id: string, field: K, value: TrainingDay[K]) {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function addExercise(dayId: string) {
    const ex = emptyExercise();
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d))
    );
  }

  function addExerciseAt(dayId: string, insertIdx: number) {
    const ex = emptyExercise();
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const arr = [...d.exercises];
        arr.splice(insertIdx, 0, ex);
        return { ...d, exercises: arr };
      })
    );
  }

  function addExerciseFromDB(dayId: string, item: ExerciseDBItem) {
    const ex = exerciseFromDB(item);
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d))
    );
    setPickerOpenDayId(null);
  }

  function reorderExercises(dayId: string, srcIdx: number, destIdx: number) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        const arr = [...d.exercises];
        const [moved] = arr.splice(srcIdx, 1);
        arr.splice(destIdx, 0, moved);
        return { ...d, exercises: arr };
      })
    );
  }

  function handleExerciseDragStart(dayId: string, idx: number) {
    setDragSrc({ dayId, idx });
  }

  function handleExerciseDragOver(dayId: string, idx: number) {
    if (!dragSrc || dragSrc.dayId !== dayId) return;
    setDragOverTarget({ dayId, idx });
  }

  function handleExerciseDrop(dayId: string, targetIdx: number) {
    if (dragSrc && dragSrc.dayId === dayId && dragSrc.idx !== targetIdx) {
      reorderExercises(dayId, dragSrc.idx, targetIdx);
    }
    setDragSrc(null);
    setDragOverTarget(null);
  }

  function handleExerciseDragEnd() {
    setDragSrc(null);
    setDragOverTarget(null);
  }

  function updateExercise(dayId: string, exId: string, updated: Exercise) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? updated : e)) }
          : d
      )
    );
  }

  function deleteExercise(dayId: string, exId: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
      )
    );
  }

  function handleSave() {
    onSave({ ...initPlan, title, coachNote, days, mode, schritteProTag, cardioMinuten, cardioFrequenz, cardioIntensity, trackedFields });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Meta */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#8fa3c0]">Plan-Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#8fa3c0]">Plan-Modus</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("weekday")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-left ${
                  mode === "weekday"
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0]"
                }`}
              >
                <span className="block font-semibold mb-0.5">Wochentag-gebunden</span>
                <span className="text-[#5a7090] font-normal">Mo Push · Di Pull · Mi Rest</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("flexible")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-left ${
                  mode === "flexible"
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0]"
                }`}
              >
                <span className="block font-semibold mb-0.5">Flexibel</span>
                <span className="text-[#5a7090] font-normal">Training A · B · C</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#8fa3c0]">Coach-Notiz</label>
            <textarea
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              rows={2}
              placeholder="Allgemeine Hinweise zum Plan..."
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
            />
          </div>
        </div>

        {/* General cardio */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
          <label className="text-xs font-medium text-[#8fa3c0]">Allgemeine Cardio-Vorgaben</label>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#5a7090]">Schritte pro Tag</label>
            <input
              type="number"
              min={0}
              step={500}
              value={schritteProTag || ""}
              onChange={(e) => setSchritteProTag(parseInt(e.target.value) || 0)}
              placeholder="z.B. 10000"
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#5a7090]">Cardio-Minuten</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step={5}
                value={cardioMinuten || ""}
                onChange={(e) => setCardioMinuten(parseInt(e.target.value) || 0)}
                placeholder="z.B. 90"
                className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors flex-1"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCardioFrequenz("woche")}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    cardioFrequenz === "woche"
                      ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                      : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0]"
                  }`}
                >
                  Pro Woche
                </button>
                <button
                  type="button"
                  onClick={() => setCardioFrequenz("taeglich")}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    cardioFrequenz === "taeglich"
                      ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                      : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0]"
                  }`}
                >
                  Täglich
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#5a7090]">Intensität</label>
            <input
              type="text"
              value={cardioIntensity}
              onChange={(e) => setCardioIntensity(e.target.value)}
              placeholder="z.B. Zone 2, moderat, HIIT …"
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>
        </div>

        {/* Tracking-Felder */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
          <label className="text-xs font-medium text-[#8fa3c0]">Tracking-Felder (pro Satz)</label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "weight" as const, label: "Gewicht" },
                { key: "reps" as const, label: "Wiederholungen" },
                { key: "rir" as const, label: "RIR" },
                { key: "cadence" as const, label: "Kadenz" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTrackedFields((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  trackedFields[key]
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0f1624] border-[#1e2d42] text-[#5a7090]"
                )}
              >
                {trackedFields[key] ? "✓ " : ""}{label}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setTrackedFields((prev) => ({
                  ...prev,
                  custom: { label: prev.custom?.label ?? "", enabled: !prev.custom?.enabled },
                }))
              }
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                trackedFields.custom?.enabled
                  ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                  : "bg-[#0f1624] border-[#1e2d42] text-[#5a7090]"
              )}
            >
              {trackedFields.custom?.enabled ? "✓ " : ""}Custom-Feld
            </button>
          </div>
          {trackedFields.custom?.enabled && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#5a7090] shrink-0">Label:</label>
              <input
                value={trackedFields.custom?.label ?? ""}
                onChange={(e) =>
                  setTrackedFields((prev) => ({
                    ...prev,
                    custom: { enabled: true, label: e.target.value },
                  }))
                }
                placeholder="z.B. Tempo, Distanz, Dauer"
                className="flex-1 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2.5 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          )}
        </div>

        {/* Training days */}
        {days.map((day, idx) => {
          const expanded = expandedDays.has(day.id);
          return (
            <div key={day.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
              {/* Day header */}
              <div className="px-4 py-3 border-b border-[#1e2d42] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className="flex-1 flex items-center gap-2 min-w-0"
                >
                  {expanded ? <ChevronUp size={14} className="text-[#5a7090] shrink-0" /> : <ChevronDown size={14} className="text-[#5a7090] shrink-0" />}
                  <span className="text-xs text-[#5a7090] shrink-0 w-4">{idx + 1}.</span>
                  {mode === "weekday" ? (
                    <select
                      value={day.dayName}
                      onChange={(e) => { e.stopPropagation(); updateDayField(day.id, "dayName", e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#0f1624] text-sm font-semibold text-[#f0f4ff] focus:outline-none cursor-pointer rounded px-1 border border-[#1e2d42]"
                      style={{ colorScheme: "dark" }}
                    >
                      {WEEKDAYS.map((w) => <option key={w} value={w} className="bg-[#0f1624] text-[#f0f4ff]">{w}</option>)}
                    </select>
                  ) : (
                    <input
                      value={day.dayName}
                      onChange={(e) => { e.stopPropagation(); updateDayField(day.id, "dayName", e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-sm font-semibold text-[#f0f4ff] focus:outline-none border-b border-transparent focus:border-[#3b82f6] transition-colors min-w-0 w-28"
                    />
                  )}
                  <input
                    value={day.label}
                    onChange={(e) => { e.stopPropagation(); updateDayField(day.id, "label", e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="z.B. Push"
                    className="bg-transparent text-xs text-[#60a5fa] focus:outline-none border-b border-transparent focus:border-[#3b82f6] transition-colors w-20"
                  />
                  <span className="text-xs text-[#5a7090] ml-auto shrink-0">
                    {day.exercises.length} Übungen
                  </span>
                </button>
                <Tooltip label="Nach oben">
                  <button
                    type="button"
                    onClick={() => moveDay(day.id, -1)}
                    aria-label="Nach oben"
                    disabled={idx === 0}
                    className="p-1 rounded-lg hover:bg-[#1e2d42] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={13} className="text-[#5a7090]" />
                  </button>
                </Tooltip>
                <Tooltip label="Nach unten">
                  <button
                    type="button"
                    onClick={() => moveDay(day.id, 1)}
                    aria-label="Nach unten"
                    disabled={idx === days.length - 1}
                    className="p-1 rounded-lg hover:bg-[#1e2d42] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ArrowDown size={13} className="text-[#5a7090]" />
                  </button>
                </Tooltip>
                <Tooltip label="Tag löschen">
                  <button
                    type="button"
                    onClick={() => deleteDay(day.id)}
                    aria-label="Tag löschen"
                    className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
                  >
                    <Trash2 size={14} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                  </button>
                </Tooltip>
              </div>

              {expanded && (
                <div className="p-4 flex flex-col gap-1">
                  {/* Exercises with insert buttons between them */}
                  {day.exercises.map((ex, exIdx) => (
                    <Fragment key={ex.id}>
                      {exIdx > 0 && (
                        <InsertButton onClick={() => addExerciseAt(day.id, exIdx)} />
                      )}
                      <ExerciseRow
                        exercise={ex}
                        onChange={(updated) => updateExercise(day.id, ex.id, updated)}
                        onDelete={() => setDeleteConfirm({ dayId: day.id, exId: ex.id })}
                        trackedFields={trackedFields}
                        onDragStart={() => handleExerciseDragStart(day.id, exIdx)}
                        onDragOver={() => handleExerciseDragOver(day.id, exIdx)}
                        onDrop={() => handleExerciseDrop(day.id, exIdx)}
                        onDragEnd={handleExerciseDragEnd}
                        isDragOver={dragOverTarget?.dayId === day.id && dragOverTarget?.idx === exIdx}
                        isDragging={dragSrc?.dayId === day.id && dragSrc?.idx === exIdx}
                      />
                    </Fragment>
                  ))}

                  {/* DB Picker */}
                  {pickerOpenDayId === day.id && (
                    <ExerciseDBPicker
                      exercises={dbExercises}
                      onSelect={(item) => addExerciseFromDB(day.id, item)}
                      onClose={() => setPickerOpenDayId(null)}
                    />
                  )}

                  {/* Add buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-2">
                    <button
                      type="button"
                      onClick={() => setPickerOpenDayId(pickerOpenDayId === day.id ? null : day.id)}
                      className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors py-1 font-medium"
                    >
                      <Database size={12} /> Aus ÜbungenDB
                    </button>
                    <span className="text-[#2a3d54] text-xs select-none">·</span>
                    <button
                      type="button"
                      onClick={() => addExercise(day.id)}
                      className="flex items-center gap-1.5 text-xs text-[#5a7090] hover:text-[#8fa3c0] transition-colors py-1"
                    >
                      <Plus size={12} /> Manuell hinzufügen
                    </button>
                  </div>

                  {/* Per-day cardio */}
                  <div className="flex flex-col gap-1.5 pt-3 border-t border-[#1e2d42]/60 mt-2">
                    <label className="text-xs font-medium text-[#8fa3c0]">Cardio für diesen Tag</label>
                    <input
                      value={day.cardioNote ?? ""}
                      onChange={(e) => updateDayField(day.id, "cardioNote", e.target.value)}
                      placeholder="z.B. 20 min Stairmaster nach dem Training"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                  </div>

                  {/* Day note */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#8fa3c0]">Tag-Notiz</label>
                    <input
                      value={day.note ?? ""}
                      onChange={(e) => updateDayField(day.id, "note", e.target.value)}
                      placeholder="Allgemeine Hinweise für diesen Trainingstag"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add day */}
        <button
          type="button"
          onClick={addDay}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#1e2d42] text-[#5a7090] text-sm hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors"
        >
          <Plus size={15} />
          {mode === "weekday" ? "Tag hinzufügen" : "Training hinzufügen"}
        </button>

      </div>

      <FloatingSaveButton onClick={handleSave} label="Plan speichern" />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-semibold text-[#f0f4ff] mb-1.5">Übung entfernen</h3>
            <p className="text-xs text-[#8fa3c0] mb-5">Möchtest du diese Übung wirklich aus dem Trainingsplan entfernen?</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs rounded-lg border border-[#1e2d42] text-[#8fa3c0] hover:bg-[#1e2d42] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExercise(deleteConfirm.dayId, deleteConfirm.exId);
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 text-xs rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors font-medium"
              >
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
