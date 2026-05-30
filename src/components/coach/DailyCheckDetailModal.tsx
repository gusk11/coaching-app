"use client";
import { Athlete, DailyCheckIn, MealPlan } from "@/types";
import { calculateCalorieTrackerDayMacros, calculateDayMacros, calculateMealMacros, normalizeNutritionStatus, roundMacro, roundSalt } from "@/lib/utils";
import { CheckInSection, CheckInRow, MacroChip } from "@/components/ui/CheckInModalLayout";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { modalOverlay, modalContent } from "@/lib/motion";

interface Props {
  ci: DailyCheckIn;
  athlete: Athlete;
  onClose: () => void;
}

function stars(val: number, max = 5) {
  return "★".repeat(val) + "☆".repeat(max - val) + ` (${val}/5)`;
}


function NutritionCalorieTracker({ ci, athlete }: { ci: DailyCheckIn; athlete: Athlete }) {
  const ctDay = (athlete.calorieTrackerDays ?? []).find(d => d.date === ci.date);
  const dateLabel = new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });

  if (!ctDay) {
    return (
      <>
        <CheckInRow label="Quelle" value="Kalorientracker" />
        <div className="py-4 text-center">
          <p className="text-xs text-[#5a7090]">
            Für diesen Tag wurde kein Kalorientracker-Eintrag gefunden.
          </p>
        </div>
      </>
    );
  }

  const totals = calculateCalorieTrackerDayMacros(ctDay);

  return (
    <>
      <CheckInRow label="Quelle" value={`Kalorientracker · ${dateLabel}`} />
      {/* Totals strip */}
      <div className="flex flex-wrap gap-1 justify-around py-3 border-b border-[#1e2d42]">
        <MacroChip label="kcal" value={totals.kcal} unit="" color="text-[#f0f4ff] font-bold" />
        <MacroChip label="Protein" value={totals.protein} color="text-[#60a5fa]" />
        <MacroChip label="Kohlenhydrate" value={totals.carbs} />
        <MacroChip label="Fett" value={totals.fat} />
        <MacroChip label="Ballaststoffe" value={totals.fiber} />
        <MacroChip label="Salz" value={totals.salt} unit="g" />
      </div>
    </>
  );
}

function NutritionMealPlan({ ci, athlete }: { ci: DailyCheckIn; athlete: Athlete }) {
  const plans: MealPlan[] = athlete.mealPlans ?? [];
  const plan = ci.selectedMealPlanId
    ? plans.find(p => p.id === ci.selectedMealPlanId)
    : plans[0];

  if (!plan) {
    return (
      <>
        <CheckInRow label="Quelle" value="Ernährungsplan" />
        <div className="py-4 text-center">
          <p className="text-xs text-[#5a7090]">Kein Ernährungsplan gefunden.</p>
        </div>
      </>
    );
  }

  const dayMacros = calculateDayMacros(plan.meals);

  return (
    <>
      <CheckInRow label="Quelle" value={`Ernährungsplan: ${plan.title}`} />
      {/* Totals strip */}
      <div className="flex flex-wrap gap-1 justify-around py-3 border-b border-[#1e2d42]">
        <MacroChip label="kcal" value={dayMacros.kcal} unit="" color="text-[#f0f4ff] font-bold" />
        <MacroChip label="Protein" value={dayMacros.protein} color="text-[#60a5fa]" />
        <MacroChip label="Kohlenhydrate" value={dayMacros.carbs} />
        <MacroChip label="Fett" value={dayMacros.fat} />
        <MacroChip label="Ballaststoffe" value={dayMacros.fiber} />
        <MacroChip label="Salz" value={dayMacros.salt} unit="g" />
      </div>
    </>
  );
}

function MealDetails({ ci, athlete }: { ci: DailyCheckIn; athlete: Athlete }) {
  const status = normalizeNutritionStatus(ci);

  if (status === "calorie_tracker_used") {
    const ctDay = (athlete.calorieTrackerDays ?? []).find(d => d.date === ci.date);
    if (!ctDay || ctDay.meals.length === 0) return null;
    return (
      <section>
        <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Mahlzeiten (Kalorientracker)</p>
        <div className="flex flex-col gap-3">
          {ctDay.meals.map(meal => (
            <div key={meal.id} className="rounded-xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
              <div className="px-3 py-2 border-b border-[#1e2d42] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#f0f4ff]">{meal.name}</span>
                <span className="text-[10px] text-[#5a7090]">
                  {Math.round(meal.entries.reduce((s, e) => s + e.kcal, 0))} kcal
                </span>
              </div>
              <div className="divide-y divide-[#1e2d42]">
                {meal.entries.map(entry => {
                  const servingLabel = entry.servingLabel ?? "100 g";
                  const isStuck = servingLabel.startsWith("1 Stück");
                  const displayAmt = isStuck
                    ? `${Math.round(entry.amountG / 100)} Stück`
                    : `${Math.round(entry.amountG)} g`;
                  return (
                    <div key={entry.id} className="px-3 py-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-[#f0f4ff]">{entry.name}</span>
                        <span className="text-xs text-[#8fa3c0]">{displayAmt}</span>
                      </div>
                      <p className="text-[10px] text-[#5a7090]">
                        {Math.round(entry.kcal)} kcal ·{" "}
                        <span className="text-[#60a5fa]">P {Math.round(entry.protein)}g</span>
                        {" · "}K {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
                        {entry.fiber > 0 && ` · Bal ${roundMacro(entry.fiber)}g`}
                        {entry.salt > 0 && ` · Salz ${roundSalt(entry.salt)}g`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (status === "meal_plan_followed") {
    const plans: MealPlan[] = athlete.mealPlans ?? [];
    const plan = ci.selectedMealPlanId
      ? plans.find(p => p.id === ci.selectedMealPlanId)
      : plans[0];
    if (!plan || plan.meals.length === 0) return null;
    return (
      <section>
        <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Mahlzeiten ({plan.title})</p>
        <div className="flex flex-col gap-3">
          {plan.meals.map(meal => {
            const macros = calculateMealMacros(meal.entries);
            return (
              <div key={meal.id} className="rounded-xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
                <div className="px-3 py-2 border-b border-[#1e2d42] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#f0f4ff]">{meal.name}</span>
                    {meal.time && <span className="text-[10px] text-[#5a7090] ml-2">{meal.time} Uhr</span>}
                  </div>
                  <span className="text-[10px] text-[#5a7090]">{Math.round(macros.kcal)} kcal</span>
                </div>
                <div className="divide-y divide-[#1e2d42]">
                  {meal.entries.map(entry => {
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
                      <div key={entry.foodItemId} className="px-3 py-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-[#f0f4ff]">{entry.foodItem.name}</span>
                          <span className="text-xs text-[#8fa3c0]">{Math.round(entry.amountG)} g</span>
                        </div>
                        <p className="text-[10px] text-[#5a7090]">
                          {Math.round(em.kcal)} kcal ·{" "}
                          <span className="text-[#60a5fa]">P {Math.round(em.protein)}g</span>
                          {" · "}K {Math.round(em.carbs)}g · F {Math.round(em.fat)}g
                          {em.fiber > 0 && ` · Bal ${roundMacro(em.fiber)}g`}
                          {em.salt > 0 && ` · Salz ${roundSalt(em.salt)}g`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return null;
}

export function DailyCheckDetailModal({ ci, athlete, onClose }: Props) {
  const dateLabel = new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const status = normalizeNutritionStatus(ci);
  const noInfoReason = ci.noExactNutritionReason ?? ci.deviationReason;

  return (
    <motion.div
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg bg-[#0f1624] border border-[#1e2d42] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42] flex-shrink-0">
          <div>
            <p className="text-xs text-[#5a7090] mb-0.5">Daily Check-in</p>
            <h2 className="text-sm font-semibold text-[#f0f4ff]">{dateLabel}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#141d2e] transition-colors">
            <X size={16} className="text-[#8fa3c0]" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex flex-col gap-5">
          <CheckInSection title="Körpermessung">
            <CheckInRow label="Körpergewicht" value={`${ci.weight} kg`} />
            <CheckInRow label="Messzeitpunkt" value={ci.measurementTime || "–"} />
          </CheckInSection>

          <CheckInSection title="Schlaf">
            <CheckInRow label="Schlafdauer" value={`${ci.sleepHours} h`} />
            <CheckInRow label="Schlafqualität" value={stars(ci.sleepQuality)} />
            <CheckInRow label="Schlafscore" value={ci.sleepScore != null ? `${ci.sleepScore} / 100` : "–"} />
          </CheckInSection>

          <CheckInSection title="Vitalwerte">
            <CheckInRow label="Ruheherzfrequenz" value={ci.restingHeartRate != null ? `${ci.restingHeartRate} bpm` : "–"} />
            <CheckInRow label="HRV" value={ci.hrv != null ? `${ci.hrv} ms` : "–"} />
            <CheckInRow label="SpO₂" value={ci.spO2 != null ? `${ci.spO2} %` : "–"} />
            <CheckInRow
              label="Blutdruck"
              value={ci.bloodPressure ? `${ci.bloodPressure.systolic} / ${ci.bloodPressure.diastolic} mmHg` : "–"}
            />
          </CheckInSection>

          <CheckInSection title="Wohlbefinden">
            <CheckInRow label="Energielevel" value={stars(ci.energyLevel)} />
            <CheckInRow label="Stresslevel" value={stars(ci.stressLevel)} />
            <CheckInRow label="Stimmung" value={stars(ci.mood)} />
            <CheckInRow label="Appetit" value={stars(ci.appetite)} />
            <CheckInRow label="Verdauung" value={stars(ci.digestion)} />
          </CheckInSection>

          <CheckInSection title="Bewegung">
            <CheckInRow label="Schritte" value={ci.steps.toLocaleString("de-DE")} />
            <CheckInRow label="Training absolviert" value={ci.training ? "Ja" : "Nein"} />
            <CheckInRow
              label="Trainingsqualität"
              value={ci.training ? stars(ci.trainingQuality) : "–"}
            />
            <CheckInRow label="Cardio absolviert" value={ci.cardio ? "Ja" : "Nein"} />
            <CheckInRow
              label="Cardio-Dauer"
              value={ci.cardioDuration != null ? `${ci.cardioDuration} min` : "–"}
            />
          </CheckInSection>

          {/* ── Ernährung ── */}
          <CheckInSection title="Ernährung">
            {status === "calorie_tracker_used" && (
              <NutritionCalorieTracker ci={ci} athlete={athlete} />
            )}
            {status === "meal_plan_followed" && (
              <NutritionMealPlan ci={ci} athlete={athlete} />
            )}
            {status === "no_exact_info" && (
              <>
                <CheckInRow label="Quelle" value="Keine genaue Angabe" />
                <CheckInRow label="Begründung" value={noInfoReason || "–"} />
              </>
            )}
            <CheckInRow label="Koffein" value={ci.caffeine ? `${ci.caffeine} mg` : "–"} />
          </CheckInSection>

          {/* Mahlzeit-Details */}
          <MealDetails ci={ci} athlete={athlete} />

          {ci.note && (
            <section>
              <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Tagesanmerkung</p>
              <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] p-4">
                <p className="text-sm text-[#8fa3c0] leading-relaxed whitespace-pre-wrap">{ci.note}</p>
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
