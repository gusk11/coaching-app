"use client";
import { AthleteProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

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

export function ProfileDisplaySections({ profile, trackingDeviceLabel }: { profile: AthleteProfile; trackingDeviceLabel?: string }) {
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
      {/* Tracking device (top-level field, shown here to avoid duplication in Stammdaten) */}
      {trackingDeviceLabel && (
        <Section title="Alltag / Tracking" defaultOpen>
          <Row label="Trackinggerät" value={trackingDeviceLabel} />
        </Section>
      )}

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

// ─── Edit helpers ─────────────────────────────────────────────────────────────

const s = (v?: string) => v ?? "";
const n = (v?: number) => (v != null ? String(v) : "");
const arr = (v?: string[]) => v?.join(", ") ?? "";
const arrn = (v?: number[]) => v?.join(", ") ?? "";

function parseArr(v: string): string[] | undefined {
  const r = v.split(",").map((x) => x.trim()).filter(Boolean);
  return r.length ? r : undefined;
}
function parseArrN(v: string): number[] | undefined {
  const r = v.split(",").map((x) => Number(x.trim())).filter((x) => !isNaN(x));
  return r.length ? r : undefined;
}
function parseN(v: string): number | undefined {
  const r = Number(v);
  return v.trim() !== "" && !isNaN(r) ? r : undefined;
}

function BoolRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#1e2d42]/60 last:border-0">
      <span className="text-xs text-[#5a7090] shrink-0 max-w-[70%]">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)}
        className="accent-[#3b82f6] w-4 h-4 cursor-pointer" />
    </div>
  );
}

function EditableSection({ title, children, onSave }: {
  title: string; children: React.ReactNode; onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a2438] transition-colors">
        <span className="text-xs font-semibold text-[#8fa3c0] uppercase tracking-widest">{title}</span>
        {open ? <ChevronDown size={14} className="text-[#5a7090]" /> : <ChevronRight size={14} className="text-[#5a7090]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-0">
          {children}
          <div className="pt-3 mt-1 border-t border-[#1e2d42]/60">
            <button type="button" onClick={onSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors">
              <Check size={12} /> Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Per-section edit components ──────────────────────────────────────────────

function LifestyleEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const ls = profile.lifestyle ?? {};
  const [occupation, setOccupation] = useState(s(ls.occupation));
  const [hours, setHours] = useState(n(ls.weeklyWorkloadHours));
  const [hoursUnknown, setHoursUnknown] = useState(ls.weeklyWorkloadUnknown ?? false);
  const [planningScore, setPlanningScore] = useState(n(ls.dailyPlanningScore));
  const [routine, setRoutine] = useState(s(ls.dailyRoutine));
  const [stress, setStress] = useState(n(ls.stressLevel));
  const [steps, setSteps] = useState(n(ls.averageSteps));
  const [stepsUnknown, setStepsUnknown] = useState(ls.averageStepsUnknown ?? false);
  const [activityLevel, setActivityLevel] = useState(n(ls.dailyActivityLevel));
  const [cardio, setCardio] = useState(s(ls.currentCardio));
  const [timeInvestment, setTimeInvestment] = useState(n(ls.weeklyTimeInvestment));
  return (
    <EditableSection title="Alltag & Lifestyle" onSave={() => onSave({ ...profile, lifestyle: { ...ls, occupation: occupation || undefined, weeklyWorkloadHours: parseN(hours), weeklyWorkloadUnknown: hoursUnknown || undefined, dailyPlanningScore: parseN(planningScore), dailyRoutine: routine || undefined, stressLevel: parseN(stress), averageSteps: parseN(steps), averageStepsUnknown: stepsUnknown || undefined, dailyActivityLevel: parseN(activityLevel), currentCardio: cardio || undefined, weeklyTimeInvestment: parseN(timeInvestment) } })}>
      <EditRow label="Beruf/Alltag" value={occupation} onChange={setOccupation} />
      <EditRow label="Wochenstunden Arbeit" value={hours} onChange={setHours} type="number" />
      <BoolRow label="Wochenstunden unbekannt" value={hoursUnknown} onChange={setHoursUnknown} />
      <EditRow label="Planbarkeit (1–10)" value={planningScore} onChange={setPlanningScore} type="number" />
      <EditRow label="Tagesroutine" value={routine} onChange={setRoutine} rows={2} />
      <EditRow label="Stresspegel (1–10)" value={stress} onChange={setStress} type="number" />
      <EditRow label="Durchschn. Schritte" value={steps} onChange={setSteps} type="number" />
      <BoolRow label="Schritte unbekannt" value={stepsUnknown} onChange={setStepsUnknown} />
      <EditRow label="Aktivitätslevel Alltag (1–10)" value={activityLevel} onChange={setActivityLevel} type="number" />
      <EditRow label="Cardio aktuell" value={cardio} onChange={setCardio} rows={2} />
      <EditRow label="Wöchentl. Investitionszeit (h)" value={timeInvestment} onChange={setTimeInvestment} type="number" />
    </EditableSection>
  );
}

function RecoveryEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const rc = profile.recovery ?? {};
  const [sleepHours, setSleepHours] = useState(n(rc.sleepHours));
  const [sleepHoursUnknown, setSleepHoursUnknown] = useState(rc.sleepHoursUnknown ?? false);
  const [sleepQuality, setSleepQuality] = useState(n(rc.sleepQuality));
  const [morningRecovery, setMorningRecovery] = useState(n(rc.morningRecovery));
  const [regularity, setRegularity] = useState(n(rc.sleepScheduleRegularity));
  const [shiftWork, setShiftWork] = useState(s(rc.shiftWork));
  const [disruptors, setDisruptors] = useState(arr(rc.sleepDisruptors));
  const [disruptorsOther, setDisruptorsOther] = useState(s(rc.sleepDisruptorsOther));
  return (
    <EditableSection title="Schlaf & Regeneration" onSave={() => onSave({ ...profile, recovery: { ...rc, sleepHours: parseN(sleepHours), sleepHoursUnknown: sleepHoursUnknown || undefined, sleepQuality: parseN(sleepQuality), morningRecovery: parseN(morningRecovery), sleepScheduleRegularity: parseN(regularity), shiftWork: shiftWork || undefined, sleepDisruptors: parseArr(disruptors), sleepDisruptorsOther: disruptorsOther || undefined } })}>
      <EditRow label="Schlafdauer (h)" value={sleepHours} onChange={setSleepHours} type="number" />
      <BoolRow label="Schlafdauer unbekannt" value={sleepHoursUnknown} onChange={setSleepHoursUnknown} />
      <EditRow label="Schlafqualität (1–10)" value={sleepQuality} onChange={setSleepQuality} type="number" />
      <EditRow label="Erholung morgens (1–10)" value={morningRecovery} onChange={setMorningRecovery} type="number" />
      <EditRow label="Schlafregelmäßigkeit (1–10)" value={regularity} onChange={setRegularity} type="number" />
      <EditRow label="Schichtarbeit" value={shiftWork} onChange={setShiftWork} />
      <EditRow label="Schlafstörer (kommagetrennt)" value={disruptors} onChange={setDisruptors} />
      <EditRow label="Sonstiges Schlaf" value={disruptorsOther} onChange={setDisruptorsOther} />
    </EditableSection>
  );
}

function HealthEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const h = profile.health ?? {};
  const [hasInjuries, setHasInjuries] = useState(s(h.hasInjuries));
  const [injuriesDetail, setInjuriesDetail] = useState(s(h.injuriesDetail));
  const [problematicMovements, setProblematicMovements] = useState(s(h.problematicMovements));
  const [hasHealthIssues, setHasHealthIssues] = useState(s(h.hasHealthIssues));
  const [healthIssuesDetail, setHealthIssuesDetail] = useState(s(h.healthIssuesDetail));
  const [medications, setMedications] = useState(s(h.medications));
  const [medicationsDetail, setMedicationsDetail] = useState(s(h.medicationsDetail));
  const [hasDigestionIssues, setHasDigestionIssues] = useState(s(h.hasDigestionIssues));
  const [digestionDetail, setDigestionDetail] = useState(s(h.digestionDetail));
  const [otherLimitations, setOtherLimitations] = useState(s(h.otherLimitations));
  return (
    <EditableSection title="Gesundheit & Einschränkungen" onSave={() => onSave({ ...profile, health: { ...h, hasInjuries: hasInjuries || undefined, injuriesDetail: injuriesDetail || undefined, problematicMovements: problematicMovements || undefined, hasHealthIssues: hasHealthIssues || undefined, healthIssuesDetail: healthIssuesDetail || undefined, medications: medications || undefined, medicationsDetail: medicationsDetail || undefined, hasDigestionIssues: hasDigestionIssues || undefined, digestionDetail: digestionDetail || undefined, otherLimitations: otherLimitations || undefined } })}>
      <EditRow label="Verletzungen" value={hasInjuries} onChange={setHasInjuries} />
      <EditRow label="Verletzungsdetails" value={injuriesDetail} onChange={setInjuriesDetail} rows={2} />
      <EditRow label="Problematische Bewegungen" value={problematicMovements} onChange={setProblematicMovements} rows={2} />
      <EditRow label="Gesundheitliche Einschränkungen" value={hasHealthIssues} onChange={setHasHealthIssues} />
      <EditRow label="Details Einschränkungen" value={healthIssuesDetail} onChange={setHealthIssuesDetail} rows={2} />
      <EditRow label="Medikamente" value={medications} onChange={setMedications} />
      <EditRow label="Medikamentendetails" value={medicationsDetail} onChange={setMedicationsDetail} rows={2} />
      <EditRow label="Verdauung/Unverträglichkeiten" value={hasDigestionIssues} onChange={setHasDigestionIssues} />
      <EditRow label="Verdauungsdetails" value={digestionDetail} onChange={setDigestionDetail} rows={2} />
      <EditRow label="Sonstige Einschränkungen" value={otherLimitations} onChange={setOtherLimitations} rows={2} />
    </EditableSection>
  );
}

function NutritionEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const nt = profile.nutrition ?? {};
  const [dietType, setDietType] = useState(arr(nt.dietType));
  const [concept, setConcept] = useState(s(nt.currentNutritionConcept));
  const [tracking, setTracking] = useState(s(nt.currentTrackingStatus));
  const [preferredMethod, setPreferredMethod] = useState(s(nt.preferredNutritionMethod));
  const [calorieConf, setCalorieConf] = useState(n(nt.calorieCountingConfidence));
  const [macroConf, setMacroConf] = useState(n(nt.macroConfidence));
  const [macroAdh, setMacroAdh] = useState(n(nt.macroAdherenceConfidence));
  const [mealPlanAdh, setMealPlanAdh] = useState(n(nt.mealPlanAdherenceConfidence));
  const [problems, setProblems] = useState(arr(nt.nutritionProblems));
  const [kcal, setKcal] = useState(n(nt.currentCalories));
  const [kcalUnknown, setKcalUnknown] = useState(nt.currentCaloriesUnknown ?? false);
  const [knowsMacros, setKnowsMacros] = useState(s(nt.knowsMacros));
  const [macroP, setMacroP] = useState(n(nt.currentMacros?.protein));
  const [macroC, setMacroC] = useState(n(nt.currentMacros?.carbs));
  const [macroF, setMacroF] = useState(n(nt.currentMacros?.fat));
  const [mealReg, setMealReg] = useState(n(nt.mealRegularity));
  const [eatingOut, setEatingOut] = useState(s(nt.eatingOutFrequency));
  const [weighing, setWeighing] = useState(n(nt.weighingFoodWillingness));
  return (
    <EditableSection title="Ernährung" onSave={() => onSave({ ...profile, nutrition: { ...nt, dietType: parseArr(dietType), currentNutritionConcept: concept || undefined, currentTrackingStatus: tracking || undefined, preferredNutritionMethod: preferredMethod || undefined, calorieCountingConfidence: parseN(calorieConf), macroConfidence: parseN(macroConf), macroAdherenceConfidence: parseN(macroAdh), mealPlanAdherenceConfidence: parseN(mealPlanAdh), nutritionProblems: parseArr(problems), currentCalories: parseN(kcal), currentCaloriesUnknown: kcalUnknown || undefined, knowsMacros: knowsMacros || undefined, currentMacros: { protein: parseN(macroP), carbs: parseN(macroC), fat: parseN(macroF) }, mealRegularity: parseN(mealReg), eatingOutFrequency: eatingOut || undefined, weighingFoodWillingness: parseN(weighing) } })}>
      <EditRow label="Ernährungsform (kommagetrennt)" value={dietType} onChange={setDietType} />
      <EditRow label="Ernährungskonzept" value={concept} onChange={setConcept} />
      <EditRow label="Aktuelles Tracking" value={tracking} onChange={setTracking} />
      <EditRow label="Bevorzugte Methode" value={preferredMethod} onChange={setPreferredMethod} />
      <EditRow label="Kalorientracking-Sicherheit (1–10)" value={calorieConf} onChange={setCalorieConf} type="number" />
      <EditRow label="Makro-Sicherheit (1–10)" value={macroConf} onChange={setMacroConf} type="number" />
      <EditRow label="Makro-Adherence (1–10)" value={macroAdh} onChange={setMacroAdh} type="number" />
      <EditRow label="Plan-Adherence (1–10)" value={mealPlanAdh} onChange={setMealPlanAdh} type="number" />
      <EditRow label="Ernährungsprobleme (kommagetrennt)" value={problems} onChange={setProblems} />
      <EditRow label="Aktuelle kcal/Tag" value={kcal} onChange={setKcal} type="number" />
      <BoolRow label="kcal unbekannt" value={kcalUnknown} onChange={setKcalUnknown} />
      <EditRow label="Makros bekannt" value={knowsMacros} onChange={setKnowsMacros} />
      <EditRow label="Protein (g)" value={macroP} onChange={setMacroP} type="number" />
      <EditRow label="Carbs (g)" value={macroC} onChange={setMacroC} type="number" />
      <EditRow label="Fett (g)" value={macroF} onChange={setMacroF} type="number" />
      <EditRow label="Mahlzeitenregelmäßigkeit (1–10)" value={mealReg} onChange={setMealReg} type="number" />
      <EditRow label="Auswärtsessen" value={eatingOut} onChange={setEatingOut} />
      <EditRow label="Bereitschaft Abwiegen (1–10)" value={weighing} onChange={setWeighing} type="number" />
    </EditableSection>
  );
}

function FoodPreferencesEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const fp = profile.foodPreferences ?? {};
  const [protein, setProtein] = useState(arr(fp.proteinSources));
  const [proteinOther, setProteinOther] = useState(s(fp.proteinSourcesOther));
  const [carbs, setCarbs] = useState(arr(fp.carbSources));
  const [carbsOther, setCarbsOther] = useState(s(fp.carbSourcesOther));
  const [fat, setFat] = useState(arr(fp.fatSources));
  const [fatOther, setFatOther] = useState(s(fp.fatSourcesOther));
  const [favorite, setFavorite] = useState(s(fp.favoriteFoods));
  const [disliked, setDisliked] = useState(s(fp.dislikedFoods));
  const [intolerated, setIntolerated] = useState(s(fp.intoleratedFoods));
  const [trigger, setTrigger] = useState(s(fp.triggerFoods));
  const [hungerTiming, setHungerTiming] = useState(s(fp.hungerTiming));
  const [cravings, setCravings] = useState(n(fp.cravingsFrequency));
  const [emotional, setEmotional] = useState(n(fp.emotionalEatingFrequency));
  const [emotionalSkipped, setEmotionalSkipped] = useState(fp.emotionalEatingSkipped ?? false);
  return (
    <EditableSection title="Lebensmittelpräferenzen" onSave={() => onSave({ ...profile, foodPreferences: { ...fp, proteinSources: parseArr(protein), proteinSourcesOther: proteinOther || undefined, carbSources: parseArr(carbs), carbSourcesOther: carbsOther || undefined, fatSources: parseArr(fat), fatSourcesOther: fatOther || undefined, favoriteFoods: favorite || undefined, dislikedFoods: disliked || undefined, intoleratedFoods: intolerated || undefined, triggerFoods: trigger || undefined, hungerTiming: hungerTiming || undefined, cravingsFrequency: parseN(cravings), emotionalEatingFrequency: parseN(emotional), emotionalEatingSkipped: emotionalSkipped || undefined } })}>
      <EditRow label="Proteinquellen (kommagetrennt)" value={protein} onChange={setProtein} />
      <EditRow label="Proteinquellen Sonstiges" value={proteinOther} onChange={setProteinOther} />
      <EditRow label="Kohlenhydratquellen (kommagetrennt)" value={carbs} onChange={setCarbs} />
      <EditRow label="KH-Quellen Sonstiges" value={carbsOther} onChange={setCarbsOther} />
      <EditRow label="Fettquellen (kommagetrennt)" value={fat} onChange={setFat} />
      <EditRow label="Fettquellen Sonstiges" value={fatOther} onChange={setFatOther} />
      <EditRow label="Lieblingslebensmittel" value={favorite} onChange={setFavorite} rows={2} />
      <EditRow label="Abgelehnte Lebensmittel" value={disliked} onChange={setDisliked} rows={2} />
      <EditRow label="Unverträglichkeiten" value={intolerated} onChange={setIntolerated} rows={2} />
      <EditRow label="Trigger-Lebensmittel" value={trigger} onChange={setTrigger} rows={2} />
      <EditRow label="Hunger hauptsächlich" value={hungerTiming} onChange={setHungerTiming} />
      <EditRow label="Heißhunger-Häufigkeit (1–10)" value={cravings} onChange={setCravings} type="number" />
      <EditRow label="Emotionales Essen (1–10)" value={emotional} onChange={setEmotional} type="number" />
      <BoolRow label="Emotionales Essen nicht angegeben" value={emotionalSkipped} onChange={setEmotionalSkipped} />
    </EditableSection>
  );
}

function SupplementsEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const sp = profile.supplements ?? {};
  const [current, setCurrent] = useState(arr(sp.currentSupplements));
  const [currentOther, setCurrentOther] = useState(s(sp.currentSupplementsOther));
  const [timing, setTiming] = useState(s(sp.supplementTiming));
  const [timingDetail, setTimingDetail] = useState(s(sp.supplementTimingDetail));
  const [unwanted, setUnwanted] = useState(s(sp.unwantedSupplements));
  const [caffeine, setCaffeine] = useState(n(sp.caffeineMg));
  const [caffeineUnknown, setCaffeineUnknown] = useState(sp.caffeineUnknown ?? false);
  const [caffeineSources, setCaffeineSources] = useState(arr(sp.caffeineSources));
  const [caffeineTiming, setCaffeineTiming] = useState(s(sp.caffeineTiming));
  const [preWorkout, setPreWorkout] = useState(s(sp.preWorkoutNutrition));
  const [postWorkout, setPostWorkout] = useState(s(sp.postWorkoutNutrition));
  return (
    <EditableSection title="Supplemente & Koffein" onSave={() => onSave({ ...profile, supplements: { ...sp, currentSupplements: parseArr(current), currentSupplementsOther: currentOther || undefined, supplementTiming: timing || undefined, supplementTimingDetail: timingDetail || undefined, unwantedSupplements: unwanted || undefined, caffeineMg: parseN(caffeine), caffeineUnknown: caffeineUnknown || undefined, caffeineSources: parseArr(caffeineSources), caffeineTiming: caffeineTiming || undefined, preWorkoutNutrition: preWorkout || undefined, postWorkoutNutrition: postWorkout || undefined } })}>
      <EditRow label="Aktuelle Supplemente (kommagetrennt)" value={current} onChange={setCurrent} />
      <EditRow label="Supplemente Sonstiges" value={currentOther} onChange={setCurrentOther} />
      <EditRow label="Einnahmezeiten" value={timing} onChange={setTiming} />
      <EditRow label="Details Einnahmezeiten" value={timingDetail} onChange={setTimingDetail} />
      <EditRow label="Nicht gewünschte Supplemente" value={unwanted} onChange={setUnwanted} rows={2} />
      <EditRow label="Koffein (mg/Tag)" value={caffeine} onChange={setCaffeine} type="number" />
      <BoolRow label="Koffein unbekannt" value={caffeineUnknown} onChange={setCaffeineUnknown} />
      <EditRow label="Koffeinquellen (kommagetrennt)" value={caffeineSources} onChange={setCaffeineSources} />
      <EditRow label="Koffein-Timing" value={caffeineTiming} onChange={setCaffeineTiming} />
      <EditRow label="Pre-Workout-Nutrition" value={preWorkout} onChange={setPreWorkout} rows={2} />
      <EditRow label="Post-Workout-Nutrition" value={postWorkout} onChange={setPostWorkout} rows={2} />
    </EditableSection>
  );
}

function TrainingExperienceEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const tr = profile.training ?? {};
  const [age, setAge] = useState(s(tr.trainingAge));
  const [structuredAge, setStructuredAge] = useState(s(tr.structuredTrainingAge));
  const [level, setLevel] = useState(s(tr.trainingExperienceLevel));
  const [history, setHistory] = useState(s(tr.trainingHistory));
  const [bulkCut, setBulkCut] = useState(s(tr.bulkCutHistory));
  const [bulkCutDetail, setBulkCutDetail] = useState(s(tr.bulkCutHistoryDetail));
  const [split, setSplit] = useState(arr(tr.previousSplit));
  const [splitOther, setSplitOther] = useState(s(tr.previousSplitOther));
  const [sessions, setSessions] = useState(n(tr.weeklySessions));
  const [currentDur, setCurrentDur] = useState(n(tr.currentSessionDuration));
  const [desiredDur, setDesiredDur] = useState(n(tr.desiredSessionDuration));
  const [progression, setProgression] = useState(arr(tr.progressionMethod));
  const [tracksPerf, setTracksPerf] = useState(s(tr.tracksPerformance));
  const [freeOrMachine, setFreeOrMachine] = useState(s(tr.freeWeightsOrMachines));
  const [effective, setEffective] = useState(s(tr.effectiveExercises));
  const [ineffective, setIneffective] = useState(s(tr.ineffectiveExercises));
  const [avoided, setAvoided] = useState(s(tr.avoidedExercises));
  const [bestLifts, setBestLifts] = useState(s(tr.bestLifts));
  return (
    <EditableSection title="Trainingserfahrung" onSave={() => onSave({ ...profile, training: { ...tr, trainingAge: age || undefined, structuredTrainingAge: structuredAge || undefined, trainingExperienceLevel: level || undefined, trainingHistory: history || undefined, bulkCutHistory: bulkCut || undefined, bulkCutHistoryDetail: bulkCutDetail || undefined, previousSplit: parseArr(split), previousSplitOther: splitOther || undefined, weeklySessions: parseN(sessions), currentSessionDuration: parseN(currentDur), desiredSessionDuration: parseN(desiredDur), progressionMethod: parseArr(progression), tracksPerformance: tracksPerf || undefined, freeWeightsOrMachines: freeOrMachine || undefined, effectiveExercises: effective || undefined, ineffectiveExercises: ineffective || undefined, avoidedExercises: avoided || undefined, bestLifts: bestLifts || undefined } })}>
      <EditRow label="Trainingsdauer gesamt" value={age} onChange={setAge} />
      <EditRow label="Strukturiertes Training seit" value={structuredAge} onChange={setStructuredAge} />
      <EditRow label="Erfahrungslevel (Eigenbild)" value={level} onChange={setLevel} />
      <EditRow label="Trainingshistorie" value={history} onChange={setHistory} rows={2} />
      <EditRow label="Bulk/Cut-Erfahrung" value={bulkCut} onChange={setBulkCut} />
      <EditRow label="Bulk/Cut Details" value={bulkCutDetail} onChange={setBulkCutDetail} rows={2} />
      <EditRow label="Trainierter Split (kommagetrennt)" value={split} onChange={setSplit} />
      <EditRow label="Split Sonstiges" value={splitOther} onChange={setSplitOther} />
      <EditRow label="Einheiten/Woche" value={sessions} onChange={setSessions} type="number" />
      <EditRow label="Aktuelle Einheitsdauer (min)" value={currentDur} onChange={setCurrentDur} type="number" />
      <EditRow label="Gewünschte Einheitsdauer (min)" value={desiredDur} onChange={setDesiredDur} type="number" />
      <EditRow label="Progressionsmethode (kommagetrennt)" value={progression} onChange={setProgression} />
      <EditRow label="Leistungstracking" value={tracksPerf} onChange={setTracksPerf} />
      <EditRow label="Freie Gewichte / Maschinen" value={freeOrMachine} onChange={setFreeOrMachine} />
      <EditRow label="Effektive Übungen" value={effective} onChange={setEffective} rows={2} />
      <EditRow label="Ineffektive Übungen" value={ineffective} onChange={setIneffective} rows={2} />
      <EditRow label="Vermiedene Übungen" value={avoided} onChange={setAvoided} rows={2} />
      <EditRow label="Kraftwerte" value={bestLifts} onChange={setBestLifts} rows={2} />
    </EditableSection>
  );
}

function AvailabilityEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const av = profile.availability ?? {};
  const [trainingDays, setTrainingDays] = useState(n(av.realisticTrainingDays));
  const [availWeekdays, setAvailWeekdays] = useState(arrn(av.availableWeekdays));
  const [unavailWeekdays, setUnavailWeekdays] = useState(arrn(av.unavailableWeekdays));
  const [sessionTime, setSessionTime] = useState(n(av.sessionTimeAvailable));
  const [location, setLocation] = useState(s(av.trainingLocation));
  const [equipment, setEquipment] = useState(s(av.equipment));
  const [flexibility, setFlexibility] = useState(n(av.scheduleFlexibility));
  const [cardioPossible, setCardioPossible] = useState(s(av.cardioPossible));
  const [cardioSessions, setCardioSessions] = useState(n(av.realisticCardioSessions));
  const [cardioUnknown, setCardioUnknown] = useState(av.realisticCardioUnknown ?? false);
  return (
    <EditableSection title="Trainingsverfügbarkeit" onSave={() => onSave({ ...profile, availability: { ...av, realisticTrainingDays: parseN(trainingDays), availableWeekdays: parseArrN(availWeekdays), unavailableWeekdays: parseArrN(unavailWeekdays), sessionTimeAvailable: parseN(sessionTime), trainingLocation: location || undefined, equipment: equipment || undefined, scheduleFlexibility: parseN(flexibility), cardioPossible: cardioPossible || undefined, realisticCardioSessions: parseN(cardioSessions), realisticCardioUnknown: cardioUnknown || undefined } })}>
      <EditRow label="Realist. Trainingstage/Woche" value={trainingDays} onChange={setTrainingDays} type="number" />
      <EditRow label="Verfügbare Wochentage (1=Mo…0=So, kommagetrennt)" value={availWeekdays} onChange={setAvailWeekdays} />
      <EditRow label="Gesperrte Wochentage (kommagetrennt)" value={unavailWeekdays} onChange={setUnavailWeekdays} />
      <EditRow label="Zeit pro Einheit (min)" value={sessionTime} onChange={setSessionTime} type="number" />
      <EditRow label="Trainingsort" value={location} onChange={setLocation} />
      <EditRow label="Ausstattung" value={equipment} onChange={setEquipment} rows={2} />
      <EditRow label="Zeitflexibilität (1–10)" value={flexibility} onChange={setFlexibility} type="number" />
      <EditRow label="Cardio möglich" value={cardioPossible} onChange={setCardioPossible} />
      <EditRow label="Realist. Cardioeinheiten/Woche" value={cardioSessions} onChange={setCardioSessions} type="number" />
      <BoolRow label="Cardioeinheiten unbekannt" value={cardioUnknown} onChange={setCardioUnknown} />
    </EditableSection>
  );
}

function GoalsEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const g = profile.goals ?? {};
  const cp = profile.coachingPreferences ?? {};
  const [shortTerm, setShortTerm] = useState(s(g.shortTermGoal));
  const [longTerm, setLongTerm] = useState(s(g.longTermGoal));
  const [priorities, setPriorities] = useState(arr(g.priorities));
  const [prioritiesOther, setPrioritiesOther] = useState(s(g.prioritiesOther));
  const [targetDate, setTargetDate] = useState(s(g.targetDateOrEvent));
  const [noTargetDate, setNoTargetDate] = useState(g.noTargetDate ?? false);
  const [physique, setPhysique] = useState(n(g.physiqueImportance));
  const [strength, setStrength] = useState(n(g.strengthImportance));
  const [lifestyle, setLifestyle] = useState(n(g.lifestyleImportance));
  const [barriers, setBarriers] = useState(s(g.previousBarriers));
  const [success, setSuccess] = useState(s(g.successDefinition));
  const [coachStyle, setCoachStyle] = useState(s(cp.preferenceStructureFlexibility));
  const [directness, setDirectness] = useState(n(cp.feedbackDirectness));
  const [explanationDepth, setExplanationDepth] = useState(s(cp.explanationDepth));
  const [motivation, setMotivation] = useState(arr(cp.motivationDrivers));
  const [motivationOther, setMotivationOther] = useState(s(cp.motivationDriversOther));
  const [reliability, setReliability] = useState(n(cp.checkInReliability));
  return (
    <EditableSection title="Ziele & Coaching-Erwartung" onSave={() => onSave({ ...profile, goals: { ...g, shortTermGoal: shortTerm || undefined, longTermGoal: longTerm || undefined, priorities: parseArr(priorities), prioritiesOther: prioritiesOther || undefined, targetDateOrEvent: targetDate || undefined, noTargetDate: noTargetDate || undefined, physiqueImportance: parseN(physique), strengthImportance: parseN(strength), lifestyleImportance: parseN(lifestyle), previousBarriers: barriers || undefined, successDefinition: success || undefined }, coachingPreferences: { ...cp, preferenceStructureFlexibility: coachStyle || undefined, feedbackDirectness: parseN(directness), explanationDepth: explanationDepth || undefined, motivationDrivers: parseArr(motivation), motivationDriversOther: motivationOther || undefined, checkInReliability: parseN(reliability) } })}>
      <EditRow label="Kurzfristiges Ziel" value={shortTerm} onChange={setShortTerm} rows={2} />
      <EditRow label="Langfristiges Ziel" value={longTerm} onChange={setLongTerm} rows={2} />
      <EditRow label="Prioritäten (kommagetrennt)" value={priorities} onChange={setPriorities} />
      <EditRow label="Prioritäten Sonstiges" value={prioritiesOther} onChange={setPrioritiesOther} />
      <EditRow label="Zieldatum/Event" value={targetDate} onChange={setTargetDate} />
      <BoolRow label="Kein konkretes Datum" value={noTargetDate} onChange={setNoTargetDate} />
      <EditRow label="Optik-Wichtigkeit (1–10)" value={physique} onChange={setPhysique} type="number" />
      <EditRow label="Kraft-Wichtigkeit (1–10)" value={strength} onChange={setStrength} type="number" />
      <EditRow label="Alltag-Wichtigkeit (1–10)" value={lifestyle} onChange={setLifestyle} type="number" />
      <EditRow label="Bisherige Hindernisse" value={barriers} onChange={setBarriers} rows={2} />
      <EditRow label="Erfolgsdefinition" value={success} onChange={setSuccess} rows={2} />
      <EditRow label="Coaching-Stil" value={coachStyle} onChange={setCoachStyle} />
      <EditRow label="Feedback-Direktheit (1–10)" value={directness} onChange={setDirectness} type="number" />
      <EditRow label="Erklärungstiefe" value={explanationDepth} onChange={setExplanationDepth} />
      <EditRow label="Motivationstreiber (kommagetrennt)" value={motivation} onChange={setMotivation} />
      <EditRow label="Motivationstreiber Sonstiges" value={motivationOther} onChange={setMotivationOther} />
      <EditRow label="Check-in-Zuverlässigkeit (1–10)" value={reliability} onChange={setReliability} type="number" />
    </EditableSection>
  );
}

function FinalNotesEdit({ profile, onSave }: { profile: AthleteProfile; onSave: (p: AthleteProfile) => void }) {
  const fn = profile.finalNotes ?? {};
  const [coachShouldKnow, setCoachShouldKnow] = useState(s(fn.coachShouldKnow));
  const [supportFocus, setSupportFocus] = useState(s(fn.supportFocus));
  const [thingsToAvoid, setThingsToAvoid] = useState(s(fn.thingsToAvoid));
  return (
    <EditableSection title="Abschlussnotizen" onSave={() => onSave({ ...profile, finalNotes: { ...fn, coachShouldKnow: coachShouldKnow || undefined, supportFocus: supportFocus || undefined, thingsToAvoid: thingsToAvoid || undefined } })}>
      <EditRow label="Was der Coach wissen sollte" value={coachShouldKnow} onChange={setCoachShouldKnow} rows={3} />
      <EditRow label="Unterstützungsfokus" value={supportFocus} onChange={setSupportFocus} rows={3} />
      <EditRow label="Im Coaching vermeiden" value={thingsToAvoid} onChange={setThingsToAvoid} rows={3} />
    </EditableSection>
  );
}

// ─── Coach-editable questionnaire ─────────────────────────────────────────────

export function ProfileEditSections({ profile, onSave }: {
  profile: AthleteProfile;
  onSave: (updated: AthleteProfile) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <LifestyleEdit profile={profile} onSave={onSave} />
      <RecoveryEdit profile={profile} onSave={onSave} />
      <HealthEdit profile={profile} onSave={onSave} />
      <NutritionEdit profile={profile} onSave={onSave} />
      <FoodPreferencesEdit profile={profile} onSave={onSave} />
      <SupplementsEdit profile={profile} onSave={onSave} />
      <TrainingExperienceEdit profile={profile} onSave={onSave} />
      <AvailabilityEdit profile={profile} onSave={onSave} />
      <GoalsEdit profile={profile} onSave={onSave} />
      <FinalNotesEdit profile={profile} onSave={onSave} />
    </div>
  );
}
