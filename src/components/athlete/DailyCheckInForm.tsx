"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DailyCheckIn, MealComplianceType, DailyCheckConfig, DEFAULT_DAILY_CHECK_CONFIG } from "@/types";
import { SliderInput } from "@/components/ui/SliderInput";
import { cn, todayISO } from "@/lib/utils";

interface DailyCheckInFormProps {
  athleteId: string;
  existingToday?: DailyCheckIn;
  checkConfig?: DailyCheckConfig;
  date?: string; // defaults to todayISO()
  onSubmit: (data: Omit<DailyCheckIn, "id" | "athleteId">) => void;
}

const mealComplianceOptions: { label: string; value: MealComplianceType }[] = [
  { label: "Plan vollständig eingehalten", value: "fully_followed" },
  { label: "Nicht nach Plan gegessen", value: "not_followed" },
  { label: "Im Kalorientracker eingetragen", value: "tracked_in_calorie_tracker" },
];


export function DailyCheckInForm({ athleteId, existingToday, checkConfig, date, onSubmit }: DailyCheckInFormProps) {
  const cfg: DailyCheckConfig = { ...DEFAULT_DAILY_CHECK_CONFIG, ...checkConfig };
  const init = existingToday;
  const router = useRouter();

  const [weight, setWeight] = useState(init?.weight ?? 80);
  const [measurementTime, setMeasurementTime] = useState(init?.measurementTime ?? "07:00");
  const [appetite, setAppetite] = useState<1|2|3|4|5>(init?.appetite ?? 3);
  const [digestion, setDigestion] = useState<1|2|3|4|5>(init?.digestion ?? 3);
  const [caffeine, setCaffeine] = useState(init?.caffeine ?? 200);
  const [steps, setSteps] = useState(init?.steps ?? 8000);
  const [cardio, setCardio] = useState(init?.cardio ?? false);
  const [cardioDuration, setCardioDuration] = useState(init?.cardioDuration ?? 30);
  const [training, setTraining] = useState(init?.training ?? false);
  const [trainingQuality, setTrainingQuality] = useState<1|2|3|4|5>(init?.trainingQuality ?? 3);
  const [sleepHours, setSleepHours] = useState(init?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState<1|2|3|4|5>(
    (init?.sleepQuality && init.sleepQuality <= 5 ? init.sleepQuality : 3) as 1|2|3|4|5
  );
  const [sleepScore, setSleepScore] = useState(init?.sleepScore ?? 75);
  const [restingHeartRate, setRestingHeartRate] = useState(init?.restingHeartRate ?? 55);
  const [hrv, setHrv] = useState(init?.hrv ?? 50);
  const [spO2, setSpO2] = useState(init?.spO2 ?? 98);
  const [bpSystolic, setBpSystolic] = useState(init?.bloodPressure?.systolic ?? 120);
  const [bpDiastolic, setBpDiastolic] = useState(init?.bloodPressure?.diastolic ?? 80);
  const [energyLevel, setEnergyLevel] = useState<1|2|3|4|5>(init?.energyLevel ?? 3);
  const [stressLevel, setStressLevel] = useState<1|2|3|4|5>(init?.stressLevel ?? 3);
  const [mood, setMood] = useState<1|2|3|4|5>(init?.mood ?? 3);
  const [note, setNote] = useState(init?.note ?? "");
  const [mealCompliance, setMealCompliance] = useState<MealComplianceType>(
    init?.mealCompliance ?? "fully_followed"
  );
  const [deviationReason, setDeviationReason] = useState(init?.deviationReason ?? "");
  const [submitted, setSubmitted] = useState(false);

  const needsDeviation = mealCompliance === "not_followed";
  const isTrackerEntry = mealCompliance === "tracked_in_calorie_tracker";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      mealCompliance: cfg.nutritionCompliance ? mealCompliance : "fully_followed",
      deviationReason: needsDeviation ? deviationReason : undefined,
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const inputCls = "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Weight + Time */}
      {cfg.bodyweight && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8fa3c0]">Gewicht (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className={inputCls} />
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
        {cfg.stressLevel && <SliderInput label="Stresslevel" value={stressLevel} onChange={(v) => setStressLevel(v as 1|2|3|4|5)} labelMin="Entspannt" labelMax="Sehr gestresst" />}
        {cfg.mood && <SliderInput label="Stimmung / Tagesgefühl" value={mood} onChange={(v) => setMood(v as 1|2|3|4|5)} labelMin="Sehr schlecht" labelMax="Ausgezeichnet" />}
      </div>

      {/* Subjective ratings */}
      <div className="grid grid-cols-1 gap-5">
        {cfg.appetite && <SliderInput label="Appetit" value={appetite} onChange={(v) => setAppetite(v as 1|2|3|4|5)} />}
        {cfg.digestion && <SliderInput label="Verdauung" value={digestion} onChange={(v) => setDigestion(v as 1|2|3|4|5)} />}
      </div>

      {/* Sleep */}
      <div className="grid grid-cols-2 gap-4">
        {cfg.sleepDuration && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8fa3c0]">Schlafdauer (h)</label>
            <input type="number" step="0.5" min={0} max={14} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className={inputCls} />
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
            <input type="number" min={0} max={100} value={sleepScore} onChange={(e) => setSleepScore(Number(e.target.value))} className={inputCls} />
          </div>
        )}
      </div>

      {/* Steps + Caffeine */}
      <div className="grid grid-cols-2 gap-4">
        {cfg.steps && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8fa3c0]">Schritte</label>
            <input type="number" step="500" min={0} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className={inputCls} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#8fa3c0]">Koffein (mg)</label>
          <input type="number" step="50" min={0} value={caffeine} onChange={(e) => setCaffeine(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      {/* Resting heart rate + HRV + SpO₂ + Blood pressure */}
      {(cfg.restingHeartRate || cfg.hrv || cfg.spO2 || cfg.bloodPressure) && (
        <div className="grid grid-cols-2 gap-4">
          {cfg.restingHeartRate && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">Ruheherzfrequenz (bpm)</label>
              <input type="number" min={30} max={200} value={restingHeartRate} onChange={(e) => setRestingHeartRate(Number(e.target.value))} className={inputCls} />
            </div>
          )}
          {cfg.hrv && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">HRV (ms)</label>
              <input type="number" min={1} max={300} value={hrv} onChange={(e) => setHrv(Number(e.target.value))} className={inputCls} />
            </div>
          )}
          {cfg.spO2 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">Sauerstoffsättigung SpO₂ (%)</label>
              <input type="number" min={80} max={100} step={0.1} value={spO2} onChange={(e) => setSpO2(Number(e.target.value))} className={inputCls} />
            </div>
          )}
          {cfg.bloodPressure && (
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-sm font-medium text-[#8fa3c0]">Blutdruck (mmHg)</label>
              <div className="flex gap-2 items-center">
                <input type="number" min={60} max={250} value={bpSystolic} onChange={(e) => setBpSystolic(Number(e.target.value))} placeholder="Syst." className={`${inputCls} flex-1`} />
                <span className="text-[#5a7090] font-bold">/</span>
                <input type="number" min={40} max={150} value={bpDiastolic} onChange={(e) => setBpDiastolic(Number(e.target.value))} placeholder="Diast." className={`${inputCls} flex-1`} />
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
                  <input type="number" min={1} max={300} step={5} value={cardioDuration} onChange={(e) => setCardioDuration(Number(e.target.value))}
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

      {/* Meal Compliance */}
      {cfg.nutritionCompliance && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-[#8fa3c0]">Ernährung heute</label>
          <div className="flex flex-col gap-2">
            {mealComplianceOptions.map((o) => (
              <button key={o.value} type="button" onClick={() => setMealCompliance(o.value)}
                className={cn("text-left px-4 py-2.5 rounded-xl border text-sm transition-all",
                  mealCompliance === o.value
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/30"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {needsDeviation && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8fa3c0]">Grund / kurze Anmerkung</label>
              <textarea value={deviationReason} onChange={(e) => setDeviationReason(e.target.value)} rows={2}
                placeholder="Kurze Anmerkung..."
                className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none" />
            </div>
          )}

          {isTrackerEntry && (
            <button
              type="button"
              onClick={() => router.push("/athlete/calorie-tracker")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#3b82f6]/30 text-[#60a5fa] text-sm hover:bg-[#3b82f6]/10 transition-colors self-start"
            >
              → Zum Kalorientracker
            </button>
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

      <button type="submit" className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors">
        {submitted ? "✓ Gespeichert!" : "Check-in speichern"}
      </button>
    </form>
  );
}
