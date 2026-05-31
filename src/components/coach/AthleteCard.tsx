"use client";
import { Athlete } from "@/types";
import {
  analyzeWeek, calculateDistanceToGoal, calculateGoalProgressPercent,
  getGoalLabel, getGoalColor, getTrendIcon, getTrendColor,
} from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

interface AthleteCardProps {
  athlete: Athlete;
  isCheckInToday?: boolean;
  isDone?: boolean;
  onToggleDone?: () => void;
}

export function AthleteCard({ athlete, isCheckInToday, isDone, onToggleDone }: AthleteCardProps) {
  const router = useRouter();
  const analysis = analyzeWeek(athlete);
  const dist = calculateDistanceToGoal(athlete.currentWeight, athlete.targetWeight);
  const progress = calculateGoalProgressPercent(athlete.startWeight, athlete.currentWeight, athlete.targetWeight);
  const trendColor = getTrendColor(analysis.trend, athlete.goalType);
  const checkInDayLabel = athlete.checkInDay != null ? DAY_NAMES[athlete.checkInDay] : null;

  return (
    <div
      className={cn(
        "w-full rounded-2xl border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all",
        isCheckInToday && !isDone
          ? "bg-[#1a1300] border-[#f59e0b]/25"
          : isCheckInToday && isDone
          ? "bg-[#0d1a14] border-[#10b981]/25"
          : "bg-[#141d2e] border-[#1e2d42]"
      )}
    >
      {/* Clickable area → athlete detail */}
      <button
        onClick={() => router.push(`/coach/athlete/${athlete.id}`)}
        className="w-full text-left group"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden",
              !athlete.profileImage && (isCheckInToday && !isDone
                ? "bg-[#f59e0b]/15 text-[#f59e0b]"
                : isCheckInToday && isDone
                ? "bg-[#10b981]/15 text-[#10b981]"
                : "bg-[#1d4ed8]/20 text-[#60a5fa]")
            )}>
              {athlete.profileImage ? (
                <img src={athlete.profileImage.url} alt={athlete.name} className="w-full h-full object-cover" />
              ) : (
                athlete.avatarInitials
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f0f4ff] group-hover:text-white">{athlete.name}</p>
              <p className={cn("text-xs font-medium", getGoalColor(athlete.goalType))}>
                {getGoalLabel(athlete.goalType)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isCheckInToday && (
              <span className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                isDone
                  ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                  : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
              )}>
                Check-in heute
              </span>
            )}
            <div className={cn("text-lg font-bold", trendColor)}>
              {getTrendIcon(analysis.trend)}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#5a7090]">Aktuell</span>
            <span className="text-sm font-bold text-[#f0f4ff]">{athlete.currentWeight} kg</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#5a7090]">Ziel</span>
            <span className="text-sm font-bold text-[#f0f4ff]">{athlete.targetWeight} kg</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#5a7090]">Abstand</span>
            <span className={cn("text-sm font-bold", Math.abs(dist) < 1 ? "text-[#10b981]" : "text-[#f0f4ff]")}>
              {dist > 0 ? `+${dist}` : dist} kg
            </span>
          </div>
        </div>

        {/* Progress */}
        <ProgressBar value={progress} label="Fortschritt zum Ziel" showPercent className="mb-3" />

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#5a7090]">
          <span>
            {checkInDayLabel ? `Check-in-Tag: ${checkInDayLabel}` : "Check-in-Tag: –"}
          </span>
          <Badge variant={analysis.trend === "falling" && athlete.goalType === "cut" ? "success" : analysis.trend === "rising" && athlete.goalType === "bulk" ? "success" : "default"}>
            {getTrendIcon(analysis.trend)} {analysis.changeKg > 0 ? "+" : ""}{analysis.changeKg} kg
          </Badge>
        </div>
      </button>

      {/* Coach check-in done toggle — only shown on check-in day */}
      {isCheckInToday && onToggleDone && (
        <div className={cn(
          "mt-3 pt-3 border-t flex items-center justify-end",
          isDone ? "border-[#10b981]/15" : "border-[#f59e0b]/10"
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
              isDone
                ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
                : "bg-transparent border-[#f59e0b]/15 text-[#8fa3c0] hover:border-[#f59e0b]/30 hover:text-[#f59e0b]"
            )}
          >
            <span className={cn(
              "w-4 h-4 rounded flex items-center justify-center border transition-all",
              isDone ? "bg-[#10b981] border-[#10b981]" : "border-[#5a7090]"
            )}>
              {isDone && <Check size={10} strokeWidth={3} className="text-black" />}
            </span>
            Check-in erledigt
          </button>
        </div>
      )}
    </div>
  );
}
