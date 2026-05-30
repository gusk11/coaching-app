"use client";
import { useState, useEffect } from "react";
import { TrainingPlan, TrainingDay, Exercise, TrainingPlanMode, ExerciseDBItem } from "@/types";
import { loadExerciseDB } from "@/lib/store";
import { Trash2, Plus, ChevronDown, ChevronUp, GripVertical, ExternalLink, Database, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface Props {
  plan?: TrainingPlan;
  athleteId: string;
  onSave: (plan: TrainingPlan) => void;
}

const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

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
    reps: "8-12",
    muscleGroup: item.muscleGroup,
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
                {item.equipment && <span className="text-[#3a5070]"> · {item.equipment}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ExerciseRowProps {
  exercise: Exercise;
  onChange: (updated: Exercise) => void;
  onDelete: () => void;
}

function ExerciseRow({ exercise, onChange, onDelete }: ExerciseRowProps) {
  const isFromDB = !!exercise.exerciseDbId;

  return (
    <div className="flex items-start gap-2 py-2 border-b border-[#1e2d42]/60 last:border-0">
      <GripVertical size={14} className="text-[#2a3d54] mt-2.5 shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        {isFromDB ? (
          <div className="bg-[#0a1120] rounded-lg px-2.5 py-2 border border-[#1e2d42] flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-[#f0f4ff]">{exercise.name}</span>
              <span className="text-[9px] bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20 rounded px-1.5 py-0.5 font-medium leading-none">DB</span>
              {exercise.muscleGroup && (
                <span className="text-[9px] bg-[#1e2d42] text-[#8fa3c0] rounded px-1.5 py-0.5 leading-none">{exercise.muscleGroup}</span>
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

        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex items-center gap-1">
            <label className="text-xs text-[#5a7090] shrink-0">Sätze</label>
            <input
              type="number"
              min={1}
              max={20}
              value={exercise.sets}
              onChange={(e) => onChange({ ...exercise, sets: Number(e.target.value) })}
              className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-full"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-[#5a7090] shrink-0">Wdh.</label>
            <input
              value={exercise.reps}
              onChange={(e) => onChange({ ...exercise, reps: e.target.value })}
              placeholder="8-12"
              className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-full"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-[#5a7090] shrink-0">RIR</label>
            <input
              type="number"
              min={0}
              max={5}
              value={exercise.rir ?? ""}
              onChange={(e) => onChange({ ...exercise, rir: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="–"
              className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-full"
            />
          </div>
        </div>

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

export function TrainingEditor({ plan, athleteId, onSave }: Props) {
  const initPlan = plan ?? {
    id: `tp-${Date.now()}`,
    athleteId,
    title: "Trainingsplan",
    days: [],
    coachNote: "",
    createdAt: new Date().toISOString(),
    mode: "weekday" as TrainingPlanMode,
    generalCardio: "",
  };

  const [title, setTitle] = useState(initPlan.title);
  const [coachNote, setCoachNote] = useState(initPlan.coachNote ?? "");
  const [mode, setMode] = useState<TrainingPlanMode>(initPlan.mode ?? "weekday");
  const [generalCardio, setGeneralCardio] = useState(initPlan.generalCardio ?? "");
  const [days, setDays] = useState<TrainingDay[]>(initPlan.days);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(initPlan.days.map((d) => d.id)));
  const [dbExercises, setDbExercises] = useState<ExerciseDBItem[]>([]);
  const [pickerOpenDayId, setPickerOpenDayId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ dayId: string; exId: string } | null>(null);

  useEffect(() => {
    setDbExercises(loadExerciseDB());
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

  function updateDayField<K extends keyof TrainingDay>(id: string, field: K, value: TrainingDay[K]) {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function addExercise(dayId: string) {
    const ex = emptyExercise();
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d))
    );
  }

  function addExerciseFromDB(dayId: string, item: ExerciseDBItem) {
    const ex = exerciseFromDB(item);
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d))
    );
    setPickerOpenDayId(null);
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
    onSave({ ...initPlan, title, coachNote, days, mode, generalCardio });
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
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-2">
          <label className="text-xs font-medium text-[#8fa3c0]">Allgemeine Cardio-Vorgaben</label>
          <textarea
            value={generalCardio}
            onChange={(e) => setGeneralCardio(e.target.value)}
            rows={3}
            placeholder="z.B. 4× pro Woche 25 min nüchtern · 30 min Stairmaster nach dem Training · täglich 10.000 Schritte"
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
          />
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
                      className="bg-transparent text-sm font-semibold text-[#f0f4ff] focus:outline-none cursor-pointer"
                    >
                      {WEEKDAYS.map((w) => <option key={w} value={w}>{w}</option>)}
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
                <div className="p-4 flex flex-col gap-3">
                  {/* Exercises */}
                  {day.exercises.map((ex) => (
                    <ExerciseRow
                      key={ex.id}
                      exercise={ex}
                      onChange={(updated) => updateExercise(day.id, ex.id, updated)}
                      onDelete={() => setDeleteConfirm({ dayId: day.id, exId: ex.id })}
                    />
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
                  <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1e2d42]/60">
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

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors"
        >
          Plan speichern
        </button>
      </div>

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
