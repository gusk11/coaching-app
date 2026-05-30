"use client";
import { AthleteProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function val(v: unknown): string {
  if (v == null || v === "") return "–";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "–";
  return String(v);
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-[#1e2d42]/60 last:border-0">
      <span className="text-xs text-[#5a7090] shrink-0 max-w-[45%]">{label}</span>
      <span className="text-xs text-[#c0cfe0] text-right">{val(value)}</span>
    </div>
  );
}

function Section({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a2438] transition-colors">
        <span className="text-xs font-semibold text-[#8fa3c0] uppercase tracking-widest">{title}</span>
        {open ? <ChevronDown size={14} className="text-[#5a7090]" /> : <ChevronRight size={14} className="text-[#5a7090]" />}
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-0">{children}</div>}
    </div>
  );
}

const inp = "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full placeholder:text-[#3b4d6a]";

function EditRow({ label, value, onChange, rows, type }: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-1.5 border-b border-[#1e2d42]/60 last:border-0">
      <span className="text-xs text-[#5a7090]">{label}</span>
      {rows
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
            className={`${inp} resize-none`} />
        : <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} className={inp} />}
    </div>
  );
}

// ─── Display-only component ───────────────────────────────────────────────────

export function ProfileDisplaySections({ profile }: { profile: AthleteProfile }) {
  const p = profile;

  const dayLabels: Record<number, string> = {
    1: "Mo", 2: "Di", 3: "Mi", 4: "Do", 5: "Fr", 6: "Sa", 0: "So",
  };
  function days(arr?: number[]): string {
    if (!arr?.length) return "–";
    return arr.map((n) => dayLabels[n] ?? n).join(", ");
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Lifestyle */}
      <Section title="Alltag & Lifestyle">
        <Row label="Beruf/Alltag" value={p.lifestyle?.occupation} />
        <Row label="Wochenstunden Arbeit" value={p.lifestyle?.weeklyWorkloadUnknown ? "weiß ich nicht" : p.lifestyle?.weeklyWorkloadHours != null ? `${p.lifestyle.weeklyWorkloadHours} h` : undefined} />
        <Row label="Planbarkeit (1–10)" value={p.lifestyle?.dailyPlanningScore} />
        <Row label="Tagesroutine" value={p.lifestyle?.dailyRoutine} />
        <Row label="Stresspegel (1–10)" value={p.lifestyle?.stressLevel} />
        <Row label="Durchschn. Schritte" value={p.lifestyle?.averageStepsUnknown ? "weiß ich nicht" : p.lifestyle?.averageSteps != null ? p.lifestyle.averageSteps.toLocaleString("de") : undefined} />
        <Row label="Aktivitätslevel Alltag (1–10)" value={p.lifestyle?.dailyActivityLevel} />
        <Row label="Cardio aktuell" value={p.lifestyle?.currentCardio} />
        <Row label="Wöchentliche Investitionszeit" value={p.lifestyle?.weeklyTimeInvestment != null ? `${p.lifestyle.weeklyTimeInvestment} h` : undefined} />
      </Section>

      {/* Recovery */}
      <Section title="Schlaf & Regeneration">
        <Row label="Schlafdauer" value={p.recovery?.sleepHoursUnknown ? "weiß ich nicht" : p.recovery?.sleepHours != null ? `${p.recovery.sleepHours} h` : undefined} />
        <Row label="Schlafqualität (1–10)" value={p.recovery?.sleepQuality} />
        <Row label="Erholung morgens (1–10)" value={p.recovery?.morningRecovery} />
        <Row label="Schlafregelmäßigkeit (1–10)" value={p.recovery?.sleepScheduleRegularity} />
        <Row label="Schichtarbeit" value={p.recovery?.shiftWork} />
        <Row label="Schlafstörer" value={p.recovery?.sleepDisruptors} />
        <Row label="Sonstiges Schlaf" value={p.recovery?.sleepDisruptorsOther} />
      </Section>

      {/* Health */}
      <Section title="Gesundheit & Einschränkungen">
        <Row label="Verletzungen" value={p.health?.hasInjuries} />
        <Row label="Verletzungsdetails" value={p.health?.injuriesDetail} />
        <Row label="Problematische Bewegungen" value={p.health?.problematicMovements} />
        <Row label="Gesundheitliche Einschränkungen" value={p.health?.hasHealthIssues} />
        <Row label="Details Einschränkungen" value={p.health?.healthIssuesDetail} />
        <Row label="Medikamente" value={p.health?.medications} />
        <Row label="Medikamentendetails" value={p.health?.medicationsDetail} />
        <Row label="Verdauung/Unverträglichkeiten" value={p.health?.hasDigestionIssues} />
        <Row label="Verdauungsdetails" value={p.health?.digestionDetail} />
        <Row label="Sonstige Einschränkungen" value={p.health?.otherLimitations} />
      </Section>

      {/* Nutrition */}
      <Section title="Ernährung">
        <Row label="Ernährungsform" value={p.nutrition?.dietType} />
        <Row label="Ernährungskonzept" value={p.nutrition?.currentNutritionConcept} />
        <Row label="Aktuelles Tracking" value={p.nutrition?.currentTrackingStatus} />
        <Row label="Bevorzugte Methode" value={p.nutrition?.preferredNutritionMethod} />
        <Row label="Kalorientracking-Sicherheit (1–10)" value={p.nutrition?.calorieCountingConfidence} />
        <Row label="Makro-Sicherheit (1–10)" value={p.nutrition?.macroConfidence} />
        <Row label="Makro-Adherence-Konfidenz (1–10)" value={p.nutrition?.macroAdherenceConfidence} />
        <Row label="Ernährungsplan-Adherence (1–10)" value={p.nutrition?.mealPlanAdherenceConfidence} />
        <Row label="Ernährungsprobleme" value={p.nutrition?.nutritionProblems} />
        <Row label="Aktuell kcal/Tag" value={p.nutrition?.currentCaloriesUnknown ? "weiß ich nicht" : p.nutrition?.currentCalories != null ? `${p.nutrition.currentCalories} kcal` : undefined} />
        <Row label="Makros bekannt" value={p.nutrition?.knowsMacros} />
        {p.nutrition?.currentMacros && (
          <Row label="Aktuelle Makros"
            value={`P: ${p.nutrition.currentMacros.protein ?? "?"}g / C: ${p.nutrition.currentMacros.carbs ?? "?"}g / F: ${p.nutrition.currentMacros.fat ?? "?"}g`} />
        )}
        <Row label="Mahlzeitenregelmäßigkeit (1–10)" value={p.nutrition?.mealRegularity} />
        <Row label="Auswärtsessen" value={p.nutrition?.eatingOutFrequency} />
        <Row label="Bereitschaft Abwiegen (1–10)" value={p.nutrition?.weighingFoodWillingness} />
      </Section>

      {/* Food Prefs */}
      <Section title="Lebensmittelpräferenzen">
        <Row label="Proteinquellen" value={p.foodPreferences?.proteinSources} />
        <Row label="Kohlenhydratquellen" value={p.foodPreferences?.carbSources} />
        <Row label="Fettquellen" value={p.foodPreferences?.fatSources} />
        <Row label="Lieblingslebensmittel" value={p.foodPreferences?.favoriteFoods} />
        <Row label="Abgelehnte LM" value={p.foodPreferences?.dislikedFoods} />
        <Row label="Unverträglichkeiten" value={p.foodPreferences?.intoleratedFoods} />
        <Row label="Trigger-Lebensmittel" value={p.foodPreferences?.triggerFoods} />
        <Row label="Hunger hauptsächlich" value={p.foodPreferences?.hungerTiming} />
        <Row label="Heißhunger-Häufigkeit (1–10)" value={p.foodPreferences?.cravingsFrequency} />
        <Row label="Emotionales Essen (1–10)" value={p.foodPreferences?.emotionalEatingSkipped ? "nicht angegeben" : p.foodPreferences?.emotionalEatingFrequency} />
      </Section>

      {/* Supplements */}
      <Section title="Supplemente & Koffein">
        <Row label="Aktuelle Supplemente" value={p.supplements?.currentSupplements} />
        <Row label="Einnahmezeiten bekannt" value={p.supplements?.supplementTiming} />
        <Row label="Nicht gewünschte Supplemente" value={p.supplements?.unwantedSupplements} />
        <Row label="Koffein/Tag" value={p.supplements?.caffeineUnknown ? "weiß ich nicht" : p.supplements?.caffeineMg != null ? `${p.supplements.caffeineMg} mg` : undefined} />
        <Row label="Koffeinquellen" value={p.supplements?.caffeineSources} />
        <Row label="Koffein-Timing" value={p.supplements?.caffeineTiming} />
        <Row label="Pre-Workout-Nutrition" value={p.supplements?.preWorkoutNutrition} />
        <Row label="Post-Workout-Nutrition" value={p.supplements?.postWorkoutNutrition} />
      </Section>

      {/* Training */}
      <Section title="Trainingserfahrung">
        <Row label="Trainingsdauer gesamt" value={p.training?.trainingAge} />
        <Row label="Strukturiertes Training seit" value={p.training?.structuredTrainingAge} />
        <Row label="Erfahrungslevel (Eigenbild)" value={p.training?.trainingExperienceLevel} />
        <Row label="Trainingshistorie" value={p.training?.trainingHistory} />
        <Row label="Bulk/Cut-Erfahrung" value={p.training?.bulkCutHistory} />
        <Row label="Trainierter Split" value={p.training?.previousSplit} />
        <Row label="Einheiten/Woche bisher" value={p.training?.weeklySessions != null ? `${p.training.weeklySessions}×` : undefined} />
        <Row label="Aktuelle Einheitsdauer" value={p.training?.currentSessionDuration != null ? `${p.training.currentSessionDuration} min` : undefined} />
        <Row label="Gewünschte Einheitsdauer" value={p.training?.desiredSessionDuration != null ? `${p.training.desiredSessionDuration} min` : undefined} />
        <Row label="Progressionsmethode" value={p.training?.progressionMethod} />
        <Row label="Leistungstracking" value={p.training?.tracksPerformance} />
        <Row label="Freie Gewichte / Maschinen" value={p.training?.freeWeightsOrMachines} />
        <Row label="Effektive Übungen" value={p.training?.effectiveExercises} />
        <Row label="Ineffektive Übungen" value={p.training?.ineffectiveExercises} />
        <Row label="Vermiedene Übungen" value={p.training?.avoidedExercises} />
        <Row label="Kraftwerte" value={p.training?.bestLifts} />
      </Section>

      {/* Availability */}
      <Section title="Trainingsverfügbarkeit">
        <Row label="Realist. Trainingstage/Woche" value={p.availability?.realisticTrainingDays != null ? `${p.availability.realisticTrainingDays}×` : undefined} />
        <Row label="Verfügbare Wochentage" value={days(p.availability?.availableWeekdays)} />
        <Row label="Gesperrte Wochentage" value={days(p.availability?.unavailableWeekdays)} />
        <Row label="Zeit pro Einheit" value={p.availability?.sessionTimeAvailable != null ? `${p.availability.sessionTimeAvailable} min` : undefined} />
        <Row label="Trainingsort" value={p.availability?.trainingLocation} />
        <Row label="Ausstattung" value={p.availability?.equipment} />
        <Row label="Zeitflexibilität (1–10)" value={p.availability?.scheduleFlexibility} />
        <Row label="Cardio möglich" value={p.availability?.cardioPossible} />
        <Row label="Realist. Cardioeinheiten/Woche" value={p.availability?.realisticCardioUnknown ? "weiß ich nicht" : p.availability?.realisticCardioSessions != null ? `${p.availability.realisticCardioSessions}×` : undefined} />
      </Section>

      {/* Goals */}
      <Section title="Ziele & Coaching-Erwartung">
        <Row label="Kurzfristiges Ziel" value={p.goals?.shortTermGoal} />
        <Row label="Langfristiges Ziel" value={p.goals?.longTermGoal} />
        <Row label="Prioritäten" value={p.goals?.priorities} />
        <Row label="Zieldatum/Event" value={p.goals?.noTargetDate ? "kein konkretes Datum" : p.goals?.targetDateOrEvent} />
        <Row label="Optik-Wichtigkeit (1–10)" value={p.goals?.physiqueImportance} />
        <Row label="Kraft-Wichtigkeit (1–10)" value={p.goals?.strengthImportance} />
        <Row label="Alltag-Wichtigkeit (1–10)" value={p.goals?.lifestyleImportance} />
        <Row label="Bisherige Hindernisse" value={p.goals?.previousBarriers} />
        <Row label="Erfolgsdefinition" value={p.goals?.successDefinition} />
        <Row label="Coaching-Stil" value={p.coachingPreferences?.preferenceStructureFlexibility} />
        <Row label="Feedback-Direktheit (1–10)" value={p.coachingPreferences?.feedbackDirectness} />
        <Row label="Erklärungstiefe" value={p.coachingPreferences?.explanationDepth} />
        <Row label="Motivationstreiber" value={p.coachingPreferences?.motivationDrivers} />
        <Row label="Check-in-Zuverlässigkeit (1–10)" value={p.coachingPreferences?.checkInReliability} />
      </Section>

      {/* Final Notes */}
      <Section title="Abschlussnotizen">
        <Row label="Was der Coach wissen sollte" value={p.finalNotes?.coachShouldKnow} />
        <Row label="Unterstützungsfokus" value={p.finalNotes?.supportFocus} />
        <Row label="Im Coaching vermeiden" value={p.finalNotes?.thingsToAvoid} />
      </Section>
    </div>
  );
}
