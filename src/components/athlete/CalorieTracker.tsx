"use client";
import { useState, useMemo, useEffect } from "react";
import { CalorieTrackerDay, CalorieTrackerEntry, CalorieTrackerMeal, FoodItem, MealPlan } from "@/types";
import { getAllFoodItems } from "@/lib/store";
import { Plus, Trash2, Search, ChevronDown, ChevronUp, CheckCircle2, X, Check } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

// ─── Serving helpers ──────────────────────────────────────────────────────────

function isStückFood(food: FoodItem): boolean {
  return food.servingLabel?.includes("Stück") ?? false;
}

function getServingUnit(food: FoodItem): string {
  return isStückFood(food) ? "Stück" : "g";
}

/** Convert user-entered amount (grams or pieces) to the internal amountG value used by calcEntry. */
function toInternalAmountG(amount: number, food: FoodItem): number {
  return isStückFood(food) ? amount * 100 : amount;
}

/** Format an entry's amountG for display, respecting its servingLabel. */
function formatDisplayAmount(amountG: number, servingLabel?: string): string {
  if (amountG <= 0) return "";
  if (servingLabel?.includes("Stück")) {
    const pieces = amountG / 100;
    return `${pieces % 1 === 0 ? Math.round(pieces) : pieces.toFixed(1)} Stück · `;
  }
  return `${amountG} g · `;
}

// ─── Calc ─────────────────────────────────────────────────────────────────────

function calcEntry(
  food: { kcalPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number; fiberPer100g: number; saltPer100g?: number },
  amountG: number
): Pick<CalorieTrackerEntry, "kcal" | "protein" | "carbs" | "fat" | "fiber" | "salt"> {
  const r = amountG / 100;
  return {
    kcal: Math.round(food.kcalPer100g * r),
    protein: Math.round(food.proteinPer100g * r * 10) / 10,
    carbs: Math.round(food.carbsPer100g * r * 10) / 10,
    fat: Math.round(food.fatPer100g * r * 10) / 10,
    fiber: Math.round(food.fiberPer100g * r * 10) / 10,
    salt: Math.round((food.saltPer100g ?? 0) * r * 10) / 10,
  };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Totals ───────────────────────────────────────────────────────────────────

type Totals = { kcal: number; protein: number; carbs: number; fat: number; fiber: number; salt: number };

function sumEntries(entries: CalorieTrackerEntry[]): Totals {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      fiber: acc.fiber + e.fiber,
      salt: acc.salt + e.salt,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, salt: 0 }
  );
}

// ─── Food search panel ────────────────────────────────────────────────────────

function FoodSearchPanel({
  onSelect,
  onClose,
  allFoods,
}: {
  onSelect: (amountG: number, foodId: string) => void;
  onClose: () => void;
  allFoods: FoodItem[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");

  const filtered = useMemo(
    () => {
      const q = query.toLowerCase();
      return allFoods.filter((f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    },
    [allFoods, query]
  );

  const parsedAmount = parseFloat(amountInput);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const amountG = isValidAmount && selected ? toInternalAmountG(parsedAmount, selected) : 0;
  const preview = isValidAmount && selected ? calcEntry(selected, amountG) : null;
  const unit = selected ? getServingUnit(selected) : "g";

  const inputCls =
    "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";

  return (
    <div className="flex flex-col gap-3">
      {!selected ? (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a7090]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Lebensmittel suchen..."
              className={`${inputCls} pl-8 w-full`}
            />
          </div>
          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
            {filtered.slice(0, 20).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelected(f);
                  setAmountInput(String(f.defaultAmount ?? (isStückFood(f) ? 1 : 100)));
                  setAmountError("");
                }}
                className="text-left px-3 py-2 rounded-xl hover:bg-[#141d2e] transition-colors"
              >
                <span className="text-sm text-[#f0f4ff]">{f.name}</span>
                <span className="text-xs text-[#5a7090] ml-2">{f.category}</span>
                <span className="text-xs text-[#5a7090] ml-2">
                  {f.kcalPer100g} kcal · P {f.proteinPer100g}g / K {f.carbsPer100g}g / F {f.fatPer100g}g
                  {f.servingLabel ? ` per ${f.servingLabel}` : " per 100g"}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-[#5a7090] px-3 py-4 text-center">Kein Lebensmittel gefunden.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelected(null)} className="text-xs text-[#5a7090] hover:text-[#f0f4ff]">← Zurück</button>
            <p className="text-sm font-semibold text-[#f0f4ff]">{selected.name}</p>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Menge</label>
              <input
                type="number"
                min={0}
                step={1}
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setAmountError(""); }}
                className={inputCls}
              />
              {amountError && <p className="text-xs text-[#ef4444] mt-1">{amountError}</p>}
            </div>
            <div className="pb-2">
              <span className="text-sm text-[#8fa3c0]">{unit}</span>
            </div>
          </div>

          {preview && (
            <div className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42] text-xs text-[#8fa3c0] flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-[#f0f4ff] font-semibold">{amountInput} {unit}</span>
              <span>{preview.kcal} kcal</span>
              <span>P {preview.protein}g</span>
              <span>K {preview.carbs}g</span>
              <span>F {preview.fat}g</span>
              {preview.fiber > 0 && <span>Bal {preview.fiber}g</span>}
              {preview.salt > 0 && <span>Salz {preview.salt}g</span>}
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#1e2d42] text-xs text-[#5a7090]">Abbrechen</button>
            <button
              type="button"
              onClick={() => {
                if (!isValidAmount) {
                  setAmountError("Bitte Menge größer als 0 eingeben.");
                  return;
                }
                onSelect(amountG, selected.id);
                onClose();
              }}
              className="flex-1 py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors"
            >
              Hinzufügen
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Free entry panel ─────────────────────────────────────────────────────────

function FreeEntryPanel({
  onAdd,
  onClose,
}: {
  onAdd: (entry: Omit<CalorieTrackerEntry, "id">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [kcalInput, setKcalInput] = useState("0");
  const [proteinInput, setProteinInput] = useState("0");
  const [carbsInput, setCarbsInput] = useState("0");
  const [fatInput, setFatInput] = useState("0");
  const [fiberInput, setFiberInput] = useState("0");
  const [saltInput, setSaltInput] = useState("0");
  const [nutrientError, setNutrientError] = useState("");

  const inputCls =
    "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#5a7090] uppercase tracking-widest">Freier Eintrag</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "kcal", val: kcalInput, set: setKcalInput },
          { label: "Protein (g)", val: proteinInput, set: setProteinInput },
          { label: "Kohlenhydrate (g)", val: carbsInput, set: setCarbsInput },
          { label: "Fett (g)", val: fatInput, set: setFatInput },
          { label: "Ballaststoffe (g)", val: fiberInput, set: setFiberInput },
          { label: "Salz (g)", val: saltInput, set: setSaltInput },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <label className="text-xs text-[#5a7090]">{f.label}</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={f.val}
              onChange={(e) => { f.set(e.target.value); setNutrientError(""); }}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      {nutrientError && <p className="text-xs text-[#ef4444]">{nutrientError}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#1e2d42] text-xs text-[#5a7090]">Abbrechen</button>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            const inputs = [kcalInput, proteinInput, carbsInput, fatInput, fiberInput, saltInput];
            for (const v of inputs) {
              const n = v === "" ? 0 : parseFloat(v);
              if (isNaN(n) || n < 0) {
                setNutrientError("Bitte gültigen Wert eingeben.");
                return;
              }
            }
            const parseN = (v: string) => v === "" ? 0 : (parseFloat(v) || 0);
            onAdd({
              name: name.trim(),
              amountG: 0,
              kcal: parseN(kcalInput),
              protein: parseN(proteinInput),
              carbs: parseN(carbsInput),
              fat: parseN(fatInput),
              fiber: parseN(fiberInput),
              salt: parseN(saltInput),
            });
            onClose();
          }}
          className="flex-1 py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-40"
        >
          Hinzufügen
        </button>
      </div>
    </div>
  );
}

// ─── Meal plan import modal ───────────────────────────────────────────────────

function MealPlanImportModal({
  mealPlan,
  onImport,
  onClose,
}: {
  mealPlan: MealPlan;
  onImport: (selectedMealIds: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(mealPlan.meals.map((m) => m.id));

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const allSelected = selected.length === mealPlan.meals.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#0d1525] border border-[#1e2d42] overflow-hidden">
        <div className="p-4 border-b border-[#1e2d42] flex items-center justify-between">
          <p className="text-sm font-semibold text-[#f0f4ff]">Aus Ernährungsplan übernehmen</p>
          <Tooltip label="Schließen">
            <button type="button" onClick={onClose} aria-label="Schließen" className="p-1 rounded-lg hover:bg-[#1e2d42] transition-colors">
              <X size={16} className="text-[#5a7090]" />
            </button>
          </Tooltip>
        </div>

        <p className="px-4 pt-3 text-xs text-[#5a7090]">Wähle, welche Mahlzeiten du für diesen Tag übernehmen möchtest.</p>

        <div className="p-4 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {mealPlan.meals.map((meal) => {
            const isChecked = selected.includes(meal.id);
            return (
              <button
                key={meal.id}
                type="button"
                onClick={() => toggle(meal.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                  isChecked
                    ? "border-[#3b82f6]/60 bg-[#3b82f6]/10"
                    : "border-[#1e2d42] bg-[#141d2e]"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                  isChecked ? "border-[#3b82f6] bg-[#3b82f6]" : "border-[#3a4a5c]"
                )}>
                  {isChecked && <Check size={10} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f0f4ff]">{meal.name}</p>
                  <p className="text-xs text-[#5a7090]">
                    {meal.entries.length} Lebensmittel
                    {meal.time ? ` · ${meal.time} Uhr` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#1e2d42] flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelected(allSelected ? [] : mealPlan.meals.map((m) => m.id))}
            className="text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
          >
            {allSelected ? "Alle abwählen" : "Alle auswählen"}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#1e2d42] text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => { onImport(selected); onClose(); }}
            className="px-4 py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-40"
          >
            {selected.length} übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  initialDay?: CalorieTrackerDay;
  mealPlan?: MealPlan;
  date: string;
  athleteId: string;
  onSave: (day: Omit<CalorieTrackerDay, "id" | "athleteId">) => void;
}

export function CalorieTracker({ initialDay, mealPlan, date, athleteId, onSave }: Props) {
  const [meals, setMeals] = useState<CalorieTrackerMeal[]>(initialDay?.meals ?? []);
  const [openMealId, setOpenMealId] = useState<string | null>(null);
  const [foodSearchMealId, setFoodSearchMealId] = useState<string | null>(null);
  const [freeEntryMealId, setFreeEntryMealId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  useEffect(() => { getAllFoodItems().then(setAllFoods); }, []);
  const dayTotals = useMemo(() => sumEntries(meals.flatMap((m) => m.entries)), [meals]);

  function addMeal() {
    const id = uid();
    setMeals((prev) => [...prev, { id, name: `Mahlzeit ${prev.length + 1}`, entries: [] }]);
    setOpenMealId(id);
  }

  function removeMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  function importFromPlan(selectedIds: string[]) {
    if (!mealPlan) return;
    const imported: CalorieTrackerMeal[] = mealPlan.meals
      .filter((m) => selectedIds.includes(m.id))
      .map((m) => ({
        id: uid(),
        name: m.name,
        entries: m.entries.filter((e) => !!e.foodItem).map((e) => {
          const macros = calcEntry(e.foodItem, e.amountG);
          return {
            id: uid(),
            name: e.foodItem.name,
            amountG: e.amountG,
            ...macros,
            foodItemId: e.foodItemId,
            servingLabel: e.foodItem.servingLabel,
          };
        }),
      }));
    setMeals((prev) => [...prev, ...imported]);
  }

  function addFoodToMeal(mealId: string, amountG: number, foodId: string) {
    const food = allFoods.find((f) => f.id === foodId);
    if (!food) return;
    const macros = calcEntry(food, amountG);
    const entry: CalorieTrackerEntry = {
      id: uid(),
      name: food.name,
      amountG,
      ...macros,
      foodItemId: food.id,
      servingLabel: food.servingLabel,
    };
    setMeals((prev) =>
      prev.map((m) => m.id === mealId ? { ...m, entries: [...m.entries, entry] } : m)
    );
  }

  function addFreeEntryToMeal(mealId: string, entry: Omit<CalorieTrackerEntry, "id">) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId ? { ...m, entries: [...m.entries, { ...entry, id: uid() }] } : m
      )
    );
  }

  function removeEntry(mealId: string, entryId: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId ? { ...m, entries: m.entries.filter((e) => e.id !== entryId) } : m
      )
    );
  }

  function handleSave() {
    onSave({ date, meals });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      {showImportModal && mealPlan && (
        <MealPlanImportModal
          mealPlan={mealPlan}
          onImport={importFromPlan}
          onClose={() => setShowImportModal(false)}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Day totals */}
        {meals.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
            <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-3">Tagesgesamtwerte</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "kcal", value: Math.round(dayTotals.kcal), color: "text-[#f97316]" },
                { label: "Protein", value: `${Math.round(dayTotals.protein)}g`, color: "text-[#60a5fa]" },
                { label: "Kohlenhydrate", value: `${Math.round(dayTotals.carbs)}g`, color: "text-[#a78bfa]" },
                { label: "Fett", value: `${Math.round(dayTotals.fat)}g`, color: "text-[#f59e0b]" },
                { label: "Ballaststoffe", value: `${Math.round(dayTotals.fiber)}g`, color: "text-[#34d399]" },
                { label: "Salz", value: `${(Math.round(dayTotals.salt * 10) / 10).toFixed(1)}g`, color: "text-[#8fa3c0]" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#5a7090]">{s.label}</span>
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meals */}
        {meals.map((meal) => {
          const mealTotals = sumEntries(meal.entries);
          const isOpen = openMealId === meal.id;
          return (
            <div key={meal.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2d42]">
                <button
                  type="button"
                  onClick={() => setOpenMealId(isOpen ? null : meal.id)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-sm font-semibold text-[#f0f4ff]">{meal.name}</span>
                  <span className="text-xs text-[#5a7090]">{meal.entries.length} Einträge</span>
                  <span className="text-xs text-[#f97316] ml-auto">{mealTotals.kcal} kcal</span>
                  {isOpen ? <ChevronUp size={14} className="text-[#5a7090]" /> : <ChevronDown size={14} className="text-[#5a7090]" />}
                </button>
                <Tooltip label="Mahlzeit entfernen">
                  <button
                    type="button"
                    onClick={() => removeMeal(meal.id)}
                    aria-label="Mahlzeit entfernen"
                    className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
                  >
                    <Trash2 size={13} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                  </button>
                </Tooltip>
              </div>

              {isOpen && (
                <div className="p-3 flex flex-col gap-2">
                  {meal.entries.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#f0f4ff] font-medium">{entry.name}</p>
                        <p className="text-xs text-[#5a7090] mt-0.5">
                          {formatDisplayAmount(entry.amountG, entry.servingLabel)}{entry.kcal} kcal · P {entry.protein}g · K {entry.carbs}g · F {entry.fat}g
                          {entry.fiber > 0 ? ` · Bal ${entry.fiber}g` : ""}
                          {entry.salt > 0 ? ` · Salz ${entry.salt}g` : ""}
                        </p>
                      </div>
                      <Tooltip label="Eintrag entfernen">
                        <button
                          type="button"
                          onClick={() => removeEntry(meal.id, entry.id)}
                          aria-label="Eintrag entfernen"
                          className="p-1 rounded hover:bg-[#ef4444]/10 transition-colors"
                        >
                          <X size={11} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                        </button>
                      </Tooltip>
                    </div>
                  ))}

                  {foodSearchMealId === meal.id ? (
                    <div className="p-3 rounded-xl bg-[#0f1624] border border-[#3b82f6]/30">
                      <FoodSearchPanel
                        onSelect={(amountG, foodId) => addFoodToMeal(meal.id, amountG, foodId)}
                        onClose={() => setFoodSearchMealId(null)}
                        allFoods={allFoods}
                      />
                    </div>
                  ) : freeEntryMealId === meal.id ? (
                    <div className="p-3 rounded-xl bg-[#0f1624] border border-[#3b82f6]/30">
                      <FreeEntryPanel
                        onAdd={(entry) => addFreeEntryToMeal(meal.id, entry)}
                        onClose={() => setFreeEntryMealId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => { setFoodSearchMealId(meal.id); setFreeEntryMealId(null); }}
                        className="flex items-center gap-1 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                      >
                        <Search size={11} /> Aus Datenbank
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFreeEntryMealId(meal.id); setFoodSearchMealId(null); }}
                        className="flex items-center gap-1 text-xs text-[#8fa3c0] hover:text-[#f0f4ff] transition-colors"
                      >
                        <Plus size={11} /> Freier Eintrag
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Action bar */}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={addMeal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#1e2d42] text-xs text-[#8fa3c0] hover:text-[#f0f4ff] hover:border-[#3b82f6]/40 transition-colors"
          >
            <Plus size={13} /> Mahlzeit hinzufügen
          </button>
          {mealPlan && (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#1e2d42] text-xs text-[#8fa3c0] hover:text-[#60a5fa] hover:border-[#3b82f6]/40 transition-colors"
            >
              ↓ Aus Ernährungsplan übernehmen
            </button>
          )}
        </div>

        {/* Save */}
        {meals.length > 0 && (
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
          >
            {saved ? <><CheckCircle2 size={16} /> Gespeichert!</> : "Tag speichern"}
          </button>
        )}
      </div>
    </>
  );
}
