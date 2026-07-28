"use client";
import { useState, useEffect, useCallback } from "react";
import { FoodItem, ExerciseDBItem, SupplementDBItem } from "@/types";
import { foodItems as baseFoodItems } from "@/data/foodItems";
import {
  loadCustomFoods,
  loadDeactivatedFoods,
  addCustomFood,
  updateCustomFood,
  deleteCustomFood,
  deleteBaseFoodItem,
  loadExerciseDB,
  addExerciseDBItem,
  updateExerciseDBItem,
  deleteExerciseDBItem,
  loadSupplementDB,
  addSupplementDBItem,
  updateSupplementDBItem,
  deleteSupplementDBItem,
} from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Loader2, Globe, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modalOverlay, modalContent } from "@/lib/motion";
import type { ExternalFoodResult } from "@/app/api/foods/external-search/route";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls =
  "bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full";
const errorInputCls =
  "bg-[#0f1624] border border-[#ef4444] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#ef4444] transition-colors w-full";
const labelCls = "text-xs text-[#5a7090] mb-1 block";

// ═══════════════════════════════════════════════════════════════════════════════
// FOOD DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

const FOOD_CATEGORIES = ["Protein", "Kohlenhydrate", "Fettquelle", "Gemüse", "Obst", "Weitere"] as const;
const SERVING_OPTIONS = ["100 g", "1 Stück"] as const;
type ServingOption = typeof SERVING_OPTIONS[number];
type NutrientKey = "kcalPer100g" | "proteinPer100g" | "carbsPer100g" | "fatPer100g" | "fiberPer100g" | "saltPer100g";
const NUTRIENT_KEYS: NutrientKey[] = ["kcalPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g", "fiberPer100g", "saltPer100g"];

function emptyFoodForm(): Partial<FoodItem> {
  return {
    name: "", category: "Protein", servingLabel: "100 g",
    kcalPer100g: 0, proteinPer100g: 0, carbsPer100g: 0,
    fatPer100g: 0, fiberPer100g: 0, saltPer100g: 0,
    defaultAmount: 100, notes: "", source: "manual",
  };
}

function servingToDefaultAmount(serving: string): number {
  return serving === "1 Stück" ? 1 : 100;
}

function findSimilarFood(name: string, items: FoodItem[]): FoodItem | undefined {
  const a = name.toLowerCase().trim();
  return items.find((f) => {
    const b = f.name.toLowerCase().trim();
    if (a === b) return true;
    if (a.length >= 5 && b.includes(a)) return true;
    if (b.length >= 5 && a.includes(b)) return true;
    return false;
  });
}

function FoodForm({
  initial, onSave, onClose, duplicateWarning,
}: {
  initial?: Partial<FoodItem>;
  onSave: (data: Partial<FoodItem>) => void;
  onClose: () => void;
  duplicateWarning?: string;
}) {
  const [form, setForm] = useState<Partial<FoodItem>>(initial ?? emptyFoodForm());
  const [nutrientInputs, setNutrientInputs] = useState<Record<NutrientKey, string>>(() => {
    const src = initial ?? emptyFoodForm();
    return {
      kcalPer100g: String(src.kcalPer100g ?? 0),
      proteinPer100g: String(src.proteinPer100g ?? 0),
      carbsPer100g: String(src.carbsPer100g ?? 0),
      fatPer100g: String(src.fatPer100g ?? 0),
      fiberPer100g: String(src.fiberPer100g ?? 0),
      saltPer100g: String(src.saltPer100g ?? 0),
    };
  });
  const [nutrientError, setNutrientError] = useState("");

  function set(field: keyof FoodItem, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const parsedNutrients: Partial<Record<NutrientKey, number>> = {};
    for (const key of NUTRIENT_KEYS) {
      const s = nutrientInputs[key];
      const n = s === "" ? 0 : parseFloat(s);
      if (isNaN(n) || n < 0) { setNutrientError("Bitte gültigen Wert eingeben."); return; }
      parsedNutrients[key] = n;
    }
    setNutrientError("");
    onSave({ ...form, ...parsedNutrients, category: form.category || "Weitere" });
  }

  return (
    <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit"
        className="w-full max-w-lg bg-[#141d2e] border border-[#1e2d42] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
          <h2 className="text-base font-semibold text-[#f0f4ff]">
            {initial?.id ? "Lebensmittel bearbeiten" : "Neues Lebensmittel"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e2d42] transition-colors">
            <X size={16} className="text-[#8fa3c0]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">
          {initial?.source === "external" && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-xs text-[#8fa3c0]">
              <Globe size={12} className="shrink-0 mt-0.5 text-[#3b82f6]" />
              Daten aus Open Food Facts (crowd-sourced) — bitte Werte vor dem Speichern prüfen und ggf. korrigieren.
            </div>
          )}
          {duplicateWarning && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-xs text-[#f59e0b]">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              {duplicateWarning}
            </div>
          )}
          <div>
            <label className={labelCls}>Name *</label>
            <input type="text" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)}
              placeholder="z.B. Hähnchenbrust" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Standardmenge *</label>
            <select value={form.servingLabel ?? "100 g"}
              onChange={(e) => {
                const serving = e.target.value as ServingOption;
                setForm((prev) => ({ ...prev, servingLabel: serving, defaultAmount: servingToDefaultAmount(serving) }));
              }}
              className={inputCls}>
              {SERVING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <p className="text-[10px] text-[#5a7090] mt-1">Alle Nährwerte beziehen sich auf diese Menge.</p>
          </div>
          <div>
            <label className={labelCls}>
              Kategorie{initial?.source === "external" && <span className="ml-1 text-[#5a7090]">(Vorschlag — bitte prüfen)</span>}
            </label>
            <select value={form.category ?? "Weitere"} onChange={(e) => set("category", e.target.value)} className={inputCls}>
              {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className={labelCls}>Nährwerte pro Standardmenge</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["kcalPer100g", "Kalorien (kcal)"],
                ["proteinPer100g", "Protein (g)"],
                ["carbsPer100g", "Kohlenhydrate (g)"],
                ["fatPer100g", "Fett (g)"],
                ["fiberPer100g", "Ballaststoffe (g)"],
                ["saltPer100g", "Salz (g)"],
              ] as [keyof FoodItem, string][]).map(([field, label]) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" min={0} step={0.01}
                    value={nutrientInputs[field as NutrientKey] ?? "0"}
                    onChange={(e) => { setNutrientInputs((prev) => ({ ...prev, [field]: e.target.value })); setNutrientError(""); }}
                    className={inputCls} />
                </div>
              ))}
            </div>
            {nutrientError && <p className="text-xs text-[#ef4444] mt-1">{nutrientError}</p>}
          </div>
          <div>
            <label className={labelCls}>Hinweis (optional)</label>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              rows={2} placeholder="z.B. Nährwerte markenabhängig" className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors">
              Abbrechen
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2">
              <Check size={15} /> Speichern
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function FoodDeleteModal({ foodName, onConfirm, onCancel }: { foodName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit"
        className="w-full max-w-sm bg-[#141d2e] border border-[#1e2d42] rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#ef4444]/10 shrink-0">
            <AlertTriangle size={18} className="text-[#ef4444]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f0f4ff] mb-1">Lebensmittel löschen</p>
            <p className="text-xs text-[#8fa3c0]">
              Möchtest du <span className="text-[#f0f4ff] font-medium">{foodName}</span> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors">Abbrechen</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors">Löschen</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FoodDBContent() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [hiddenBaseIds, setHiddenBaseIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<Partial<FoodItem> | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);
  const [externalResults, setExternalResults] = useState<ExternalFoodResult[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadCustomFoods(), loadDeactivatedFoods()]).then(([custom, deactivated]) => {
      setCustomFoods(custom);
      setHiddenBaseIds(deactivated);
    });
  }, []);

  const activeCustomNames = new Set(customFoods.filter((f) => f.isActive !== false).map((f) => f.name.toLowerCase()));
  const allItems: FoodItem[] = [
    ...baseFoodItems.filter((f) => !hiddenBaseIds.includes(f.id) && !activeCustomNames.has(f.name.toLowerCase())).map((f) => ({ ...f, isActive: true })),
    ...customFoods.filter((f) => f.isActive !== false),
  ];

  const categories = ["Alle", ...FOOD_CATEGORIES];
  const filtered = allItems.filter((f) => {
    const matchCat = categoryFilter === "Alle" || f.category === categoryFilter;
    const q = search.toLowerCase();
    return matchCat && (f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || (f.servingLabel ?? "").toLowerCase().includes(q));
  });

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 3) { setExternalResults([]); setExternalError(null); setExternalLoading(false); return; }
    const timer = setTimeout(async () => {
      setExternalLoading(true);
      try {
        const res = await fetch(`/api/foods/external-search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setExternalResults(data.results ?? []);
        setExternalError(data.error ?? null);
      } catch {
        setExternalError("Externe Suche nicht verfügbar.");
        setExternalResults([]);
      } finally {
        setExternalLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleExternalImport = useCallback((result: ExternalFoodResult) => {
    const similar = findSimilarFood(result.name, allItems);
    const prefilled: Partial<FoodItem> = {
      name: result.name, category: result.category, kcalPer100g: result.kcalPer100g,
      proteinPer100g: result.proteinPer100g, carbsPer100g: result.carbsPer100g,
      fatPer100g: result.fatPer100g, fiberPer100g: result.fiberPer100g, saltPer100g: result.saltPer100g,
      servingLabel: result.servingLabel, defaultAmount: result.defaultAmount,
      notes: result.brand ? `Marke: ${result.brand}` : undefined, source: "external",
    };
    setDuplicateWarning(similar ? `Ähnlicher Eintrag existiert bereits: "${similar.name}"` : undefined);
    setEditing(prefilled);
  }, [allItems]);

  async function handleSave(data: Partial<FoodItem>) {
    const prevCustom = [...customFoods];
    const prevHidden = [...hiddenBaseIds];
    try {
      if (editing?.id) {
        const isCustomEditing = !baseFoodItems.some((b) => b.id === editing.id);
        if (isCustomEditing) {
          setCustomFoods(await updateCustomFood(editing.id, data));
        } else {
          setHiddenBaseIds(await deleteBaseFoodItem(editing.id));
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, createdAt, updatedAt, ...foodData } = { ...editing, ...data };
          setCustomFoods(await addCustomFood(foodData as Omit<FoodItem, "id" | "createdAt" | "updatedAt">));
        }
      } else {
        setCustomFoods(await addCustomFood(data as Omit<FoodItem, "id" | "createdAt" | "updatedAt">));
      }
      setEditing(null);
      setDuplicateWarning(undefined);
      showToast("Lebensmittel gespeichert.", "success");
    } catch {
      setCustomFoods(prevCustom);
      setHiddenBaseIds(prevHidden);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const prevCustom = [...customFoods];
    const prevHidden = [...hiddenBaseIds];
    const isCustomTarget = !baseFoodItems.some((b) => b.id === target.id);
    const baseMatch = isCustomTarget ? baseFoodItems.find((b) => b.name.toLowerCase() === target.name.toLowerCase()) : null;
    if (isCustomTarget) {
      setCustomFoods((prev) => prev.filter((f) => f.id !== target.id));
      if (baseMatch && !hiddenBaseIds.includes(baseMatch.id)) setHiddenBaseIds((prev) => [...prev, baseMatch.id]);
    } else {
      setHiddenBaseIds((prev) => [...prev, target.id]);
    }
    setDeleteTarget(null);
    try {
      if (isCustomTarget) {
        setCustomFoods(await deleteCustomFood(target.id));
        if (baseMatch && !hiddenBaseIds.includes(baseMatch.id)) setHiddenBaseIds(await deleteBaseFoodItem(baseMatch.id));
      } else {
        setHiddenBaseIds(await deleteBaseFoodItem(target.id));
      }
      showToast("Lebensmittel gelöscht.", "success");
    } catch {
      setCustomFoods(prevCustom);
      setHiddenBaseIds(prevHidden);
      showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
        <span className="text-xs text-[#8fa3c0]">
          <span className="text-[#f0f4ff] font-semibold">{allItems.length}</span> Einträge
        </span>
        <button onClick={() => { setDuplicateWarning(undefined); setEditing(emptyFoodForm()); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors">
          <Plus size={13} /> Neu
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Lebensmittel suchen…"
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-4 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#5a7090]" />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${categoryFilter === c ? "bg-[#3b82f6] text-white" : "bg-[#141d2e] text-[#8fa3c0] hover:text-[#f0f4ff]"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
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
            <div className="divide-y divide-[#1e2d42]">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-[#5a7090] py-8">Keine Lebensmittel gefunden.</p>
              ) : (
                filtered.map((f) => (
                  <div key={f.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#192236] transition-colors">
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm text-[#f0f4ff] truncate">{f.name}</p>
                      <p className="text-xs text-[#5a7090] truncate">
                        {f.category}{f.servingLabel && <span className="text-[#3a4d60]"> · {f.servingLabel}</span>}
                      </p>
                    </div>
                    <span className="col-span-2 text-sm text-[#f0f4ff] text-right">{f.kcalPer100g}</span>
                    <span className="col-span-1 text-sm text-[#60a5fa] text-right">{f.proteinPer100g}g</span>
                    <span className="col-span-1 text-sm text-[#8fa3c0] text-right">{f.carbsPer100g}g</span>
                    <span className="col-span-1 text-sm text-[#8fa3c0] text-right">{f.fatPer100g}g</span>
                    <span className="col-span-1 text-sm text-[#5a7090] text-right">{f.fiberPer100g}g</span>
                    <span className="col-span-1 text-sm text-[#5a7090] text-right">{f.saltPer100g ?? 0}g</span>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button onClick={() => { setDuplicateWarning(undefined); setEditing(f); }} title="Bearbeiten"
                        className="p-1.5 rounded hover:bg-[#3b82f6]/10 transition-colors group">
                        <Pencil size={13} className="text-[#5a7090] group-hover:text-[#3b82f6] transition-colors" />
                      </button>
                      <button onClick={() => setDeleteTarget(f)} title="Löschen"
                        className="p-1.5 rounded hover:bg-[#ef4444]/10 transition-colors group">
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

      <p className="text-xs text-[#5a7090] text-center">{filtered.length} von {allItems.length} Einträgen</p>

      {search.trim().length >= 3 && (
        <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e2d42] bg-[#0f1624] flex items-center gap-2">
            <Globe size={13} className="text-[#3b82f6]" />
            <span className="text-xs font-semibold text-[#8fa3c0] uppercase tracking-widest">Aus externer Datenbank</span>
            {externalLoading && <Loader2 size={12} className="text-[#5a7090] animate-spin ml-1" />}
          </div>
          {externalError && !externalLoading && <p className="text-xs text-[#f59e0b] px-4 py-3">{externalError}</p>}
          {!externalLoading && !externalError && externalResults.length === 0 && (
            <p className="text-sm text-[#5a7090] px-4 py-4 text-center">Keine externen Treffer.</p>
          )}
          <div className="divide-y divide-[#1e2d42]">
            {externalResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-[#192236] transition-colors gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <p className="text-sm text-[#f0f4ff] truncate">{r.name}</p>
                    {r.brand && <span className="text-xs text-[#5a7090] shrink-0">· {r.brand}</span>}
                  </div>
                  <p className="text-xs text-[#5a7090]">
                    {r.category} · {r.kcalPer100g} kcal · P {r.proteinPer100g}g · K {r.carbsPer100g}g · F {r.fatPer100g}g
                  </p>
                </div>
                <button onClick={() => handleExternalImport(r)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-medium hover:bg-[#3b82f6]/20 transition-colors shrink-0">
                  <Plus size={11} /> Übernehmen
                </button>
              </div>
            ))}
          </div>
          <p className="px-4 py-2 text-[10px] text-[#3a4d60] border-t border-[#1e2d42]">
            Quelle: Open Food Facts (crowd-sourced) · Werte vor dem Speichern prüfen
          </p>
        </div>
      )}

      <AnimatePresence>
        {editing !== null && (
          <FoodForm initial={editing} onSave={handleSave}
            onClose={() => { setEditing(null); setDuplicateWarning(undefined); }}
            duplicateWarning={duplicateWarning} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteTarget !== null && (
          <FoodDeleteModal foodName={deleteTarget.name}
            onConfirm={handleDeleteConfirmed} onCancel={() => setDeleteTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISE DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

const MUSCLE_GROUPS = ["Brust", "Rücken", "Beine", "Schultern", "Bizeps", "Trizeps", "Bauch", "Gluteus", "Waden", "Sonstiges"] as const;
const EQUIPMENT_OPTIONS = ["Langhantel", "Kurzhantel", "Kabelzug", "Maschine", "Körpergewicht", "Sonstiges"] as const;

function emptyExerciseForm(): Partial<ExerciseDBItem> {
  return { name: "", muscleGroup: "", equipmentType: "", laterality: "bilateral", notes: "", executionLink: "" };
}

function ExerciseForm({ initial, onSave, onClose }: {
  initial?: Partial<ExerciseDBItem>;
  onSave: (data: Partial<ExerciseDBItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ExerciseDBItem>>(initial ?? emptyExerciseForm());
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
      try { new URL(form.executionLink.trim()); } catch { errs.executionLink = "Bitte eine gültige URL eingeben (z.B. https://…)"; }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name?.trim() ?? "", muscleGroup: form.muscleGroup?.trim() ?? "",
      equipmentType: form.equipmentType?.trim() || undefined,
      laterality: form.laterality ?? "bilateral",
      notes: form.notes?.trim() || undefined,
      executionLink: form.executionLink?.trim() || undefined,
    });
  }

  return (
    <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit"
        className="w-full max-w-lg bg-[#141d2e] border border-[#1e2d42] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
          <h2 className="text-base font-semibold text-[#f0f4ff]">{initial?.id ? "Übung bearbeiten" : "Neue Übung"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e2d42] transition-colors">
            <X size={16} className="text-[#8fa3c0]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">
          <div>
            <label className={labelCls}>Übungsname *</label>
            <input type="text" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)}
              placeholder="z.B. Bankdrücken, Kniebeuge, Latzug"
              className={errors.name ? errorInputCls : inputCls} />
            {errors.name && <p className="text-xs text-[#ef4444] mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={labelCls}>Muskelgruppe *</label>
            <select value={form.muscleGroup ?? ""} onChange={(e) => set("muscleGroup", e.target.value)}
              className={errors.muscleGroup ? errorInputCls : inputCls}>
              <option value="">— auswählen —</option>
              {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            {errors.muscleGroup && <p className="text-xs text-[#ef4444] mt-1">{errors.muscleGroup}</p>}
          </div>
          <div>
            <label className={labelCls}>Equipment</label>
            <select value={form.equipmentType ?? ""} onChange={(e) => set("equipmentType", e.target.value)} className={inputCls}>
              <option value="">— auswählen —</option>
              {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Ausführung</label>
            <div className="flex gap-2">
              {(["bilateral", "unilateral"] as const).map((lat) => (
                <button key={lat} type="button" onClick={() => setForm((prev) => ({ ...prev, laterality: lat }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${(form.laterality ?? "bilateral") === lat ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]" : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/30"}`}>
                  {lat === "bilateral" ? "Bilateral (beidseitig)" : "Unilateral (einseitig)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Anmerkungen</label>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              rows={4} placeholder="z.B. Auf stabile Schulterblattposition achten. Langsame exzentrische Phase."
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Link zur Übungsausführung (optional)</label>
            <input type="text" value={form.executionLink ?? ""} onChange={(e) => set("executionLink", e.target.value)}
              placeholder="https://…  z.B. YouTube-Link oder Technikbeschreibung"
              className={errors.executionLink ? errorInputCls : inputCls} />
            {errors.executionLink && <p className="text-xs text-[#ef4444] mt-1">{errors.executionLink}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors">Abbrechen</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2">
              <Check size={15} /> Speichern
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ExerciseDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit"
        className="w-full max-w-sm bg-[#141d2e] border border-[#1e2d42] rounded-2xl overflow-hidden">
        <div className="px-5 py-5 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-[#f0f4ff]">Übung löschen</h2>
          <p className="text-sm text-[#8fa3c0] leading-relaxed">
            Möchtest du diese Übung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors">Abbrechen</button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors flex items-center justify-center gap-2">
              <Trash2 size={14} /> Löschen
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExerciseDBContent() {
  const [items, setItems] = useState<ExerciseDBItem[]>([]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [editing, setEditing] = useState<Partial<ExerciseDBItem> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { loadExerciseDB().then(setItems); }, []);

  const filtered = items.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (muscleFilter ? e.muscleGroup === muscleFilter : true);
  });

  const usedMuscleGroups = Array.from(new Set(items.map((e) => e.muscleGroup))).sort();

  async function handleSave(data: Partial<ExerciseDBItem>) {
    const prevItems = [...items];
    try {
      if (editing?.id) {
        setItems(await updateExerciseDBItem(editing.id, data));
      } else {
        setItems(await addExerciseDBItem(data as Omit<ExerciseDBItem, "id" | "createdAt" | "updatedAt">));
      }
      setEditing(null);
      showToast("Übung gespeichert.", "success");
    } catch {
      setItems(prevItems);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleDelete(id: string) {
    const prevItems = [...items];
    setItems((prev) => prev.filter((e) => e.id !== id));
    setConfirmDelete(null);
    try { await deleteExerciseDBItem(id); }
    catch { setItems(prevItems); showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error"); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
        <div className="flex gap-4 text-xs">
          <span className="text-[#8fa3c0]"><span className="text-[#f0f4ff] font-semibold">{items.length}</span> Übungen</span>
          {usedMuscleGroups.length > 0 && (
            <span className="text-[#8fa3c0]"><span className="text-[#f0f4ff] font-semibold">{usedMuscleGroups.length}</span> Muskelgruppen</span>
          )}
        </div>
        <button onClick={() => setEditing(emptyExerciseForm())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors">
          <Plus size={13} /> Neu
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Übung suchen…"
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-4 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#5a7090]" />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["Alle", ...MUSCLE_GROUPS] as string[]).map((g) => (
            <button key={g} onClick={() => setMuscleFilter(g === "Alle" ? "" : g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${(g === "Alle" ? !muscleFilter : muscleFilter === g) ? "bg-[#3b82f6] text-white" : "bg-[#141d2e] text-[#8fa3c0] hover:text-[#f0f4ff]"}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-12 px-4 py-2 text-xs text-[#5a7090] uppercase tracking-widest border-b border-[#1e2d42] bg-[#0f1624]">
              <span className="col-span-3">Übungsname</span>
              <span className="col-span-2">Muskelgruppe</span>
              <span className="col-span-2">Ausrüstung</span>
              <span className="col-span-1">Ausführung</span>
              <span className="col-span-2">Anmerkungen</span>
              <span className="col-span-1">Link</span>
              <span className="col-span-1 text-right">Aktionen</span>
            </div>
            <div className="divide-y divide-[#1e2d42]">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-[#5a7090] py-8">
                  {items.length === 0 ? 'Noch keine Übungen. Klicke auf "+ Neu" um die erste hinzuzufügen.' : "Keine Übungen gefunden."}
                </p>
              ) : (
                filtered.map((e) => (
                  <div key={e.id} className="grid grid-cols-12 px-4 py-3 items-start hover:bg-[#192236] transition-colors">
                    <div className="col-span-3 pr-3">
                      <p className="text-sm text-[#f0f4ff] font-medium leading-snug line-clamp-2">{e.name}</p>
                    </div>
                    <div className="col-span-2 pr-3">
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20">
                        {e.muscleGroup}
                      </span>
                    </div>
                    <div className="col-span-2 pr-3">
                      {e.equipmentType ? (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[#1e3a5f]/40 text-[#7cb3e0] border border-[#1e3a5f]/60">{e.equipmentType}</span>
                      ) : <span className="text-xs text-[#5a7090] italic">—</span>}
                    </div>
                    <div className="col-span-1 pr-2">
                      {(e.laterality ?? "bilateral") === "unilateral" ? (
                        <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 whitespace-nowrap">1-seitig</span>
                      ) : (
                        <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1e2d42] text-[#5a7090] whitespace-nowrap">2-seitig</span>
                      )}
                    </div>
                    <div className="col-span-2 pr-3">
                      <p className="text-sm text-[#8fa3c0] line-clamp-2 leading-snug">
                        {e.notes || <span className="text-[#5a7090] italic">—</span>}
                      </p>
                    </div>
                    <div className="col-span-1 pr-2">
                      {e.executionLink ? (
                        <a href={e.executionLink} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
                          <ExternalLink size={11} /> Öffnen
                        </a>
                      ) : <span className="text-xs text-[#5a7090] italic">—</span>}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(e)} title="Bearbeiten" className="p-1.5 rounded hover:bg-[#1e2d42] transition-colors">
                        <Pencil size={13} className="text-[#8fa3c0] hover:text-[#f0f4ff]" />
                      </button>
                      <button onClick={() => setConfirmDelete(e.id)} title="Löschen" className="p-1.5 rounded hover:bg-[#ef4444]/10 transition-colors">
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
        <p className="text-xs text-[#5a7090] text-center">{filtered.length} von {items.length} Einträgen</p>
      )}

      <AnimatePresence>
        {editing !== null && <ExerciseForm initial={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDelete !== null && (
          <ExerciseDeleteModal onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLEMENT DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

const SUPPLEMENT_CATEGORIES = ["Aminosäuren", "Adaptogene", "Fettsäuren", "Mineralstoffe", "Schlaf & Erholung", "Vitamine", "Weitere"] as const;
const TIMING_OPTIONS = ["morgens", "abends", "vor dem Training", "nach dem Training", "zu einer Mahlzeit", "täglich unabhängig vom Zeitpunkt", "Sonstiges"];

function emptySupplementForm(): Partial<SupplementDBItem> {
  return { name: "", category: "Weitere", standardDosage: "", timing: "", instructions: "", notes: "" };
}

function SupplementForm({ initial, onSave, onClose }: {
  initial?: Partial<SupplementDBItem>;
  onSave: (data: Partial<SupplementDBItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<SupplementDBItem>>(initial ?? emptySupplementForm());
  const [customTiming, setCustomTiming] = useState(
    initial?.timing && !TIMING_OPTIONS.slice(0, -1).includes(initial.timing) ? initial.timing : ""
  );
  const [showCustomTiming, setShowCustomTiming] = useState(!!(initial?.timing && !TIMING_OPTIONS.includes(initial.timing)));

  function set(field: keyof SupplementDBItem, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTimingChange(val: string) {
    if (val === "Sonstiges") { setShowCustomTiming(true); set("timing", ""); }
    else { setShowCustomTiming(false); setCustomTiming(""); set("timing", val); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const finalTiming = showCustomTiming ? customTiming.trim() : form.timing ?? "";
    onSave({ ...form, timing: finalTiming });
  }

  const selectedTiming = TIMING_OPTIONS.includes(form.timing ?? "") ? form.timing : showCustomTiming ? "Sonstiges" : "";

  return (
    <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit"
        className="w-full max-w-lg bg-[#141d2e] border border-[#1e2d42] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
          <h2 className="text-base font-semibold text-[#f0f4ff]">{initial?.id ? "Supplement bearbeiten" : "Neues Supplement"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e2d42] transition-colors">
            <X size={16} className="text-[#8fa3c0]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">
          <div>
            <label className={labelCls}>Name *</label>
            <input type="text" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)}
              placeholder="z.B. Kreatin Monohydrat, Omega-3, Vitamin D3" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Kategorie</label>
            <select value={form.category ?? "Weitere"} onChange={(e) => set("category", e.target.value)} className={inputCls}>
              {SUPPLEMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Standarddosierung</label>
            <input type="text" value={form.standardDosage ?? ""} onChange={(e) => set("standardDosage", e.target.value)}
              placeholder="z.B. 5 g täglich, 2000 I.E. täglich, 2 Kapseln pro Tag" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Einnahmezeitpunkt</label>
            <select value={selectedTiming} onChange={(e) => handleTimingChange(e.target.value)} className={inputCls}>
              <option value="">— auswählen —</option>
              {TIMING_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {showCustomTiming && (
              <input type="text" value={customTiming} onChange={(e) => setCustomTiming(e.target.value)}
                placeholder="Eigenen Einnahmezeitpunkt eingeben" className={`${inputCls} mt-2`} />
            )}
          </div>
          <div>
            <label className={labelCls}>Einnahmeanleitung</label>
            <textarea value={form.instructions ?? ""} onChange={(e) => set("instructions", e.target.value)}
              rows={3} placeholder="z.B. Mit ausreichend Wasser einnehmen." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Weitere Hinweise</label>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              rows={3} placeholder="z.B. Bei Magenproblemen Dosierung aufteilen." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Link (optional)</label>
            <input type="url" value={form.link ?? ""} onChange={(e) => set("link", e.target.value)}
              placeholder="https://…  z.B. Produktseite oder Studie" className={inputCls} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors">Abbrechen</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2">
              <Check size={15} /> Speichern
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function SupplementDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div variants={modalContent} initial="hidden" animate="visible" exit="exit"
        className="w-full max-w-sm bg-[#141d2e] border border-[#1e2d42] rounded-2xl overflow-hidden">
        <div className="px-5 py-5 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-[#f0f4ff]">Supplement löschen</h2>
          <p className="text-sm text-[#8fa3c0] leading-relaxed">
            Möchtest du dieses Supplement wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#1e2d42] transition-colors">Abbrechen</button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-colors flex items-center justify-center gap-2">
              <Trash2 size={14} /> Löschen
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SupplementDBContent() {
  const [items, setItems] = useState<SupplementDBItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [editing, setEditing] = useState<Partial<SupplementDBItem> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { loadSupplementDB().then(setItems); }, []);

  const filtered = items.filter((s) => {
    const matchCat = categoryFilter === "Alle" || (s.category ?? "Weitere") === categoryFilter;
    const q = search.toLowerCase();
    return matchCat && (s.name.toLowerCase().includes(q) || s.timing.toLowerCase().includes(q) || s.standardDosage.toLowerCase().includes(q));
  });

  async function handleSave(data: Partial<SupplementDBItem>) {
    const prevItems = [...items];
    try {
      if (editing?.id) {
        setItems(await updateSupplementDBItem(editing.id, data));
      } else {
        setItems(await addSupplementDBItem(data as Omit<SupplementDBItem, "id" | "createdAt" | "updatedAt">));
      }
      setEditing(null);
      showToast("Supplement gespeichert.", "success");
    } catch {
      setItems(prevItems);
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  async function handleDelete(id: string) {
    const prevItems = [...items];
    setItems((prev) => prev.filter((s) => s.id !== id));
    setConfirmDelete(null);
    try { await deleteSupplementDBItem(id); }
    catch { setItems(prevItems); showToast("Fehler beim Löschen. Bitte erneut versuchen.", "error"); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42]">
        <span className="text-xs text-[#8fa3c0]"><span className="text-[#f0f4ff] font-semibold">{items.length}</span> Supplements</span>
        <button onClick={() => setEditing(emptySupplementForm())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors">
          <Plus size={13} /> Neu
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Supplement suchen…"
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-4 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#5a7090]" />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["Alle", ...SUPPLEMENT_CATEGORIES] as string[]).map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${categoryFilter === c ? "bg-[#3b82f6] text-white" : "bg-[#141d2e] text-[#8fa3c0] hover:text-[#f0f4ff]"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[580px]">
            <div className="grid grid-cols-12 px-4 py-2 text-xs text-[#5a7090] uppercase tracking-widest border-b border-[#1e2d42] bg-[#0f1624]">
              <span className="col-span-2">Name</span>
              <span className="col-span-2">Dosierung</span>
              <span className="col-span-2">Zeitpunkt</span>
              <span className="col-span-3">Einnahmeanleitung</span>
              <span className="col-span-2">Hinweise</span>
              <span className="col-span-1 text-right">Aktionen</span>
            </div>
            <div className="divide-y divide-[#1e2d42]">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-[#5a7090] py-8">
                  {items.length === 0
                    ? "Noch keine Supplements. Klicke auf „Neu“ um das erste hinzuzufügen."
                    : "Keine Supplements gefunden."}
                </p>
              ) : (
                filtered.map((s) => (
                  <div key={s.id} className="grid grid-cols-12 px-4 py-3 items-start hover:bg-[#192236] transition-colors">
                    <div className="col-span-2 pr-3">
                      <div className="flex items-start gap-1.5">
                        <p className="text-sm text-[#f0f4ff] font-medium leading-snug line-clamp-2">{s.name}</p>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noopener noreferrer" title={s.link}
                            onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-[#1e2d42] transition-colors">
                            <ExternalLink size={12} className="text-[#3b82f6]" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[#3a5070] mt-0.5">{s.category ?? "Weitere"}</p>
                    </div>
                    <div className="col-span-2 pr-3"><p className="text-sm text-[#8fa3c0] line-clamp-2">{s.standardDosage || "—"}</p></div>
                    <div className="col-span-2 pr-3"><p className="text-sm text-[#60a5fa] line-clamp-2">{s.timing || "—"}</p></div>
                    <div className="col-span-3 pr-3"><p className="text-sm text-[#8fa3c0] line-clamp-2 leading-snug">{s.instructions || "—"}</p></div>
                    <div className="col-span-2 pr-3"><p className="text-sm text-[#5a7090] line-clamp-2 leading-snug">{s.notes || "—"}</p></div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(s)} title="Bearbeiten" className="p-1.5 rounded hover:bg-[#1e2d42] transition-colors">
                        <Pencil size={13} className="text-[#8fa3c0] hover:text-[#f0f4ff]" />
                      </button>
                      <button onClick={() => setConfirmDelete(s.id)} title="Löschen" className="p-1.5 rounded hover:bg-[#ef4444]/10 transition-colors">
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
        <p className="text-xs text-[#5a7090] text-center">{filtered.length} von {items.length} Einträgen</p>
      )}

      <AnimatePresence>
        {editing !== null && <SupplementForm initial={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDelete !== null && (
          <SupplementDeleteModal onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE TABS (main export)
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = "food" | "exercises" | "supplements";

const TABS: { id: Tab; label: string }[] = [
  { id: "food", label: "Food-DB" },
  { id: "exercises", label: "Übungen-DB" },
  { id: "supplements", label: "Supplement-DB" },
];

export function DatabaseTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("food");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 p-1 rounded-xl bg-[#0f1624] border border-[#1e2d42] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20"
                : "text-[#8fa3c0] hover:text-[#f0f4ff]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "food" && <FoodDBContent />}
      {activeTab === "exercises" && <ExerciseDBContent />}
      {activeTab === "supplements" && <SupplementDBContent />}
    </div>
  );
}
