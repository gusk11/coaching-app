"use client";
import { useState, useEffect } from "react";
import { SupplementDBItem } from "@/types";
import {
  loadSupplementDB,
  addSupplementDBItem,
  updateSupplementDBItem,
  deleteSupplementDBItem,
  loadAuth,
} from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modalOverlay, modalContent } from "@/lib/motion";

// ─── Timing suggestions ───────────────────────────────────────────────────────
const TIMING_OPTIONS = [
  "morgens",
  "abends",
  "vor dem Training",
  "nach dem Training",
  "zu einer Mahlzeit",
  "täglich unabhängig vom Zeitpunkt",
  "Sonstiges",
];

// ─── Empty form ───────────────────────────────────────────────────────────────
function emptyForm(): Partial<SupplementDBItem> {
  return {
    name: "",
    standardDosage: "",
    timing: "",
    instructions: "",
    notes: "",
  };
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function SupplementForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<SupplementDBItem>;
  onSave: (data: Partial<SupplementDBItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<SupplementDBItem>>(initial ?? emptyForm());
  const [customTiming, setCustomTiming] = useState(
    initial?.timing && !TIMING_OPTIONS.slice(0, -1).includes(initial.timing)
      ? initial.timing
      : ""
  );
  const [showCustomTiming, setShowCustomTiming] = useState(
    !!(initial?.timing && !TIMING_OPTIONS.includes(initial.timing))
  );

  function set(field: keyof SupplementDBItem, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTimingChange(val: string) {
    if (val === "Sonstiges") {
      setShowCustomTiming(true);
      set("timing", "");
    } else {
      setShowCustomTiming(false);
      setCustomTiming("");
      set("timing", val);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const finalTiming = showCustomTiming ? customTiming.trim() : form.timing ?? "";
    onSave({ ...form, timing: finalTiming });
  }

  const inputCls =
    "bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full";
  const labelCls = "text-xs text-[#5a7090] mb-1 block";

  const selectedTiming = TIMING_OPTIONS.includes(form.timing ?? "")
    ? form.timing
    : showCustomTiming
    ? "Sonstiges"
    : "";

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
            {initial?.id ? "Supplement bearbeiten" : "Neues Supplement"}
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
          {/* Name */}
          <div>
            <label className={labelCls}>Name *</label>
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="z.B. Kreatin Monohydrat, Omega-3, Vitamin D3"
              required
              className={inputCls}
            />
          </div>

          {/* Standarddosierung */}
          <div>
            <label className={labelCls}>Standarddosierung</label>
            <input
              type="text"
              value={form.standardDosage ?? ""}
              onChange={(e) => set("standardDosage", e.target.value)}
              placeholder="z.B. 5 g täglich, 2000 I.E. täglich, 2 Kapseln pro Tag"
              className={inputCls}
            />
          </div>

          {/* Einnahmezeitpunkt */}
          <div>
            <label className={labelCls}>Einnahmezeitpunkt</label>
            <select
              value={selectedTiming}
              onChange={(e) => handleTimingChange(e.target.value)}
              className={inputCls}
            >
              <option value="">— auswählen —</option>
              {TIMING_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {showCustomTiming && (
              <input
                type="text"
                value={customTiming}
                onChange={(e) => setCustomTiming(e.target.value)}
                placeholder="Eigenen Einnahmezeitpunkt eingeben"
                className={`${inputCls} mt-2`}
              />
            )}
          </div>

          {/* Einnahmeanleitung */}
          <div>
            <label className={labelCls}>Einnahmeanleitung</label>
            <textarea
              value={form.instructions ?? ""}
              onChange={(e) => set("instructions", e.target.value)}
              rows={3}
              placeholder="z.B. Mit ausreichend Wasser einnehmen. Bei fettlöslichen Vitaminen zusammen mit einer fetthaltigen Mahlzeit einnehmen."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Weitere Hinweise */}
          <div>
            <label className={labelCls}>Weitere Hinweise</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="z.B. Bei Magenproblemen Dosierung aufteilen. Nicht nüchtern einnehmen. Blutwerte beachten."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Link */}
          <div>
            <label className={labelCls}>Link (optional)</label>
            <input
              type="url"
              value={form.link ?? ""}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://…  z.B. Produktseite oder Studie"
              className={inputCls}
            />
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
          <h2 className="text-base font-semibold text-[#f0f4ff]">Supplement löschen</h2>
          <p className="text-sm text-[#8fa3c0] leading-relaxed">
            Möchtest du dieses Supplement wirklich löschen? Diese Aktion kann nicht rückgängig
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
export default function SupplementDatabase() {
  const router = useRouter();
  const [items, setItems] = useState<SupplementDBItem[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<SupplementDBItem> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") router.replace("/login");
    setItems(loadSupplementDB());
  }, [router]);

  const filtered = items.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.timing.toLowerCase().includes(search.toLowerCase()) ||
    s.standardDosage.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave(data: Partial<SupplementDBItem>) {
    if (editing?.id) {
      const updated = updateSupplementDBItem(editing.id, data);
      setItems(updated);
    } else {
      const updated = addSupplementDBItem(
        data as Omit<SupplementDBItem, "id" | "createdAt" | "updatedAt">
      );
      setItems(updated);
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    const updated = deleteSupplementDBItem(id);
    setItems(updated);
    setConfirmDelete(null);
  }

  return (
    <AppShell role="coach" title="Supplement-Datenbank">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">

        {/* Stats bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
          <div className="flex gap-4 text-xs">
            <span className="text-[#8fa3c0]">
              <span className="text-[#f0f4ff] font-semibold">{items.length}</span> Supplements
            </span>
          </div>
          <button
            onClick={() => setEditing(emptyForm())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors"
          >
            <Plus size={13} /> Neu
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Supplement suchen…"
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-4 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#5a7090]"
        />

        {/* Table */}
        <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
          <div className="overflow-x-auto">
          <div className="min-w-[580px]">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs text-[#5a7090] uppercase tracking-widest border-b border-[#1e2d42] bg-[#0f1624]">
            <span className="col-span-2">Name</span>
            <span className="col-span-2">Dosierung</span>
            <span className="col-span-2">Zeitpunkt</span>
            <span className="col-span-3">Einnahmeanleitung</span>
            <span className="col-span-2">Hinweise</span>
            <span className="col-span-1 text-right">Aktionen</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1e2d42]">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-[#5a7090] py-8">
                {items.length === 0
                  ? "Noch keine Supplements. Klicke auf „Neu“ um das erste hinzuzufügen."
                  : "Keine Supplements gefunden."}
              </p>
            ) : (
              filtered.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-12 px-4 py-3 items-start hover:bg-[#192236] transition-colors"
                >
                  <div className="col-span-2 pr-3">
                    <div className="flex items-start gap-1.5">
                      <p className="text-sm text-[#f0f4ff] font-medium leading-snug line-clamp-2">
                        {s.name}
                      </p>
                      {s.link && (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={s.link}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-[#1e2d42] transition-colors"
                        >
                          <ExternalLink size={12} className="text-[#3b82f6]" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 pr-3">
                    <p className="text-sm text-[#8fa3c0] line-clamp-2">{s.standardDosage || "—"}</p>
                  </div>
                  <div className="col-span-2 pr-3">
                    <p className="text-sm text-[#60a5fa] line-clamp-2">{s.timing || "—"}</p>
                  </div>
                  <div className="col-span-3 pr-3">
                    <p className="text-sm text-[#8fa3c0] line-clamp-2 leading-snug">
                      {s.instructions || "—"}
                    </p>
                  </div>
                  <div className="col-span-2 pr-3">
                    <p className="text-sm text-[#5a7090] line-clamp-2 leading-snug">
                      {s.notes || "—"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditing(s)}
                      title="Bearbeiten"
                      className="p-1.5 rounded hover:bg-[#1e2d42] transition-colors"
                    >
                      <Pencil size={13} className="text-[#8fa3c0] hover:text-[#f0f4ff]" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(s.id)}
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
          <SupplementForm
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
