"use client";
import { useState, useMemo, useEffect } from "react";
import { TrainingLog, TrainingExerciseLog, TrainingSetLog } from "@/types";
import { TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react";

interface Props {
  trainingLogs: TrainingLog[];
}

type SetResult = "progress" | "same" | "regress" | "na";

function compareSet(curr: TrainingSetLog, prev: TrainingSetLog): SetResult {
  const cw = curr.weight, cr = curr.reps, pw = prev.weight, pr = prev.reps;
  if (cw == null || cr == null || pw == null || pr == null) return "na";
  if (cw > pw) return "progress";
  if (cw === pw && cr > pr) return "progress";
  if (cw === pw && cr === pr) return "same";
  return "regress";
}

function getMondayISO(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

interface ExSession {
  date: string;
  trainingDayName: string;
  exLog: TrainingExerciseLog;
}

interface ProcessedSession extends ExSession {
  comparisons: SetResult[];
  progressRate: number | null;
  improved: number;
  unchanged: number;
  regressed: number;
  comparable: number;
  extraSets: number;
}

interface WeekStats {
  label: string;
  progressRate: number | null;
  improved: number;
  comparable: number;
}

function buildExerciseHistory(trainingLogs: TrainingLog[]): Map<string, ExSession[]> {
  const map = new Map<string, ExSession[]>();
  for (const log of trainingLogs) {
    for (const exLog of log.exercises) {
      const name = exLog.exerciseName;
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push({ date: log.date, trainingDayName: log.trainingDayName, exLog });
    }
  }
  for (const sessions of map.values()) {
    sessions.sort((a, b) => a.date.localeCompare(b.date));
  }
  return map;
}

function processSessions(sessions: ExSession[]): ProcessedSession[] {
  return sessions.map((session, idx): ProcessedSession => {
    const prev = idx > 0 ? sessions[idx - 1] : null;
    const comparisons: SetResult[] = [];
    let improved = 0, unchanged = 0, regressed = 0;

    if (!prev) {
      return { ...session, comparisons: session.exLog.sets.map(() => "na" as SetResult), progressRate: null, improved: 0, unchanged: 0, regressed: 0, comparable: 0, extraSets: 0 };
    }

    const comparable = Math.min(session.exLog.sets.length, prev.exLog.sets.length);
    for (let i = 0; i < session.exLog.sets.length; i++) {
      if (i < comparable) {
        const r = compareSet(session.exLog.sets[i], prev.exLog.sets[i]);
        comparisons.push(r);
        if (r === "progress") improved++;
        else if (r === "same") unchanged++;
        else if (r === "regress") regressed++;
      } else {
        comparisons.push("na");
      }
    }

    const total = improved + unchanged + regressed;
    const progressRate = total > 0 ? Math.round((improved / total) * 1000) / 10 : null;
    const extraSets = session.exLog.sets.length - comparable;
    return { ...session, comparisons, progressRate, improved, unchanged, regressed, comparable: total, extraSets };
  }).reverse();
}

function computeWeekStats(trainingLogs: TrainingLog[], exerciseHistory: Map<string, ExSession[]>, fromDate: string, toDate: string, label: string): WeekStats {
  let totalImproved = 0, totalComparable = 0;

  const logsInRange = trainingLogs.filter(l => l.date >= fromDate && l.date <= toDate);
  for (const log of logsInRange) {
    for (const exLog of log.exercises) {
      const allSessions = exerciseHistory.get(exLog.exerciseName) ?? [];
      const prevSession = [...allSessions].filter(s => s.date < log.date).pop();
      if (!prevSession) continue;

      const comparable = Math.min(exLog.sets.length, prevSession.exLog.sets.length);
      for (let i = 0; i < comparable; i++) {
        const r = compareSet(exLog.sets[i], prevSession.exLog.sets[i]);
        if (r !== "na") {
          totalComparable++;
          if (r === "progress") totalImproved++;
        }
      }
    }
  }

  return {
    label,
    progressRate: totalComparable > 0 ? Math.round((totalImproved / totalComparable) * 1000) / 10 : null,
    improved: totalImproved,
    comparable: totalComparable,
  };
}

// ─── Session Card ─────────────────────────────────────────────────────────────

interface CardProps {
  session: ProcessedSession;
  defaultOpen: boolean;
}

function SessionCard({ session, defaultOpen }: CardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const noComparison = session.progressRate === null && session.comparable === 0;

  const rateColor =
    session.progressRate == null ? "text-[#5a7090]" :
    session.progressRate >= 66 ? "text-[#10b981]" :
    session.progressRate >= 33 ? "text-[#f0d060]" :
    "text-[#ef4444]";

  const rateBg =
    session.progressRate == null ? "bg-[#1e2d42]" :
    session.progressRate >= 66 ? "bg-[#10b981]/15" :
    session.progressRate >= 33 ? "bg-[#f0d060]/15" :
    "bg-[#ef4444]/15";

  return (
    <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-medium text-[#f0f4ff]">{formatDate(session.date)}</p>
          <p className="text-xs text-[#5a7090] mt-0.5">{session.trainingDayName}</p>
        </div>
        <div className="flex items-center gap-2">
          {noComparison ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e2d42] text-[#5a7090]">Erster Log</span>
          ) : session.progressRate !== null ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rateBg} ${rateColor}`}>
              {session.progressRate}%
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e2d42] text-[#5a7090]">–</span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#5a7090] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-[#1e2d42] px-4 py-3">
          {noComparison && (
            <p className="text-xs text-[#5a7090] mb-3 italic">Keine Vergleichsdaten vorhanden – erste Einheit dieser Übung.</p>
          )}
          <div className="flex flex-col gap-1.5">
            {session.exLog.sets.map((set, i) => {
              const comp = session.comparisons[i] ?? "na";
              const isExtra = i >= session.comparable && !noComparison;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[#5a7090] w-14 shrink-0">Satz {set.setNumber}</span>
                  <span className={`text-sm flex-1 ${isExtra ? "text-[#5a7090]" : "text-[#f0f4ff]"}`}>
                    {set.weight != null ? `${set.weight} kg` : "–"}
                    {" × "}
                    {set.reps != null ? set.reps : "–"}
                    {set.rir != null ? <span className="text-[#5a7090]"> @RIR{set.rir}</span> : null}
                    {isExtra && <span className="text-xs text-[#5a7090] ml-1">(extra)</span>}
                  </span>
                  {!isExtra && !noComparison && (
                    comp === "progress" ? <TrendingUp className="w-4 h-4 text-[#10b981] shrink-0" /> :
                    comp === "same" ? <Minus className="w-4 h-4 text-[#5a7090] shrink-0" /> :
                    comp === "regress" ? <TrendingDown className="w-4 h-4 text-[#ef4444] shrink-0" /> :
                    null
                  )}
                </div>
              );
            })}
          </div>

          {!noComparison && (
            <div className="mt-3 pt-3 border-t border-[#1e2d42] flex gap-4 text-xs">
              <span className="text-[#10b981]">↑ {session.improved} gesteigert</span>
              <span className="text-[#5a7090]">= {session.unchanged} gleich</span>
              <span className="text-[#ef4444]">↓ {session.regressed} gefallen</span>
              {session.extraSets > 0 && (
                <span className="text-[#5a7090]">+{session.extraSets} extra</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TrainingProgress({ trainingLogs }: Props) {
  const exerciseHistory = useMemo(() => buildExerciseHistory(trainingLogs), [trainingLogs]);

  const exerciseNames = useMemo(
    () => [...exerciseHistory.keys()].sort((a, b) => a.localeCompare(b, "de")),
    [exerciseHistory]
  );

  const [selectedExercise, setSelectedExercise] = useState<string>(exerciseNames[0] ?? "");

  useEffect(() => {
    if (exerciseNames.length > 0 && !exerciseHistory.has(selectedExercise)) {
      setSelectedExercise(exerciseNames[0]);
    }
  }, [exerciseNames, exerciseHistory, selectedExercise]);

  const processedSessions = useMemo(
    () => processSessions(exerciseHistory.get(selectedExercise) ?? []),
    [selectedExercise, exerciseHistory]
  );

  const weeklyStats = useMemo((): WeekStats[] => {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonday = getMondayISO(today);
    const thisSunday = addDays(thisMonday, 6);
    const fourWeeksAgo = addDays(thisMonday, -21);

    return [
      computeWeekStats(trainingLogs, exerciseHistory, thisMonday, thisSunday, "Diese Woche"),
      computeWeekStats(trainingLogs, exerciseHistory, fourWeeksAgo, thisSunday, "Letzte 4 Wochen"),
    ];
  }, [trainingLogs, exerciseHistory]);

  const latestSession = processedSessions[0];

  if (exerciseNames.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#141d2e] border border-[#1e2d42] text-center">
        <p className="text-sm text-[#5a7090]">Noch keine Trainingseinheiten geloggt.</p>
        <p className="text-xs text-[#5a7090] mt-1">Nutze den Trainingstracker, um deine erste Einheit einzutragen.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Global weekly stats */}
      <div className="grid grid-cols-2 gap-3">
        {weeklyStats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
            <p className="text-xs text-[#5a7090] mb-1">{stat.label}</p>
            {stat.progressRate !== null ? (
              <>
                <p className={`text-2xl font-bold ${stat.progressRate >= 66 ? "text-[#10b981]" : stat.progressRate >= 33 ? "text-[#f0d060]" : "text-[#ef4444]"}`}>
                  {stat.progressRate}%
                </p>
                <p className="text-xs text-[#5a7090] mt-0.5">{stat.improved} / {stat.comparable} Sätze</p>
              </>
            ) : (
              <p className="text-base text-[#5a7090] mt-1">Keine Daten</p>
            )}
          </div>
        ))}
      </div>

      {/* Exercise selector */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Übung</p>
        <div className="relative">
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            className="w-full bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm appearance-none pr-8 focus:outline-none focus:border-[#3b82f6]"
          >
            {exerciseNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7090] pointer-events-none" />
        </div>
      </div>

      {/* Summary for selected exercise (most recent session) */}
      {latestSession && latestSession.comparable > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Gesteigert", value: latestSession.improved, color: "text-[#10b981]" },
            { label: "Gleich", value: latestSession.unchanged, color: "text-[#5a7090]" },
            { label: "Gefallen", value: latestSession.regressed, color: "text-[#ef4444]" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42] text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-[#5a7090] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Session history */}
      <div key={selectedExercise} className="flex flex-col gap-3">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest px-1">
          Verlauf · {processedSessions.length} {processedSessions.length === 1 ? "Einheit" : "Einheiten"}
        </p>
        {processedSessions.map((session, idx) => (
          <SessionCard
            key={`${session.date}-${idx}`}
            session={session}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}
