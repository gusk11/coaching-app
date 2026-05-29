"use client";
import { useState } from "react";
import { TrainingLog } from "@/types";
import { Athlete } from "@/types";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { updateTrainingLog, deleteTrainingLog } from "@/lib/store";

interface Props {
  trainingLogs: TrainingLog[];
  athleteId: string;
  onUpdate: (athletes: Athlete[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

function totalSets(log: TrainingLog): number {
  return log.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
}

function totalVolume(log: TrainingLog): number | null {
  let vol = 0, hasData = false;
  for (const ex of log.exercises)
    for (const s of ex.sets)
      if (s.weight != null && s.reps != null) { vol += s.weight * s.reps; hasData = true; }
  return hasData ? Math.round(vol) : null;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

// ─── Edit types ───────────────────────────────────────────────────────────────

interface EditSet { weight: string; reps: string; rir: string; notes: string; }
interface EditExercise { exerciseId: string; exerciseName: string; sets: EditSet[]; }
interface EditState {
  logId: string;
  date: string;
  trainingDayName: string;
  note: string;
  durationMinutes: string;
  exercises: EditExercise[];
}

function logToEditState(log: TrainingLog): EditState {
  return {
    logId: log.id,
    date: log.date,
    trainingDayName: log.trainingDayName,
    note: log.note ?? "",
    durationMinutes: log.durationSeconds != null ? String(Math.round(log.durationSeconds / 60)) : "",
    exercises: log.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s) => ({
        weight: s.weight != null ? String(s.weight) : "",
        reps: s.reps != null ? String(s.reps) : "",
        rir: s.rir != null ? String(s.rir) : "",
        notes: s.notes ?? "",
      })),
    })),
  };
}

function editStateToLog(state: EditState, original: TrainingLog): TrainingLog {
  return {
    ...original,
    date: state.date,
    trainingDayName: state.trainingDayName,
    note: state.note || undefined,
    durationSeconds: state.durationMinutes ? Number(state.durationMinutes) * 60 : undefined,
    exercises: state.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s, sIdx) => ({
        setNumber: sIdx + 1,
        weight: s.weight !== "" ? Number(s.weight) : null,
        reps: s.reps !== "" ? Number(s.reps) : null,
        rir: s.rir !== "" ? Number(s.rir) : null,
        notes: s.notes || undefined,
      })),
    })),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AllTrainings({ trainingLogs, athleteId, onUpdate }: Props) {
  const sorted = [...trainingLogs].sort((a, b) => b.date.localeCompare(a.date));
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [editState, setEditState] = useState<EditState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function requestDelete(id: string) {
    setConfirmDeleteId(id);
    setEditState(null);
  }

  function cancelDelete() { setConfirmDeleteId(null); }

  function confirmDelete() {
    if (!confirmDeleteId) return;
    const athletes = deleteTrainingLog(athleteId, confirmDeleteId);
    setConfirmDeleteId(null);
    onUpdate(athletes);
  }

  function startEdit(log: TrainingLog) {
    setEditState(logToEditState(log));
    setOpenIds((prev) => new Set([...prev, log.id]));
  }

  function cancelEdit() { setEditState(null); }

  function saveEdit() {
    if (!editState) return;
    const original = trainingLogs.find((l) => l.id === editState.logId);
    if (!original) return;
    const updated = editStateToLog(editState, original);
    const athletes = updateTrainingLog(athleteId, updated);
    onUpdate(athletes);
    setEditState(null);
  }

  // ── Edit state mutators ────────────────────────────────────────────────────

  function setField<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEditState((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function setExName(exIdx: number, name: string) {
    setEditState((prev) => {
      if (!prev) return prev;
      return { ...prev, exercises: prev.exercises.map((ex, i) => i === exIdx ? { ...ex, exerciseName: name } : ex) };
    });
  }

  function setSetField(exIdx: number, setIdx: number, field: keyof EditSet, value: string) {
    setEditState((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        return { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) };
      });
      return { ...prev, exercises };
    });
  }

  function addSet(exIdx: number) {
    setEditState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex, i) =>
          i !== exIdx ? ex : { ...ex, sets: [...ex.sets, { weight: "", reps: "", rir: "", notes: "" }] }
        ),
      };
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setEditState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex, i) =>
          i !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
        ),
      };
    });
  }

  function removeExercise(exIdx: number) {
    setEditState((prev) => prev ? { ...prev, exercises: prev.exercises.filter((_, i) => i !== exIdx) } : prev);
  }

  function addExercise() {
    setEditState((prev) =>
      prev ? {
        ...prev,
        exercises: [...prev.exercises, {
          exerciseId: `ex-custom-${Date.now()}`,
          exerciseName: "",
          sets: [{ weight: "", reps: "", rir: "", notes: "" }],
        }],
      } : prev
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (sorted.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[#141d2e] border border-[#1e2d42] text-center">
        <p className="text-3xl mb-3">🏋️</p>
        <p className="text-sm font-medium text-[#8fa3c0]">Noch keine abgeschlossenen Trainings</p>
        <p className="text-xs text-[#5a7090] mt-1">Tracke dein erstes Training im Tab „Training tracken".</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#5a7090] uppercase tracking-widest px-1">
        {sorted.length} {sorted.length === 1 ? "Training" : "Trainings"}
      </p>

      {sorted.map((log) => {
        const open = openIds.has(log.id);
        const editing = editState?.logId === log.id;
        const confirming = confirmDeleteId === log.id;
        const sets = totalSets(log);
        const vol = totalVolume(log);

        return (
          <div key={log.id} className={`rounded-2xl bg-[#141d2e] border overflow-hidden transition-colors ${confirming ? "border-[#ef4444]/40" : "border-[#1e2d42]"}`}>
            {/* Header */}
            <div className="px-4 py-3">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => !editing && !confirming && toggleOpen(log.id)}
                  className="flex-1 text-left min-w-0"
                  disabled={editing || confirming}
                >
                  <p className="text-xs text-[#5a7090]">{formatDate(log.date)}</p>
                  <p className="text-sm font-semibold text-[#f0f4ff] mt-0.5 truncate">{log.trainingDayName}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[#5a7090] mt-1">
                    <span>{log.exercises.length} Übungen</span>
                    <span>·</span>
                    <span>{sets} Sätze</span>
                    {log.durationSeconds != null && (
                      <><span>·</span><span>{formatDuration(log.durationSeconds)}</span></>
                    )}
                    {vol != null && (
                      <><span>·</span><span>{vol >= 1000 ? `${(vol / 1000).toFixed(1)}t` : `${vol} kg`} Vol.</span></>
                    )}
                  </div>
                </button>
                {!editing && !confirming && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => requestDelete(log.id)}
                      className="p-1.5 text-[#5a7090] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-[#ef4444]/10"
                      title="Training löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEdit(log)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff] hover:border-[#3b82f6] transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button onClick={() => toggleOpen(log.id)} className="p-1">
                      <ChevronDown className={`w-4 h-4 text-[#5a7090] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delete confirmation panel */}
            {confirming && (
              <div className="border-t border-[#ef4444]/30 bg-[#ef4444]/5 px-4 py-4 flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-[#f0f4ff]">Training wirklich löschen?</p>
                  <p className="text-xs text-[#5a7090] mt-0.5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 py-2 rounded-xl border border-[#1e2d42] text-sm text-[#5a7090] hover:text-[#8fa3c0] transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-sm font-medium text-white transition-colors"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            )}

            {/* Expanded detail view */}
            {open && !editing && (
              <div className="border-t border-[#1e2d42] px-4 py-3 flex flex-col gap-4">
                {log.exercises.map((ex, exIdx) => (
                  <div key={exIdx}>
                    <p className="text-xs font-semibold text-[#8fa3c0] uppercase tracking-wider mb-1.5">{ex.exerciseName}</p>
                    <div className="flex flex-col gap-1">
                      {ex.sets.map((set, si) => (
                        <div key={si} className="flex items-center gap-2 text-sm">
                          <span className="text-xs text-[#5a7090] w-14 shrink-0">Satz {set.setNumber}</span>
                          <span className="text-[#f0f4ff] flex-1">
                            {set.weight != null ? `${set.weight} kg` : "–"}
                            {" × "}
                            {set.reps != null ? set.reps : "–"}
                            {set.rir != null ? <span className="text-[#5a7090]"> @RIR{set.rir}</span> : null}
                          </span>
                          {set.notes && (
                            <span className="text-xs text-[#5a7090] italic truncate max-w-[100px]">{set.notes}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {log.note && (
                  <div className="pt-2 border-t border-[#1e2d42]">
                    <p className="text-xs text-[#5a7090]">
                      Anmerkung: <span className="text-[#8fa3c0]">{log.note}</span>
                    </p>
                  </div>
                )}
                {log.durationSeconds != null && !log.note && (
                  <div className="pt-2 border-t border-[#1e2d42]">
                    <p className="text-xs text-[#5a7090]">Dauer: {formatDuration(log.durationSeconds)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Edit form */}
            {editing && editState && (
              <div className="border-t border-[#1e2d42] px-4 py-4 flex flex-col gap-4">
                {/* Meta fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#5a7090]">Datum</label>
                    <input
                      type="date"
                      value={editState.date}
                      onChange={(e) => setField("date", e.target.value)}
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#5a7090]">Dauer (min)</label>
                    <input
                      type="number"
                      value={editState.durationMinutes}
                      onChange={(e) => setField("durationMinutes", e.target.value)}
                      min="0"
                      placeholder="–"
                      className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#5a7090]">Trainingsname</label>
                  <input
                    type="text"
                    value={editState.trainingDayName}
                    onChange={(e) => setField("trainingDayName", e.target.value)}
                    className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#5a7090]">Anmerkung</label>
                  <textarea
                    value={editState.note}
                    onChange={(e) => setField("note", e.target.value)}
                    rows={2}
                    placeholder="Optional…"
                    className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] resize-none"
                  />
                </div>

                {/* Exercises */}
                <div className="flex flex-col gap-3">
                  {editState.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="rounded-xl border border-[#1e2d42] bg-[#0f1624] p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ex.exerciseName}
                          onChange={(e) => setExName(exIdx, e.target.value)}
                          placeholder="Übungsname"
                          className="flex-1 bg-transparent border-b border-[#1e2d42] pb-1 text-sm font-medium text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
                        />
                        <button
                          onClick={() => removeExercise(exIdx)}
                          className="p-1 text-[#5a7090] hover:text-[#ef4444] transition-colors"
                          title="Übung entfernen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="flex items-center gap-1.5">
                            <span className="text-xs text-[#5a7090] w-5 shrink-0 text-right">{setIdx + 1}</span>
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) => setSetField(exIdx, setIdx, "weight", e.target.value)}
                              placeholder="kg"
                              min="0"
                              className="w-14 bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1 text-xs text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] text-center"
                            />
                            <span className="text-xs text-[#5a7090]">×</span>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => setSetField(exIdx, setIdx, "reps", e.target.value)}
                              placeholder="Wdh"
                              min="0"
                              className="w-12 bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1 text-xs text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] text-center"
                            />
                            <span className="text-xs text-[#5a7090]">RIR</span>
                            <input
                              type="number"
                              value={set.rir}
                              onChange={(e) => setSetField(exIdx, setIdx, "rir", e.target.value)}
                              placeholder="–"
                              min="0"
                              className="w-10 bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1 text-xs text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] text-center"
                            />
                            <input
                              type="text"
                              value={set.notes}
                              onChange={(e) => setSetField(exIdx, setIdx, "notes", e.target.value)}
                              placeholder="Notiz"
                              className="flex-1 bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1 text-xs text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] min-w-0"
                            />
                            <button
                              onClick={() => removeSet(exIdx, setIdx)}
                              className="p-1 text-[#5a7090] hover:text-[#ef4444] transition-colors shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => addSet(exIdx)}
                        className="text-xs text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1 mt-0.5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Satz hinzufügen
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addExercise}
                  className="text-xs text-[#3b82f6] hover:text-[#60a5fa] flex items-center justify-center gap-1.5 transition-colors border border-dashed border-[#1e2d42] rounded-xl py-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Übung hinzufügen
                </button>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-sm text-[#5a7090] hover:text-[#8fa3c0] transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-sm font-medium text-white transition-colors"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
