"use client";
import { useState } from "react";
import { MealPlan } from "@/types";
import { calculateMealMacros, calculateDayMacros, roundMacro, roundSalt } from "@/lib/utils";

function MacroRow({ label, value, unit = "g", color, fmt = Math.round, perKg }: { label: string; value: number; unit?: string; color?: string; fmt?: (v: number) => number; perKg?: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#5a7090]">{label}</span>
      <span className={color ?? "text-[#8fa3c0]"}>
        {fmt(value)}{unit}
        {perKg !== undefined && (
          <span className="text-[10px] text-[#3b4d6a] ml-1">({perKg.toFixed(1)} g/kg)</span>
        )}
      </span>
    </div>
  );
}

function SinglePlanView({ plan, athleteWeight }: { plan: MealPlan; athleteWeight?: number }) {
  const dayMacros = calculateDayMacros(plan.meals);
  const proteinPerKg = athleteWeight ? dayMacros.protein / athleteWeight : undefined;
  const fatPerKg = athleteWeight ? dayMacros.fat / athleteWeight : undefined;

  return (
    <div className="flex flex-col gap-4">
      {plan.coachNote && (
        <div className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
          <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Coach-Hinweis</p>
          <p className="text-sm text-[#8fa3c0]">{plan.coachNote}</p>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-[#3b82f6]/5 border border-[#3b82f6]/20">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-3">Tagessumme</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <MacroRow label="Kalorien" value={dayMacros.kcal} unit=" kcal" color="text-[#f0f4ff] font-semibold" />
          <MacroRow label="Protein" value={dayMacros.protein} color="text-[#60a5fa]" perKg={proteinPerKg} />
          <MacroRow label="Kohlenhydrate" value={dayMacros.carbs} />
          <MacroRow label="Fett" value={dayMacros.fat} perKg={fatPerKg} />
          <MacroRow label="Ballaststoffe" value={dayMacros.fiber} fmt={roundMacro} />
          <MacroRow label="Salz" value={dayMacros.salt} fmt={roundSalt} />
        </div>
      </div>

      {plan.meals.map((meal) => {
        const macros = calculateMealMacros(meal.entries);
        return (
          <div key={meal.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2d42] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#f0f4ff]">{meal.name}</p>
                {meal.time && <p className="text-xs text-[#5a7090]">{meal.time} Uhr</p>}
              </div>
              <span className="text-xs text-[#8fa3c0] bg-[#1e2d42] px-2 py-1 rounded-lg">
                {Math.round(macros.kcal)} kcal
              </span>
            </div>

            <div className="divide-y divide-[#1e2d42]">
              {meal.entries.map((entry) => {
                const ratio = entry.amountG / 100;
                const entryMacros = {
                  kcal: entry.foodItem.kcalPer100g * ratio,
                  protein: entry.foodItem.proteinPer100g * ratio,
                  carbs: entry.foodItem.carbsPer100g * ratio,
                  fat: entry.foodItem.fatPer100g * ratio,
                  fiber: entry.foodItem.fiberPer100g * ratio,
                  salt: (entry.foodItem.saltPer100g ?? 0) * ratio,
                };
                return (
                  <div key={entry.foodItemId} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#f0f4ff]">{entry.foodItem.name}</span>
                      <span className="text-sm font-medium text-[#8fa3c0]">{Math.round(entry.amountG)}g</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[#5a7090]">
                      <span>{Math.round(entryMacros.kcal)} kcal</span>
                      <span className="text-[#60a5fa]">P {Math.round(entryMacros.protein)}g</span>
                      <span>K {Math.round(entryMacros.carbs)}g</span>
                      <span>F {Math.round(entryMacros.fat)}g</span>
                      <span className="text-[#34d399]">Bal {roundMacro(entryMacros.fiber)}g</span>
                      <span className="text-[#f59e0b]">Salz {roundSalt(entryMacros.salt)}g</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-2 bg-[#0f1624] border-t border-[#1e2d42] flex gap-4 text-xs">
              <span className="text-[#5a7090]">Gesamt:</span>
              <span className="text-[#60a5fa]">P {Math.round(macros.protein)}g</span>
              <span className="text-[#8fa3c0]">K {Math.round(macros.carbs)}g</span>
              <span className="text-[#8fa3c0]">F {Math.round(macros.fat)}g</span>
            </div>

            {meal.note && (
              <p className="px-4 pb-3 text-xs text-[#5a7090] italic">{meal.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MealPlanView({ plans, athleteWeight }: { plans: MealPlan[]; athleteWeight?: number }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-4">🍽</p>
        <p className="text-[#8fa3c0] font-medium">Noch kein Ernährungsplan</p>
        <p className="text-sm text-[#5a7090] mt-1">Dein Coach arbeitet gerade daran.</p>
      </div>
    );
  }

  const activePlan = plans[Math.min(activeIdx, plans.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      {/* Plan selector (only shown if multiple plans) */}
      {plans.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {plans.map((plan, idx) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeIdx === idx
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#141d2e] text-[#8fa3c0] hover:text-[#f0f4ff] border border-[#1e2d42]"
              }`}
            >
              {plan.title}
            </button>
          ))}
        </div>
      )}

      <SinglePlanView plan={activePlan} athleteWeight={athleteWeight} />
    </div>
  );
}
