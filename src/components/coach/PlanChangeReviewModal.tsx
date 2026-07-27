"use client";
import { useState } from "react";
import { X, Check } from "lucide-react";
import { motion } from "framer-motion";
import {
  Athlete, PlanChangeRequest, TrainingPlan, MealPlan, Exercise, MealEntry, Meal, TrainingDay,
} from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  athlete: Athlete;
  request: PlanChangeRequest;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onClose: () => void;
}

// ── diff helpers ───────────────────────────────────────────────────────────────

type Mark = "same" | "changed" | "only-left" | "only-right";

function getMark(hasLeft: boolean, hasRight: boolean, diff: boolean): Mark {
  if (!hasLeft) return "only-right";
  if (!hasRight) return "only-left";
  return diff ? "changed" : "same";
}

function rowBg(m: Mark) {
  if (m === "only-right") return "bg-[#0d2d1a]";
  if (m === "only-left") return "bg-[#2d0d0d]";
  if (m === "changed") return "bg-[#2d0d0d]/60";
  return "";
}

function cellBg(m: Mark, side: "l" | "r") {
  if (m === "only-right") return side === "r" ? "bg-[#14532d]/50" : "opacity-0 pointer-events-none";
  if (m === "only-left") return side === "l" ? "bg-[#450a0a]/50" : "opacity-0 pointer-events-none";
  if (m === "changed") return "bg-[#450a0a]/40";
  return "bg-[#0f1624]";
}

function cellText(m: Mark, side: "l" | "r") {
  if (m === "only-right") return side === "r" ? "text-[#4ade80]" : "";
  if (m === "only-left") return side === "l" ? "text-[#f87171]" : "";
  if (m === "changed") return "text-[#f87171]";
  return "text-[#8fa3c0]";
}

// ── exercise summary string ────────────────────────────────────────────────────

function exSummary(ex: Exercise): string {
  let s = `${ex.sets} × ${ex.reps}`;
  if (ex.rir != null) s += `  RiR ${ex.rir}`;
  if (ex.rpe != null) s += `  RPE ${ex.rpe}`;
  if (ex.restSeconds) s += `  ${ex.restSeconds}s Pause`;
  return s;
}

function exDiffs(a: Exercise, b: Exercise): boolean {
  return (
    a.name !== b.name ||
    a.sets !== b.sets ||
    a.reps !== b.reps ||
    a.rir !== b.rir ||
    a.rpe !== b.rpe ||
    a.restSeconds !== b.restSeconds ||
    (a.note ?? "") !== (b.note ?? "")
  );
}

// ── ExerciseRow ───────────────────────────────────────────────────────────────

function ExerciseRow({ cur, prop }: { cur: Exercise | undefined; prop: Exercise | undefined }) {
  const m = getMark(!!cur, !!prop, !!cur && !!prop && exDiffs(cur, prop));

  function Cell({ side, ex }: { side: "l" | "r"; ex: Exercise | undefined }) {
    const bg = cellBg(m, side);
    const txt = cellText(m, side);
    if (!ex) return <div className={cn("rounded-lg p-2 min-h-[3rem]", bg)} />;
    return (
      <div className={cn("rounded-lg p-2 flex flex-col gap-0.5", bg)}>
        <span className={cn("text-xs font-medium leading-tight", m !== "same" ? txt : "text-[#f0f4ff]")}>
          {ex.name}
        </span>
        <span className={cn("text-[10px]", txt)}>{exSummary(ex)}</span>
        {ex.note && <span className={cn("text-[10px] italic", txt)}>{ex.note}</span>}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-1.5", rowBg(m))}>
      <Cell side="l" ex={cur} />
      <Cell side="r" ex={prop} />
    </div>
  );
}

// ── DaySection ────────────────────────────────────────────────────────────────

function DaySection({ curDay, propDay, idx }: { curDay: TrainingDay | undefined; propDay: TrainingDay | undefined; idx: number }) {
  const dayMark = getMark(!!curDay, !!propDay, !!(curDay && propDay && (curDay.dayName !== propDay.dayName || curDay.label !== propDay.label)));
  const maxEx = Math.max(curDay?.exercises.length ?? 0, propDay?.exercises.length ?? 0);

  return (
    <div className="flex flex-col gap-1">
      {/* Day header */}
      <div className="grid grid-cols-2 gap-1.5">
        {[{ side: "l" as const, day: curDay }, { side: "r" as const, day: propDay }].map(({ side, day }) => (
          <div
            key={side}
            className={cn(
              "rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide",
              day ? cellBg(dayMark, side) : "opacity-0",
              cellText(dayMark, side)
            )}
          >
            {day ? `${day.dayName}${day.label ? ` · ${day.label}` : ""}` : `Tag ${idx + 1}`}
          </div>
        ))}
      </div>
      {/* Exercises */}
      <div className="flex flex-col gap-1">
        {maxEx === 0 ? (
          <p className="text-xs text-[#3b4d6a] px-2 py-1">Keine Übungen</p>
        ) : (
          Array.from({ length: maxEx }).map((_, ei) => (
            <ExerciseRow key={ei} cur={curDay?.exercises[ei]} prop={propDay?.exercises[ei]} />
          ))
        )}
      </div>
      {/* Day note */}
      {(curDay?.note || propDay?.note) && (() => {
        const nm = getMark(!!curDay?.note, !!propDay?.note, curDay?.note !== propDay?.note);
        return (
          <div className="grid grid-cols-2 gap-1.5 mt-0.5">
            {([["l", curDay?.note], ["r", propDay?.note]] as ["l" | "r", string | undefined][]).map(([side, note]) => (
              <div key={side} className={cn("rounded-lg px-2 py-1 text-[10px] italic", note ? cellBg(nm, side) : "opacity-0", cellText(nm, side))}>
                {note ?? ""}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ── TrainingDiff ──────────────────────────────────────────────────────────────

function TrainingDiff({ current, proposed }: { current: TrainingPlan | undefined; proposed: TrainingPlan }) {
  const maxDays = Math.max(current?.days.length ?? 0, proposed.days.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Plan-level note diff */}
      {(current?.coachNote || proposed.coachNote) && (() => {
        const m = getMark(!!current?.coachNote, !!proposed.coachNote, current?.coachNote !== proposed.coachNote);
        return (
          <div className="grid grid-cols-2 gap-1.5">
            {([["l", current?.coachNote] as const, ["r", proposed.coachNote] as const]).map(([side, note]) => (
              <div key={side} className={cn("rounded-lg px-2 py-1.5 text-[10px] italic", note ? cellBg(m, side) : "opacity-0", cellText(m, side))}>
                {note ?? ""}
              </div>
            ))}
          </div>
        );
      })()}

      {Array.from({ length: maxDays }).map((_, di) => (
        <DaySection
          key={di}
          idx={di}
          curDay={current?.days[di]}
          propDay={proposed.days[di]}
        />
      ))}
    </div>
  );
}

// ── MealEntryRow ──────────────────────────────────────────────────────────────

function MealEntryRow({ cur, prop }: { cur: MealEntry | undefined; prop: MealEntry | undefined }) {
  const diff = !!cur && !!prop && (cur.foodItemId !== prop.foodItemId || cur.amountG !== prop.amountG);
  const m = getMark(!!cur, !!prop, diff);

  function Cell({ side, entry }: { side: "l" | "r"; entry: MealEntry | undefined }) {
    const bg = cellBg(m, side);
    const txt = cellText(m, side);
    if (!entry) return <div className={cn("rounded-lg p-2 min-h-[2.25rem]", bg)} />;
    return (
      <div className={cn("rounded-lg px-2 py-1.5 flex items-center justify-between gap-2", bg)}>
        <span className={cn("text-xs leading-tight", m !== "same" ? txt : "text-[#f0f4ff]")} style={{ wordBreak: "break-word" }}>
          {entry.foodItem.name}
        </span>
        <span className={cn("text-xs font-medium shrink-0", txt)}>{entry.amountG} g</span>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-1.5", rowBg(m))}>
      <Cell side="l" entry={cur} />
      <Cell side="r" entry={prop} />
    </div>
  );
}

// ── MealSection ───────────────────────────────────────────────────────────────

function MealSection({ curMeal, propMeal, idx }: { curMeal: Meal | undefined; propMeal: Meal | undefined; idx: number }) {
  const nameDiff = !!(curMeal && propMeal && curMeal.name !== propMeal.name);
  const hm = getMark(!!curMeal, !!propMeal, nameDiff);
  const maxEntries = Math.max(curMeal?.entries.length ?? 0, propMeal?.entries.length ?? 0);

  return (
    <div className="flex flex-col gap-1">
      {/* Meal name header */}
      <div className="grid grid-cols-2 gap-1.5">
        {([["l", curMeal] as const, ["r", propMeal] as const]).map(([side, meal]) => (
          <div
            key={side}
            className={cn(
              "rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide",
              meal ? cellBg(hm, side) : "opacity-0",
              cellText(hm, side)
            )}
          >
            {meal?.name ?? `Mahlzeit ${idx + 1}`}
            {meal?.time ? ` · ${meal.time}` : ""}
          </div>
        ))}
      </div>
      {/* Entries */}
      <div className="flex flex-col gap-0.5">
        {maxEntries === 0 ? (
          <p className="text-xs text-[#3b4d6a] px-2 py-1">Keine Einträge</p>
        ) : (
          Array.from({ length: maxEntries }).map((_, ei) => (
            <MealEntryRow key={ei} cur={curMeal?.entries[ei]} prop={propMeal?.entries[ei]} />
          ))
        )}
      </div>
    </div>
  );
}

// ── MealDiff ─────────────────────────────────────────────────────────────────

function MealDiff({ current, proposed }: { current: MealPlan | undefined; proposed: MealPlan }) {
  const maxMeals = Math.max(current?.meals.length ?? 0, proposed.meals.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Macro targets diff */}
      {(current?.macroTargets || proposed.macroTargets) && (() => {
        const ct = current?.macroTargets;
        const pt = proposed.macroTargets;
        const changed = ct?.kcal !== pt?.kcal || ct?.protein !== pt?.protein || ct?.carbs !== pt?.carbs || ct?.fat !== pt?.fat;
        const m = getMark(!!ct, !!pt, changed);
        return (
          <div className="grid grid-cols-2 gap-1.5">
            {([["l", ct] as const, ["r", pt] as const]).map(([side, t]) => (
              <div key={side} className={cn("rounded-lg px-2 py-1.5 text-[10px]", t ? cellBg(m, side) : "opacity-0", cellText(m, side))}>
                {t ? `${t.kcal} kcal · P ${t.protein}g · K ${t.carbs}g · F ${t.fat}g` : ""}
              </div>
            ))}
          </div>
        );
      })()}

      {Array.from({ length: maxMeals }).map((_, mi) => (
        <MealSection
          key={mi}
          idx={mi}
          curMeal={current?.meals[mi]}
          propMeal={proposed.meals[mi]}
        />
      ))}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function PlanChangeReviewModal({ athlete, request, onApprove, onReject, onClose }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const isTraining = request.planType === "training";
  const proposed = request.proposedPlan;

  const currentPlan = isTraining
    ? athlete.trainingPlan
    : (athlete.mealPlans ?? []).find((p) => p.id === (proposed as MealPlan).id);

  async function handleApprove() {
    setLoading("approve");
    try { await onApprove(); } finally { setLoading(null); }
  }

  async function handleReject() {
    setLoading("reject");
    try { await onReject(); } finally { setLoading(null); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl bg-[#0d1526] border-t border-[#1e2d42]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0d1526] flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e2d42] shrink-0">
          <div>
            <p className="text-[10px] text-[#f59e0b] uppercase tracking-wider mb-0.5">Planänderungsvorschlag</p>
            <p className="text-sm font-semibold text-[#f0f4ff]">
              {isTraining ? "Trainingsplan" : "Ernährungsplan"} · {athlete.name}
            </p>
            <p className="text-[10px] text-[#5a7090] mt-0.5">
              {new Date(request.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-2 gap-1.5 px-4 pt-3 pb-2 shrink-0">
          <div className="text-[10px] font-semibold text-[#5a7090] uppercase tracking-widest px-2">
            Aktuell
          </div>
          <div className="text-[10px] font-semibold text-[#f59e0b] uppercase tracking-widest px-2">
            Vorschlag
          </div>
        </div>

        {/* Scrollable diff content */}
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {isTraining ? (
            <TrainingDiff
              current={currentPlan as TrainingPlan | undefined}
              proposed={proposed as TrainingPlan}
            />
          ) : (
            <MealDiff
              current={currentPlan as MealPlan | undefined}
              proposed={proposed as MealPlan}
            />
          )}
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 px-4 pb-6 pt-3 border-t border-[#1e2d42] flex gap-2">
          <button
            type="button"
            disabled={!!loading}
            onClick={handleReject}
            className={cn(
              "flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors",
              loading === "reject"
                ? "border-[#ef4444]/20 text-[#ef4444]/50 bg-[#ef4444]/5"
                : "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20"
            )}
          >
            {loading === "reject" ? "…" : "Ablehnen"}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={handleApprove}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5",
              loading === "approve"
                ? "bg-[#10b981]/50 text-white/50"
                : "bg-[#10b981] text-white hover:bg-[#059669]"
            )}
          >
            {loading === "approve" ? "…" : <><Check size={14} /> Bestätigen &amp; übernehmen</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
