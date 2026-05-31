"use client";
import { useEffect, useRef, useState } from "react";
import { registerAthlete, loadAthletes } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Play, X } from "lucide-react";
import { AthleteProfile } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardData {
  // Step 1: Basisdaten
  name: string; email: string; pin: string; pinConfirm: string;
  birthDate: string; height: number; currentWeight: number;
  targetWeight: number; targetWeightUnknown: boolean;
  lowestWeight: number; lowestWeightUnknown: boolean;
  highestWeight: number; highestWeightUnknown: boolean;
  // Step 2: Lifestyle
  occupation: string; weeklyWorkloadHours: number; weeklyWorkloadUnknown: boolean;
  dailyPlanningScore: number; dailyRoutine: string; stressLevel: number;
  averageSteps: number; averageStepsUnknown: boolean; dailyActivityLevel: number;
  currentCardio: string; weeklyTimeInvestment: number;
  // Step 3: Recovery
  sleepHours: number; sleepHoursUnknown: boolean; sleepQuality: number;
  morningRecovery: number; sleepScheduleRegularity: number; shiftWork: string;
  sleepDisruptors: string[]; sleepDisruptorsOther: string;
  // Step 4: Health
  hasInjuries: string; injuriesDetail: string; problematicMovements: string;
  hasHealthIssues: string; healthIssuesDetail: string;
  medications: string; medicationsDetail: string;
  hasDigestionIssues: string; digestionDetail: string; otherLimitations: string;
  // Step 5: Nutrition
  dietType: string[]; currentNutritionConcept: string; currentTrackingStatus: string;
  preferredNutritionMethod: string; calorieCountingConfidence: number;
  macroConfidence: number; macroAdherenceConfidence: number;
  mealPlanAdherenceConfidence: number; nutritionProblems: string[];
  nutritionProblemsOther: string; currentCalories: number; currentCaloriesUnknown: boolean;
  knowsMacros: string; currentProtein: number; currentCarbs: number; currentFat: number;
  mealRegularity: number; eatingOutFrequency: string; weighingFoodWillingness: number;
  // Step 6: Food Preferences
  proteinSources: string[]; proteinSourcesOther: string;
  carbSources: string[]; carbSourcesOther: string;
  fatSources: string[]; fatSourcesOther: string;
  favoriteFoods: string; dislikedFoods: string; intoleratedFoods: string;
  triggerFoods: string; hungerTiming: string; cravingsFrequency: number;
  emotionalEatingFrequency: number; emotionalEatingSkipped: boolean;
  // Step 7: Supplements
  currentSupplements: string[]; currentSupplementsOther: string;
  supplementTiming: string; supplementTimingDetail: string;
  unwantedSupplements: string; caffeineMg: number; caffeineUnknown: boolean;
  caffeineSources: string[]; caffeineTiming: string;
  preWorkoutNutrition: string; postWorkoutNutrition: string;
  // Step 8: Training Experience
  trainingAge: string; structuredTrainingAge: string; trainingExperienceLevel: string;
  trainingHistory: string; bulkCutHistory: string; bulkCutHistoryDetail: string;
  previousSplit: string[]; previousSplitOther: string; weeklySessions: number;
  currentSessionDuration: number; desiredSessionDuration: number;
  progressionMethod: string[]; tracksPerformance: string;
  freeWeightsOrMachines: string; effectiveExercises: string;
  ineffectiveExercises: string; avoidedExercises: string; bestLifts: string;
  // Step 9: Availability
  realisticTrainingDays: number; availableWeekdays: number[];
  unavailableWeekdays: number[]; sessionTimeAvailable: number;
  trainingLocation: string; equipment: string; scheduleFlexibility: number;
  cardioPossible: string; realisticCardioSessions: number; realisticCardioUnknown: boolean;
  // Step 10: Goals & Coaching
  shortTermGoal: string; longTermGoal: string; priorities: string[];
  prioritiesOther: string; targetDateOrEvent: string; noTargetDate: boolean;
  physiqueImportance: number; strengthImportance: number; lifestyleImportance: number;
  previousBarriers: string; successDefinition: string;
  preferenceStructureFlexibility: string; feedbackDirectness: number;
  explanationDepth: string; motivationDrivers: string[]; motivationDriversOther: string;
  checkInReliability: number; preferredCheckInDay: number;
  // Step 11: Final Notes
  coachShouldKnow: string; supportFocus: string; thingsToAvoid: string; confirmed: boolean;
}

const DEFAULT: WizardData = {
  name: "", email: "", pin: "", pinConfirm: "",
  birthDate: "", height: 175, currentWeight: 75,
  targetWeight: 70, targetWeightUnknown: false,
  lowestWeight: 65, lowestWeightUnknown: false,
  highestWeight: 80, highestWeightUnknown: false,
  occupation: "", weeklyWorkloadHours: 40, weeklyWorkloadUnknown: false,
  dailyPlanningScore: 5, dailyRoutine: "", stressLevel: 5,
  averageSteps: 8000, averageStepsUnknown: false, dailyActivityLevel: 5,
  currentCardio: "", weeklyTimeInvestment: 5,
  sleepHours: 7, sleepHoursUnknown: false, sleepQuality: 6,
  morningRecovery: 6, sleepScheduleRegularity: 6, shiftWork: "",
  sleepDisruptors: [], sleepDisruptorsOther: "",
  hasInjuries: "", injuriesDetail: "", problematicMovements: "",
  hasHealthIssues: "", healthIssuesDetail: "",
  medications: "", medicationsDetail: "",
  hasDigestionIssues: "", digestionDetail: "", otherLimitations: "",
  dietType: [], currentNutritionConcept: "", currentTrackingStatus: "",
  preferredNutritionMethod: "", calorieCountingConfidence: 5,
  macroConfidence: 5, macroAdherenceConfidence: 5, mealPlanAdherenceConfidence: 5,
  nutritionProblems: [], nutritionProblemsOther: "",
  currentCalories: 2000, currentCaloriesUnknown: false,
  knowsMacros: "", currentProtein: 0, currentCarbs: 0, currentFat: 0,
  mealRegularity: 5, eatingOutFrequency: "", weighingFoodWillingness: 5,
  proteinSources: [], proteinSourcesOther: "",
  carbSources: [], carbSourcesOther: "",
  fatSources: [], fatSourcesOther: "",
  favoriteFoods: "", dislikedFoods: "", intoleratedFoods: "",
  triggerFoods: "", hungerTiming: "", cravingsFrequency: 3,
  emotionalEatingFrequency: 3, emotionalEatingSkipped: false,
  currentSupplements: [], currentSupplementsOther: "",
  supplementTiming: "", supplementTimingDetail: "",
  unwantedSupplements: "", caffeineMg: 200, caffeineUnknown: false,
  caffeineSources: [], caffeineTiming: "", preWorkoutNutrition: "", postWorkoutNutrition: "",
  trainingAge: "", structuredTrainingAge: "", trainingExperienceLevel: "",
  trainingHistory: "", bulkCutHistory: "", bulkCutHistoryDetail: "",
  previousSplit: [], previousSplitOther: "", weeklySessions: 3,
  currentSessionDuration: 60, desiredSessionDuration: 60,
  progressionMethod: [], tracksPerformance: "", freeWeightsOrMachines: "",
  effectiveExercises: "", ineffectiveExercises: "", avoidedExercises: "", bestLifts: "",
  realisticTrainingDays: 3, availableWeekdays: [], unavailableWeekdays: [],
  sessionTimeAvailable: 60, trainingLocation: "", equipment: "",
  scheduleFlexibility: 5, cardioPossible: "", realisticCardioSessions: 0,
  realisticCardioUnknown: false,
  shortTermGoal: "", longTermGoal: "", priorities: [], prioritiesOther: "",
  targetDateOrEvent: "", noTargetDate: false,
  physiqueImportance: 7, strengthImportance: 6, lifestyleImportance: 6,
  previousBarriers: "", successDefinition: "",
  preferenceStructureFlexibility: "", feedbackDirectness: 7,
  explanationDepth: "", motivationDrivers: [], motivationDriversOther: "",
  checkInReliability: 7, preferredCheckInDay: 1,
  coachShouldKnow: "", supportFocus: "", thingsToAvoid: "", confirmed: false,
};

const STEPS = [
  "Basisdaten", "Alltag & Lifestyle", "Schlaf & Regeneration",
  "Gesundheit", "Ernährung", "Lebensmittel",
  "Supplemente", "Trainingserfahrung", "Verfügbarkeit",
  "Ziele & Coaching", "Abschluss",
];

// Intro-Video: videoUrl setzen sobald vorhanden, sonst Platzhalter
const INTRO_DURATION = 25; // Sekunden — später durch echte Videodauer ersetzen
const TOTAL_STEPS = STEPS.length + 1; // 1 Intro + 11 Fragebogen

type Phase = "intro" | "questionnaire" | "complete";

// ─── Shared UI primitives ──────────────────────────────────────────────────────

const inp = "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full placeholder:text-[#3b4d6a]";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-[#8fa3c0]">{children}</p>;
}

function Q({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-[#4a6080] mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function TextField({ label, hint, value, onChange, placeholder, rows }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <Q label={label} hint={hint}>
      {rows
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
            placeholder={placeholder} className={`${inp} resize-none`} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder} className={inp} />}
    </Q>
  );
}

function NumberField({ label, hint, value, onChange, min, max, step, unit, unknown, onUnknown, unknownLabel }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string;
  unknown?: boolean; onUnknown?: (v: boolean) => void; unknownLabel?: string;
}) {
  return (
    <Q label={label} hint={hint}>
      <div className="flex gap-2 items-center">
        <input
          type="number" value={unknown ? "" : value}
          onChange={(e) => { onChange(Number(e.target.value)); if (onUnknown) onUnknown(false); }}
          min={min} max={max} step={step}
          disabled={unknown}
          placeholder={unit ?? ""}
          className={cn(inp, "flex-1", unknown && "opacity-40")}
        />
        {unit && !unknown && <span className="text-xs text-[#5a7090] shrink-0">{unit}</span>}
        {onUnknown && (
          <Toggle active={!!unknown} onClick={() => onUnknown(!unknown)} className="shrink-0 text-xs whitespace-nowrap">
            {unknownLabel ?? "weiß ich nicht"}
          </Toggle>
        )}
      </div>
    </Q>
  );
}

function SliderField({ label, hint, value, onChange, min, max, step, labelMin, labelMax, unit }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; labelMin?: string; labelMax?: string; unit?: string;
}) {
  const mn = min ?? 1; const mx = max ?? 10;
  return (
    <Q label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input type="range" min={mn} max={mx} step={step ?? 1} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[#3b82f6]" />
        <span className="w-12 text-right text-sm font-semibold text-[#60a5fa]">
          {value}{unit ?? ""}
        </span>
      </div>
      {(labelMin || labelMax) && (
        <div className="flex justify-between text-xs text-[#4a6080]">
          <span>{labelMin}</span><span>{labelMax}</span>
        </div>
      )}
    </Q>
  );
}

function Toggle({ active, onClick, children, className }: {
  active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn(
      "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
      active ? "bg-[#3b82f6]/15 border-[#3b82f6]/50 text-[#60a5fa]"
              : "bg-[#0f1624] border-[#1e2d42] text-[#5a7090] hover:border-[#3b82f6]/30 hover:text-[#8fa3c0]",
      className,
    )}>
      {children}
    </button>
  );
}

function SingleSelect({ label, hint, options, value, onChange }: {
  label: string; hint?: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <Q label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Toggle key={o} active={value === o} onClick={() => onChange(value === o ? "" : o)}>
            {o}
          </Toggle>
        ))}
      </div>
    </Q>
  );
}

function MultiSelect({ label, hint, options, value, onChange, other, onOther }: {
  label: string; hint?: string; options: string[]; value: string[];
  onChange: (v: string[]) => void; other?: string; onOther?: (v: string) => void;
}) {
  function toggle(o: string) {
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  }
  return (
    <Q label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Toggle key={o} active={value.includes(o)} onClick={() => toggle(o)}>
            {o}
          </Toggle>
        ))}
      </div>
      {onOther !== undefined && (
        <input type="text" value={other ?? ""} onChange={(e) => onOther(e.target.value)}
          placeholder="Sonstiges (optional)" className={cn(inp, "mt-1")} />
      )}
    </Q>
  );
}

function WeekdaySelect({ label, hint, value, onChange }: {
  label: string; hint?: string; value: number[]; onChange: (v: number[]) => void;
}) {
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  return (
    <Q label={label} hint={hint}>
      <div className="flex gap-2 flex-wrap">
        {days.map((d, i) => {
          const num = i + 1 === 7 ? 0 : i + 1;
          return (
            <Toggle key={d} active={value.includes(num)}
              onClick={() => onChange(value.includes(num) ? value.filter((x) => x !== num) : [...value, num])}>
              {d}
            </Toggle>
          );
        })}
      </div>
    </Q>
  );
}

function PinField({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <Q label={label} hint={hint}>
      <input type="password" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "PIN"} autoComplete="new-password"
        className={inp} />
    </Q>
  );
}

function SectionDivider({ children }: { children: string }) {
  return <p className="text-xs text-[#5a7090] uppercase tracking-widest pt-2 pb-1 border-b border-[#1e2d42]">{children}</p>;
}

// ─── Wizard Steps ──────────────────────────────────────────────────────────────

function Step1({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <SectionDivider>Persönliche Angaben</SectionDivider>
      <TextField label="Wie heißt du vollständig?" value={d.name} onChange={(v) => u({ name: v })} placeholder="Vor- und Nachname" />
      <Q label="Wie lautet deine E-Mail-Adresse?">
        <input type="email" value={d.email} onChange={(e) => u({ email: e.target.value })}
          placeholder="deine@email.de" autoComplete="email" className={inp} />
      </Q>
      <Q label="Wann bist du geboren?" hint="Optional">
        <input type="date" value={d.birthDate} onChange={(e) => u({ birthDate: e.target.value })} className={inp} />
      </Q>
      <SectionDivider>Körperdaten</SectionDivider>
      <SliderField label="Wie groß bist du?" value={d.height} onChange={(v) => u({ height: v })}
        min={140} max={220} unit=" cm" labelMin="140 cm" labelMax="220 cm" />
      <SliderField label="Wie viel wiegst du aktuell?" value={d.currentWeight}
        onChange={(v) => u({ currentWeight: v })} min={40} max={180} step={0.5} unit=" kg"
        labelMin="40 kg" labelMax="180 kg" />
      <Q label="Was ist dein aktuelles Zielgewicht?">
        <div className="flex flex-col gap-2">
          {!d.targetWeightUnknown && (
            <div className="flex items-center gap-3">
              <input type="range" min={40} max={180} step={0.5} value={d.targetWeight}
                onChange={(e) => u({ targetWeight: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
              <span className="w-16 text-right text-sm font-semibold text-[#60a5fa]">{d.targetWeight} kg</span>
            </div>
          )}
          <Toggle active={d.targetWeightUnknown} onClick={() => u({ targetWeightUnknown: !d.targetWeightUnknown })}>
            Noch unklar
          </Toggle>
        </div>
      </Q>
      <Q label="Niedrigstes Gewicht der letzten 3 Jahre?" hint="Optional">
        <div className="flex gap-2 items-center">
          <input type="number" value={d.lowestWeightUnknown ? "" : d.lowestWeight} step={0.5}
            onChange={(e) => u({ lowestWeight: Number(e.target.value), lowestWeightUnknown: false })}
            disabled={d.lowestWeightUnknown} placeholder="kg"
            className={cn(inp, "flex-1", d.lowestWeightUnknown && "opacity-40")} />
          <Toggle active={d.lowestWeightUnknown} onClick={() => u({ lowestWeightUnknown: !d.lowestWeightUnknown })}>
            Weiß ich nicht
          </Toggle>
        </div>
      </Q>
      <Q label="Höchstes Gewicht der letzten 3 Jahre?" hint="Optional">
        <div className="flex gap-2 items-center">
          <input type="number" value={d.highestWeightUnknown ? "" : d.highestWeight} step={0.5}
            onChange={(e) => u({ highestWeight: Number(e.target.value), highestWeightUnknown: false })}
            disabled={d.highestWeightUnknown} placeholder="kg"
            className={cn(inp, "flex-1", d.highestWeightUnknown && "opacity-40")} />
          <Toggle active={d.highestWeightUnknown} onClick={() => u({ highestWeightUnknown: !d.highestWeightUnknown })}>
            Weiß ich nicht
          </Toggle>
        </div>
      </Q>
      <SectionDivider>Login einrichten</SectionDivider>
      <PinField label="Lege deine PIN fest." hint="Mindestens 4 Zeichen" value={d.pin} onChange={(v) => u({ pin: v })} placeholder="PIN wählen" />
      <PinField label="Bestätige deine PIN." value={d.pinConfirm} onChange={(v) => u({ pinConfirm: v })} placeholder="PIN wiederholen" />
    </div>
  );
}

function Step2({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <TextField label="Was machst du beruflich oder im Alltag hauptsächlich?" value={d.occupation}
        onChange={(v) => u({ occupation: v })} placeholder="z. B. Büroangestellter, Student, Handwerker…" />
      <Q label="Wie viele Stunden arbeitest/studierst du ungefähr pro Woche?">
        {!d.weeklyWorkloadUnknown && (
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={80} step={1} value={d.weeklyWorkloadHours}
              onChange={(e) => u({ weeklyWorkloadHours: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
            <span className="w-14 text-right text-sm font-semibold text-[#60a5fa]">{d.weeklyWorkloadHours} h</span>
          </div>
        )}
        <Toggle active={d.weeklyWorkloadUnknown} onClick={() => u({ weeklyWorkloadUnknown: !d.weeklyWorkloadUnknown })}>
          Weiß ich nicht genau
        </Toggle>
      </Q>
      <SliderField label="Wie planbar ist dein Alltag aktuell?" value={d.dailyPlanningScore}
        onChange={(v) => u({ dailyPlanningScore: v })} min={1} max={10}
        labelMin="kaum planbar" labelMax="sehr planbar" />
      <TextField label="Beschreibe kurz deine typische Tagesroutine." hint="Optional"
        value={d.dailyRoutine} onChange={(v) => u({ dailyRoutine: v })} rows={2}
        placeholder="z. B. 9–18 Uhr Büro, Training nach der Arbeit…" />
      <SliderField label="Wie hoch ist dein Stresspegel im Alltag?" value={d.stressLevel}
        onChange={(v) => u({ stressLevel: v })} min={1} max={10}
        labelMin="sehr niedrig" labelMax="sehr hoch" />
      <Q label="Wie viele Schritte machst du durchschnittlich pro Tag?">
        {!d.averageStepsUnknown && (
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={30000} step={500} value={d.averageSteps}
              onChange={(e) => u({ averageSteps: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
            <span className="w-20 text-right text-sm font-semibold text-[#60a5fa]">{d.averageSteps.toLocaleString("de")}</span>
          </div>
        )}
        <Toggle active={d.averageStepsUnknown} onClick={() => u({ averageStepsUnknown: !d.averageStepsUnknown })}>
          Weiß ich nicht
        </Toggle>
      </Q>
      <SliderField label="Wie körperlich aktiv ist dein Alltag außerhalb des Trainings?" value={d.dailyActivityLevel}
        onChange={(v) => u({ dailyActivityLevel: v })} min={1} max={10}
        labelMin="fast nur sitzend" labelMax="sehr aktiv" />
      <SingleSelect label="Machst du aktuell zusätzlich Cardio oder Ausdauertraining?"
        options={["Nein", "Ja, gelegentlich", "Ja, regelmäßig", "Unsicher/wechselhaft"]}
        value={d.currentCardio} onChange={(v) => u({ currentCardio: v })} />
      <Q label="Wie viel Zeit kannst du realistisch pro Woche für Training, Ernährung und Check-ins investieren?">
        <div className="flex items-center gap-3">
          <input type="range" min={1} max={20} step={0.5} value={d.weeklyTimeInvestment}
            onChange={(e) => u({ weeklyTimeInvestment: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
          <span className="w-14 text-right text-sm font-semibold text-[#60a5fa]">{d.weeklyTimeInvestment} h</span>
        </div>
        <div className="flex justify-between text-xs text-[#4a6080]"><span>1 h</span><span>20 h</span></div>
      </Q>
    </div>
  );
}

function Step3({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  const disruptorOpts = ["Stress", "Handy/Screenzeit", "Spätes Essen", "Koffein",
    "Unregelmäßige Zeiten", "Lärm", "Arbeit/Schicht", "Nichts Spezifisches", "Anderes"];
  return (
    <div className="flex flex-col gap-5">
      <Q label="Wie viele Stunden schläfst du durchschnittlich pro Nacht?">
        {!d.sleepHoursUnknown && (
          <div className="flex items-center gap-3">
            <input type="range" min={3} max={12} step={0.25} value={d.sleepHours}
              onChange={(e) => u({ sleepHours: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
            <span className="w-14 text-right text-sm font-semibold text-[#60a5fa]">{d.sleepHours} h</span>
          </div>
        )}
        <Toggle active={d.sleepHoursUnknown} onClick={() => u({ sleepHoursUnknown: !d.sleepHoursUnknown })}>
          Weiß ich nicht
        </Toggle>
      </Q>
      <SliderField label="Wie bewertest du deine Schlafqualität?" value={d.sleepQuality}
        onChange={(v) => u({ sleepQuality: v })} min={1} max={10}
        labelMin="sehr schlecht" labelMax="sehr gut" />
      <SliderField label="Wie erholt fühlst du dich morgens meistens?" value={d.morningRecovery}
        onChange={(v) => u({ morningRecovery: v })} min={1} max={10}
        labelMin="kaum erholt" labelMax="sehr erholt" />
      <SliderField label="Wie regelmäßig sind deine Schlafenszeiten?" value={d.sleepScheduleRegularity}
        onChange={(v) => u({ sleepScheduleRegularity: v })} min={1} max={10}
        labelMin="sehr unregelmäßig" labelMax="sehr regelmäßig" />
      <SingleSelect label="Hast du Schichtarbeit oder stark wechselnde Tagesrhythmen?"
        options={["Nein", "Ja", "Teilweise"]}
        value={d.shiftWork} onChange={(v) => u({ shiftWork: v })} />
      <MultiSelect label="Was stört deinen Schlaf aktuell am meisten?" hint="Mehrere möglich"
        options={disruptorOpts} value={d.sleepDisruptors}
        onChange={(v) => u({ sleepDisruptors: v })}
        other={d.sleepDisruptorsOther} onOther={(v) => u({ sleepDisruptorsOther: v })} />
    </div>
  );
}

function Step4({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-[#5a7090] bg-[#1e2d42]/40 rounded-xl p-3">
        Diese Angaben ersetzen keine medizinische Beratung. Sie helfen dabei, Training und Ernährung besser an deine Situation anzupassen.
      </p>
      <SingleSelect label="Gibt es Verletzungen, die dein Training beeinflussen?"
        options={["Nein", "Ja", "Unsicher"]} value={d.hasInjuries}
        onChange={(v) => u({ hasInjuries: v })} />
      {d.hasInjuries === "Ja" && (
        <TextField label="Welche Verletzungen?" value={d.injuriesDetail}
          onChange={(v) => u({ injuriesDetail: v })} placeholder="z. B. Knieschmerzen links, Schulter…" rows={2} />
      )}
      <TextField label="Welche Übungen oder Bewegungen verursachen aktuell Beschwerden?" hint="Optional"
        value={d.problematicMovements} onChange={(v) => u({ problematicMovements: v })}
        placeholder="z. B. Kniebeuge, Overhead Press…" />
      <SingleSelect label="Gibt es gesundheitliche Einschränkungen, die ich berücksichtigen sollte?"
        options={["Nein", "Ja", "Weiß ich nicht"]} value={d.hasHealthIssues}
        onChange={(v) => u({ hasHealthIssues: v })} />
      {d.hasHealthIssues === "Ja" && (
        <TextField label="Welche Einschränkungen?" value={d.healthIssuesDetail}
          onChange={(v) => u({ healthIssuesDetail: v })} rows={2} />
      )}
      <SingleSelect label="Nimmst du Medikamente oder Präparate, die für Training/Ernährung relevant sein könnten?"
        options={["Nein", "Ja", "Weiß ich nicht", "Möchte ich nicht angeben"]}
        value={d.medications} onChange={(v) => u({ medications: v })} />
      {d.medications === "Ja" && (
        <TextField label="Welche Medikamente/Präparate?" value={d.medicationsDetail}
          onChange={(v) => u({ medicationsDetail: v })} rows={2} />
      )}
      <SingleSelect label="Hast du Verdauungsprobleme, Unverträglichkeiten oder Allergien?"
        options={["Nein", "Ja", "Unsicher"]} value={d.hasDigestionIssues}
        onChange={(v) => u({ hasDigestionIssues: v })} />
      {d.hasDigestionIssues === "Ja" && (
        <TextField label="Welche?" value={d.digestionDetail}
          onChange={(v) => u({ digestionDetail: v })} rows={2} />
      )}
      <TextField label="Gibt es sonstige Einschränkungen, die ich kennen sollte?" hint="Optional"
        value={d.otherLimitations} onChange={(v) => u({ otherLimitations: v })} rows={2} />
    </div>
  );
}

function Step5({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  const dietOpts = ["Keine spezielle Ernährungsform", "Vegetarisch", "Vegan", "Pescetarisch",
    "Halal", "Low Carb", "High Carb", "Intermittent Fasting", "Andere"];
  const problemOpts = ["Hunger", "Heißhunger", "Zeitmangel", "Auswärtsessen", "Soziale Situationen",
    "Unsicherheit bei Lebensmitteln", "Fehlende Struktur", "Wochenende", "Keine großen Probleme", "Anderes"];
  return (
    <div className="flex flex-col gap-5">
      <MultiSelect label="Welche Ernährungsform passt aktuell am ehesten zu dir?" hint="Mehrere möglich"
        options={dietOpts} value={d.dietType} onChange={(v) => u({ dietType: v })} />
      <TextField label="Wie würdest du dein aktuelles Ernährungskonzept beschreiben?" hint="Optional"
        value={d.currentNutritionConcept} onChange={(v) => u({ currentNutritionConcept: v })} rows={2} />
      <SingleSelect label="Trackst du aktuell Kalorien oder Makronährstoffe?"
        options={["Ja, regelmäßig", "Gelegentlich", "Früher mal", "Nein"]}
        value={d.currentTrackingStatus} onChange={(v) => u({ currentTrackingStatus: v })} />
      <SingleSelect label="Was wäre dir lieber?"
        options={["Kalorien/Makros tracken", "Fester Ernährungsplan", "Mischung aus beidem", "Noch unklar"]}
        value={d.preferredNutritionMethod} onChange={(v) => u({ preferredNutritionMethod: v })} />
      <SliderField label="Wie vertraut bist du mit Kalorienzählen?" value={d.calorieCountingConfidence}
        onChange={(v) => u({ calorieCountingConfidence: v })} min={1} max={10}
        labelMin="gar nicht" labelMax="sehr vertraut" />
      <SliderField label="Wie sicher bist du beim Einschätzen von Makronährstoffen?" value={d.macroConfidence}
        onChange={(v) => u({ macroConfidence: v })} min={1} max={10}
        labelMin="gar nicht" labelMax="sehr sicher" />
      <SliderField label="Wie gut kannst du dir vorstellen, vorgegebene Makros einzuhalten?" value={d.macroAdherenceConfidence}
        onChange={(v) => u({ macroAdherenceConfidence: v })} min={1} max={10}
        labelMin="schwer vorstellbar" labelMax="sehr gut vorstellbar" />
      <SliderField label="Wie gut kannst du dir vorstellen, dich an einen festen Ernährungsplan zu halten?" value={d.mealPlanAdherenceConfidence}
        onChange={(v) => u({ mealPlanAdherenceConfidence: v })} min={1} max={10}
        labelMin="schwer vorstellbar" labelMax="sehr gut vorstellbar" />
      <MultiSelect label="Was sind aktuell deine größten Probleme bei Ernährung oder Tracking?" hint="Mehrere möglich"
        options={problemOpts} value={d.nutritionProblems}
        onChange={(v) => u({ nutritionProblems: v })}
        other={d.nutritionProblemsOther} onOther={(v) => u({ nutritionProblemsOther: v })} />
      <Q label="Wie viele Kalorien isst du aktuell ungefähr pro Tag?">
        {!d.currentCaloriesUnknown && (
          <div className="flex items-center gap-3">
            <input type="range" min={1000} max={6000} step={50} value={d.currentCalories}
              onChange={(e) => u({ currentCalories: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
            <span className="w-20 text-right text-sm font-semibold text-[#60a5fa]">{d.currentCalories} kcal</span>
          </div>
        )}
        <Toggle active={d.currentCaloriesUnknown} onClick={() => u({ currentCaloriesUnknown: !d.currentCaloriesUnknown })}>
          Weiß ich nicht
        </Toggle>
      </Q>
      <SingleSelect label="Kennst du deine aktuelle Makroverteilung?"
        options={["Nein", "Ja", "Ungefähr"]} value={d.knowsMacros}
        onChange={(v) => u({ knowsMacros: v })} />
      {(d.knowsMacros === "Ja" || d.knowsMacros === "Ungefähr") && (
        <div className="grid grid-cols-3 gap-3">
          {([["Protein (g)", "currentProtein"], ["Carbs (g)", "currentCarbs"], ["Fett (g)", "currentFat"]] as [string, keyof WizardData][]).map(([l, k]) => (
            <div key={k} className="flex flex-col gap-1">
              <span className="text-xs text-[#5a7090]">{l}</span>
              <input type="number" value={(d[k] as number) || ""} onChange={(e) => u({ [k]: Number(e.target.value) })}
                placeholder="0" className={inp} />
            </div>
          ))}
        </div>
      )}
      <SliderField label="Wie regelmäßig sind deine Mahlzeiten aktuell?" value={d.mealRegularity}
        onChange={(v) => u({ mealRegularity: v })} min={1} max={10}
        labelMin="sehr unregelmäßig" labelMax="sehr regelmäßig" />
      <SingleSelect label="Wie oft isst du außer Haus?"
        options={["Selten", "1–2× pro Woche", "3–5× pro Woche", "Fast täglich"]}
        value={d.eatingOutFrequency} onChange={(v) => u({ eatingOutFrequency: v })} />
      <SliderField label="Wie bereit bist du, Lebensmittel abzuwiegen?" value={d.weighingFoodWillingness}
        onChange={(v) => u({ weighingFoodWillingness: v })} min={1} max={10}
        labelMin="gar nicht bereit" labelMax="sehr bereit" />
    </div>
  );
}

function Step6({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  const proteinOpts = ["Hähnchen", "Rind", "Fisch", "Eier", "Magerquark/Skyr", "Whey", "Tofu/Tempeh", "Hülsenfrüchte"];
  const carbOpts = ["Reis", "Kartoffeln", "Nudeln", "Haferflocken", "Brot/Brötchen", "Obst", "Cerealien"];
  const fatOpts = ["Nüsse", "Öl", "Avocado", "Eier", "Fetter Fisch", "Käse", "Nussmus"];
  const hungerOpts = ["Morgens", "Mittags", "Abends", "Nachts", "Unterschiedlich", "Selten Hunger"];
  return (
    <div className="flex flex-col gap-5">
      <MultiSelect label="Welche Proteinquellen isst du häufig?" options={proteinOpts}
        value={d.proteinSources} onChange={(v) => u({ proteinSources: v })}
        other={d.proteinSourcesOther} onOther={(v) => u({ proteinSourcesOther: v })} />
      <MultiSelect label="Welche Kohlenhydratquellen isst du häufig?" options={carbOpts}
        value={d.carbSources} onChange={(v) => u({ carbSources: v })}
        other={d.carbSourcesOther} onOther={(v) => u({ carbSourcesOther: v })} />
      <MultiSelect label="Welche Fettquellen isst du häufig?" options={fatOpts}
        value={d.fatSources} onChange={(v) => u({ fatSources: v })}
        other={d.fatSourcesOther} onOther={(v) => u({ fatSourcesOther: v })} />
      <TextField label="Welche Lebensmittel isst du besonders gerne?" hint="Optional"
        value={d.favoriteFoods} onChange={(v) => u({ favoriteFoods: v })} placeholder="z. B. Hähnchen, Reis, Bananen…" />
      <TextField label="Welche Lebensmittel magst du gar nicht?" hint="Optional"
        value={d.dislikedFoods} onChange={(v) => u({ dislikedFoods: v })} />
      <TextField label="Welche Lebensmittel verträgst du nicht?" hint="Optional"
        value={d.intoleratedFoods} onChange={(v) => u({ intoleratedFoods: v })} />
      <TextField label="Gibt es Lebensmittel, bei denen du schwer Maß halten kannst?" hint="Optional"
        value={d.triggerFoods} onChange={(v) => u({ triggerFoods: v })} placeholder="z. B. Nüsse, Süßigkeiten…" />
      <SingleSelect label="Wann hast du meistens am meisten Hunger?"
        options={hungerOpts} value={d.hungerTiming} onChange={(v) => u({ hungerTiming: v })} />
      <SliderField label="Wie häufig hast du Heißhunger?" value={d.cravingsFrequency}
        onChange={(v) => u({ cravingsFrequency: v })} min={1} max={10}
        labelMin="fast nie" labelMax="sehr häufig" />
      <Q label="Wie häufig isst du aus Stress, Langeweile oder Emotionen?">
        {!d.emotionalEatingSkipped && (
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={10} step={1} value={d.emotionalEatingFrequency}
              onChange={(e) => u({ emotionalEatingFrequency: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
            <span className="w-6 text-right text-sm font-semibold text-[#60a5fa]">{d.emotionalEatingFrequency}</span>
          </div>
        )}
        <Toggle active={d.emotionalEatingSkipped} onClick={() => u({ emotionalEatingSkipped: !d.emotionalEatingSkipped })}>
          Möchte ich nicht beantworten
        </Toggle>
      </Q>
    </div>
  );
}

function Step7({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  const suppOpts = ["Kreatin", "Whey", "Omega 3", "Vitamin D3/K2", "Magnesium", "Zink",
    "Ashwagandha", "Melatonin", "Elektrolyte", "Multivitamin", "Keine"];
  const caffeineSourceOpts = ["Kaffee", "Energy Drinks", "Pre-Workout-Booster", "Tee", "Cola/Softdrinks", "Kein Koffein"];
  return (
    <div className="flex flex-col gap-5">
      <MultiSelect label="Welche Supplemente nimmst du aktuell?" hint="Mehrere möglich"
        options={suppOpts} value={d.currentSupplements}
        onChange={(v) => u({ currentSupplements: v })}
        other={d.currentSupplementsOther} onOther={(v) => u({ currentSupplementsOther: v })} />
      <SingleSelect label="Kennst du Dosierungen und Einnahmezeiten?"
        options={["Ja", "Teilweise", "Nein"]} value={d.supplementTiming}
        onChange={(v) => u({ supplementTiming: v })} />
      {d.supplementTiming && d.supplementTiming !== "Nein" && (
        <TextField label="Details (optional)" value={d.supplementTimingDetail}
          onChange={(v) => u({ supplementTimingDetail: v })} rows={2} />
      )}
      <TextField label="Gibt es Supplemente, die du nicht nehmen möchtest?" hint="Optional"
        value={d.unwantedSupplements} onChange={(v) => u({ unwantedSupplements: v })} />
      <Q label="Wie viel Koffein konsumierst du ungefähr pro Tag?">
        {!d.caffeineUnknown && (
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={800} step={25} value={d.caffeineMg}
              onChange={(e) => u({ caffeineMg: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
            <span className="w-16 text-right text-sm font-semibold text-[#60a5fa]">{d.caffeineMg} mg</span>
          </div>
        )}
        <Toggle active={d.caffeineUnknown} onClick={() => u({ caffeineUnknown: !d.caffeineUnknown })}>
          Weiß ich nicht
        </Toggle>
      </Q>
      <MultiSelect label="Woher kommt dein Koffein hauptsächlich?" hint="Mehrere möglich"
        options={caffeineSourceOpts} value={d.caffeineSources}
        onChange={(v) => u({ caffeineSources: v })} />
      <SingleSelect label="Wann konsumierst du meistens Koffein?"
        options={["Morgens", "Mittags", "Nachmittags", "Abends", "Unterschiedlich", "Kein Koffein"]}
        value={d.caffeineTiming} onChange={(v) => u({ caffeineTiming: v })} />
      <SingleSelect label="Achtest du aktuell auf Pre-Workout-Nutrition?"
        options={["Ja", "Teilweise", "Nein", "Weiß ich nicht"]}
        value={d.preWorkoutNutrition} onChange={(v) => u({ preWorkoutNutrition: v })} />
      <SingleSelect label="Achtest du aktuell auf Post-Workout-Nutrition?"
        options={["Ja", "Teilweise", "Nein", "Weiß ich nicht"]}
        value={d.postWorkoutNutrition} onChange={(v) => u({ postWorkoutNutrition: v })} />
    </div>
  );
}

function Step8({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  const ageOpts = ["Unter 6 Monate", "6–12 Monate", "1–2 Jahre", "2–5 Jahre", "Über 5 Jahre"];
  const levelOpts = ["Anfänger", "Leicht fortgeschritten", "Fortgeschritten", "Sehr fortgeschritten", "Wettkampferfahren", "Unsicher"];
  const splitOpts = ["Ganzkörper", "Oberkörper/Unterkörper", "Push/Pull/Legs", "Arnold Split", "Bro Split", "Individuell", "Kein fester Split"];
  const progressionOpts = ["Logbuch", "Mehr Gewicht", "Mehr Wiederholungen", "Mehr Volumen",
    "Bessere Technik", "Gefühl/Pump", "Gar nicht gezielt", "Weiß ich nicht"];
  return (
    <div className="flex flex-col gap-5">
      <SingleSelect label="Wie lange trainierst du bereits regelmäßig?"
        options={ageOpts} value={d.trainingAge} onChange={(v) => u({ trainingAge: v })} />
      <SingleSelect label="Wie lange trainierst du bereits ambitioniert oder strukturiert?"
        options={ageOpts} value={d.structuredTrainingAge} onChange={(v) => u({ structuredTrainingAge: v })} />
      <SingleSelect label="Wie würdest du dein Erfahrungslevel einschätzen?"
        options={levelOpts} value={d.trainingExperienceLevel}
        onChange={(v) => u({ trainingExperienceLevel: v })} />
      <TextField label="Beschreibe kurz deine Trainingskarriere." hint="Optional"
        value={d.trainingHistory} onChange={(v) => u({ trainingHistory: v })} rows={3}
        placeholder="z. B. 3 Jahre Kraftsport, früher Fußball…" />
      <SingleSelect label="Hattest du schon Aufbau- oder Diätphasen?"
        options={["Nein", "Ja, Aufbau", "Ja, Diät", "Ja, beides"]}
        value={d.bulkCutHistory} onChange={(v) => u({ bulkCutHistory: v })} />
      {(d.bulkCutHistory && d.bulkCutHistory !== "Nein") && (
        <TextField label="Details (optional)" value={d.bulkCutHistoryDetail}
          onChange={(v) => u({ bulkCutHistoryDetail: v })} rows={2} />
      )}
      <MultiSelect label="Welchen Split hast du bisher trainiert?" hint="Mehrere möglich"
        options={splitOpts} value={d.previousSplit}
        onChange={(v) => u({ previousSplit: v })}
        other={d.previousSplitOther} onOther={(v) => u({ previousSplitOther: v })} />
      <SliderField label="Wie viele Einheiten pro Woche hast du bisher trainiert?" value={d.weeklySessions}
        onChange={(v) => u({ weeklySessions: v })} min={0} max={7}
        labelMin="0" labelMax="7×/Woche" />
      <SliderField label="Wie lange dauert eine Einheit aktuell durchschnittlich?" value={d.currentSessionDuration}
        onChange={(v) => u({ currentSessionDuration: v })} min={30} max={180} step={5} unit=" min"
        labelMin="30 min" labelMax="180 min" />
      <SliderField label="Wie viel Zeit möchtest du künftig pro Einheit investieren?" value={d.desiredSessionDuration}
        onChange={(v) => u({ desiredSessionDuration: v })} min={30} max={180} step={5} unit=" min"
        labelMin="30 min" labelMax="180 min" />
      <MultiSelect label="Wie hast du bisher Progression im Training sichergestellt?" hint="Mehrere möglich"
        options={progressionOpts} value={d.progressionMethod}
        onChange={(v) => u({ progressionMethod: v })} />
      <SingleSelect label="Trackst du deine Trainingsleistungen?"
        options={["Ja, konsequent", "Teilweise", "Selten", "Nein"]}
        value={d.tracksPerformance} onChange={(v) => u({ tracksPerformance: v })} />
      <SingleSelect label="Trainierst du lieber mit freien Gewichten oder Maschinen?"
        options={["Freie Gewichte", "Maschinen", "Mischung", "Keine Präferenz"]}
        value={d.freeWeightsOrMachines} onChange={(v) => u({ freeWeightsOrMachines: v })} />
      <TextField label="Welche Übungen haben für dich gut funktioniert?" hint="Optional"
        value={d.effectiveExercises} onChange={(v) => u({ effectiveExercises: v })} rows={2} />
      <TextField label="Welche Übungen haben für dich nicht gut funktioniert?" hint="Optional"
        value={d.ineffectiveExercises} onChange={(v) => u({ ineffectiveExercises: v })} rows={2} />
      <TextField label="Gibt es Übungen, die du vermeiden möchtest?" hint="Optional"
        value={d.avoidedExercises} onChange={(v) => u({ avoidedExercises: v })} />
      <TextField label="Welche Kraftwerte oder Referenzleistungen sollte ich kennen?" hint="Optional"
        value={d.bestLifts} onChange={(v) => u({ bestLifts: v })} placeholder="z. B. Bankdrücken 100 kg × 5…" rows={2} />
    </div>
  );
}

function Step9({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <SliderField label="Wie viele Trainingstage pro Woche sind realistisch?" value={d.realisticTrainingDays}
        onChange={(v) => u({ realisticTrainingDays: v })} min={1} max={7}
        labelMin="1×" labelMax="7×" />
      <WeekdaySelect label="An welchen Wochentagen kannst du trainieren?" hint="Mehrere möglich"
        value={d.availableWeekdays} onChange={(v) => u({ availableWeekdays: v })} />
      <WeekdaySelect label="An welchen Wochentagen kannst du nicht ins Gym?" hint="Mehrere möglich"
        value={d.unavailableWeekdays} onChange={(v) => u({ unavailableWeekdays: v })} />
      <SliderField label="Wie viel Zeit hast du pro Trainingseinheit?" value={d.sessionTimeAvailable}
        onChange={(v) => u({ sessionTimeAvailable: v })} min={30} max={180} step={5} unit=" min"
        labelMin="30 min" labelMax="180 min" />
      <SingleSelect label="Trainierst du im Gym, zuhause oder beides?"
        options={["Gym", "Zuhause", "Beides"]} value={d.trainingLocation}
        onChange={(v) => u({ trainingLocation: v })} />
      <TextField label="Welche Ausstattung steht dir zur Verfügung?" hint="Optional"
        value={d.equipment} onChange={(v) => u({ equipment: v })} placeholder="z. B. Langhantel, Kabelzug, Maschinen…" />
      <SliderField label="Wie flexibel bist du bei Trainingszeiten?" value={d.scheduleFlexibility}
        onChange={(v) => u({ scheduleFlexibility: v })} min={1} max={10}
        labelMin="kaum flexibel" labelMax="sehr flexibel" />
      <SingleSelect label="Sind zusätzliche Cardioeinheiten möglich?"
        options={["Ja", "Nein", "Vielleicht"]} value={d.cardioPossible}
        onChange={(v) => u({ cardioPossible: v })} />
      <Q label="Wie viele Cardioeinheiten pro Woche wären realistisch?">
        {!d.realisticCardioUnknown && (
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={7} step={1} value={d.realisticCardioSessions}
              onChange={(e) => u({ realisticCardioSessions: Number(e.target.value) })} className="flex-1 accent-[#3b82f6]" />
            <span className="w-6 text-right text-sm font-semibold text-[#60a5fa]">{d.realisticCardioSessions}</span>
          </div>
        )}
        <Toggle active={d.realisticCardioUnknown} onClick={() => u({ realisticCardioUnknown: !d.realisticCardioUnknown })}>
          Weiß ich nicht
        </Toggle>
      </Q>
    </div>
  );
}

function Step10({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  const priorityOpts = ["Muskelaufbau", "Fettverlust", "Recomp", "Kraftsteigerung", "Gesundheit",
    "Routine aufbauen", "Ernährung strukturieren", "Wettkampf", "Lifestyle verbessern"];
  const motivationOpts = ["Zahlen", "Optik", "Leistung", "Routine", "Feedback", "Gesundheit", "Wettkampf"];
  const checkInDayOpts = [{ v: 1, l: "Mo" }, { v: 2, l: "Di" }, { v: 3, l: "Mi" },
    { v: 4, l: "Do" }, { v: 5, l: "Fr" }, { v: 6, l: "Sa" }, { v: 0, l: "So" }];
  return (
    <div className="flex flex-col gap-5">
      <SectionDivider>Deine Ziele</SectionDivider>
      <TextField label="Was ist dein kurzfristiges Ziel?" value={d.shortTermGoal}
        onChange={(v) => u({ shortTermGoal: v })} placeholder="In den nächsten 3–6 Monaten…" rows={2} />
      <TextField label="Was ist dein langfristiges Ziel?" value={d.longTermGoal}
        onChange={(v) => u({ longTermGoal: v })} placeholder="In 1–2 Jahren…" rows={2} />
      <MultiSelect label="Was ist dir aktuell am wichtigsten?" hint="Mehrere möglich"
        options={priorityOpts} value={d.priorities}
        onChange={(v) => u({ priorities: v })}
        other={d.prioritiesOther} onOther={(v) => u({ prioritiesOther: v })} />
      <Q label="Gibt es ein konkretes Datum, Event oder Ziel, auf das du hinarbeitest?">
        {!d.noTargetDate && (
          <input type="text" value={d.targetDateOrEvent}
            onChange={(e) => u({ targetDateOrEvent: e.target.value })}
            placeholder="z. B. Urlaub Mai 2026, Wettkampf Oktober…" className={inp} />
        )}
        <Toggle active={d.noTargetDate} onClick={() => u({ noTargetDate: !d.noTargetDate })}>
          Kein konkretes Datum
        </Toggle>
      </Q>
      <SliderField label="Wie wichtig ist dir optische Veränderung?" value={d.physiqueImportance}
        onChange={(v) => u({ physiqueImportance: v })} min={1} max={10}
        labelMin="nicht wichtig" labelMax="sehr wichtig" />
      <SliderField label="Wie wichtig ist dir Kraftsteigerung?" value={d.strengthImportance}
        onChange={(v) => u({ strengthImportance: v })} min={1} max={10}
        labelMin="nicht wichtig" labelMax="sehr wichtig" />
      <SliderField label="Wie wichtig ist dir Alltagstauglichkeit?" value={d.lifestyleImportance}
        onChange={(v) => u({ lifestyleImportance: v })} min={1} max={10}
        labelMin="nicht wichtig" labelMax="sehr wichtig" />
      <TextField label="Was hat bisher verhindert, dass du dein Ziel erreichst?" hint="Optional"
        value={d.previousBarriers} onChange={(v) => u({ previousBarriers: v })} rows={2} />
      <TextField label="Woran würdest du merken, dass das Coaching erfolgreich war?"
        value={d.successDefinition} onChange={(v) => u({ successDefinition: v })} rows={2} />
      <SectionDivider>Coaching-Präferenzen</SectionDivider>
      <SingleSelect label="Welchen Coaching-Stil wünschst du dir?"
        options={["Klare Vorgaben", "Eher klare Vorgaben", "Mischung", "Eher flexibel", "Sehr flexibel"]}
        value={d.preferenceStructureFlexibility}
        onChange={(v) => u({ preferenceStructureFlexibility: v })} />
      <SliderField label="Wie direkt darf mein Feedback sein?" value={d.feedbackDirectness}
        onChange={(v) => u({ feedbackDirectness: v })} min={1} max={10}
        labelMin="sehr sanft" labelMax="sehr direkt" />
      <SingleSelect label="Wie viel Erklärung möchtest du zu Entscheidungen?"
        options={["Wenig, nur Aufgaben", "Mittel", "Viel Hintergrund", "Sehr detailliert"]}
        value={d.explanationDepth} onChange={(v) => u({ explanationDepth: v })} />
      <MultiSelect label="Was motiviert dich am meisten?" hint="Mehrere möglich"
        options={motivationOpts} value={d.motivationDrivers}
        onChange={(v) => u({ motivationDrivers: v })}
        other={d.motivationDriversOther} onOther={(v) => u({ motivationDriversOther: v })} />
      <SliderField label="Wie zuverlässig kannst du Check-ins ausfüllen?" value={d.checkInReliability}
        onChange={(v) => u({ checkInReliability: v })} min={1} max={10}
        labelMin="schwer vorherzusagen" labelMax="sehr zuverlässig" />
      <Q label="Welcher Check-in-Tag wäre dir am liebsten?">
        <div className="flex flex-wrap gap-2">
          {checkInDayOpts.map(({ v, l }) => (
            <Toggle key={v} active={d.preferredCheckInDay === v} onClick={() => u({ preferredCheckInDay: v as 0|1|2|3|4|5|6 })}>
              {l}
            </Toggle>
          ))}
        </div>
      </Q>
    </div>
  );
}

function Step11({ d, u }: { d: WizardData; u: (p: Partial<WizardData>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <TextField label="Was sollte ich sonst noch über dich wissen?" hint="Optional"
        value={d.coachShouldKnow} onChange={(v) => u({ coachShouldKnow: v })} rows={3}
        placeholder="Alles, was du für wichtig hältst und bisher nicht erwähnt hast…" />
      <TextField label="Bei welchen Themen wünschst du dir besonders viel Unterstützung?" hint="Optional"
        value={d.supportFocus} onChange={(v) => u({ supportFocus: v })} rows={2} />
      <TextField label="Gibt es etwas, das du im Coaching vermeiden möchtest?" hint="Optional"
        value={d.thingsToAvoid} onChange={(v) => u({ thingsToAvoid: v })} rows={2} />
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#1e2d42]/40 border border-[#2e4060]">
        <button type="button" onClick={() => u({ confirmed: !d.confirmed })}
          className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all",
            d.confirmed ? "bg-[#3b82f6] border-[#3b82f6]" : "border-[#2e4060] bg-[#0f1624]")}>
          {d.confirmed && <Check size={12} className="text-white" />}
        </button>
        <p className="text-sm text-[#8fa3c0]">
          Ich habe die Angaben nach bestem Wissen ausgefüllt.
        </p>
      </div>
    </div>
  );
}

// ─── Build profile from wizard data ──────────────────────────────────────────

function buildProfile(d: WizardData): AthleteProfile {
  return {
    personal: { email: d.email, birthDate: d.birthDate || undefined },
    body: {
      lowestWeightThreeYears: d.lowestWeightUnknown ? undefined : d.lowestWeight,
      lowestWeightUnknown: d.lowestWeightUnknown,
      highestWeightThreeYears: d.highestWeightUnknown ? undefined : d.highestWeight,
      highestWeightUnknown: d.highestWeightUnknown,
      targetWeightUnknown: d.targetWeightUnknown,
    },
    lifestyle: {
      occupation: d.occupation || undefined,
      weeklyWorkloadHours: d.weeklyWorkloadUnknown ? undefined : d.weeklyWorkloadHours,
      weeklyWorkloadUnknown: d.weeklyWorkloadUnknown,
      dailyPlanningScore: d.dailyPlanningScore,
      dailyRoutine: d.dailyRoutine || undefined,
      stressLevel: d.stressLevel,
      averageSteps: d.averageStepsUnknown ? undefined : d.averageSteps,
      averageStepsUnknown: d.averageStepsUnknown,
      dailyActivityLevel: d.dailyActivityLevel,
      currentCardio: d.currentCardio || undefined,
      weeklyTimeInvestment: d.weeklyTimeInvestment,
    },
    recovery: {
      sleepHours: d.sleepHoursUnknown ? undefined : d.sleepHours,
      sleepHoursUnknown: d.sleepHoursUnknown,
      sleepQuality: d.sleepQuality,
      morningRecovery: d.morningRecovery,
      sleepScheduleRegularity: d.sleepScheduleRegularity,
      shiftWork: d.shiftWork || undefined,
      sleepDisruptors: d.sleepDisruptors.length ? d.sleepDisruptors : undefined,
      sleepDisruptorsOther: d.sleepDisruptorsOther || undefined,
    },
    health: {
      hasInjuries: d.hasInjuries || undefined,
      injuriesDetail: d.injuriesDetail || undefined,
      problematicMovements: d.problematicMovements || undefined,
      hasHealthIssues: d.hasHealthIssues || undefined,
      healthIssuesDetail: d.healthIssuesDetail || undefined,
      medications: d.medications || undefined,
      medicationsDetail: d.medicationsDetail || undefined,
      hasDigestionIssues: d.hasDigestionIssues || undefined,
      digestionDetail: d.digestionDetail || undefined,
      otherLimitations: d.otherLimitations || undefined,
    },
    nutrition: {
      dietType: d.dietType.length ? d.dietType : undefined,
      currentNutritionConcept: d.currentNutritionConcept || undefined,
      currentTrackingStatus: d.currentTrackingStatus || undefined,
      preferredNutritionMethod: d.preferredNutritionMethod || undefined,
      calorieCountingConfidence: d.calorieCountingConfidence,
      macroConfidence: d.macroConfidence,
      macroAdherenceConfidence: d.macroAdherenceConfidence,
      mealPlanAdherenceConfidence: d.mealPlanAdherenceConfidence,
      nutritionProblems: d.nutritionProblems.length ? d.nutritionProblems : undefined,
      nutritionProblemsOther: d.nutritionProblemsOther || undefined,
      currentCalories: d.currentCaloriesUnknown ? undefined : d.currentCalories,
      currentCaloriesUnknown: d.currentCaloriesUnknown,
      knowsMacros: d.knowsMacros || undefined,
      currentMacros: (d.knowsMacros && d.knowsMacros !== "Nein")
        ? { protein: d.currentProtein || undefined, carbs: d.currentCarbs || undefined, fat: d.currentFat || undefined }
        : undefined,
      mealRegularity: d.mealRegularity,
      eatingOutFrequency: d.eatingOutFrequency || undefined,
      weighingFoodWillingness: d.weighingFoodWillingness,
    },
    foodPreferences: {
      proteinSources: d.proteinSources.length ? d.proteinSources : undefined,
      proteinSourcesOther: d.proteinSourcesOther || undefined,
      carbSources: d.carbSources.length ? d.carbSources : undefined,
      carbSourcesOther: d.carbSourcesOther || undefined,
      fatSources: d.fatSources.length ? d.fatSources : undefined,
      fatSourcesOther: d.fatSourcesOther || undefined,
      favoriteFoods: d.favoriteFoods || undefined,
      dislikedFoods: d.dislikedFoods || undefined,
      intoleratedFoods: d.intoleratedFoods || undefined,
      triggerFoods: d.triggerFoods || undefined,
      hungerTiming: d.hungerTiming || undefined,
      cravingsFrequency: d.cravingsFrequency,
      emotionalEatingFrequency: d.emotionalEatingSkipped ? undefined : d.emotionalEatingFrequency,
      emotionalEatingSkipped: d.emotionalEatingSkipped,
    },
    supplements: {
      currentSupplements: d.currentSupplements.length ? d.currentSupplements : undefined,
      currentSupplementsOther: d.currentSupplementsOther || undefined,
      supplementTiming: d.supplementTiming || undefined,
      supplementTimingDetail: d.supplementTimingDetail || undefined,
      unwantedSupplements: d.unwantedSupplements || undefined,
      caffeineMg: d.caffeineUnknown ? undefined : d.caffeineMg,
      caffeineUnknown: d.caffeineUnknown,
      caffeineSources: d.caffeineSources.length ? d.caffeineSources : undefined,
      caffeineTiming: d.caffeineTiming || undefined,
      preWorkoutNutrition: d.preWorkoutNutrition || undefined,
      postWorkoutNutrition: d.postWorkoutNutrition || undefined,
    },
    training: {
      trainingAge: d.trainingAge || undefined,
      structuredTrainingAge: d.structuredTrainingAge || undefined,
      trainingExperienceLevel: d.trainingExperienceLevel || undefined,
      trainingHistory: d.trainingHistory || undefined,
      bulkCutHistory: d.bulkCutHistory || undefined,
      bulkCutHistoryDetail: d.bulkCutHistoryDetail || undefined,
      previousSplit: d.previousSplit.length ? d.previousSplit : undefined,
      previousSplitOther: d.previousSplitOther || undefined,
      weeklySessions: d.weeklySessions,
      currentSessionDuration: d.currentSessionDuration,
      desiredSessionDuration: d.desiredSessionDuration,
      progressionMethod: d.progressionMethod.length ? d.progressionMethod : undefined,
      tracksPerformance: d.tracksPerformance || undefined,
      freeWeightsOrMachines: d.freeWeightsOrMachines || undefined,
      effectiveExercises: d.effectiveExercises || undefined,
      ineffectiveExercises: d.ineffectiveExercises || undefined,
      avoidedExercises: d.avoidedExercises || undefined,
      bestLifts: d.bestLifts || undefined,
    },
    availability: {
      realisticTrainingDays: d.realisticTrainingDays,
      availableWeekdays: d.availableWeekdays.length ? d.availableWeekdays : undefined,
      unavailableWeekdays: d.unavailableWeekdays.length ? d.unavailableWeekdays : undefined,
      sessionTimeAvailable: d.sessionTimeAvailable,
      trainingLocation: d.trainingLocation || undefined,
      equipment: d.equipment || undefined,
      scheduleFlexibility: d.scheduleFlexibility,
      cardioPossible: d.cardioPossible || undefined,
      realisticCardioSessions: d.realisticCardioUnknown ? undefined : d.realisticCardioSessions,
      realisticCardioUnknown: d.realisticCardioUnknown,
    },
    goals: {
      shortTermGoal: d.shortTermGoal || undefined,
      longTermGoal: d.longTermGoal || undefined,
      priorities: d.priorities.length ? d.priorities : undefined,
      prioritiesOther: d.prioritiesOther || undefined,
      targetDateOrEvent: (!d.noTargetDate && d.targetDateOrEvent) ? d.targetDateOrEvent : undefined,
      noTargetDate: d.noTargetDate,
      physiqueImportance: d.physiqueImportance,
      strengthImportance: d.strengthImportance,
      lifestyleImportance: d.lifestyleImportance,
      previousBarriers: d.previousBarriers || undefined,
      successDefinition: d.successDefinition || undefined,
    },
    coachingPreferences: {
      preferenceStructureFlexibility: d.preferenceStructureFlexibility || undefined,
      feedbackDirectness: d.feedbackDirectness,
      explanationDepth: d.explanationDepth || undefined,
      motivationDrivers: d.motivationDrivers.length ? d.motivationDrivers : undefined,
      motivationDriversOther: d.motivationDriversOther || undefined,
      checkInReliability: d.checkInReliability,
      preferredCheckInDay: d.preferredCheckInDay,
    },
    finalNotes: {
      coachShouldKnow: d.coachShouldKnow || undefined,
      supportFocus: d.supportFocus || undefined,
      thingsToAvoid: d.thingsToAvoid || undefined,
      confirmed: d.confirmed,
    },
  };
}

// ─── Main Wizard component ─────────────────────────────────────────────────────

interface Props {
  onComplete: (athleteId: string) => void;
  onCancel: () => void;
  initialData?: Partial<WizardData>;
}

export function OnboardingWizard({ onComplete, onCancel, initialData }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ ...DEFAULT, ...initialData });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [introElapsed, setIntroElapsed] = useState(0);
  const [completedAthleteId, setCompletedAthleteId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "intro" || introElapsed >= INTRO_DURATION) return;
    const id = setInterval(() => setIntroElapsed((e) => Math.min(e + 1, INTRO_DURATION)), 1000);
    return () => clearInterval(id);
  }, [phase, introElapsed]);

  const introTimerDone = introElapsed >= INTRO_DURATION;
  const introProgress = Math.round((introElapsed / INTRO_DURATION) * 100);
  const globalStep = phase === "intro" ? 1 : step + 1;
  const headerProgress = Math.round((globalStep / TOTAL_STEPS) * 100);
  const headerStepName = phase === "intro" ? "Willkommen" : STEPS[step - 1];

  function update(patch: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setError("");
  }

  function validateStep(): string {
    if (step === 1) {
      if (!data.name.trim()) return "Bitte gib deinen vollständigen Namen ein.";
      if (!data.email.trim() || !data.email.includes("@")) return "Bitte gib eine gültige E-Mail-Adresse ein.";
      if (data.pin.length < 4) return "Die PIN muss mindestens 4 Zeichen lang sein.";
      if (data.pin !== data.pinConfirm) return "Die PINs stimmen nicht überein.";
      try {
        const athletes = loadAthletes();
        const exists = athletes.some((a) =>
          (a.email || a.profile?.personal?.email || "").toLowerCase() === data.email.toLowerCase()
        );
        if (exists) return "Diese E-Mail-Adresse ist bereits registriert.";
      } catch { /* ignore */ }
    }
    if (step === 11) {
      if (!data.confirmed) return "Bitte bestätige, dass du die Angaben ausgefüllt hast.";
    }
    return "";
  }

  function scrollToTop() {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (step < STEPS.length) {
      setStep((s) => s + 1);
      setError("");
      scrollToTop();
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      setError("");
      scrollToTop();
    }
  }

  function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const expLevelMap: Record<string, string> = {
        "Anfänger": "beginner",
        "Leicht fortgeschritten": "beginner",
        "Fortgeschritten": "intermediate",
        "Sehr fortgeschritten": "advanced",
        "Wettkampferfahren": "elite",
      };
      const athlete = registerAthlete({
        name: data.name.trim(),
        email: data.email.trim(),
        pin: data.pin,
        birthDate: data.birthDate || undefined,
        height: data.height || undefined,
        currentWeight: data.currentWeight || undefined,
        targetWeight: data.targetWeightUnknown ? undefined : (data.targetWeight || undefined),
        checkInDay: data.preferredCheckInDay as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        experienceLevel: expLevelMap[data.trainingExperienceLevel] || undefined,
        injuries: data.hasInjuries === "Ja" ? data.injuriesDetail || "Ja" : undefined,
        trainingHistory: data.trainingHistory || undefined,
        goalPriorities: data.priorities,
        goalText: data.shortTermGoal || data.longTermGoal || undefined,
        profile: buildProfile(data),
      });
      setCompletedAthleteId(athlete.id);
      setPhase("complete");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ein Fehler ist aufgetreten.");
      setSubmitting(false);
    }
  }

  // ── Intro-Phase ──────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="h-screen bg-[#0a0f1a] flex flex-col overflow-hidden">
        <div className="shrink-0 bg-[#0a0f1a] border-b border-[#1e2d42] px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button onClick={onCancel}
                className="flex items-center gap-1.5 text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors">
                <X size={14} /> Abbrechen
              </button>
              <span className="text-xs text-[#5a7090]">Schritt 1 von {TOTAL_STEPS}</span>
              <div className="w-16" />
            </div>
            <div className="w-full bg-[#1e2d42] rounded-full h-1.5">
              <div className="bg-[#3b82f6] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(100 / TOTAL_STEPS)}%` }} />
            </div>
            <p className="text-base font-semibold text-[#f0f4ff] mt-3">Willkommen</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-lg mx-auto flex flex-col gap-6">
            {/* Video-Platzhalter */}
            <div className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: "16/9" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center">
                  <Play size={28} className="text-[#60a5fa] translate-x-0.5" />
                </div>
                <div className="text-center px-4">
                  <p className="text-base font-semibold text-[#f0f4ff]">Willkommen im Coaching</p>
                  <p className="text-sm text-[#5a7090] mt-1">Kurzes Onboarding-Video</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#5a7090] text-center px-2">
              Bitte schau dir das kurze Video vollständig an, bevor du fortfährst.
            </p>

            {/* Timer-Fortschritt */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-[#5a7090]">
                <span>{introTimerDone ? "Video abgeschlossen" : "Video läuft…"}</span>
                <span>{introElapsed}s / {INTRO_DURATION}s</span>
              </div>
              <div className="w-full bg-[#1e2d42] rounded-full h-1.5">
                <div className="bg-[#3b82f6] h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${introProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-[#0a0f1a] border-t border-[#1e2d42] px-4 py-4">
          <div className="max-w-lg mx-auto">
            <button
              disabled={!introTimerDone}
              onClick={() => setPhase("questionnaire")}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all",
                introTimerDone
                  ? "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                  : "bg-[#1e2d42] text-[#3b4d6a] cursor-not-allowed"
              )}
            >
              {introTimerDone
                ? <>Weiter geht&apos;s <ArrowRight size={15} /></>
                : `Bitte warten… (${INTRO_DURATION - introElapsed}s)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Abschluss-Phase ──────────────────────────────────────────────────────────
  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
        <div className="w-full max-w-lg flex flex-col gap-5">
          <div className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-6 flex flex-col gap-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-[#10b981]" />
              </div>
              <h1 className="text-xl font-bold text-[#f0f4ff]">Onboarding abgeschlossen</h1>
              <p className="text-sm text-[#5a7090] mt-2">Dein Profil wurde erfolgreich erstellt.</p>
            </div>

            {/* Abschluss-Video-Platzhalter */}
            <div className="bg-[#0a0f1a] border border-[#1e2d42] rounded-xl overflow-hidden relative"
              style={{ aspectRatio: "16/9" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1e2d42] border border-[#2e4060] flex items-center justify-center">
                  <Play size={20} className="text-[#5a7090] translate-x-0.5" />
                </div>
                <p className="text-sm text-[#4a6080]">Abschlussvideo wird hier eingefügt</p>
              </div>
            </div>

            <p className="text-sm text-[#5a7090] text-center">
              Ich prüfe jetzt deine Angaben und richte dein Coaching-Profil weiter ein.
            </p>

            <button
              onClick={() => onComplete(completedAthleteId)}
              className="w-full py-3.5 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors"
            >
              Zum Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Fragebogen-Phase ─────────────────────────────────────────────────────────
  const stepContent = [
    <Step1 key={1} d={data} u={update} />,
    <Step2 key={2} d={data} u={update} />,
    <Step3 key={3} d={data} u={update} />,
    <Step4 key={4} d={data} u={update} />,
    <Step5 key={5} d={data} u={update} />,
    <Step6 key={6} d={data} u={update} />,
    <Step7 key={7} d={data} u={update} />,
    <Step8 key={8} d={data} u={update} />,
    <Step9 key={9} d={data} u={update} />,
    <Step10 key={10} d={data} u={update} />,
    <Step11 key={11} d={data} u={update} />,
  ];

  return (
    <div className="h-screen bg-[#0a0f1a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-[#0a0f1a] border-b border-[#1e2d42] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onCancel}
              className="flex items-center gap-1.5 text-xs text-[#5a7090] hover:text-[#f0f4ff] transition-colors">
              <X size={14} /> Abbrechen
            </button>
            <span className="text-xs text-[#5a7090]">Schritt {globalStep} von {TOTAL_STEPS}</span>
            <div className="w-16" />
          </div>
          <div className="w-full bg-[#1e2d42] rounded-full h-1.5">
            <div
              className="bg-[#3b82f6] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${headerProgress}%` }}
            />
          </div>
          <p className="text-base font-semibold text-[#f0f4ff] mt-3">{headerStepName}</p>
        </div>
      </div>

      {/* Content — overflow-y-auto = Mausrad-Scroll funktioniert hier */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto pb-2">
          {stepContent[step - 1]}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 bg-[#0a0f1a] border-t border-[#1e2d42] px-4 py-4">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          {error && (
            <p className="text-sm text-[#ef4444] text-center">{error}</p>
          )}
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#1e2d42] text-sm font-medium text-[#8fa3c0] hover:bg-[#0f1624] hover:text-[#f0f4ff] transition-all">
                <ArrowLeft size={15} /> Zurück
              </button>
            )}
            <button onClick={handleNext} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] disabled:opacity-60 transition-colors">
              {step === STEPS.length
                ? <><Check size={15} /> Registrierung abschließen</>
                : <>Weiter geht&apos;s <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
