import { DailyCheckIn, SeasonPhase, SeasonPlan, PhaseType } from "@/types";

export const DEFAULT_CORRIDOR_KG = 0.5;
export const DEFAULT_GREEN_PCT = 25;
export const DEFAULT_YELLOW_PCT = 50;

export type Ampel = "green" | "yellow" | "red" | "gray";

export interface PhaseStatus {
  targetToday: number | null;
  actualToday: number | null;
  deviationKg: number | null;
  actualRateKgPerWeek: number | null;
  targetRateKgPerWeek: number;
  ampel: Ampel;
  reason: string;
}

export interface Forecast {
  endDate: string | null;
  diffDays: number | null;
  unreachable: boolean;
}

export interface Progress {
  phasePercent: number;
  overallPercent: number;
}

export interface ActualRate {
  kgPerWeek: number | null;
  percentPerWeek: number | null;
  startAvg: number | null;
  endAvg: number | null;
}

// ─── Date utils ───────────────────────────────────────────────────────────────

export function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function parseISO(iso: string): Date {
  return new Date(iso + "T12:00:00Z");
}

export function todayISO(): string {
  return toISO(new Date());
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = parseISO(aIso).getTime();
  const b = parseISO(bIso).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function weeksBetween(aIso: string, bIso: string): number {
  return daysBetween(aIso, bIso) / 7;
}

// ─── 7-day trend ──────────────────────────────────────────────────────────────

/**
 * Rolling 7-day average of body weight up to (and including) `date`.
 * Needs at least 4 valid readings in the window — otherwise returns null.
 */
export function weightTrend7(entries: DailyCheckIn[], date: string): number | null {
  if (!entries || entries.length === 0) return null;
  const to = parseISO(date).getTime();
  const from = to - 6 * 24 * 60 * 60 * 1000; // inclusive of 7 days
  const window = entries.filter((e) => {
    if (typeof e.weight !== "number" || isNaN(e.weight) || e.weight <= 0) return false;
    const t = parseISO(e.date).getTime();
    return t >= from && t <= to;
  });
  if (window.length < 4) return null;
  const sum = window.reduce((s, e) => s + e.weight, 0);
  return Math.round((sum / window.length) * 100) / 100;
}

/**
 * Approx. latest trend as of today for display anywhere needing "current weight".
 */
export function currentTrend(entries: DailyCheckIn[]): number | null {
  return weightTrend7(entries, todayISO());
}

// ─── Default start weight for new phases ──────────────────────────────────────

export function defaultStartWeight(
  plan: SeasonPlan | undefined,
  newPhaseStartDate: string,
  entries: DailyCheckIn[]
): number {
  const today = todayISO();
  if (newPhaseStartDate <= today) {
    const trend = weightTrend7(entries, today);
    if (trend != null) return trend;
  }
  // Prefer target of the phase that ends just before the new start date
  if (plan) {
    const prior = [...plan.phases]
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .reverse()
      .find((p) => p.endDate <= newPhaseStartDate);
    if (prior) return prior.targetWeight;
    const first = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    if (first) return first.startWeight;
  }
  const latest = weightTrend7(entries, today);
  return latest ?? 80;
}

// ─── Phase recomputation ──────────────────────────────────────────────────────

/**
 * Given an edited phase, derive the other value (endDate or rate) according to
 * inputMode. Returns a new phase (does not mutate).
 */
export function recomputePhase(phase: SeasonPhase): SeasonPhase {
  const delta = phase.targetWeight - phase.startWeight;
  if (phase.inputMode === "target_and_date") {
    const weeks = weeksBetween(phase.startDate, phase.endDate);
    const rate = weeks > 0 ? delta / weeks : 0;
    return { ...phase, targetRatePerWeek: round2(rate) };
  }
  // target_and_rate → derive endDate
  if (Math.abs(phase.targetRatePerWeek) < 1e-6) {
    // Maintenance style with 0 rate — keep user's endDate.
    return phase;
  }
  const weeks = delta / phase.targetRatePerWeek;
  if (!isFinite(weeks) || weeks <= 0) return phase;
  const endDate = addDays(phase.startDate, Math.round(weeks * 7));
  return { ...phase, endDate };
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

// ─── Target curve ─────────────────────────────────────────────────────────────

export interface TargetPoint {
  date: string;
  target: number;
  phaseId?: string;
  corridor?: number; // only when the current phase is maintenance/peak
}

/**
 * Daily target points across all phases of the plan. Linear per phase.
 * Phases are sorted by start date.
 */
export function buildTargetCurve(plan: SeasonPlan): TargetPoint[] {
  const phases = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (phases.length === 0) return [];
  const out: TargetPoint[] = [];
  for (const p of phases) {
    const totalDays = Math.max(1, daysBetween(p.startDate, p.endDate));
    const steps = totalDays + 1;
    for (let i = 0; i < steps; i++) {
      const date = addDays(p.startDate, i);
      const ratio = i / totalDays;
      const target = p.startWeight + (p.targetWeight - p.startWeight) * ratio;
      const corridor = (p.type === "maintenance" || p.type === "peak")
        ? (p.corridorKg ?? DEFAULT_CORRIDOR_KG)
        : undefined;
      out.push({ date, target: round2(target), phaseId: p.id, corridor });
    }
  }
  // Remove duplicated boundary dates (end of phase == start of next)
  const seen = new Set<string>();
  const dedup: TargetPoint[] = [];
  for (const p of out) {
    if (seen.has(p.date)) continue;
    seen.add(p.date);
    dedup.push(p);
  }
  return dedup;
}

export function targetAt(plan: SeasonPlan, date: string): number | null {
  const phase = findPhaseAt(plan, date);
  if (!phase) return null;
  const total = Math.max(1, daysBetween(phase.startDate, phase.endDate));
  const elapsed = Math.max(0, Math.min(total, daysBetween(phase.startDate, date)));
  const ratio = elapsed / total;
  return round2(phase.startWeight + (phase.targetWeight - phase.startWeight) * ratio);
}

export function findPhaseAt(plan: SeasonPlan, date: string): SeasonPhase | undefined {
  return plan.phases.find((p) => date >= p.startDate && date <= p.endDate);
}

export function activePhase(plan: SeasonPlan): SeasonPhase | undefined {
  const today = todayISO();
  return findPhaseAt(plan, today)
    ?? [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}

// ─── Actual rate over a range ─────────────────────────────────────────────────

/**
 * Computes rate from the 7-day trend at range start vs. range end.
 * Returns null when either anchor doesn't have enough data.
 */
export function actualRate(
  entries: DailyCheckIn[],
  rangeStart: string,
  rangeEnd: string
): ActualRate {
  const startAvg = weightTrend7(entries, rangeStart);
  const endAvg = weightTrend7(entries, rangeEnd);
  if (startAvg == null || endAvg == null) {
    return { kgPerWeek: null, percentPerWeek: null, startAvg, endAvg };
  }
  const weeks = Math.max(1 / 7, weeksBetween(rangeStart, rangeEnd));
  const kgPerWeek = (endAvg - startAvg) / weeks;
  const percentPerWeek = startAvg > 0 ? (kgPerWeek / startAvg) * 100 : 0;
  return {
    kgPerWeek: round2(kgPerWeek),
    percentPerWeek: round2(percentPerWeek),
    startAvg,
    endAvg,
  };
}

// ─── Phase status (traffic light) ─────────────────────────────────────────────

export function phaseStatus(phase: SeasonPhase, entries: DailyCheckIn[]): PhaseStatus {
  const today = todayISO();
  const effectiveDate = today < phase.startDate ? phase.startDate : (today > phase.endDate ? phase.endDate : today);

  // Target on effectiveDate
  const total = Math.max(1, daysBetween(phase.startDate, phase.endDate));
  const elapsed = Math.max(0, Math.min(total, daysBetween(phase.startDate, effectiveDate)));
  const ratio = elapsed / total;
  const targetToday = round2(phase.startWeight + (phase.targetWeight - phase.startWeight) * ratio);

  const actualToday = weightTrend7(entries, effectiveDate);
  const targetRate = phase.targetRatePerWeek;

  if (actualToday == null) {
    return {
      targetToday,
      actualToday: null,
      deviationKg: null,
      actualRateKgPerWeek: null,
      targetRateKgPerWeek: targetRate,
      ampel: "gray",
      reason: "Zu wenig Daten für 7-Tage-Trend",
    };
  }

  const deviationKg = round2(actualToday - targetToday);

  // Compute observed rate from phase start to effectiveDate using the trend
  const startTrend = weightTrend7(entries, phase.startDate);
  let actualRateKgPerWeek: number | null = null;
  if (startTrend != null) {
    const weeks = Math.max(1 / 7, weeksBetween(phase.startDate, effectiveDate));
    actualRateKgPerWeek = round2((actualToday - startTrend) / weeks);
  }

  const isCorridorType = phase.type === "maintenance" || phase.type === "peak";
  if (isCorridorType) {
    const corridor = phase.corridorKg ?? DEFAULT_CORRIDOR_KG;
    const absDev = Math.abs(deviationKg);
    let ampel: Ampel = "green";
    if (absDev > corridor * 2) ampel = "red";
    else if (absDev > corridor) ampel = "yellow";
    return {
      targetToday,
      actualToday,
      deviationKg,
      actualRateKgPerWeek,
      targetRateKgPerWeek: targetRate,
      ampel,
      reason: ampel === "green" ? "Im Korridor" : ampel === "yellow" ? "Außerhalb Korridor" : "Deutlich außerhalb Korridor",
    };
  }

  // Directional phases
  if (actualRateKgPerWeek == null) {
    // Fall back to deviation ampel if we can't compute a rate
    const abs = Math.abs(deviationKg);
    let ampel: Ampel = "green";
    if (abs > 1.5) ampel = "red";
    else if (abs > 0.5) ampel = "yellow";
    return {
      targetToday,
      actualToday,
      deviationKg,
      actualRateKgPerWeek: null,
      targetRateKgPerWeek: targetRate,
      ampel,
      reason: "Rate konnte nicht berechnet werden",
    };
  }

  const greenPct = phase.toleranceGreenPct ?? DEFAULT_GREEN_PCT;
  const yellowPct = phase.toleranceYellowPct ?? DEFAULT_YELLOW_PCT;
  const absTargetRate = Math.abs(targetRate);
  if (absTargetRate < 1e-6) {
    // Treat near-zero rate like maintenance (fall through to deviation check)
    const abs = Math.abs(deviationKg);
    let ampel: Ampel = "green";
    if (abs > 1.5) ampel = "red";
    else if (abs > 0.5) ampel = "yellow";
    return { targetToday, actualToday, deviationKg, actualRateKgPerWeek, targetRateKgPerWeek: targetRate, ampel, reason: "Rate ~ 0" };
  }
  const diffPct = ((actualRateKgPerWeek - targetRate) / absTargetRate) * 100;
  const absDiff = Math.abs(diffPct);
  let ampel: Ampel = "green";
  if (absDiff > yellowPct) ampel = "red";
  else if (absDiff > greenPct) ampel = "yellow";

  // Direction mismatch (e.g. target is cut but athlete is gaining) → at least yellow
  const dirMismatch = Math.sign(actualRateKgPerWeek) !== Math.sign(targetRate) && Math.abs(actualRateKgPerWeek) > absTargetRate * 0.25;
  if (dirMismatch && ampel === "green") ampel = "yellow";

  return {
    targetToday,
    actualToday,
    deviationKg,
    actualRateKgPerWeek,
    targetRateKgPerWeek: targetRate,
    ampel,
    reason: ampel === "green" ? "Im Plan" : ampel === "yellow" ? "Leichte Abweichung" : "Starke Abweichung",
  };
}

// ─── Forecast end date ────────────────────────────────────────────────────────

export function forecastEndDate(phase: SeasonPhase, entries: DailyCheckIn[]): Forecast {
  const today = todayISO();
  const effectiveDate = today < phase.startDate ? phase.startDate : (today > phase.endDate ? phase.endDate : today);
  const actual = weightTrend7(entries, effectiveDate);
  const startTrend = weightTrend7(entries, phase.startDate) ?? phase.startWeight;
  if (actual == null) return { endDate: null, diffDays: null, unreachable: false };

  // Directional phases: compute observed weekly rate (phase start → now) and project to target
  const isCorridorType = phase.type === "maintenance" || phase.type === "peak";
  if (isCorridorType) {
    return { endDate: null, diffDays: null, unreachable: false };
  }

  const weeksSoFar = Math.max(1 / 7, weeksBetween(phase.startDate, effectiveDate));
  const observedRate = (actual - startTrend) / weeksSoFar;
  const remaining = phase.targetWeight - actual;
  if (Math.abs(observedRate) < 1e-4) {
    return { endDate: null, diffDays: null, unreachable: Math.abs(remaining) > 0.01 };
  }
  if (Math.sign(observedRate) !== Math.sign(remaining) && Math.abs(remaining) > 0.1) {
    return { endDate: null, diffDays: null, unreachable: true };
  }
  const weeksLeft = remaining / observedRate;
  if (!isFinite(weeksLeft) || weeksLeft < 0) {
    return { endDate: null, diffDays: null, unreachable: true };
  }
  const endIso = addDays(effectiveDate, Math.round(weeksLeft * 7));
  const diffDays = daysBetween(phase.endDate, endIso); // positive = later than plan
  return { endDate: endIso, diffDays, unreachable: false };
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function progress(phase: SeasonPhase, plan: SeasonPlan): Progress {
  const today = todayISO();
  const total = Math.max(1, daysBetween(phase.startDate, phase.endDate));
  const elapsed = Math.max(0, Math.min(total, daysBetween(phase.startDate, today)));
  const phasePercent = Math.round((elapsed / total) * 100);

  const sorted = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalDays = Math.max(1, daysBetween(first.startDate, last.endDate));
  const elapsedOverall = Math.max(0, Math.min(totalDays, daysBetween(first.startDate, today)));
  const overallPercent = Math.round((elapsedOverall / totalDays) * 100);

  return { phasePercent, overallPercent };
}

// ─── Shift subsequent phases ──────────────────────────────────────────────────

export function shiftPhasesAfter(plan: SeasonPlan, phaseId: string, days: number): SeasonPlan {
  const sorted = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const idx = sorted.findIndex((p) => p.id === phaseId);
  if (idx === -1) return plan;
  const next = sorted.map((p, i) => {
    if (i <= idx) return p;
    return {
      ...p,
      startDate: addDays(p.startDate, days),
      endDate: addDays(p.endDate, days),
    };
  });
  return { ...plan, phases: next, updatedAt: new Date().toISOString() };
}

// ─── Templates ────────────────────────────────────────────────────────────────

export type TemplateName = "aufbau_minicut_peak" | "klassische_diaet" | "aufbau";

function newPhaseId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createTemplate(
  name: TemplateName,
  startDate: string,
  startWeight: number,
  athleteId: string,
  planTitle = "Jahresplan"
): SeasonPlan {
  const nowIso = new Date().toISOString();
  const base = { toleranceGreenPct: DEFAULT_GREEN_PCT, toleranceYellowPct: DEFAULT_YELLOW_PCT };
  const makePhase = (overrides: Partial<SeasonPhase>): SeasonPhase => {
    const defaults: SeasonPhase = {
      id: newPhaseId("ph"),
      name: "Phase",
      type: "other",
      startDate,
      endDate: addDays(startDate, 7 * 8),
      inputMode: "target_and_rate",
      startWeight,
      targetWeight: startWeight,
      targetRatePerWeek: 0,
      ...base,
    };
    return recomputePhase({ ...defaults, ...overrides });
  };

  let phases: SeasonPhase[] = [];
  if (name === "aufbau_minicut_peak") {
    const aufbauWeeks = 23;
    const miniCutWeeks = 8;
    const peakWeeks = 12;
    const aufbauRate = startWeight * 0.002; // 0.2 %/w
    const aufbau = makePhase({
      name: "Aufbau",
      type: "bulk",
      startDate,
      endDate: addDays(startDate, aufbauWeeks * 7),
      inputMode: "target_and_date",
      startWeight,
      targetWeight: round2(startWeight + aufbauRate * aufbauWeeks),
    });
    const miniCutStart = aufbau.endDate;
    const miniCutRate = -(aufbau.targetWeight * 0.008); // -0.8 %/w
    const miniCut = makePhase({
      name: "Mini-Cut",
      type: "mini_cut",
      startDate: miniCutStart,
      endDate: addDays(miniCutStart, miniCutWeeks * 7),
      inputMode: "target_and_date",
      startWeight: aufbau.targetWeight,
      targetWeight: round2(aufbau.targetWeight + miniCutRate * miniCutWeeks),
    });
    const peakStart = miniCut.endDate;
    const peak = makePhase({
      name: "Peak",
      type: "peak",
      startDate: peakStart,
      endDate: addDays(peakStart, peakWeeks * 7),
      inputMode: "target_and_date",
      startWeight: miniCut.targetWeight,
      targetWeight: miniCut.targetWeight,
      corridorKg: DEFAULT_CORRIDOR_KG,
    });
    phases = [aufbau, miniCut, peak];
  } else if (name === "klassische_diaet") {
    const weeks = 16;
    const rate = -(startWeight * 0.006); // -0.6 %/w
    const diaet = makePhase({
      name: "Diät",
      type: "cut",
      startDate,
      endDate: addDays(startDate, weeks * 7),
      inputMode: "target_and_date",
      startWeight,
      targetWeight: round2(startWeight + rate * weeks),
    });
    phases = [diaet];
  } else if (name === "aufbau") {
    const weeks = 20;
    const rate = startWeight * 0.002;
    const aufbau = makePhase({
      name: "Aufbau",
      type: "bulk",
      startDate,
      endDate: addDays(startDate, weeks * 7),
      inputMode: "target_and_date",
      startWeight,
      targetWeight: round2(startWeight + rate * weeks),
    });
    phases = [aufbau];
  }

  return {
    id: `sp-${Date.now()}`,
    athleteId,
    title: planTitle,
    phases,
    visibleToAthlete: false,
    showStatusToAthlete: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

export interface PlanWarning {
  kind: "overlap" | "gap" | "rate_high" | "rate_direction";
  message: string;
  phaseId?: string;
}

export function planWarnings(plan: SeasonPlan): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const sorted = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (b.startDate < a.endDate) {
      warnings.push({ kind: "overlap", message: `Überlappung zwischen "${a.name}" und "${b.name}"`, phaseId: b.id });
    } else if (b.startDate > addDays(a.endDate, 1)) {
      warnings.push({ kind: "gap", message: `Lücke zwischen "${a.name}" und "${b.name}"`, phaseId: b.id });
    }
  }
  for (const p of sorted) {
    if (p.startWeight <= 0) continue;
    const pctPerWeek = (p.targetRatePerWeek / p.startWeight) * 100;
    if ((p.type === "bulk") && pctPerWeek > 0.25) {
      warnings.push({ kind: "rate_high", message: `Aufbau-Rate in "${p.name}" ist mit ${pctPerWeek.toFixed(2)} %/Woche sehr hoch`, phaseId: p.id });
    }
    if ((p.type === "cut" || p.type === "mini_cut") && pctPerWeek < -1) {
      warnings.push({ kind: "rate_high", message: `Diät-Rate in "${p.name}" ist mit ${pctPerWeek.toFixed(2)} %/Woche sehr hoch`, phaseId: p.id });
    }
  }
  return warnings;
}

// ─── Labels & colors ──────────────────────────────────────────────────────────

export function phaseTypeLabel(t: PhaseType): string {
  switch (t) {
    case "bulk": return "Aufbau";
    case "cut": return "Diät";
    case "mini_cut": return "Mini-Cut";
    case "maintenance": return "Erhalt";
    case "peak": return "Peak";
    case "other": return "Sonstiges";
  }
}

export function phaseTypeColor(t: PhaseType): string {
  switch (t) {
    case "bulk": return "#3b82f6";       // blue
    case "cut": return "#ef4444";        // red
    case "mini_cut": return "#f59e0b";   // amber
    case "maintenance": return "#10b981";// emerald
    case "peak": return "#a78bfa";       // violet
    case "other": return "#64748b";      // slate
  }
}

export function ampelColor(a: Ampel): string {
  switch (a) {
    case "green": return "#10b981";
    case "yellow": return "#eab308";
    case "red": return "#ef4444";
    case "gray": return "#64748b";
  }
}

export function formatSignedKg(kg: number | null): string {
  if (kg == null || isNaN(kg)) return "–";
  const r = Math.round(kg * 10) / 10;
  return (r >= 0 ? "+" : "") + r.toFixed(1) + " kg";
}

export function formatRate(kgPerWeek: number | null): string {
  if (kgPerWeek == null || isNaN(kgPerWeek)) return "–";
  const r = Math.round(kgPerWeek * 100) / 100;
  return (r >= 0 ? "+" : "") + r.toFixed(2) + " kg/W";
}

export function formatPct(pct: number | null): string {
  if (pct == null || isNaN(pct)) return "–";
  const r = Math.round(pct * 100) / 100;
  return (r >= 0 ? "+" : "") + r.toFixed(2) + " %/W";
}

/** Rate as %/Woche relative to a reference weight (phase start weight). */
export function ratePct(kgPerWeek: number | null, baseWeight: number | null | undefined): number | null {
  if (kgPerWeek == null || isNaN(kgPerWeek)) return null;
  if (!baseWeight || baseWeight <= 0) return null;
  return round2((kgPerWeek / baseWeight) * 100);
}

/** Deviation (kg) expressed as % of reference weight — single-point percentage, no /W. */
export function formatDeviationPct(deviationKg: number | null, baseWeight: number | null | undefined): string {
  if (deviationKg == null || isNaN(deviationKg) || !baseWeight || baseWeight <= 0) return "–";
  const pct = (deviationKg / baseWeight) * 100;
  const r = Math.round(pct * 100) / 100;
  return (r >= 0 ? "+" : "") + r.toFixed(2) + " %";
}
