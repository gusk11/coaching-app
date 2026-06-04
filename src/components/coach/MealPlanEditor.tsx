"use client";
import { useState, useEffect } from "react";
import { MealPlan, MealPlanType, MacroTargets, Meal, MealEntry, FoodItem } from "@/types";
import { getAllFoodItems } from "@/lib/store";
import { copyMeal, getMealClipboard } from "@/lib/planClipboard";
import { Trash2, Plus, ChevronDown, ChevronUp, Pencil, ArrowLeft, ArrowUp, ArrowDown, Search, X, Copy, ClipboardPaste } from "lucide-react";
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

function customFoodItem(name: string, kcal: number, protein: number, carbs: number, fat: number, fiber: number, salt: number): FoodItem {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    category: "Sonstiges",
    kcalPer100g: kcal,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    fiberPer100g: fiber,
    saltPer100g: salt,
  };
}

// ─── Serving helpers ──────────────────────────────────────────────────────────

function isStückFood(food: FoodItem): boolean {
  return food.servingLabel?.includes("Stück") ?? false;
}

function defaultDisplayAmount(food: FoodItem): string {
  return String(food.defaultAmount ?? 100);
}

// ─── AddFoodRow ───────────────────────────────────────────────────────────────

function AddFoodRow({ onAdd }: { onAdd: (entry: MealEntry) => void }) {
  const [mode, setMode] = useState<"db" | "custom">("db");
  const [dbFoodItems, setDbFoodItems] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [foodSearch, setFoodSearch] = useState("");
  useEffect(() => {
    getAllFoodItems().then(setDbFoodItems);
  }, []);
  const [amountInput, setAmountInput] = useState("100");
  const [amountError, setAmountError] = useState("");
  const [customName, setCustomName] = useState("");
  const [customKcalInput, setCustomKcalInput] = useState("0");
  const [customProteinInput, setCustomProteinInput] = useState("0");
  const [customCarbsInput, setCustomCarbsInput] = useState("0");
  const [customFatInput, setCustomFatInput] = useState("0");
  const [customFiberInput, setCustomFiberInput] = useState("0");
  const [customSaltInput, setCustomSaltInput] = useState("0");
  const [customNutrientError, setCustomNutrientError] = useState("");
  const [open, setOpen] = useState(false);

  const filteredFoods = dbFoodItems.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(foodSearch.toLowerCase())
  );

  function handleAdd() {
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError("Bitte Menge größer als 0 eingeben.");
      return;
    }
    if (mode === "db") {
      if (!selectedFood) return;
      onAdd({ foodItemId: selectedFood.id, foodItem: selectedFood, amountG: parsedAmount });
      setSelectedFood(null);
      setFoodSearch("");
    } else {
      if (!customName.trim()) return;
      const nutInputs = [customKcalInput, customProteinInput, customCarbsInput, customFatInput, customFiberInput, customSaltInput];
      for (const v of nutInputs) {
        const n = v === "" ? 0 : parseFloat(v);
        if (isNaN(n) || n < 0) {
          setCustomNutrientError("Bitte gültigen Wert eingeben.");
          return;
        }
      }
      const parseN = (v: string) => v === "" ? 0 : (parseFloat(v) || 0);
      const fi = customFoodItem(customName.trim(), parseN(customKcalInput), parseN(customProteinInput), parseN(customCarbsInput), parseN(customFatInput), parseN(customFiberInput), parseN(customSaltInput));
      onAdd({ foodItemId: fi.id, foodItem: fi, amountG: parsedAmount });
      setCustomName(""); setCustomKcalInput("0"); setCustomProteinInput("0"); setCustomCarbsInput("0"); setCustomFatInput("0"); setCustomFiberInput("0"); setCustomSaltInput("0"); setCustomNutrientError("");
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a7090]">Lebensmittel</label>
            {selectedFood ? (
              <div className="flex items-center gap-2 bg-[#141d2e] border border-[#3b82f6]/40 rounded-lg px-2.5 py-1.5">
                <span className="text-xs text-[#f0f4ff] flex-1 truncate">{selectedFood.name}</span>
                <span className="text-[10px] text-[#5a7090] shrink-0">{selectedFood.category}</span>
                <button type="button" onClick={() => { setSelectedFood(null); setFoodSearch(""); }}
                  className="shrink-0 text-[#5a7090] hover:text-[#f0f4ff] transition-colors">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a7090] pointer-events-none" />
                  <input
                    autoFocus
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    placeholder="Lebensmittel suchen…"
                    className="bg-[#141d2e] border border-[#1e2d42] rounded-lg pl-7 pr-3 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] w-full"
                  />
                </div>
                {dbFoodItems.length === 0 ? (
                  <p className="text-xs text-[#5a7090] px-1 py-2">Noch keine Lebensmittel in der DB vorhanden.</p>
                ) : (
                  <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto rounded-lg border border-[#1e2d42] bg-[#0f1624]">
                    {filteredFoods.length === 0 ? (
                      <p className="text-xs text-[#5a7090] px-2.5 py-3">Keine Lebensmittel gefunden</p>
                    ) : (
                      filteredFoods.map((f) => (
                        <button key={f.id} type="button"
                          onClick={() => { setSelectedFood(f); setAmountInput(defaultDisplayAmount(f)); setAmountError(""); }}
                          className="text-left px-2.5 py-2 hover:bg-[#1e2d42] transition-colors">
                          <span className="text-xs font-medium text-[#f0f4ff] block">{f.name}</span>
                          <span className="text-[10px] text-[#5a7090]">{f.category}{f.servingLabel ? ` · ${f.servingLabel}` : ""}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a7090]">
              Menge{selectedFood?.servingLabel ? ` (${selectedFood.servingLabel})` : " (g)"}
            </label>
            <input type="number" min={0} step={selectedFood && isStückFood(selectedFood) ? 1 : 10} value={amountInput} onChange={(e) => { setAmountInput(e.target.value); setAmountError(""); }}
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
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "kcal", val: customKcalInput, set: setCustomKcalInput },
              { label: "P (g)", val: customProteinInput, set: setCustomProteinInput },
              { label: "K (g)", val: customCarbsInput, set: setCustomCarbsInput },
              { label: "F (g)", val: customFatInput, set: setCustomFatInput },
              { label: "Bal (g)", val: customFiberInput, set: setCustomFiberInput },
              { label: "Salz (g)", val: customSaltInput, set: setCustomSaltInput },
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
  const [planType, setPlanType] = useState<MealPlanType>(plan.planType ?? "fixed");
  const [macroInputs, setMacroInputs] = useState<Record<keyof MacroTargets, string>>(() => {
    const t = plan.macroTargets;
    const fmt = (v: number | undefined) => (v ? String(v) : "");
    return { kcal: fmt(t?.kcal), protein: fmt(t?.protein), carbs: fmt(t?.carbs), fat: fmt(t?.fat), fiber: fmt(t?.fiber) };
  });
  const [meals, setMeals] = useState<Meal[]>(plan.meals);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(plan.meals.map((m) => m.id)));
  const [clipboardMeal, setClipboardMeal] = useState<Meal | null>(null);
  useEffect(() => { setClipboardMeal(getMealClipboard()); }, []);
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

  function updateMacroTarget(field: keyof MacroTargets, value: string) {
    setMacroInputs((prev) => ({ ...prev, [field]: value }));
  }

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

  function handleCopyMeal(meal: Meal) {
    copyMeal(meal);
    setClipboardMeal(meal);
  }

  function handlePasteMeal() {
    if (!clipboardMeal) return;
    const m: Meal = {
      ...clipboardMeal,
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      entries: clipboardMeal.entries.map((e) => ({ ...e })),
    };
    setMeals((prev) => [...prev, m]);
    setExpandedMeals((prev) => new Set([...prev, m.id]));
    setEntryAmountInputs((prev) => {
      const next = { ...prev };
      m.entries.forEach((e) => { next[getAmountKey(m.id, e.foodItemId)] = String(e.amountG); });
      return next;
    });
  }

  function moveMeal(id: string, dir: -1 | 1) {
    setMeals((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
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
    const parsedMacros: MacroTargets = {
      kcal: parseFloat(macroInputs.kcal) || 0,
      protein: parseFloat(macroInputs.protein) || 0,
      carbs: parseFloat(macroInputs.carbs) || 0,
      fat: parseFloat(macroInputs.fat) || 0,
      fiber: parseFloat(macroInputs.fiber) || 0,
    };
    onSave({
      ...plan,
      title,
      coachNote,
      planType,
      macroTargets: planType === "macro_targets" ? parsedMacros : undefined,
      meals,
    });
  }

  const dayMacros = calculateDayMacros(meals);
  const parsedTargets = {
    kcal: parseFloat(macroInputs.kcal) || 0,
    protein: parseFloat(macroInputs.protein) || 0,
    carbs: parseFloat(macroInputs.carbs) || 0,
    fat: parseFloat(macroInputs.fat) || 0,
    fiber: parseFloat(macroInputs.fiber) || 0,
  };
  const remaining = {
    kcal: parsedTargets.kcal - dayMacros.kcal,
    protein: parsedTargets.protein - dayMacros.protein,
    carbs: parsedTargets.carbs - dayMacros.carbs,
    fat: parsedTargets.fat - dayMacros.fat,
    fiber: parsedTargets.fiber - dayMacros.fiber,
  };

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

        {/* Plan type selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8fa3c0]">Plan-Typ</label>
          <div className="flex gap-2">
            {(["fixed", "macro_targets"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setPlanType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  planType === t
                    ? "bg-[#3b82f6]/20 text-[#60a5fa] border-[#3b82f6]/40"
                    : "bg-[#0f1624] text-[#5a7090] border-[#1e2d42] hover:border-[#3b82f6]/20"
                }`}>
                {t === "fixed" ? "Fester Plan" : "Makrovorgaben"}
              </button>
            ))}
          </div>
        </div>

        {/* Macro targets (only shown when planType === "macro_targets") */}
        {planType === "macro_targets" && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#0f1624] border border-[#3b82f6]/20">
            <p className="text-xs font-medium text-[#8fa3c0]">Tagesziele</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: "Kalorien (kcal)", field: "kcal" as const },
                { label: "Protein (g)", field: "protein" as const },
                { label: "Kohlenhydrate (g)", field: "carbs" as const },
                { label: "Fett (g)", field: "fat" as const },
                { label: "Ballaststoffe (g)", field: "fiber" as const },
              ] as const).map(({ label, field }) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5a7090]">{label}</label>
                  <input
                    type="number" min={0}
                    value={macroInputs[field]}
                    onChange={(e) => updateMacroTarget(field, e.target.value)}
                    className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8fa3c0]">Coach-Notiz</label>
          <textarea value={coachNote} onChange={(e) => setCoachNote(e.target.value)} rows={2}
            placeholder="Hinweise zum Ernährungsplan..."
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none" />
        </div>
      </div>

      {/* Day totals / macro diff */}
      {planType === "macro_targets" ? (
        <div className="p-3 rounded-xl bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 flex flex-col gap-2 text-xs">
          <p className="text-[10px] text-[#a78bfa] uppercase tracking-wide">Makro-Überblick</p>
          <div className="flex gap-3 flex-wrap items-baseline">
            <span className="text-[10px] text-[#a78bfa] w-20 shrink-0">Tagesziel</span>
            <span className="text-[#f0f4ff] font-semibold">{Math.round(parsedTargets.kcal)} kcal</span>
            <span className="text-[#60a5fa]">P {Math.round(parsedTargets.protein)}g</span>
            <span className="text-[#8fa3c0]">K {Math.round(parsedTargets.carbs)}g</span>
            <span className="text-[#8fa3c0]">F {Math.round(parsedTargets.fat)}g</span>
            <span className="text-[#34d399]">Bal {roundMacro(parsedTargets.fiber)}g</span>
          </div>
          {meals.length > 0 && (
            <>
              <div className="flex gap-3 flex-wrap items-baseline">
                <span className="text-[10px] text-[#5a7090] w-20 shrink-0">Feste LM</span>
                <span className="text-[#f0f4ff]">{Math.round(dayMacros.kcal)} kcal</span>
                <span className="text-[#60a5fa]">P {Math.round(dayMacros.protein)}g</span>
                <span className="text-[#8fa3c0]">K {Math.round(dayMacros.carbs)}g</span>
                <span className="text-[#8fa3c0]">F {Math.round(dayMacros.fat)}g</span>
                <span className="text-[#34d399]">Bal {roundMacro(dayMacros.fiber)}g</span>
              </div>
              <div className="border-t border-[#8b5cf6]/20" />
              <div className="flex gap-3 flex-wrap items-baseline">
                <span className="text-[10px] text-[#5a7090] w-20 shrink-0">Verbleibend</span>
                <span className={`font-semibold ${remaining.kcal < 0 ? "text-[#ef4444]" : "text-[#34d399]"}`}>{Math.round(remaining.kcal)} kcal</span>
                <span className={remaining.protein < 0 ? "text-[#ef4444]" : "text-[#60a5fa]"}>P {Math.round(remaining.protein)}g</span>
                <span className={remaining.carbs < 0 ? "text-[#ef4444]" : "text-[#8fa3c0]"}>K {Math.round(remaining.carbs)}g</span>
                <span className={remaining.fat < 0 ? "text-[#ef4444]" : "text-[#8fa3c0]"}>F {Math.round(remaining.fat)}g</span>
                <span className={remaining.fiber < 0 ? "text-[#ef4444]" : "text-[#34d399]"}>Bal {roundMacro(remaining.fiber)}g</span>
              </div>
            </>
          )}
        </div>
      ) : (
        meals.length > 0 && (
          <div className="p-3 rounded-xl bg-[#3b82f6]/5 border border-[#3b82f6]/20 flex flex-col gap-1.5 text-xs">
            <div className="flex gap-4 flex-wrap">
              <span className="text-[#f0f4ff] font-semibold">{Math.round(dayMacros.kcal)} kcal</span>
              <span className="text-[#60a5fa]">P {Math.round(dayMacros.protein)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.protein / athleteWeight).toFixed(1)} g/kg)</span> : null}</span>
              <span className="text-[#8fa3c0]">K {Math.round(dayMacros.carbs)}g</span>
              <span className="text-[#8fa3c0]">F {Math.round(dayMacros.fat)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.fat / athleteWeight).toFixed(1)} g/kg)</span> : null}</span>
              <span className="text-[#34d399]">Bal {roundMacro(dayMacros.fiber)}g</span>
              <span className="text-[#f59e0b]">Salz {roundSalt(dayMacros.salt)}g</span>
            </div>
          </div>
        )
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
              <div className="flex items-center gap-0.5">
                <Tooltip label="Nach oben">
                  <button type="button" onClick={() => moveMeal(meal.id, -1)} aria-label="Nach oben"
                    disabled={meals.indexOf(meal) === 0}
                    className="p-1 rounded-lg hover:bg-[#1e2d42] transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                    <ArrowUp size={13} className="text-[#5a7090]" />
                  </button>
                </Tooltip>
                <Tooltip label="Nach unten">
                  <button type="button" onClick={() => moveMeal(meal.id, 1)} aria-label="Nach unten"
                    disabled={meals.indexOf(meal) === meals.length - 1}
                    className="p-1 rounded-lg hover:bg-[#1e2d42] transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                    <ArrowDown size={13} className="text-[#5a7090]" />
                  </button>
                </Tooltip>
                <Tooltip label="Mahlzeit kopieren">
                  <button type="button" onClick={() => handleCopyMeal(meal)} aria-label="Mahlzeit kopieren"
                    className="p-1 rounded-lg hover:bg-[#1e2d42] transition-colors">
                    <Copy size={13} className="text-[#5a7090] hover:text-[#60a5fa]" />
                  </button>
                </Tooltip>
                <Tooltip label="Mahlzeit löschen">
                  <button type="button" onClick={() => deleteMeal(meal.id)} aria-label="Mahlzeit löschen"
                    className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors">
                    <Trash2 size={14} className="text-[#ef4444]/60 hover:text-[#ef4444]" />
                  </button>
                </Tooltip>
              </div>
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
                          <input type="number" min={0} step={10} value={amountStr}
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

      <div className="flex gap-2">
        <button type="button" onClick={addMeal}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#1e2d42] text-[#5a7090] text-sm hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors">
          <Plus size={15} /> {planType === "macro_targets" ? "Feste Lebensmittel hinzufügen" : "Mahlzeit hinzufügen"}
        </button>
        {clipboardMeal && (
          <Tooltip label={`"${clipboardMeal.name}" einfügen`}>
            <button type="button" onClick={handlePasteMeal} aria-label="Mahlzeit einfügen"
              className="flex items-center gap-1.5 px-3 py-3 rounded-2xl border border-dashed border-[#3b82f6]/30 text-[#60a5fa] text-xs hover:border-[#3b82f6]/60 hover:bg-[#3b82f6]/5 transition-colors">
              <ClipboardPaste size={14} /> Einfügen
            </button>
          </Tooltip>
        )}
      </div>

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
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());

  const isCreatingNew = editingId === "new";
  const planToEdit = isCreatingNew
    ? newPlanDraft
    : plans.find((p) => p.id === editingId) ?? null;

  function togglePlanExpanded(planId: string) {
    setExpandedPlanIds((prev) => {
      const next = new Set(prev);
      next.has(planId) ? next.delete(planId) : next.add(planId);
      return next;
    });
  }

  function quickAddMeal(plan: MealPlan) {
    const meal = emptyMeal();
    onSavePlan({ ...plan, meals: [...plan.meals, meal] });
  }

  function quickDeleteMeal(plan: MealPlan, mealId: string) {
    onSavePlan({ ...plan, meals: plan.meals.filter((m) => m.id !== mealId) });
  }

  function startNewPlan() {
    const draft: MealPlan = {
      id: `mp-${athleteId}-${Date.now()}`,
      athleteId,
      title: "Neuer Plan",
      planType: "fixed",
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
        const isExpanded = expandedPlanIds.has(plan.id);
        return (
          <div key={plan.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
            {/* Plan header */}
            <div className="p-4 flex items-start justify-between gap-3">
              <button type="button" onClick={() => togglePlanExpanded(plan.id)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  {isExpanded ? <ChevronUp size={13} className="text-[#5a7090] shrink-0" /> : <ChevronDown size={13} className="text-[#5a7090] shrink-0" />}
                  <p className="text-sm font-semibold text-[#f0f4ff] truncate">{plan.title}</p>
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                    (plan.planType ?? "fixed") === "macro_targets"
                      ? "bg-[#8b5cf6]/15 text-[#a78bfa]"
                      : "bg-[#1e2d42] text-[#5a7090]"
                  }`}>
                    {(plan.planType ?? "fixed") === "macro_targets" ? "Makrovorgaben" : "Fester Plan"}
                  </span>
                </div>
                {plan.meals.length > 0 ? (
                  <p className="text-xs text-[#5a7090] mt-0.5 pl-[17px]">
                    {Math.round(dayMacros.kcal)} kcal · P {Math.round(dayMacros.protein)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.protein / athleteWeight).toFixed(1)} g/kg)</span> : null}{" · "}K {Math.round(dayMacros.carbs)}g · F {Math.round(dayMacros.fat)}g{athleteWeight ? <span className="text-[10px] text-[#3b4d6a] ml-0.5">({(dayMacros.fat / athleteWeight).toFixed(1)} g/kg)</span> : null}
                    <span className="ml-1.5">· {plan.meals.length} Mahlzeit{plan.meals.length !== 1 ? "en" : ""}</span>
                  </p>
                ) : (
                  <p className="text-xs text-[#3b4d6a] mt-0.5 pl-[17px]">Keine Mahlzeiten</p>
                )}
                {plan.coachNote && (
                  <p className="text-xs text-[#5a7090] mt-1 italic line-clamp-1 pl-[17px]">{plan.coachNote}</p>
                )}
              </button>
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

            {/* Inline meal list */}
            {isExpanded && (
              <div className="border-t border-[#1e2d42] px-4 pb-3 pt-2 flex flex-col gap-1">
                {plan.meals.length === 0 && (
                  <p className="text-xs text-[#3b4d6a] py-1">Noch keine Mahlzeiten</p>
                )}
                {plan.meals.map((meal) => {
                  const mealMacros = calculateMealMacros(meal.entries);
                  return (
                    <div key={meal.id} className="flex items-center gap-2 py-1.5 border-b border-[#1e2d42]/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-[#f0f4ff]">{meal.name}</span>
                        {meal.time && <span className="text-[10px] text-[#5a7090] ml-1.5">{meal.time} Uhr</span>}
                        {meal.entries.length > 0 && (
                          <span className="text-[10px] text-[#5a7090] ml-1.5">· {Math.round(mealMacros.kcal)} kcal · {meal.entries.length} Lebensmittel</span>
                        )}
                      </div>
                      <Tooltip label="Mahlzeit löschen">
                        <button type="button" onClick={() => quickDeleteMeal(plan, meal.id)} aria-label="Mahlzeit löschen"
                          className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors shrink-0">
                          <Trash2 size={12} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                        </button>
                      </Tooltip>
                    </div>
                  );
                })}
                <button type="button" onClick={() => quickAddMeal(plan)}
                  className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors pt-1.5">
                  <Plus size={12} /> Mahlzeit hinzufügen
                </button>
              </div>
            )}
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
