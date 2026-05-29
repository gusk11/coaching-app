"use client";
import { useState } from "react";
import { MealPlan, Meal, MealEntry, FoodItem } from "@/types";
import { getAllFoodItems } from "@/lib/store";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { calculateMealMacros, calculateDayMacros, roundMacro, roundSalt } from "@/lib/utils";

interface Props {
  plan?: MealPlan;
  athleteId: string;
  onSave: (plan: MealPlan) => void;
}

function emptyMeal(athleteId: string): Meal {
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

interface AddFoodRowProps {
  onAdd: (entry: MealEntry) => void;
}

function AddFoodRow({ onAdd }: AddFoodRowProps) {
  const [mode, setMode] = useState<"db" | "custom">("db");
  const dbFoodItems = getAllFoodItems();
  const [selectedId, setSelectedId] = useState(dbFoodItems[0]?.id ?? "");
  const [amount, setAmount] = useState(100);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState(0);
  const [customProtein, setCustomProtein] = useState(0);
  const [customCarbs, setCustomCarbs] = useState(0);
  const [customFat, setCustomFat] = useState(0);
  const [open, setOpen] = useState(false);

  function handleAdd() {
    if (mode === "db") {
      const fi = getAllFoodItems().find((f) => f.id === selectedId);
      if (!fi) return;
      onAdd({ foodItemId: fi.id, foodItem: fi, amountG: amount });
    } else {
      if (!customName.trim()) return;
      const fi = customFoodItem(customName.trim(), customKcal, customProtein, customCarbs, customFat);
      onAdd({ foodItemId: fi.id, foodItem: fi, amountG: amount });
      setCustomName(""); setCustomKcal(0); setCustomProtein(0); setCustomCarbs(0); setCustomFat(0);
    }
    setOpen(false);
    setAmount(100);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors py-1"
      >
        <Plus size={13} /> Lebensmittel hinzufügen
      </button>
    );
  }

  return (
    <div className="bg-[#192236] rounded-xl p-3 flex flex-col gap-3 border border-[#1e2d42]">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["db", "custom"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mode === m
                ? "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30"
                : "bg-[#141d2e] text-[#5a7090] border border-[#1e2d42]"
            }`}
          >
            {m === "db" ? "Aus Datenbank" : "Manuell"}
          </button>
        ))}
      </div>

      {mode === "db" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a7090]">Lebensmittel</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
            >
              {dbFoodItems.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5a7090]">Menge (g)</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Name</label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="z.B. Haferflocken"
                className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Menge (g)</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>
          <p className="text-xs text-[#5a7090]">Makros pro 100g (optional)</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "kcal", val: customKcal, set: setCustomKcal },
              { label: "P (g)", val: customProtein, set: setCustomProtein },
              { label: "K (g)", val: customCarbs, set: setCustomCarbs },
              { label: "F (g)", val: customFat, set: setCustomFat },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <label className="text-xs text-[#5a7090]">{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={f.val}
                  onChange={(e) => f.set(Number(e.target.value))}
                  className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors"
        >
          Hinzufügen
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg border border-[#1e2d42] text-[#8fa3c0] text-xs hover:border-[#3b82f6]/30 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export function MealPlanEditor({ plan, athleteId, onSave }: Props) {
  const initPlan = plan ?? {
    id: `mp-${Date.now()}`,
    athleteId,
    title: "Ernährungsplan",
    meals: [],
    coachNote: "",
    createdAt: new Date().toISOString(),
  };

  const [title, setTitle] = useState(initPlan.title);
  const [coachNote, setCoachNote] = useState(initPlan.coachNote ?? "");
  const [meals, setMeals] = useState<Meal[]>(initPlan.meals);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(initPlan.meals.map((m) => m.id)));

  function toggleMeal(id: string) {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addMeal() {
    const m = emptyMeal(athleteId);
    setMeals((prev) => [...prev, m]);
    setExpandedMeals((prev) => new Set([...prev, m.id]));
  }

  function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMealField(id: string, field: keyof Meal, value: string) {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  function addEntry(mealId: string, entry: MealEntry) {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, entries: [...m.entries, entry] } : m))
    );
  }

  function updateEntryAmount(mealId: string, foodItemId: string, amount: number) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? { ...m, entries: m.entries.map((e) => e.foodItemId === foodItemId ? { ...e, amountG: amount } : e) }
          : m
      )
    );
  }

  function deleteEntry(mealId: string, foodItemId: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId ? { ...m, entries: m.entries.filter((e) => e.foodItemId !== foodItemId) } : m
      )
    );
  }

  function handleSave() {
    onSave({
      ...initPlan,
      title,
      coachNote,
      meals,
    });
  }

  const dayMacros = calculateDayMacros(meals);

  return (
    <div className="flex flex-col gap-4">
      {/* Plan meta */}
      <div className="grid grid-cols-1 gap-3 p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8fa3c0]">Plan-Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#8fa3c0]">Coach-Notiz</label>
          <textarea
            value={coachNote}
            onChange={(e) => setCoachNote(e.target.value)}
            rows={2}
            placeholder="Hinweise zum Ernährungsplan..."
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Day totals */}
      {meals.length > 0 && (
        <div className="p-3 rounded-xl bg-[#3b82f6]/5 border border-[#3b82f6]/20 flex gap-4 text-xs flex-wrap">
          <span className="text-[#f0f4ff] font-semibold">{Math.round(dayMacros.kcal)} kcal</span>
          <span className="text-[#60a5fa]">P {Math.round(dayMacros.protein)}g</span>
          <span className="text-[#8fa3c0]">K {Math.round(dayMacros.carbs)}g</span>
          <span className="text-[#8fa3c0]">F {Math.round(dayMacros.fat)}g</span>
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
            {/* Meal header */}
            <div className="px-4 py-3 border-b border-[#1e2d42] flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleMeal(meal.id)}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {expanded ? <ChevronUp size={14} className="text-[#5a7090]" /> : <ChevronDown size={14} className="text-[#5a7090]" />}
                  <input
                    value={meal.name}
                    onChange={(e) => { e.stopPropagation(); updateMealField(meal.id, "name", e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-sm font-semibold text-[#f0f4ff] focus:outline-none border-b border-transparent focus:border-[#3b82f6] transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={meal.time ?? ""}
                    onChange={(e) => { e.stopPropagation(); updateMealField(meal.id, "time", e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Uhrzeit"
                    className="bg-transparent text-xs text-[#5a7090] w-16 focus:outline-none text-right border-b border-transparent focus:border-[#3b82f6] transition-colors"
                  />
                  {meals.length > 0 && (
                    <span className="text-xs text-[#8fa3c0] bg-[#1e2d42] px-2 py-0.5 rounded-md">
                      {Math.round(mealMacros.kcal)} kcal
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => deleteMeal(meal.id)}
                className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
              >
                <Trash2 size={14} className="text-[#ef4444]/60 hover:text-[#ef4444]" />
              </button>
            </div>

            {expanded && (
              <div className="p-4 flex flex-col gap-2">
                {/* Entries */}
                {meal.entries.map((entry) => {
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
                        <input
                          type="number"
                          min={1}
                          value={entry.amountG}
                          onChange={(e) => updateEntryAmount(meal.id, entry.foodItemId, Number(e.target.value))}
                          className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1 text-[#f0f4ff] text-xs w-16 focus:outline-none focus:border-[#3b82f6] text-right"
                        />
                        <span className="text-xs text-[#5a7090]">g</span>
                        <button
                          type="button"
                          onClick={() => deleteEntry(meal.id, entry.foodItemId)}
                          className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
                        >
                          <Trash2 size={12} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add food */}
                <AddFoodRow onAdd={(entry) => addEntry(meal.id, entry)} />

                {/* Meal note */}
                <input
                  value={meal.note ?? ""}
                  onChange={(e) => updateMealField(meal.id, "note", e.target.value)}
                  placeholder="Notiz zur Mahlzeit (optional)"
                  className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors mt-1"
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add meal */}
      <button
        type="button"
        onClick={addMeal}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#1e2d42] text-[#5a7090] text-sm hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors"
      >
        <Plus size={15} /> Mahlzeit hinzufügen
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
  );
}
