"use client";
import { useState } from "react";
import { TrainingPlan, TrainingDay } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink } from "lucide-react";

const dayColors: Record<string, string> = {
  Push: "text-blue-400",
  Pull: "text-purple-400",
  Legs: "text-orange-400",
  Upper: "text-cyan-400",
  "Full Body A": "text-green-400",
  "Full Body B": "text-green-400",
  "Full Body C": "text-green-400",
  Rest: "text-[#5a7090]",
  "Rest / Cardio": "text-yellow-400",
  "Rest/Cardio": "text-yellow-400",
};

function DayCard({ day, isOpen, onToggle }: { day: TrainingDay; isOpen: boolean; onToggle: () => void }) {
  const isRest = !day.exercises.length;
  const color = dayColors[day.label] ?? "text-[#8fa3c0]";

  return (
    <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
      <button
        type="button"
        onClick={!isRest ? onToggle : undefined}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3.5 text-left",
          !isRest && "hover:bg-[#192236] transition-colors"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#f0f4ff]">{day.dayName}</span>
            <span className={cn("text-xs font-medium", color)}>{day.label}</span>
          </div>
          {!isRest && (
            <span className="text-xs text-[#5a7090] bg-[#1e2d42] px-2 py-0.5 rounded-full">
              {day.exercises.length} Übungen
            </span>
          )}
        </div>
        {!isRest && (
          <ChevronDown
            size={16}
            className={cn("text-[#5a7090] transition-transform duration-200", isOpen && "rotate-180")}
          />
        )}
      </button>

      {isOpen && !isRest && (
        <div className="border-t border-[#1e2d42] divide-y divide-[#1e2d42]">
          {day.note && (
            <p className="px-4 py-2 text-xs text-[#8fa3c0] italic">{day.note}</p>
          )}
          {day.exercises.map((ex) => (
            <div key={ex.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[#f0f4ff]">{ex.name}</span>
                  {ex.muscleGroup && (
                    <span className="text-[10px] bg-[#1e2d42] text-[#8fa3c0] rounded px-1.5 py-0.5 leading-none">{ex.muscleGroup}</span>
                  )}
                </div>
                {ex.exerciseDbNote && (
                  <p className="text-xs text-[#5a7090] italic">{ex.exerciseDbNote}</p>
                )}
                {ex.note && <p className="text-xs text-[#5a7090]">{ex.note}</p>}
                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1 mt-0.5 w-fit"
                  >
                    <ExternalLink size={9} /> Ausführung öffnen
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span className="bg-[#1e2d42] text-[#8fa3c0] px-2 py-1 rounded-lg">{ex.sets} × {ex.reps}</span>
                {ex.rir !== undefined && (
                  <span className="bg-[#1e2d42] text-[#5a7090] px-2 py-1 rounded-lg">RIR {ex.rir}</span>
                )}
              </div>
            </div>
          ))}
          {day.note && day.exercises.length === 0 && (
            <p className="px-4 py-3 text-sm text-[#8fa3c0]">{day.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function TrainingAccordion({ plan }: { plan: TrainingPlan }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const today = new Date().getDay(); // 0=Sun
  const dayMap: Record<number, string> = { 0: "Sonntag", 1: "Montag", 2: "Dienstag", 3: "Mittwoch", 4: "Donnerstag", 5: "Freitag", 6: "Samstag" };
  const todayName = dayMap[today];

  return (
    <div className="flex flex-col gap-2">
      {plan.days.map((day) => {
        const isToday = day.dayName === todayName;
        return (
          <div key={day.id} className={cn(isToday && "ring-1 ring-[#3b82f6]/30 rounded-2xl")}>
            {isToday && (
              <p className="text-xs text-[#3b82f6] font-medium px-1 pb-1">● Heute</p>
            )}
            <DayCard
              day={day}
              isOpen={openId === day.id}
              onToggle={() => setOpenId(openId === day.id ? null : day.id)}
            />
          </div>
        );
      })}
      {plan.coachNote && (
        <div className="mt-2 p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
          <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Coach-Hinweis</p>
          <p className="text-sm text-[#8fa3c0]">{plan.coachNote}</p>
        </div>
      )}
    </div>
  );
}
