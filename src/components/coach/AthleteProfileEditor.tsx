"use client";
import { Athlete, AthleteProfile } from "@/types";
import { AthleteStammdatenForm } from "@/components/athlete/AthleteStammdatenForm";
import { cn } from "@/lib/utils";

interface Props {
  athlete: Athlete;
  onSave: (updates: Partial<Athlete>) => void;
  onSaveProfile?: (profile: AthleteProfile) => void;
}

export function AthleteProfileEditor({ athlete, onSave, onSaveProfile }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#f0f4ff]">Planbearbeitung erlauben</p>
          <p className="text-xs text-[#5a7090] mt-0.5">
            Athlet kann Vorschläge für Trainings- und Ernährungsplan einreichen
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSave({ planBearbeitungErlaubt: !athlete.planBearbeitungErlaubt })}
          aria-label="Planbearbeitung erlauben"
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors shrink-0",
            athlete.planBearbeitungErlaubt ? "bg-[#3b82f6]" : "bg-[#1e2d42]"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
              athlete.planBearbeitungErlaubt ? "left-5" : "left-0.5"
            )}
          />
        </button>
      </div>
      <AthleteStammdatenForm athlete={athlete} mode="coach" onSave={onSave} onSaveProfile={onSaveProfile} />
    </div>
  );
}
