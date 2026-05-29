"use client";
import { useState } from "react";
import { WeeklyCheckIn, Athlete } from "@/types";
import { SliderInput } from "@/components/ui/SliderInput";
import { analyzeWeek, todayISO, getWeekDates } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";

interface WeeklyCheckInFormProps {
  athlete: Athlete;
  onSubmit: (data: Omit<WeeklyCheckIn, "id" | "athleteId">) => void;
  initialValues?: Partial<WeeklyCheckIn>;
  isEdit?: boolean;
}


export function WeeklyCheckInForm({ athlete, onSubmit, initialValues, isEdit }: WeeklyCheckInFormProps) {
  const today = todayISO();
  const { start: weekStart } = getWeekDates(today);
  const analysis = analyzeWeek(athlete);

  const [overallWeekRating, setOverallWeekRating] = useState<1|2|3|4|5>((initialValues?.overallWeekRating as 1|2|3|4|5) ?? 3);
  const [weekSatisfaction, setWeekSatisfaction] = useState<1|2|3|4|5>((initialValues?.weekSatisfaction as 1|2|3|4|5) ?? 3);
  const [selfSatisfaction, setSelfSatisfaction] = useState<1|2|3|4|5>((initialValues?.selfSatisfaction as 1|2|3|4|5) ?? 3);
  const [nutritionAdherence, setNutritionAdherence] = useState<1|2|3|4|5>((initialValues?.nutritionAdherence as 1|2|3|4|5) ?? 3);
  const [hungerCravings, setHungerCravings] = useState(initialValues?.hungerCravings ?? "");
  const [trainingRating, setTrainingRating] = useState<1|2|3|4|5>((initialValues?.trainingRating as 1|2|3|4|5) ?? 3);
  const [stressAvg, setStressAvg] = useState(initialValues?.stressAvg ?? 3);
  const [energyAvg, setEnergyAvg] = useState(initialValues?.energyAvg ?? 3);
  const [specialEvents, setSpecialEvents] = useState(initialValues?.specialEvents ?? "");
  const [freeNote, setFreeNote] = useState(initialValues?.freeNote ?? "");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      weekStart, date: today,
      overallWeekRating, weekSatisfaction, selfSatisfaction,
      nutritionAdherence, hungerCravings,
      trainingRating, stressAvg, energyAvg,
      specialEvents, coachNote: "", freeNote,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#064e3b] flex items-center justify-center text-3xl">✓</div>
        <p className="text-lg font-semibold text-[#f0f4ff]">Wochen-Check-in gespeichert!</p>
        <p className="text-[#8fa3c0] text-sm">Der Coach hat Zugriff auf deine Auswertung.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Auto-Analyse */}
      <div className="p-4 rounded-2xl bg-[#0f1624] border border-[#1e2d42]">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-3">Automatische Wochenanalyse</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Ø Gewicht diese Woche" value={analysis.currentWeekAvg || "–"} unit="kg" />
          <StatCard label="Ø Gewicht Vorwoche" value={analysis.previousWeekAvg || "–"} unit="kg" />
          <StatCard
            label="Veränderung"
            value={analysis.changeKg > 0 ? `+${analysis.changeKg}` : analysis.changeKg}
            unit="kg"
            color={analysis.changeKg < 0 ? "text-[#3b82f6]" : "text-[#f0f4ff]"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SliderInput label="Gesamteinschätzung der Woche" value={overallWeekRating} onChange={(v) => setOverallWeekRating(v as 1|2|3|4|5)} />
        <SliderInput label="Zufriedenheit mit der Woche" value={weekSatisfaction} onChange={(v) => setWeekSatisfaction(v as 1|2|3|4|5)} />
        <SliderInput label="Zufriedenheit mit dir selbst" value={selfSatisfaction} onChange={(v) => setSelfSatisfaction(v as 1|2|3|4|5)} />
      </div>

      <SliderInput
        label="Wie einfach war es, sich diese Woche an den Ernährungsplan zu halten?"
        value={nutritionAdherence}
        onChange={(v) => setNutritionAdherence(v as 1|2|3|4|5)}
        labelMin="Sehr schwer"
        labelMax="Sehr leicht"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#8fa3c0]">Hunger, Cravings oder Probleme?</label>
        <textarea
          value={hungerCravings}
          onChange={(e) => setHungerCravings(e.target.value)}
          rows={2}
          placeholder="Gab es Cravings, Hunger oder Schwierigkeiten?"
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SliderInput label="Wie lief dein Training diese Woche?" value={trainingRating} onChange={(v) => setTrainingRating(v as 1|2|3|4|5)} />
        <SliderInput label="Stressdurchschnitt" value={stressAvg} onChange={(v) => setStressAvg(v as 1|2|3|4|5)} colorMode="negative_high" labelMin="Entspannt" labelMax="Sehr gestresst" />
        <SliderInput label="Energiedurchschnitt" value={energyAvg} onChange={(v) => setEnergyAvg(v as 1|2|3|4|5)} labelMin="Erschöpft" labelMax="Voller Energie" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#8fa3c0]">Besondere Ereignisse</label>
        <textarea
          value={specialEvents}
          onChange={(e) => setSpecialEvents(e.target.value)}
          rows={2}
          placeholder="Urlaub, Krankheit, Stress, Event..."
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#8fa3c0]">Freie Wochenanmerkung</label>
        <textarea
          value={freeNote}
          onChange={(e) => setFreeNote(e.target.value)}
          rows={3}
          placeholder="Eigene Gedanken zur Woche..."
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
        />
      </div>

      <button type="submit"
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors">
        {isEdit ? "Änderungen speichern" : "Wochen-Check-in absenden"}
      </button>
    </form>
  );
}
