"use client";
import { useState, useEffect } from "react";
import { MealPlan, Meal, MealEntry, FoodItem } from "@/types";
import { getAllFoodItems } from "@/lib/store";
import { Trash2, Plus, ChevronDown, ChevronUp, Pencil, ArrowLeft } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { calculateMealMacros, calculateDayMacros, roundMacro, roundSalt } from "@/lib/utils";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function emptyMeal(): Meal {
  return {
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "Mahlzeit",
    time: "",
    entries: [],
  };
}

function customFoodItem(name: string, kcal: number, protein: number, carbs: number, fat: number): FoodItem {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    category: "Sonstiges",
    kcalPer100g: kcal,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    fiberPer100g: 0,
    saltPer100g: 0,
  };
}

// ─── AddFoodRow ───────────────────────────────────────────────────────────────

function AddFoodRow({ onAdd }: { onAdd: (entry: MealEntry) => void }) {
  const [mode, setMode] = useState<"db" | "custom">("db");
  const [dbFoodItems, setDbFoodItems] = useState<FoodItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  useEffect(() => {
    getAllFoodItems().then((foods) => {
      setDbFoodItems(foods);
      setSelectedId((prev) => prev || foods[0]?.id || "");
    });
  }, []);
  const [amountInput, setAmountInput] = useState("100");
  const [amountError, setAmountError] = useState("");
  const [customName, setCustomName] = useState("");
  const [customKcalInput, setCustomKcalInput] = useState("0");
  const [customProteinInput, setCustomProteinInput] = useState("0");
  const [customCarbsInput, setCustomCarbsInput] = useState("0");
  const [customFatInput, setCustomFatInput] = useState("0");
  const [customNutrientError, setCustomNutrientError] = useState("");
  const [open, setOpen] = useState(false);

  function handleAdd() {
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Bitte Menge größer als 0 eingeben.");
      return;
    }
    if (mode === "db") {
      const fi = dbFoodItems.find((f) => f.id === selectedId);
      if (!fi) return;
      onAdd({ foodItemId: fi.id, foodItem: fi, amountG: parsedAmount });
    } else {
      if (!customName.trim()) return;
      const nutInputs = [customKcalInput, customProteinInput, customCarbsInput, customFatInput];
      for (const v of nutInputs) {
        const n = v === "" ? 0 : parseFloat(v);
        if (isNaN(n) || n < 0) {
          setCustomNutrientError("Bitte gültigen Wert eingeben.");
          return;
        }
      }
      const parseN = (v: string) => v === "" ? 0 : (parseFloat(v) || 0);
      const fi = customFoodItem(customName.trim(), parseN(customKcalInput), parseN(customProteinInput), parseN(customCarbsInput), parseN(customFatInput));
      onAdd({ foodItemId: fi.id, foodItem: fi, amountG: parsedAmount });
      setCustomName(""); setCustomKcalInput("0"); setCustomProteinInput("0"); setCustomCarbsInput("0"); setCustomFatInput("0"); setCustomNutrientError("");
    }
    setOpen(false);
    setAmountInput("100");
    setAmountError("");
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors py-1">
        <Plus size={13} /> Lebensmittel hinzufügen
      </button>
    );
  }

  return (
    <div className="bg-[#192236] rounded-xl p-3 flex flex-col gap-3 border border-[#1e2d42]">
      <div className="flex gap-2">
        {(["db", "custom"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mode === m ? "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30"
                : "bg-[#141d2e] text-[#5a7090] border border-[#1e2d42]"}`}>
            {m === "db" ? "Aus Datenbank" : "Manuell"}
          </button>
        ))}
      </div>

      {mode === "db" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a7090]">Lebensmittel</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]">
              {dbFoodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a7090]">Menge (g)</label>
            <input type="number" min={0} value={amountInput} onChange={(e) => { setAmountInput(e.target.value); setAmountError(""); }}
              className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]" />
            {amountError && <p className="text-[10px] text-[#ef4444] mt-0.5">{amountError}</p>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Name</label>
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="z.B. Haferflocken"
                className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Menge (g)</label>
              <input type="number" min={0} value={amountInput} onChange={(e) => { setAmountInput(e.target.value); setAmountError(""); }}
                className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]" />
              {amountError && <p className="text-[10px] text-[#ef4444] mt-0.5">{amountError}</p>}
            </div>
          </div>
          <p className="text-xs text-[#5a7090]">Makros pro 100g (optional)</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "kcal", val: customKcalInput, set: setCustomKcalInput },
              { label: "P (g)", val: customProteinInput, set: setCustomProteinInput },
              { label: "K (g)", val: customCarbsInput, set: setCustomCarbsInput },
              { label: "F (g)", val: customFatInput, set: setCustomFatInput },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <label className="text-xs text-[#5a7090]">{f.label}</label>
                <input type="number" min={0} value={f.val} onChange={(e) => { f.set(e.target.value); setCustomNutrientError(""); }}
                  className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]" />
              </div>
            ))}
          </div>
          {customNutrientError && <p className="text-[10px] text-[#ef4444]">{customNutrientError}</p>}
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={handleAdd}
          className="flex-1 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors">
          Hinzufügen
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg border border-[#1e2d42] text-[#8fa3c0] text-xs hover:border-[#3b82f6]/30 transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ─── SinglePlanEditor ─────────────────────────────────────────────────────────

interface SinglePlanEditorProps {
  plan: MealPlan;
  onSave: (plan: MealPlan) => void;
  onCancel: () => void;
  athleteWeight?: number;
}

function SinglePlanEditor({ plan, onSave, onCancel, athleteWeight }: SinglePlanEditorProps) {
  const [title, setTitle] = useState(plan.title);
  const [coachNote, setCoachNote] = useState(plan.coachNote ?? "");
  const [meals, setMeals] = useState<Meal[]>(plan.meals);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(plan.meals.map((m) => m.id)));
  const [entryAmountInputs, setEntryAmountInputs] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    plan.meals.forEach((meal) => {
      meal.entries.forEach((entry) => {
        m[`${meal.id}:${entry.foodItemId}`] = String(entry.amountG);
      });
    });
    return m;
  });
  const [amountErrors, setAmountErrors] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState("");

  function getAmountKey(mealId: string, foodItemId: string) {
    return `${mealId}:${foodItemId}`;
  }

  function toggleMeal(id: string) {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addMeal() {
    const m = emptyMeal();
    setMeals((prev) => [...prev, m]);
    setExpandedMeals((prev) => new Set([...prev, m.id]));
  }

  function deleteMeal(id: string) {
    const meal = meals.find((m) => m.id === id);
    if (meal) {
      setEntryAmountInputs((prev) => {
        const next = { ...prev };
        meal.entries.forEach((e) => { delete next[getAmountKey(id, e.foodItemId)]; });
        return next;
      });
      setAmountErrors((prev) => {
        const next = { ...prev };
        meal.entries.forEach((e) => { delete next[getAmountKey(id, e.foodItemId)]; });
        return next;
      });
    }
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMealField(id: string, field: keyof Meal, value: string) {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  function addEntry(mealId: string, entry: MealEntry) {
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, entries: [...m.entries, entry] } : m)));
    setEntryAmountInputs((prev) => ({ ...prev, [getAmountKey(mealId, entry.foodItemId)]: String(entry.amountG) }));
  }

  function updateEntryAmount(mealId: string, foodItemId: string, amount: number) {
    setMeals((prev) => prev.map((m) =>
      m.id === mealId
        ? { ...m, entries: m.entries.map((e) => e.foodItemId === foodItemId ? { ...e, amountG: amount } : e) }
        : m
    ));
  }

  function handleAmountChange(mealId: string, foodItemId: string, value: string) {
    const key = getAmountKey(mealId, foodItemId);
    setEntryAmountInputs((prev) => ({ ...prev, [key]: value }));
    setSaveError("");
    const n = parseFloat(value);
    if (!isNaN(n) && n > 0) {
      setAmountErrors((prev) => ({ ...prev, [key]: false }));
      updateEntryAmount(mealId, foodItemId, n);
    } else {
      setAmountErrors((prev) => ({ ...prev, [key]: value !== "" }));
    }
  }

  function deleteEntry(mealId: string, foodItemId: string) {
    setMeals((prev) => prev.map((m) =>
      m.id === mealId ? { ...m, entries: m.entries.filter((e) => e.foodItemId !== foodItemId) } : m
    ));
    const key = getAmountKey(mealId, foodItemId);
    setEntryAmountInputs((prev) => { const next = { ...prev }; delete next[key]; return next; });
    setAmountErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function handleSave() {
    const newErrors: Record<string, boolean> = {};
    let hasError = false;
    for (const meal of meals) {
      for (const entry of meal.entries) {
        const key = getAmountKey(meal.id, entry.foodItemId);
        const inputStr = entryAmountInputs[key] ?? String(entry.amountG);
        const n = parseFloat(inputStr);
        if (isNaN(n) || n <= 0) {
          newErrors[key] = true;
          hasError = true;
        }
      }
    }
    if (hasError) {
      setAmountErrors(newErrors);
      setSaveError("Bitte Menge größer als 0 eingeben.");
      return;
    }
    setSaveError("");
    onSave({ ...plan, title, coachNote, meals });
  }

  const dayMacros = calculateDayMacros(meals);

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button type="button" onClick={onCancel}
        className="flex items-center gap-1.5 text-xs text-[#8fa3c0] hover:text-[#60a5fa] transition-colors self-start">
        <ArrowLeft size={13} /> Zurück zur Planübersicht
      </button>

      {/* Plan meta */}
      <div className="grid grid-cols-1 gap-3 p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8fa3c0]">Plan-Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8fa3c0]">Coach-Notiz</label>
          <textarea value={coachNote} onChange={(e) => setCoachNote(e.target.value)} rows={2}
            placeholder="Hinweise zum Ernährungsplan..."
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none" />
        </div>
      </div>

      {/* Day totals */}
      {meals.length > 0 && (
        <div className="p-3 rounded-xl bg-[#3b82f6]/5 border border-[#3b82f6]/20 flex gap-4 text-xs flex-wrap">
          <span className="text-[#f0f4ff] font-semibold">{Math.round(dayMacros.kcal)} kcal</span>
          <span className="text-[#60a5fa]">P {Math.round(dayMacros.protein)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.protein / athleteWeight).toFixed(1)} g/kg)</span> : null}</span>
          <span className="text-[#8fa3c0]">K {Math.round(dayMacros.carbs)}g</span>
          <span className="text-[#8fa3c0]">F {Math.round(dayMacros.fat)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.fat / athleteWeight).toFixed(1)} g/kg)</span> : null}</span>
          <span className="text-[#34d399]">Bal {roundMacro(dayMacros.fiber)}g</span>
          <span className="text-[#f59e0b]">Salz {roundSalt(dayMacros.salt)}g</span>
        </div>
      )}

      {/* Meals */}
      {meals.map((meal) => {
        const mealMacros = calculateMealMacros(meal.entries);
        const expanded = expandedMeals.has(meal.id);
        return (
          <div key={meal.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2d42] flex items-center gap-2">
              <button type="button" onClick={() => toggleMeal(meal.id)} className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expanded ? <ChevronUp size={14} className="text-[#5a7090]" /> : <ChevronDown size={14} className="text-[#5a7090]" />}
                  <input value={meal.name} onChange={(e) => { e.stopPropagation(); updateMealField(meal.id, "name", e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-sm font-semibold text-[#f0f4ff] focus:outline-none border-b border-transparent focus:border-[#3b82f6] transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <input value={meal.time ?? ""} onChange={(e) => { e.stopPropagation(); updateMealField(meal.id, "time", e.target.value); }}
                    onClick={(e) => e.stopPropagation()} placeholder="Uhrzeit"
                    className="bg-transparent text-xs text-[#5a7090] w-16 focus:outline-none text-right border-b border-transparent focus:border-[#3b82f6] transition-colors" />
                  {meals.length > 0 && (
                    <span className="text-xs text-[#8fa3c0] bg-[#1e2d42] px-2 py-0.5 rounded-md">
                      {Math.round(mealMacros.kcal)} kcal
                    </span>
                  )}
                </div>
              </button>
              <Tooltip label="Mahlzeit löschen">
                <button type="button" onClick={() => deleteMeal(meal.id)} aria-label="Mahlzeit löschen"
                  className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors">
                  <Trash2 size={14} className="text-[#ef4444]/60 hover:text-[#ef4444]" />
                </button>
              </Tooltip>
            </div>

            {expanded && (
              <div className="p-4 flex flex-col gap-2">
                {meal.entries.map((entry) => {
                  const amtKey = getAmountKey(meal.id, entry.foodItemId);
                  const amountStr = entryAmountInputs[amtKey] ?? String(entry.amountG);
                  const hasAmountError = amountErrors[amtKey] === true;
                  const r = entry.amountG / 100;
                  const em = {
                    kcal: entry.foodItem.kcalPer100g * r,
                    protein: entry.foodItem.proteinPer100g * r,
                    carbs: entry.foodItem.carbsPer100g * r,
                    fat: entry.foodItem.fatPer100g * r,
                    fiber: entry.foodItem.fiberPer100g * r,
                    salt: (entry.foodItem.saltPer100g ?? 0) * r,
                  };
                  return (
                    <div key={entry.foodItemId} className="flex items-center gap-2 py-1.5 border-b border-[#1e2d42]/60 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#f0f4ff] truncate">{entry.foodItem.name}</p>
                        <p className="text-xs text-[#5a7090]">
                          {Math.round(em.kcal)} kcal · <span className="text-[#60a5fa]">P {Math.round(em.protein)}g</span> · K {Math.round(em.carbs)}g · F {Math.round(em.fat)}g · Bal {roundMacro(em.fiber)}g · Salz {roundSalt(em.salt)}g
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col items-end">
                          <input type="number" min={0} value={amountStr}
                            onChange={(e) => handleAmountChange(meal.id, entry.foodItemId, e.target.value)}
                            className={`bg-[#0f1624] border rounded-lg px-2 py-1 text-[#f0f4ff] text-xs w-16 focus:outline-none text-right transition-colors ${hasAmountError ? "border-[#ef4444] focus:border-[#ef4444]" : "border-[#1e2d42] focus:border-[#3b82f6]"}`} />
                          {hasAmountError && <span className="text-[10px] text-[#ef4444]">{">"} 0</span>}
                        </div>
                        <span className="text-xs text-[#5a7090]">g</span>
                        <Tooltip label="Eintrag entfernen">
                          <button type="button" onClick={() => deleteEntry(meal.id, entry.foodItemId)} aria-label="Eintrag entfernen"
                            className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors">
                            <Trash2 size={12} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}

                <AddFoodRow onAdd={(entry) => addEntry(meal.id, entry)} />

                <input value={meal.note ?? ""} onChange={(e) => updateMealField(meal.id, "note", e.target.value)}
                  placeholder="Notiz zur Mahlzeit (optional)"
                  className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors mt-1" />
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={addMeal}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#1e2d42] text-[#5a7090] text-sm hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors">
        <Plus size={15} /> Mahlzeit hinzufügen
      </button>

      {saveError && (
        <p className="text-xs text-[#ef4444] text-center -mt-2">{saveError}</p>
      )}
      <button type="button" onClick={handleSave}
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors">
        Plan speichern
      </button>
    </div>
  );
}

// ─── MealPlanEditor (multi-plan manager) ──────────────────────────────────────

interface Props {
  plans: MealPlan[];
  athleteId: string;
  onSavePlan: (plan: MealPlan) => void;
  onDeletePlan: (planId: string) => void;
  athleteWeight?: number;
}

export function MealPlanEditor({ plans, athleteId, onSavePlan, onDeletePlan, athleteWeight }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlanDraft, setNewPlanDraft] = useState<MealPlan | null>(null);

  const isCreatingNew = editingId === "new";
  const planToEdit = isCreatingNew
    ? newPlanDraft
    : plans.find((p) => p.id === editingId) ?? null;

  function startNewPlan() {
    const draft: MealPlan = {
      id: `mp-${athleteId}-${Date.now()}`,
      athleteId,
      title: "Neuer Plan",
      meals: [],
      coachNote: "",
      createdAt: new Date().toISOString(),
    };
    setNewPlanDraft(draft);
    setEditingId("new");
  }

  function handleSave(plan: MealPlan) {
    onSavePlan(plan);
    setEditingId(null);
    setNewPlanDraft(null);
  }

  function handleCancel() {
    setEditingId(null);
    setNewPlanDraft(null);
  }

  // Single plan editor
  if (editingId !== null && planToEdit) {
    return (
      <SinglePlanEditor
        plan={planToEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        athleteWeight={athleteWeight}
      />
    );
  }

  // Plan list
  return (
    <div className="flex flex-col gap-3">
      {plans.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[#5a7090]">Noch keine Pläne vorhanden.</p>
        </div>
      )}

      {plans.map((plan) => {
        const dayMacros = calculateDayMacros(plan.meals);
        return (
          <div key={plan.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#f0f4ff] truncate">{plan.title}</p>
              {plan.meals.length > 0 ? (
                <p className="text-xs text-[#5a7090] mt-0.5">
                  {Math.round(dayMacros.kcal)} kcal · P {Math.round(dayMacros.protein)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.protein / athleteWeight).toFixed(1)} g/kg)</span> : null}{" · "}K {Math.round(dayMacros.carbs)}g · F {Math.round(dayMacros.fat)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.fat / athleteWeight).toFixed(1)} g/kg)</span> : null}
                  <span className="ml-1.5">· {plan.meals.length} Mahlzeit{plan.meals.length !== 1 ? "en" : ""}</span>
                </p>
              ) : (
                <p className="text-xs text-[#3b4d6a] mt-0.5">Keine Mahlzeiten</p>
              )}
              {plan.coachNote && (
                <p className="text-xs text-[#5a7090] mt-1 italic line-clamp-1">{plan.coachNote}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button type="button" onClick={() => setEditingId(plan.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1e2d42] text-[#8fa3c0] text-xs hover:text-[#60a5fa] hover:bg-[#3b82f6]/10 transition-colors">
                <Pencil size={11} /> Bearbeiten
              </button>
              <Tooltip label="Plan löschen">
                <button type="button" onClick={() => onDeletePlan(plan.id)} aria-label="Plan löschen"
                  className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 transition-colors">
                  <Trash2 size={13} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                </button>
              </Tooltip>
            </div>
          </div>
        );
      })}

      <button type="button" onClick={startNewPlan}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#1e2d42] text-[#5a7090] text-sm hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors">
        <Plus size={15} /> Neuen Plan hinzufügen
      </button>
    </div>
  );
}
