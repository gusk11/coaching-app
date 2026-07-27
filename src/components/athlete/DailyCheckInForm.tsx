"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DailyCheckIn, MealPlan, NutritionStatusType, DailyCheckConfig, DEFAULT_DAILY_CHECK_CONFIG } from "@/types";
import { SliderInput } from "@/components/ui/SliderInput";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { FloatingSaveButton } from "@/components/ui/FloatingSaveButton";
import { cn, normalizeNutritionStatus, todayISO } from "@/lib/utils";

type CheckInDraft = {
  weight?: number; weightInput?: string; measurementTime?: string;
  appetite?: number; digestion?: number; caffeine?: number; steps?: number;
  cardio?: boolean; cardioDuration?: number; training?: boolean; trainingQuality?: number;
  sleepHours?: number; sleepQuality?: number; sleepScore?: number;
  restingHeartRate?: number; hrv?: number; spO2?: number; bpSystolic?: number; bpDiastolic?: number;
  energyLevel?: number; stressLevel?: number; mood?: number; note?: string;
  nutritionStatus?: NutritionStatusType; selectedMealPlanId?: string; noExactNutritionReason?: string;
  customValues?: Record<string, string | number | boolean>;
};

function readDraft(key: string): CheckInDraft | null {
  if (typeof window === "undefined") return null;
  try { const raw = sessionStorage.getItem(key); return raw ? (JSON.parse(raw) as CheckInDraft) : null; }
  catch { return null; }
}

interface DailyCheckInFormProps {
  athleteId: string;
  existingToday?: DailyCheckIn;
  checkConfig?: DailyCheckConfig;
  date?: string; // defaults to todayISO()
  mealPlans?: MealPlan[];
  onSubmit: (data: Omit<DailyCheckIn, "id" | "athleteId">) => void;
}

const nutritionOptions: { value: NutritionStatusType; label: string; desc: string }[] = [
  { value: "calorie_tracker_used",  label: "Kalorientracker genutzt",        desc: "Alle Mahlzeiten im Tracker eingetragen" },
  { value: "meal_plan_followed",    label: "Ernährungsplan eingehalten",      desc: "Einen Plan vollständig umgesetzt" },
  { value: "no_exact_info",         label: "Keine genaue Angabe möglich",     desc: "Mengen unklar oder Plan nicht eingehalten" },
];

export function DailyCheckInForm({ athleteId, existingToday, checkConfig, date, mealPlans, onSubmit }: DailyCheckInFormProps) {
  const cfg: DailyCheckConfig = { ...DEFAULT_DAILY_CHECK_CONFIG, ...checkConfig };
  const init = existingToday;
  const router = useRouter();

  const draftKey = `daily-checkin-draft-${athleteId}-${date ?? todayISO()}`;
  const [draft] = useState<CheckInDraft | null>(() => !init ? readDraft(draftKey) : null);

  const [weight, setWeight] = useState(draft?.weight ?? init?.weight ?? 80);
  const [weightInput, setWeightInput] = useState(
    draft?.weightInput ?? (init?.weight != null ? String(init.weight).replace(".", ",") : "80")
  );
  const [measurementTime, setMeasurementTime] = useState(draft?.measurementTime ?? init?.measurementTime ?? "07:00");
  const [appetite, setAppetite] = useState<1|2|3|4|5>((draft?.appetite ?? init?.appetite ?? 3) as 1|2|3|4|5);
  const [digestion, setDigestion] = useState<1|2|3|4|5>((draft?.digestion ?? init?.digestion ?? 3) as 1|2|3|4|5);
  const [caffeine, setCaffeine] = useState(draft?.caffeine ?? init?.caffeine ?? 200);
  const [steps, setSteps] = useState(draft?.steps ?? init?.steps ?? 8000);
  const [cardio, setCardio] = useState(draft?.cardio ?? init?.cardio ?? false);
  const [cardioDuration, setCardioDuration] = useState(draft?.cardioDuration ?? init?.cardioDuration ?? 30);
  const [training, setTraining] = useState(draft?.training ?? init?.training ?? false);
  const [trainingQuality, setTrainingQuality] = useState<1|2|3|4|5>((draft?.trainingQuality ?? init?.trainingQuality ?? 3) as 1|2|3|4|5);
  const [sleepHours, setSleepHours] = useState(draft?.sleepHours ?? init?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState<1|2|3|4|5>(
    (draft?.sleepQuality ?? (init?.sleepQuality && init.sleepQuality <= 5 ? init.sleepQuality : 3) ?? 3) as 1|2|3|4|5
  );
  const [sleepScore, setSleepScore] = useState(draft?.sleepScore ?? init?.sleepScore ?? 75);
  const [restingHeartRate, setRestingHeartRate] = useState(draft?.restingHeartRate ?? init?.restingHeartRate ?? 55);
  const [hrv, setHrv] = useState(draft?.hrv ?? init?.hrv ?? 50);
  const [spO2, setSpO2] = useState(draft?.spO2 ?? init?.spO2 ?? 98);
  const [bpSystolic, setBpSystolic] = useState(draft?.bpSystolic ?? init?.bloodPressure?.systolic ?? 120);
  const [bpDiastolic, setBpDiastolic] = useState(draft?.bpDiastolic ?? init?.bloodPressure?.diastolic ?? 80);
  const [energyLevel, setEnergyLevel] = useState<1|2|3|4|5>((draft?.energyLevel ?? init?.energyLevel ?? 3) as 1|2|3|4|5);
  const [stressLevel, setStressLevel] = useState<1|2|3|4|5>((draft?.stressLevel ?? init?.stressLevel ?? 3) as 1|2|3|4|5);
  const [mood, setMood] = useState<1|2|3|4|5>((draft?.mood ?? init?.mood ?? 3) as 1|2|3|4|5);
  const [note, setNote] = useState(draft?.note ?? init?.note ?? "");

  const [nutritionStatus, setNutritionStatus] = useState<NutritionStatusType>(
    () => draft?.nutritionStatus ?? (init ? normalizeNutritionStatus(init) : "meal_plan_followed")
  );
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<string>(
    draft?.selectedMealPlanId ?? init?.selectedMealPlanId ?? mealPlans?.[0]?.id ?? ""
  );
  const [noExactNutritionReason, setNoExactNutritionReason] = useState(
    draft?.noExactNutritionReason ?? init?.noExactNutritionReason ?? init?.deviationReason ?? ""
  );

  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [customValues, setCustomValues] = useState<Record<string, string | number | boolean>>(
    () => draft?.customValues ?? init?.customFieldValues ?? {}
  );

  function setCustomValue(id: string, value: string | number | boolean) {
    setCustomValues((prev) => ({ ...prev, [id]: value }));
  }

  function handleCalorieTrackerClick() {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        weight, weightInput, measurementTime, appetite, digestion, caffeine, steps,
        cardio, cardioDuration, training, trainingQuality, sleepHours, sleepQuality,
        sleepScore, restingHeartRate, hrv, spO2, bpSystolic, bpDiastolic,
        energyLevel, stressLevel, mood, note, nutritionStatus, selectedMealPlanId,
        noExactNutritionReason, customValues,
      } as CheckInDraft));
    } catch {}
    router.push("/athlete/calorie-tracker");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const legacyCompliance =
      nutritionStatus === "calorie_tracker_used" ? "tracked_in_calorie_tracker"
      : nutritionStatus === "no_exact_info" ? "not_followed"
      : "fully_followed";

    onSubmit({
      date: date ?? todayISO(),
      weight,
      measurementTime,
      appetite,
      digestion,
      caffeine,
      steps: cfg.steps ? steps : 0,
      cardio: cfg.cardioCompleted ? cardio : false,
      cardioDuration: cfg.cardioCompleted && cardio ? cardioDuration : undefined,
      training: cfg.trainingCompleted ? training : false,
      trainingQuality: cfg.trainingCompleted && training ? trainingQuality : 3,
      sleepHours: cfg.sleepDuration ? sleepHours : 0,
      sleepQuality: cfg.sleepQuality ? sleepQuality : 3,
      sleepScore: cfg.sleepScore ? sleepScore : undefined,
      restingHeartRate: cfg.restingHeartRate ? restingHeartRate : undefined,
      hrv: cfg.hrv ? hrv : undefined,
      spO2: cfg.spO2 ? spO2 : undefined,
      bloodPressure: cfg.bloodPressure ? { systolic: bpSystolic, diastolic: bpDiastolic } : undefined,
      energyLevel: cfg.energyLevel ? energyLevel : 3,
      stressLevel: cfg.stressLevel ? stressLevel : 3,
      mood: cfg.mood ? mood : 3,
      note: cfg.notes ? note : "",
      mealCompliance: cfg.nutritionCompliance ? legacyCompliance : "fully_followed",
      nutritionStatus: cfg.nutritionCompliance ? nutritionStatus : undefined,
      selectedMealPlanId: cfg.nutritionCompliance && nutritionStatus === "meal_plan_followed" && selectedMealPlanId ? selectedMealPlanId : undefined,
      noExactNutritionReason: cfg.nutritionCompliance && nutritionStatus === "no_exact_info" ? noExactNutritionReason : undefined,
      deviationReason: cfg.nutritionCompliance && nutritionStatus === "no_exact_info" ? noExactNutritionReason : undefined,
      customFieldValues: Object.keys(customValues).length > 0 ? customValues : undefined,
    });
    try { sessionStorage.removeItem(draftKey); } catch {}
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const inputCls = "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Weight + Time */}
      {cfg.bodyweight && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8fa3c0]">Gewicht (kg)</label>
            <input
                type="text"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (!/^\d*[,.]?\d*$/.test(raw)) return;
                  setWeightInput(raw);
                  const parsed = parseFloat(raw.replace(",", "."));
                  if (!isNaN(parsed)) setWeight(parsed);
                }}
                className={inputCls}
              />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8fa3c0]">Uhrzeit</label>
            <input type="time" value={measurementTime} onChange={(e) => setMeasurementTime(e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

      {/* Sliders */}
      <div className="grid grid-cols-1 gap-5">
        {cfg.energyLevel && <SliderInput label="Energielevel" value={energyLevel} onChange={(v) => setEnergyLevel(v as 1|2|3|4|5)} labelMin="Erschöpft" labelMax="Voller Energie" />}
        {cfg.stressLevel && <SliderInput label="Stresslevel" value={stressLevel} onChange={(v) => setStressLevel(v as 1|2|3|4|5)} labelMin="Entspannt" labelMax="Sehr gestresst" colorMode="negative_high" reversed />}
        {cfg.mood && <SliderInput label="Stimmung / Tagesgefühl" value={mood} onChange={(v) => setMood(v as 1|2|3|4|5)} labelMin="Sehr schlecht" labelMax="Ausgezeichnet" />}
      </div>

      {/* Subjective ratings */}
      <div className="grid grid-cols-1 gap-5">
        {cfg.appetite && <SliderInput label="Appetit" value={appetite} onChange={(v) => setAppetite(v as 1|2|3|4|5)} noValueColor />}
        {cfg.digestion && <SliderInput label="Verdauung" value={digestion} onChange={(v) => setDigestion(v as 1|2|3|4|5)} />}
      </div>

      {/* Sleep */}
      <div className="grid grid-cols-2 gap-4">
        {cfg.sleepDuration && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8fa3c0]">Schlafdauer (h)</label>
            <input type="number" step="any" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className={inputCls} />
          </div>
        )}
        {cfg.sleepQuality && (
          <div className="col-span-2">
            <SliderInput label="Schlafqualität" value={sleepQuality} onChange={(v) => setSleepQuality(v as 1|2|3|4|5)} />
          </div>
        )}
        {cfg.sleepScore && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8fa3c0]">Schlafscore (0–100)</label>
            <input type="number" value={sleepScore} onChange={(e) => setSleepScore(Number(e.target.value))} className={inputCls} />
          </div>
        )}
      </div>

      {/* Steps + Caffeine */}
      <div className="flex flex-col gap-4">
        {cfg.steps && (
          <NumberSliderInput
            label="Schritte"
            value={steps}
            min={0}
            max={20000}
            sliderStep={100}
            onChange={setSteps}
          />
        )}
        <NumberSliderInput
          label="Koffein"
          value={caffeine}
          min={0}
          max={600}
          sliderStep={10}
          unit="mg"
          onChange={setCaffeine}
        />
      </div>

      {/* Resting heart rate + HRV + SpO₂ + Blood pressure */}
      {(cfg.restingHeartRate || cfg.hrv || cfg.spO2 || cfg.bloodPressure) && (
        <div className="grid grid-cols-2 gap-4">
          {cfg.restingHeartRate && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">Ruheherzfrequenz (bpm)</label>
              <input type="number" value={restingHeartRate} onChange={(e) => setRestingHeartRate(Number(e.target.value))} className={inputCls} />
            </div>
          )}
          {cfg.hrv && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">HRV (ms)</label>
              <input type="number" value={hrv} onChange={(e) => setHrv(Number(e.target.value))} className={inputCls} />
            </div>
          )}
          {cfg.spO2 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">Sauerstoffsättigung SpO₂ (%)</label>
              <input type="number" step={0.1} value={spO2} onChange={(e) => setSpO2(Number(e.target.value))} className={inputCls} />
            </div>
          )}
          {cfg.bloodPressure && (
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-sm font-medium text-[#8fa3c0]">Blutdruck (mmHg)</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={bpSystolic} onChange={(e) => setBpSystolic(Number(e.target.value))} placeholder="Syst." className={`${inputCls} flex-1`} />
                <span className="text-[#5a7090] font-bold">/</span>
                <input type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(Number(e.target.value))} placeholder="Diast." className={`${inputCls} flex-1`} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cardio + Training */}
      {(cfg.cardioCompleted || cfg.trainingCompleted) && (
        <div className="flex flex-col gap-3">
          {cfg.cardioCompleted && (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
                <span className="text-sm text-[#8fa3c0]">Cardio absolviert?</span>
                <button type="button" onClick={() => setCardio(!cardio)}
                  className={cn("w-12 h-6 rounded-full transition-all relative", cardio ? "bg-[#3b82f6]" : "bg-[#1e2d42]")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all", cardio ? "left-6" : "left-0.5")} />
                </button>
              </div>
              {cardio && (
                <div className="flex flex-col gap-1.5 pl-1">
                  <label className="text-sm font-medium text-[#8fa3c0]">Dauer Cardio (min)</label>
                  <input type="number" value={cardioDuration} onChange={(e) => setCardioDuration(Number(e.target.value))}
                    className={`${inputCls} w-40`} />
                </div>
              )}
            </>
          )}
          {cfg.trainingCompleted && (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
                <span className="text-sm text-[#8fa3c0]">Training absolviert?</span>
                <button type="button" onClick={() => setTraining(!training)}
                  className={cn("w-12 h-6 rounded-full transition-all relative", training ? "bg-[#3b82f6]" : "bg-[#1e2d42]")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all", training ? "left-6" : "left-0.5")} />
                </button>
              </div>
              {training && cfg.trainingQuality && (
                <SliderInput label="Trainingsqualität" value={trainingQuality} onChange={(v) => setTrainingQuality(v as 1|2|3|4|5)} />
              )}
            </>
          )}
        </div>
      )}

      {/* Nutrition Status */}
      {cfg.nutritionCompliance && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-[#8fa3c0]">Ernährung heute</label>
          <div className="flex flex-col gap-2">
            {nutritionOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setNutritionStatus(o.value)}
                className={cn(
                  "text-left px-4 py-3 rounded-xl border text-sm transition-all",
                  nutritionStatus === o.value
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/30"
                )}
              >
                <span className="font-medium">{o.label}</span>
                <span className={cn("block text-xs mt-0.5", nutritionStatus === o.value ? "text-[#60a5fa]/70" : "text-[#5a7090]")}>
                  {o.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Plan selector when meal_plan_followed */}
          {nutritionStatus === "meal_plan_followed" && mealPlans && mealPlans.length > 0 && (
            <div className="flex flex-col gap-2 pl-1">
              <label className="text-xs font-medium text-[#8fa3c0]">Welchen Plan hast du eingehalten?</label>
              <div className="flex flex-col gap-1.5">
                {mealPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedMealPlanId(plan.id)}
                    className={cn(
                      "text-left px-3 py-2 rounded-xl border text-sm transition-all",
                      selectedMealPlanId === plan.id
                        ? "bg-[#10b981]/10 border-[#10b981]/40 text-[#34d399]"
                        : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/30"
                    )}
                  >
                    {plan.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Link to calorie tracker when calorie_tracker_used */}
          {nutritionStatus === "calorie_tracker_used" && (
            <button
              type="button"
              onClick={handleCalorieTrackerClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#3b82f6]/30 text-[#60a5fa] text-sm hover:bg-[#3b82f6]/10 transition-colors self-start"
            >
              → Zum Kalorientracker
            </button>
          )}

          {/* Reason field when no_exact_info */}
          {nutritionStatus === "no_exact_info" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">
                Warum ist keine genaue Angabe möglich?{" "}
                <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                value={noExactNutritionReason}
                onChange={(e) => setNoExactNutritionReason(e.target.value)}
                rows={2}
                required
                placeholder="z. B. Essen außer Haus, keine Kontrolle über die Mengen..."
                className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Note */}
      {cfg.notes && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#8fa3c0]">Tagesanmerkung</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Wie war der Tag? Was fällt auf?"
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none" />
        </div>
      )}

      {/* Custom fields */}
      {(cfg.customFields ?? []).length > 0 && (
        <div className="flex flex-col gap-4">
          {(cfg.customFields ?? []).map((field) => {
            const val = customValues[field.id];
            if (field.type === "scale_1_5") {
              const current = (typeof val === "number" ? val : 3) as 1|2|3|4|5;
              return (
                <SliderInput
                  key={field.id}
                  label={field.label + (field.unit ? ` (${field.unit})` : "")}
                  value={current}
                  min={1} max={5} step={1}
                  onChange={(v) => setCustomValue(field.id, v as 1|2|3|4|5)}
                />
              );
            }
            if (field.type === "number") {
              return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#8fa3c0]">
                    {field.label}{field.unit ? ` (${field.unit})` : ""}
                  </label>
                  <input
                    type="number"
                    value={typeof val === "number" ? val : ""}
                    onChange={(e) => setCustomValue(field.id, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
              );
            }
            if (field.type === "boolean") {
              const active = typeof val === "boolean" ? val : false;
              return (
                <div key={field.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#8fa3c0]">{field.label}</span>
                  <button
                    type="button"
                    onClick={() => setCustomValue(field.id, !active)}
                    className={cn("w-10 h-5 rounded-full transition-all relative", active ? "bg-[#3b82f6]" : "bg-[#1e2d42]")}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", active ? "left-5" : "left-0.5")} />
                  </button>
                </div>
              );
            }
            // text
            return (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#8fa3c0]">{field.label}</label>
                <textarea
                  value={typeof val === "string" ? val : ""}
                  onChange={(e) => setCustomValue(field.id, e.target.value)}
                  rows={2}
                  placeholder="Freitext …"
                  className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                />
              </div>
            );
          })}
        </div>
      )}

      <FloatingSaveButton onClick={() => formRef.current?.requestSubmit()} label="Check-in speichern" />
    </form>
  );
}
