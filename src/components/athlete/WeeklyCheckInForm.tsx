"use client";
import { useRef, useState } from "react";
import { WeeklyCheckIn, Athlete, ProgressImage } from "@/types";
import { SliderInput } from "@/components/ui/SliderInput";
import { analyzeWeek, todayISO, getWeekDates } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";

interface WeeklyCheckInFormProps {
  athlete: Athlete;
  onSubmit: (data: Omit<WeeklyCheckIn, "id" | "athleteId">) => void;
  initialValues?: Partial<WeeklyCheckIn>;
  isEdit?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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
  const [progressImages, setProgressImages] = useState<ProgressImage[]>(initialValues?.progressImages ?? []);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function readFilesAsProgressImages(files: FileList | File[]): void {
    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const image: ProgressImage = {
          id: `pi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          url,
          uploadedAt: new Date().toISOString(),
          size: file.size,
          type: file.type,
        };
        setProgressImages((prev) => [...prev, image]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) readFilesAsProgressImages(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) readFilesAsProgressImages(e.dataTransfer.files);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      weekStart, date: today,
      overallWeekRating, weekSatisfaction, selfSatisfaction,
      nutritionAdherence, hungerCravings,
      trainingRating, stressAvg, energyAvg,
      specialEvents, coachNote: "", freeNote,
      progressImages: progressImages.length > 0 ? progressImages : undefined,
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
            label="Veränderung absolut"
            value={analysis.changeKg > 0 ? `+${analysis.changeKg}` : analysis.changeKg}
            unit="kg"
            color={analysis.changeKg < 0 ? "text-[#3b82f6]" : "text-[#f0f4ff]"}
          />
          <StatCard
            label="Veränderung relativ"
            value={
              analysis.previousWeekAvg === 0
                ? "–"
                : analysis.changePercent > 0
                ? `+${analysis.changePercent.toFixed(2)}`
                : analysis.changePercent.toFixed(2)
            }
            unit={analysis.previousWeekAvg === 0 ? "" : "%"}
            color={analysis.changePercent < 0 ? "text-[#3b82f6]" : "text-[#f0f4ff]"}
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

      {/* Fortschrittsbilder */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Fortschrittsbilder hinzufügen</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={[
            "flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors select-none",
            dragOver
              ? "border-[#3b82f6] bg-[#3b82f6]/10"
              : "border-[#1e2d42] bg-[#0f1624] hover:border-[#3b82f6]/50",
          ].join(" ")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#5a7090]">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-sm text-[#5a7090]">Bilder hinzufügen</span>
          <span className="text-xs text-[#3a4a60]">JPG · PNG · WebP · Optional</span>
        </div>

        {progressImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {progressImages.map((img) => (
              <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-[#1e2d42]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.fileName} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setProgressImages((prev) => prev.filter((i) => i.id !== img.id))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Bild entfernen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit"
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors">
        {isEdit ? "Änderungen speichern" : "Wochen-Check-in absenden"}
      </button>
    </form>
  );
}
