"use client";
import { DailyCheckIn, MealComplianceType } from "@/types";
import { X } from "lucide-react";

interface Props {
  ci: DailyCheckIn;
  onClose: () => void;
}

function stars(val: number, max = 5) {
  return "★".repeat(val) + "☆".repeat(max - val) + ` (${val}/5)`;
}

function complianceLabel(c: MealComplianceType): string {
  switch (c) {
    case "full":
    case "fully_followed":
      return "Plan vollständig eingehalten";
    case "full_tracking":
    case "tracked_in_calorie_tracker":
      return "Calorie Tracker genutzt";
    case "minor_deviation":
      return "Leichte Abweichung";
    case "major_deviation":
      return "Große Abweichung";
    case "off_plan":
      return "Nicht eingehalten";
    default:
      return c;
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#1e2d42] last:border-0 gap-3">
      <span className="text-xs text-[#5a7090] flex-shrink-0 w-40">{label}</span>
      <span className="text-xs text-[#f0f4ff] text-right break-words">{value ?? "–"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">{title}</p>
      <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] px-4 py-1">
        {children}
      </div>
    </section>
  );
}

export function DailyCheckDetailModal({ ci, onClose }: Props) {
  const dateLabel = new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
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
          <Section title="Körpermessung">
            <Row label="Körpergewicht" value={`${ci.weight} kg`} />
            <Row label="Messzeitpunkt" value={ci.measurementTime || "–"} />
          </Section>

          <Section title="Schlaf">
            <Row label="Schlafdauer" value={`${ci.sleepHours} h`} />
            <Row label="Schlafqualität" value={stars(ci.sleepQuality)} />
            <Row label="Schlafscore" value={ci.sleepScore != null ? `${ci.sleepScore} / 100` : "–"} />
          </Section>

          <Section title="Vitalwerte">
            <Row label="Ruheherzfrequenz" value={ci.restingHeartRate != null ? `${ci.restingHeartRate} bpm` : "–"} />
            <Row label="HRV" value={ci.hrv != null ? `${ci.hrv} ms` : "–"} />
            <Row label="SpO₂" value={ci.spO2 != null ? `${ci.spO2} %` : "–"} />
            <Row
              label="Blutdruck"
              value={ci.bloodPressure ? `${ci.bloodPressure.systolic} / ${ci.bloodPressure.diastolic} mmHg` : "–"}
            />
          </Section>

          <Section title="Wohlbefinden">
            <Row label="Energielevel" value={stars(ci.energyLevel)} />
            <Row label="Stresslevel" value={stars(ci.stressLevel)} />
            <Row label="Stimmung" value={stars(ci.mood)} />
            <Row label="Appetit" value={stars(ci.appetite)} />
            <Row label="Verdauung" value={stars(ci.digestion)} />
          </Section>

          <Section title="Bewegung">
            <Row label="Schritte" value={ci.steps.toLocaleString("de-DE")} />
            <Row label="Training absolviert" value={ci.training ? "Ja" : "Nein"} />
            <Row
              label="Trainingsqualität"
              value={ci.training ? stars(ci.trainingQuality) : "–"}
            />
            <Row label="Cardio absolviert" value={ci.cardio ? "Ja" : "Nein"} />
            <Row
              label="Cardio-Dauer"
              value={ci.cardioDuration != null ? `${ci.cardioDuration} min` : "–"}
            />
          </Section>

          <Section title="Ernährung">
            <Row label="Plan-Compliance" value={complianceLabel(ci.mealCompliance)} />
            {ci.deviationReason && (
              <Row label="Abweichungsgrund" value={ci.deviationReason} />
            )}
            <Row label="Kalorien" value={ci.calories != null ? `${ci.calories} kcal` : "–"} />
            <Row label="Protein" value={ci.protein != null ? `${ci.protein} g` : "–"} />
            <Row label="Kohlenhydrate" value={ci.carbs != null ? `${ci.carbs} g` : "–"} />
            <Row label="Fett" value={ci.fat != null ? `${ci.fat} g` : "–"} />
            <Row label="Ballaststoffe" value={ci.fiber != null ? `${ci.fiber} g` : "–"} />
            <Row label="Koffein" value={ci.caffeine ? `${ci.caffeine} mg` : "–"} />
          </Section>

          {ci.note && (
            <section>
              <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Tagesanmerkung</p>
              <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] p-4">
                <p className="text-sm text-[#8fa3c0] leading-relaxed whitespace-pre-wrap">{ci.note}</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
