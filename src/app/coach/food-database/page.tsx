"use client";
import { useState, useEffect } from "react";
import { FoodItem } from "@/types";
import { foodItems as baseFoodItems } from "@/data/foodItems";
import {
  loadCustomFoods,
  loadDeactivatedFoods,
  addCustomFood,
  updateCustomFood,
  deleteCustomFood,
  deleteBaseFoodItem,
} from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { loadAuth } from "@/lib/store";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modalOverlay, modalContent, listContainer, listItem } from "@/lib/motion";

// ─── Categories ───────────────────────────────────────────────────────────────
const ALLOWED_CATEGORIES = [
  "Protein",
  "Kohlenhydrate",
  "Fette",
  "Gemüse",
  "Obst",
  "Weitere",
] as const;

const SERVING_OPTIONS = ["100 g", "1 Stück"] as const;
type ServingOption = typeof SERVING_OPTIONS[number];

// ─── Empty form ───────────────────────────────────────────────────────────────
function emptyForm(): Partial<FoodItem> {
  return {
    name: "",
    category: "Protein",
    servingLabel: "100 g",
    kcalPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    fiberPer100g: 0,
    saltPer100g: 0,
    defaultAmount: 100,
    notes: "",
  };
}

function servingToDefaultAmount(serving: string): number {
  return serving === "1 Stück" ? 1 : 100;
}

// ─── FoodForm (modal) ─────────────────────────────────────────────────────────
function FoodForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<FoodItem>;
  onSave: (data: Partial<FoodItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<FoodItem>>(initial ?? emptyForm());
  function set(field: keyof FoodItem, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    onSave({ ...form, category: form.category || "Weitere" });
  }

  const inputCls =
    "bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full";
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
          <h2 className="text-base font-semibold text-[#f0f4ff]">
            {initial?.id ? "Lebensmittel bearbeiten" : "Neues Lebensmittel"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e2d42] transition-colors">
            <X size={16} className="text-[#8fa3c0]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">
          {/* Name */}
          <div>
            <label className={labelCls}>Name *</label>
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="z.B. Hähnchenbrust"
              required
              className={inputCls}
            />
          </div>

          {/* Serving label */}
          <div>
            <label className={labelCls}>Standardmenge *</label>
            <select
              value={form.servingLabel ?? "100 g"}
              onChange={(e) => {
                const serving = e.target.value as ServingOption;
                setForm((prev) => ({
                  ...prev,
                  servingLabel: serving,
                  defaultAmount: servingToDefaultAmount(serving),
                }));
              }}
              className={inputCls}
            >
              {SERVING_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <p className="text-[10px] text-[#5a7090] mt-1">
              Alle Nährwerte beziehen sich auf diese Menge.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Kategorie</label>
            <select
              value={form.category ?? "Weitere"}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            >
              {ALLOWED_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Macros per serving */}
          <div>
            <p className={labelCls}>Nährwerte pro Standardmenge</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["kcalPer100g", "Kalorien (kcal)"],
                  ["proteinPer100g", "Protein (g)"],
                  ["carbsPer100g", "Kohlenhydrate (g)"],
                  ["fatPer100g", "Fett (g)"],
                  ["fiberPer100g", "Ballaststoffe (g)"],
                  ["saltPer100g", "Salz (g)"],
                ] as [keyof FoodItem, string][]
              ).map(([field, label]) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={(form[field] as number) ?? 0}
                    onChange={(e) => set(field, parseFloat(e.target.value) || 0)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Hinweis (optional)</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="z.B. Nährwerte markenabhängig"
              className={`${inputCls} resize-none`}
            />
          </div>

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

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({
  foodName,
  onConfirm,
  onCancel,
}: {
  foodName: string;
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
        className="w-full max-w-sm bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#ef4444]/10 shrink-0">
            <AlertTriangle size={18} className="text-[#ef4444]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f0f4ff] mb-1">Lebensmittel löschen</p>
            <p className="text-xs text-[#8fa3c0]">
              Möchtest du <span className="text-[#f0f4ff] font-medium">{foodName}</span> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors"
          >
            Löschen
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FoodDatabase() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");

  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [hiddenBaseIds, setHiddenBaseIds] = useState<string[]>([]);

  const [editing, setEditing] = useState<Partial<FoodItem> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") router.replace("/login");
    setCustomFoods(loadCustomFoods());
    setHiddenBaseIds(loadDeactivatedFoods());
  }, [router]);

  // Merge base (minus hidden) + custom
  const allItems: FoodItem[] = [
    ...baseFoodItems
      .filter((f) => !hiddenBaseIds.includes(f.id))
      .map((f) => ({ ...f, isActive: true })),
    ...customFoods.filter((f) => f.isActive !== false),
  ];

  const categories = ["Alle", ...ALLOWED_CATEGORIES];

  const filtered = allItems.filter((f) => {
    const matchCat = categoryFilter === "Alle" || f.category === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch =
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      (f.servingLabel ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  function handleSave(data: Partial<FoodItem>) {
    if (editing?.id) {
      if (editing.isCustomFood) {
        setCustomFoods(updateCustomFood(editing.id, data));
      } else {
        // Base food: hide the original, create an editable custom copy
        setHiddenBaseIds(deleteBaseFoodItem(editing.id));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isCustomFood, createdAt, updatedAt, ...foodData } = { ...editing, ...data };
        setCustomFoods(addCustomFood(foodData as Omit<FoodItem, "id" | "isCustomFood" | "createdAt" | "updatedAt">));
      }
    } else {
      setCustomFoods(addCustomFood(data as Omit<FoodItem, "id" | "isCustomFood" | "createdAt" | "updatedAt">));
    }
    setEditing(null);
  }

  function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    if (deleteTarget.isCustomFood) {
      setCustomFoods(deleteCustomFood(deleteTarget.id));
    } else {
      setHiddenBaseIds(deleteBaseFoodItem(deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  return (
    <AppShell role="coach" title="Lebensmitteldatenbank">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">

        {/* Stats + New button */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
          <div className="flex gap-4 text-xs">
            <span className="text-[#8fa3c0]">
              <span className="text-[#f0f4ff] font-semibold">{allItems.length}</span> Einträge
            </span>
            <span className="text-[#5a7090]">
              davon{" "}
              <span className="text-[#3b82f6] font-semibold">
                {customFoods.filter((f) => f.isActive !== false).length}
              </span>{" "}
              eigene
            </span>
          </div>
          <button
            onClick={() => setEditing(emptyForm())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors"
          >
            <Plus size={13} /> Neu
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Lebensmittel suchen…"
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-4 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#5a7090]"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  categoryFilter === c
                    ? "bg-[#3b82f6] text-white"
                    : "bg-[#141d2e] text-[#8fa3c0] hover:text-[#f0f4ff]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
          <div className="overflow-x-auto">
          <div className="min-w-[560px]">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2.5 text-xs text-[#5a7090] uppercase tracking-widest border-b border-[#1e2d42] bg-[#0f1624]">
            <span className="col-span-3">Name · Menge</span>
            <span className="col-span-2 text-right">kcal</span>
            <span className="col-span-1 text-right">P</span>
            <span className="col-span-1 text-right">K</span>
            <span className="col-span-1 text-right">F</span>
            <span className="col-span-1 text-right">Bal</span>
            <span className="col-span-1 text-right">Salz</span>
            <span className="col-span-2 text-right">Aktionen</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#1e2d42]">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-[#5a7090] py-8">Keine Lebensmittel gefunden.</p>
            ) : (
              filtered.map((f) => (
                <div
                  key={f.id}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#192236] transition-colors"
                >
                  {/* Name + category + serving */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm text-[#f0f4ff] truncate">{f.name}</p>
                      {f.isCustomFood && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-[#3b82f6]/20 text-[#60a5fa] shrink-0">eigene</span>
                      )}
                    </div>
                    <p className="text-xs text-[#5a7090] truncate">
                      {f.category}
                      {f.servingLabel && <span className="text-[#3a4d60]"> · {f.servingLabel}</span>}
                    </p>
                  </div>

                  {/* Macros */}
                  <span className="col-span-2 text-sm text-[#f0f4ff] text-right">{f.kcalPer100g}</span>
                  <span className="col-span-1 text-sm text-[#60a5fa] text-right">{f.proteinPer100g}g</span>
                  <span className="col-span-1 text-sm text-[#8fa3c0] text-right">{f.carbsPer100g}g</span>
                  <span className="col-span-1 text-sm text-[#8fa3c0] text-right">{f.fatPer100g}g</span>
                  <span className="col-span-1 text-sm text-[#5a7090] text-right">{f.fiberPer100g}g</span>
                  <span className="col-span-1 text-sm text-[#5a7090] text-right">{f.saltPer100g ?? 0}g</span>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditing(f)}
                      title="Bearbeiten"
                      className="p-1.5 rounded hover:bg-[#3b82f6]/10 transition-colors group"
                    >
                      <Pencil size={13} className="text-[#5a7090] group-hover:text-[#3b82f6] transition-colors" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(f)}
                      title="Löschen"
                      className="p-1.5 rounded hover:bg-[#ef4444]/10 transition-colors group"
                    >
                      <Trash2 size={13} className="text-[#5a7090] group-hover:text-[#ef4444] transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
          </div>
        </div>

        <p className="text-xs text-[#5a7090] text-center">
          {filtered.length} von {allItems.length} Einträgen
        </p>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {editing !== null && (
          <FoodForm
            initial={editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget !== null && (
          <DeleteConfirmModal
            foodName={deleteTarget.name}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
