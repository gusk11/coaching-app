"use client";
import { useState, useEffect } from "react";
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

interface StoredTask { id: string; checkedAt: string | null; }

function loadVisibleTasks(athleteId: string): StoredTask[] {
  try {
    const raw = localStorage.getItem(`coach_tasks_v1_${athleteId}`);
    if (!raw) return [];
    const tasks: StoredTask[] = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => t.checkedAt === null || t.checkedAt >= today);
  } catch { return []; }
}

function formatCheckInDate(date: string): string {
  const d = new Date(date + "T12:00:00Z");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `Check-in ${day}.${month}.`;
}


interface AthleteCardProps {
  athlete: Athlete;
  checkInDate?: string;
  isCheckInToday?: boolean;
  hasPendingCheckIn?: boolean;
  isDone?: boolean;
  onToggleDone?: () => void;
}

export function AthleteCard({ athlete, checkInDate, isCheckInToday, hasPendingCheckIn, isDone, onToggleDone }: AthleteCardProps) {
  const router = useRouter();
  const analysis = analyzeWeek(athlete);
  const dist = calculateDistanceToGoal(athlete.currentWeight, athlete.targetWeight);
  const progress = calculateGoalProgressPercent(athlete.startWeight, athlete.currentWeight, athlete.targetWeight);
  const trendColor = getTrendColor(analysis.trend, athlete.goalType);
  const checkInDayLabel = athlete.checkInDay != null ? DAY_NAMES[athlete.checkInDay] : null;

  const [tasks, setTasks] = useState<StoredTask[]>([]);
  useEffect(() => { setTasks(loadVisibleTasks(athlete.id)); }, [athlete.id]);

  const hasPendingTasks = tasks.some((t) => t.checkedAt === null);

  // Priority: orange > yellow > green > blue
  const isOrange = isCheckInToday && !isDone;
  const isYellow = isDone && hasPendingTasks;
  const isGreen = isDone && !hasPendingTasks;

  const cardBg = isOrange
    ? "bg-[#1a1300] border-[#f59e0b]/25"
    : isYellow
    ? "bg-[#1a1200] border-[#eab308]/25"
    : isGreen
    ? "bg-[#0d1a14] border-[#10b981]/25"
    : "bg-[#141d2e] border-[#1e2d42]";

  const avatarBg = isOrange
    ? "bg-[#f59e0b]/15 text-[#f59e0b]"
    : isYellow
    ? "bg-[#eab308]/15 text-[#eab308]"
    : isGreen
    ? "bg-[#10b981]/15 text-[#10b981]"
    : "bg-[#1d4ed8]/20 text-[#60a5fa]";

  return (
    <div
      className={cn("w-full rounded-2xl border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all", cardBg)}
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
              !athlete.profileImage && avatarBg
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
            {(hasPendingCheckIn || (isCheckInToday && isDone)) && (
              <span className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                isGreen
                  ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                  : isYellow
                  ? "bg-[#eab308]/10 text-[#eab308] border-[#eab308]/20"
                  : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
              )}>
                {isCheckInToday ? "Check-in heute" : (checkInDate ? formatCheckInDate(checkInDate) : "Check-in offen")}
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

      {/* Coach check-in done toggle */}
      {onToggleDone && (
        <div className={cn(
          "mt-3 pt-3 border-t flex items-center justify-end",
          isGreen ? "border-[#10b981]/15" : isYellow ? "border-[#eab308]/10" : "border-[#f59e0b]/10"
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
