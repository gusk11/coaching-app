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
import { Check, Plus, X } from "lucide-react";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

interface CoachTask {
  id: string;
  label: string;
  checkedAt: string | null;
  createdAt: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatCheckInDate(date: string): string {
  const d = new Date(date + "T12:00:00Z");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `Check-in ${day}.${month}.`;
}

function loadCoachTasks(athleteId: string): CoachTask[] {
  try {
    const raw = localStorage.getItem(`coach_tasks_v1_${athleteId}`);
    if (!raw) return [];
    const tasks: CoachTask[] = JSON.parse(raw);
    const today = todayISO();
    return tasks.filter((t) => t.checkedAt === null || t.checkedAt >= today);
  } catch { return []; }
}

function saveCoachTasksToStorage(athleteId: string, tasks: CoachTask[]) {
  localStorage.setItem(`coach_tasks_v1_${athleteId}`, JSON.stringify(tasks));
}

interface AthleteCardProps {
  athlete: Athlete;
  checkInDate?: string;
  isCheckInToday?: boolean;
  hasPendingCheckIn?: boolean;
  isDone?: boolean;
  onToggleDone?: () => void;
  refreshKey?: number;
  onTasksChanged?: () => void;
}

export function AthleteCard({ athlete, checkInDate, isCheckInToday, hasPendingCheckIn, isDone, onToggleDone, refreshKey, onTasksChanged }: AthleteCardProps) {
  const router = useRouter();
  const analysis = analyzeWeek(athlete);
  const dist = calculateDistanceToGoal(athlete.currentWeight, athlete.targetWeight);
  const progress = calculateGoalProgressPercent(athlete.startWeight, athlete.currentWeight, athlete.targetWeight);
  const trendColor = getTrendColor(analysis.trend, athlete.goalType);
  const checkInDayLabel = athlete.checkInDay != null ? DAY_NAMES[athlete.checkInDay] : null;

  const [coachTasks, setCoachTasks] = useState<CoachTask[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [customTaskInput, setCustomTaskInput] = useState("");

  useEffect(() => {
    setCoachTasks(loadCoachTasks(athlete.id));
  }, [athlete.id, refreshKey]);

  function addCoachTask(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const updated = [...coachTasks, { id: crypto.randomUUID(), label: trimmed, checkedAt: null, createdAt: todayISO() }];
    setCoachTasks(updated);
    saveCoachTasksToStorage(athlete.id, updated);
    setCustomTaskInput("");
    setShowAddTask(false);
    onTasksChanged?.();
  }

  function toggleCoachTask(taskId: string) {
    const today = todayISO();
    const updated = coachTasks.map((t) =>
      t.id === taskId ? { ...t, checkedAt: t.checkedAt ? null : today } : t
    );
    setCoachTasks(updated);
    saveCoachTasksToStorage(athlete.id, updated);
    onTasksChanged?.();
  }

  function removeCoachTask(taskId: string) {
    // Mark as done instead of immediate delete — disappears overnight
    const today = todayISO();
    const updated = coachTasks.map((t) =>
      t.id === taskId ? { ...t, checkedAt: today } : t
    );
    setCoachTasks(updated);
    saveCoachTasksToStorage(athlete.id, updated);
    onTasksChanged?.();
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all",
        hasPendingCheckIn
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
              !athlete.profileImage && (hasPendingCheckIn
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
            {(hasPendingCheckIn || (isCheckInToday && isDone)) && (
              <span className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                isDone
                  ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
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

      {/* Coach tasks — always visible, outside navigation button */}
      <div
        className="mt-3 pt-3 border-t border-[#1e2d42]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#5a7090]">Aufgaben</span>
          <button
            onClick={() => { setShowAddTask((v) => !v); setCustomTaskInput(""); }}
            className={cn(
              "p-0.5 rounded transition-colors",
              showAddTask ? "text-[#ef4444] hover:text-[#fca5a5]" : "text-[#3b4d6a] hover:text-[#60a5fa]"
            )}
          >
            {showAddTask ? <X size={11} /> : <Plus size={11} />}
          </button>
        </div>

        {coachTasks.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {coachTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-1.5 group">
                <button
                  onClick={() => toggleCoachTask(task.id)}
                  className={cn(
                    "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                    task.checkedAt
                      ? "bg-[#10b981] border-[#10b981]"
                      : "border-[#3b4d6a] hover:border-[#60a5fa]"
                  )}
                >
                  {task.checkedAt && <Check size={9} className="text-white" />}
                </button>
                <span className={cn(
                  "text-xs flex-1",
                  task.checkedAt ? "line-through text-[#3b4d6a]" : "text-[#8fa3c0]"
                )}>
                  {task.label}
                </span>
                <button
                  onClick={() => removeCoachTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#3b4d6a] hover:text-[#ef4444] transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {coachTasks.length === 0 && !showAddTask && (
          <p className="text-xs text-[#3b4d6a]">Keine Aufgaben</p>
        )}

        {showAddTask && (
          <div className="mt-1.5 flex gap-1.5">
            <input
              value={customTaskInput}
              onChange={(e) => setCustomTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCoachTask(customTaskInput);
                if (e.key === "Escape") { setShowAddTask(false); setCustomTaskInput(""); }
              }}
              placeholder="Neue Aufgabe..."
              autoFocus
              className="flex-1 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2 py-1 text-xs text-[#f0f4ff] placeholder:text-[#3b4d6a] focus:outline-none focus:border-[#3b82f6]/60 transition-colors"
            />
            <button
              onClick={() => addCoachTask(customTaskInput)}
              disabled={!customTaskInput.trim()}
              className="px-2 py-1 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa] text-xs disabled:opacity-30 hover:bg-[#3b82f6]/20 transition-all"
            >
              <Check size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
