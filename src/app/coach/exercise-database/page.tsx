"use client";
import { useState, useEffect } from "react";
import { ExerciseDBItem } from "@/types";
import {
  loadExerciseDB,
  addExerciseDBItem,
  updateExerciseDBItem,
  deleteExerciseDBItem,
  loadAuth,
} from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modalOverlay, modalContent } from "@/lib/motion";

const MUSCLE_GROUPS = [
  "Brust",
  "Rücken",
  "Beine",
  "Schultern",
  "Bizeps",
  "Trizeps",
  "Bauch",
  "Gluteus",
  "Waden",
  "Sonstiges",
];

function emptyForm(): Partial<ExerciseDBItem> {
  return { name: "", muscleGroup: "", notes: "", executionLink: "" };
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function ExerciseForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<ExerciseDBItem>;
  onSave: (data: Partial<ExerciseDBItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ExerciseDBItem>>(initial ?? emptyForm());
  const [errors, setErrors] = useState<{ name?: string; muscleGroup?: string; executionLink?: string }>({});

  function set(field: keyof ExerciseDBItem, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name?.trim()) errs.name = "Übungsname darf nicht leer sein.";
    if (!form.muscleGroup?.trim()) errs.muscleGroup = "Muskelgruppe darf nicht leer sein.";
    if (form.executionLink?.trim()) {
      try {
        new URL(form.executionLink.trim());
      } catch {
        errs.executionLink = "Bitte eine gültige URL eingeben (z.B. https://…)";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name?.trim() ?? "",
      muscleGroup: form.muscleGroup?.trim() ?? "",
      notes: form.notes?.trim() || undefined,
      executionLink: form.executionLink?.trim() || undefined,
    });
  }

  const inputCls =
    "bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full";
  const errorInputCls =
    "bg-[#0f1624] border border-[#ef4444] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#ef4444] transition-colors w-full";
  const labelCls = "text-xs text-[#5a7090] mb-1 block";

  return (
    <motion.div
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg bg-[#141d2e] border border-[#1e2d42] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
          <h2 className="text-base font-semibold text-[#f0f4ff]">
            {initial?.id ? "Übung bearbeiten" : "Neue Übung"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1e2d42] transition-colors"
          >
            <X size={16} className="text-[#8fa3c0]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">
          {/* Übungsname */}
          <div>
            <label className={labelCls}>Übungsname *</label>
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="z.B. Bankdrücken, Kniebeuge, Latzug"
              className={errors.name ? errorInputCls : inputCls}
            />
            {errors.name && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.name}</p>
            )}
          </div>

          {/* Muskelgruppe */}
          <div>
            <label className={labelCls}>Muskelgruppe *</label>
            <select
              value={form.muscleGroup ?? ""}
              onChange={(e) => set("muscleGroup", e.target.value)}
              className={errors.muscleGroup ? errorInputCls : inputCls}
            >
              <option value="">— auswählen —</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {errors.muscleGroup && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.muscleGroup}</p>
            )}
          </div>

          {/* Anmerkungen */}
          <div>
            <label className={labelCls}>Anmerkungen</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={4}
              placeholder="z.B. Auf stabile Schulterblattposition achten. Langsame exzentrische Phase."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Link zur Übungsausführung */}
          <div>
            <label className={labelCls}>Link zur Übungsausführung (optional)</label>
            <input
              type="text"
              value={form.executionLink ?? ""}
              onChange={(e) => set("executionLink", e.target.value)}
              placeholder="https://…  z.B. YouTube-Link oder Technikbeschreibung"
              className={errors.executionLink ? errorInputCls : inputCls}
            />
            {errors.executionLink && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.executionLink}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
            >
              <Check size={15} />
              Speichern
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-sm bg-[#141d2e] border border-[#1e2d42] rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-5 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-[#f0f4ff]">Übung löschen</h2>
          <p className="text-sm text-[#8fa3c0] leading-relaxed">
            Möchtest du diese Übung wirklich löschen? Diese Aktion kann nicht rückgängig
            gemacht werden.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Löschen
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExerciseDatabase() {
  const router = useRouter();
  const [items, setItems] = useState<ExerciseDBItem[]>([]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [editing, setEditing] = useState<Partial<ExerciseDBItem> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") router.replace("/login");
    setItems(loadExerciseDB());
  }, [router]);

  const filtered = items.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = muscleFilter ? e.muscleGroup === muscleFilter : true;
    return matchesSearch && matchesMuscle;
  });

  const usedMuscleGroups = Array.from(new Set(items.map((e) => e.muscleGroup))).sort();

  function handleSave(data: Partial<ExerciseDBItem>) {
    if (editing?.id) {
      const updated = updateExerciseDBItem(editing.id, data);
      setItems(updated);
    } else {
      const updated = addExerciseDBItem(
        data as Omit<ExerciseDBItem, "id" | "createdAt" | "updatedAt">
      );
      setItems(updated);
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    const updated = deleteExerciseDBItem(id);
    setItems(updated);
    setConfirmDelete(null);
  }

  return (
    <AppShell role="coach" title="ÜbungenDB">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">

        {/* Stats bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
          <div className="flex gap-4 text-xs">
            <span className="text-[#8fa3c0]">
              <span className="text-[#f0f4ff] font-semibold">{items.length}</span> Übungen
            </span>
            {usedMuscleGroups.length > 0 && (
              <span className="text-[#8fa3c0]">
                <span className="text-[#f0f4ff] font-semibold">{usedMuscleGroups.length}</span> Muskelgruppen
              </span>
            )}
          </div>
          <button
            onClick={() => setEditing(emptyForm())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors"
          >
            <Plus size={13} /> Übung hinzufügen
          </button>
        </div>

        {/* Search + filter row */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Übung suchen…"
            className="flex-1 min-w-[200px] bg-[#0f1624] border border-[#1e2d42] rounded-xl px-4 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#5a7090]"
          />
          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            <option value="">Alle Muskelgruppen</option>
            {usedMuscleGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
          <div className="overflow-x-auto">
          <div className="min-w-[560px]">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs text-[#5a7090] uppercase tracking-widest border-b border-[#1e2d42] bg-[#0f1624]">
            <span className="col-span-3">Übungsname</span>
            <span className="col-span-2">Muskelgruppe</span>
            <span className="col-span-4">Anmerkungen</span>
            <span className="col-span-2">Link</span>
            <span className="col-span-1 text-right">Aktionen</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1e2d42]">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-[#5a7090] py-8">
                {items.length === 0
                  ? 'Noch keine Übungen. Klicke auf "Übung hinzufügen" um die erste hinzuzufügen.'
                  : "Keine Übungen gefunden."}
              </p>
            ) : (
              filtered.map((e) => (
                <div
                  key={e.id}
                  className="grid grid-cols-12 px-4 py-3 items-start hover:bg-[#192236] transition-colors"
                >
                  {/* Übungsname */}
                  <div className="col-span-3 pr-3">
                    <p className="text-sm text-[#f0f4ff] font-medium leading-snug line-clamp-2">
                      {e.name}
                    </p>
                  </div>

                  {/* Muskelgruppe */}
                  <div className="col-span-2 pr-3">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20">
                      {e.muscleGroup}
                    </span>
                  </div>

                  {/* Anmerkungen */}
                  <div className="col-span-4 pr-3">
                    <p className="text-sm text-[#8fa3c0] line-clamp-2 leading-snug">
                      {e.notes || <span className="text-[#5a7090] italic">—</span>}
                    </p>
                  </div>

                  {/* Link */}
                  <div className="col-span-2 pr-2">
                    {e.executionLink ? (
                      <a
                        href={e.executionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(ev) => ev.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                      >
                        <ExternalLink size={11} />
                        Öffnen
                      </a>
                    ) : (
                      <span className="text-xs text-[#5a7090] italic">Kein Link</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditing(e)}
                      title="Bearbeiten"
                      className="p-1.5 rounded hover:bg-[#1e2d42] transition-colors"
                    >
                      <Pencil size={13} className="text-[#8fa3c0] hover:text-[#f0f4ff]" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(e.id)}
                      title="Löschen"
                      className="p-1.5 rounded hover:bg-[#ef4444]/10 transition-colors"
                    >
                      <Trash2 size={13} className="text-[#5a7090] hover:text-[#ef4444]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
          </div>
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-[#5a7090] text-center">
            {filtered.length} von {items.length} Einträgen
          </p>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {editing !== null && (
          <ExerciseForm
            initial={editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <DeleteConfirmModal
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
