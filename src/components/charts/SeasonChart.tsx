"use client";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { DailyCheckIn, SeasonPlan } from "@/types";
import {
  addDays, buildTargetCurve, daysBetween, parseISO, phaseTypeColor,
  recomputePhase, toISO, todayISO, weightTrend7,
} from "@/lib/seasonUtils";
import { dynamicTightWeight } from "@/lib/chartUtils";

export type SeasonChartRange = "7" | "30" | "90" | "all" | "plan";

interface Props {
  plan: SeasonPlan;
  entries: DailyCheckIn[];
  editable?: boolean;
  onChange?: (plan: SeasonPlan) => void;
  range?: SeasonChartRange;
  onRangeChange?: (r: SeasonChartRange) => void;
  height?: number;
  /** Hide the range selector (used when embedded inside another analytics view). */
  hideRangeButtons?: boolean;
  showStatus?: boolean; // whether to render ampel/corridor hints
}

const RANGE_LABELS: { key: SeasonChartRange; label: string }[] = [
  { key: "7", label: "7 Tage" },
  { key: "30", label: "30 Tage" },
  { key: "90", label: "3 Monate" },
  { key: "all", label: "Gesamt" },
  { key: "plan", label: "Gesamter Plan" },
];

const MARGIN = { top: 10, right: 14, bottom: 24, left: 44 };

export function SeasonChart({
  plan, entries, editable = false, onChange,
  range: controlledRange, onRangeChange, height = 260, hideRangeButtons = false, showStatus = true,
}: Props) {
  const [uncontrolledRange, setUncontrolledRange] = useState<SeasonChartRange>("plan");
  const range = controlledRange ?? uncontrolledRange;
  const setRange = (r: SeasonChartRange) => {
    if (onRangeChange) onRangeChange(r);
    else setUncontrolledRange(r);
  };

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 600, h: height });
  const [hover, setHover] = useState<{ iso: string; px: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((ents) => {
      for (const e of ents) {
        setSize({ w: Math.max(260, e.contentRect.width), h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const phases = useMemo(
    () => [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [plan.phases]
  );

  const { startIso, endIso } = useMemo(() => {
    const planStart = phases[0]?.startDate ?? todayISO();
    const planEnd = phases[phases.length - 1]?.endDate ?? todayISO();
    const today = todayISO();
    switch (range) {
      case "7":   return { startIso: addDays(today, -7), endIso: today };
      case "30":  return { startIso: addDays(today, -30), endIso: today };
      case "90":  return { startIso: addDays(today, -90), endIso: today };
      case "all": {
        const first = entries.length ? entries[0].date : planStart;
        return { startIso: first < planStart ? first : planStart, endIso: today > planEnd ? today : planEnd };
      }
      case "plan":
      default:    return { startIso: planStart, endIso: planEnd };
    }
  }, [range, phases, entries]);

  const totalDays = Math.max(1, daysBetween(startIso, endIso));

  // Target curve limited to the view
  const curve = useMemo(() => {
    const all = buildTargetCurve(plan);
    return all.filter((p) => p.date >= startIso && p.date <= endIso);
  }, [plan, startIso, endIso]);

  // 7-day trend series
  const trend = useMemo(() => {
    const start = parseISO(startIso).getTime();
    const end = parseISO(endIso).getTime();
    const out: { date: string; value: number }[] = [];
    for (let t = start; t <= end; t += 24 * 60 * 60 * 1000) {
      const iso = toISO(new Date(t));
      const v = weightTrend7(entries, iso);
      if (v != null) out.push({ date: iso, value: v });
    }
    return out;
  }, [entries, startIso, endIso]);

  const rawPoints = useMemo(() => entries
    .filter((e) => typeof e.weight === "number" && e.weight > 0 && e.date >= startIso && e.date <= endIso)
    .map((e) => ({ date: e.date, value: e.weight })),
    [entries, startIso, endIso]);

  // Y domain
  const allY: number[] = useMemo(() => {
    const ys: number[] = [];
    for (const p of curve) {
      ys.push(p.target);
      if (p.corridor != null) {
        ys.push(p.target + p.corridor);
        ys.push(p.target - p.corridor);
      }
    }
    for (const p of trend) ys.push(p.value);
    for (const p of rawPoints) ys.push(p.value);
    return ys.filter((v) => isFinite(v));
  }, [curve, trend, rawPoints]);

  const [yMin, yMax] = useMemo(() => {
    if (allY.length === 0) return [60, 100];
    return dynamicTightWeight(allY);
  }, [allY]);

  const innerW = size.w - MARGIN.left - MARGIN.right;
  const innerH = size.h - MARGIN.top - MARGIN.bottom;

  const xFromIso = useCallback((iso: string): number => {
    const d = daysBetween(startIso, iso);
    return (d / totalDays) * innerW;
  }, [startIso, totalDays, innerW]);
  const yFromKg = useCallback((kg: number): number => {
    const r = (kg - yMin) / (yMax - yMin || 1);
    return innerH - r * innerH;
  }, [yMin, yMax, innerH]);

  const xToIso = useCallback((x: number): string => {
    const ratio = Math.max(0, Math.min(1, x / innerW));
    const days = Math.round(ratio * totalDays);
    return addDays(startIso, days);
  }, [innerW, totalDays, startIso]);
  const yToKg = useCallback((y: number): number => {
    const ratio = Math.max(0, Math.min(1, 1 - y / innerH));
    const kg = yMin + ratio * (yMax - yMin);
    return Math.round(kg * 10) / 10;
  }, [innerH, yMin, yMax]);

  // ─── Drag state ──────────────────────────────────────────────────────────
  type Drag =
    | { kind: "boundary"; phaseIdx: number; which: "end" }
    | { kind: "target"; phaseIdx: number }
    | null;
  const [drag, setDrag] = useState<Drag>(null);

  const onPointerDown = (e: React.PointerEvent, d: Drag) => {
    if (!editable || !d) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag(d);
  };

  const svgToLocal = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return { x: clientX - rect.left - MARGIN.left, y: clientY - rect.top - MARGIN.top };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !editable || !onChange) return;
    const { x, y } = svgToLocal(e.clientX, e.clientY);
    const sorted = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const next = [...sorted];
    const p = { ...next[drag.phaseIdx] };
    if (drag.kind === "boundary") {
      const minIso = addDays(p.startDate, 7); // keep phases >= 1 week
      const nextPhase = next[drag.phaseIdx + 1];
      const maxIso = nextPhase ? addDays(nextPhase.endDate, -7) : addDays(p.endDate, 365);
      let iso = xToIso(x);
      if (iso < minIso) iso = minIso;
      if (iso > maxIso) iso = maxIso;
      p.endDate = iso;
      if (nextPhase) {
        const n = { ...nextPhase, startDate: iso };
        next[drag.phaseIdx + 1] = recomputePhase(n);
      }
    } else if (drag.kind === "target") {
      const kg = yToKg(y);
      p.targetWeight = kg;
    }
    next[drag.phaseIdx] = recomputePhase(p);
    onChange({ ...plan, phases: next, updatedAt: new Date().toISOString() });
  };

  const onPointerUp = () => {
    if (drag) setDrag(null);
  };

  // ─── X-axis tick marks (phase starts + today + last) ────────────────────
  const tickDates = useMemo(() => {
    const set = new Set<string>();
    for (const p of phases) {
      if (p.startDate >= startIso && p.startDate <= endIso) set.add(p.startDate);
      if (p.endDate >= startIso && p.endDate <= endIso) set.add(p.endDate);
    }
    set.add(startIso); set.add(endIso);
    return Array.from(set).sort();
  }, [phases, startIso, endIso]);

  const yTicks = useMemo(() => {
    const span = yMax - yMin;
    const step = span <= 5 ? 1 : span <= 15 ? 2 : span <= 30 ? 5 : 10;
    const out: number[] = [];
    const start = Math.ceil(yMin / step) * step;
    for (let v = start; v <= yMax; v += step) out.push(v);
    return out;
  }, [yMin, yMax]);

  const today = todayISO();
  const todayX = (today >= startIso && today <= endIso) ? xFromIso(today) : null;

  // Lookup maps for hover tooltip
  const trendMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of trend) m.set(p.date, p.value);
    return m;
  }, [trend]);
  const curveMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of curve) m.set(p.date, p.target);
    return m;
  }, [curve]);
  const rawMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of rawPoints) m.set(p.date, p.value);
    return m;
  }, [rawPoints]);

  const hoverValues = useMemo(() => {
    if (!hover) return null;
    return {
      iso: hover.iso,
      trend: trendMap.get(hover.iso) ?? null,
      target: curveMap.get(hover.iso) ?? null,
      raw: rawMap.get(hover.iso) ?? null,
    };
  }, [hover, trendMap, curveMap, rawMap]);

  const updateHoverFromEvent = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left - MARGIN.left;
    const y = clientY - rect.top - MARGIN.top;
    if (x < 0 || x > innerW || y < 0 || y > innerH) {
      setHover(null);
      return;
    }
    const iso = xToIso(x);
    setHover({ iso, px: xFromIso(iso) });
  }, [innerW, innerH, xToIso, xFromIso]);

  // Lines
  const targetPath = useMemo(() => pointsToPath(curve.map((p) => [xFromIso(p.date), yFromKg(p.target)])), [curve, xFromIso, yFromKg]);
  const trendPath = useMemo(() => pointsToPath(trend.map((p) => [xFromIso(p.date), yFromKg(p.value)])), [trend, xFromIso, yFromKg]);

  // Corridor band path (upper + lower) — rendered as 2 light paths
  const corridorUpperPath = useMemo(() => pointsToPath(
    curve.filter((p) => p.corridor != null).map((p) => [xFromIso(p.date), yFromKg(p.target + (p.corridor ?? 0))])
  ), [curve, xFromIso, yFromKg]);
  const corridorLowerPath = useMemo(() => pointsToPath(
    curve.filter((p) => p.corridor != null).map((p) => [xFromIso(p.date), yFromKg(p.target - (p.corridor ?? 0))])
  ), [curve, xFromIso, yFromKg]);

  return (
    <div className="flex flex-col gap-3">
      {!hideRangeButtons && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {RANGE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === key
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#0f1624] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full" style={{ height }}>
        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          className="block"
          onPointerMove={(e) => { onPointerMove(e); if (!drag) updateHoverFromEvent(e.clientX, e.clientY); }}
          onPointerLeave={() => setHover(null)}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {/* Grid */}
            {yTicks.map((v) => (
              <line key={`gy-${v}`} x1={0} x2={innerW} y1={yFromKg(v)} y2={yFromKg(v)} stroke="#1e2d42" strokeDasharray="3 3" />
            ))}

            {/* Phase bands (clipped to visible range) */}
            {phases.map((p, i) => {
              const s = p.startDate < startIso ? startIso : p.startDate;
              const e = p.endDate > endIso ? endIso : p.endDate;
              if (s >= e) return null;
              const x1 = xFromIso(s);
              const x2 = xFromIso(e);
              const color = phaseTypeColor(p.type);
              return (
                <g key={`band-${p.id}`}>
                  <rect x={x1} y={0} width={Math.max(0, x2 - x1)} height={innerH} fill={color} opacity={0.08} />
                  <line x1={x1} x2={x1} y1={0} y2={innerH} stroke={color} strokeOpacity={0.3} strokeDasharray="2 3" />
                  {i === phases.length - 1 && (
                    <line x1={x2} x2={x2} y1={0} y2={innerH} stroke={color} strokeOpacity={0.3} strokeDasharray="2 3" />
                  )}
                </g>
              );
            })}

            {/* Corridor band for maintenance/peak */}
            {showStatus && corridorUpperPath && (
              <>
                <path d={corridorUpperPath} fill="none" stroke="#10b981" strokeOpacity={0.3} strokeDasharray="3 3" strokeWidth={1} />
                <path d={corridorLowerPath} fill="none" stroke="#10b981" strokeOpacity={0.3} strokeDasharray="3 3" strokeWidth={1} />
              </>
            )}

            {/* Soll (target) line */}
            {targetPath && (
              <path d={targetPath} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeDasharray="5 4" />
            )}

            {/* Today marker */}
            {todayX != null && (
              <g>
                <line x1={todayX} x2={todayX} y1={0} y2={innerH} stroke="#f0f4ff" strokeOpacity={0.5} strokeWidth={1} />
                <text x={todayX + 4} y={innerH - 6} fill="#f0f4ff" fontSize={10} opacity={0.6}>Heute</text>
              </g>
            )}

            {/* Raw bodyweight points */}
            {rawPoints.map((p, i) => (
              <circle key={`raw-${i}`} cx={xFromIso(p.date)} cy={yFromKg(p.value)} r={2} fill="#3b82f6" opacity={0.5} />
            ))}

            {/* 7-day trend line */}
            {trendPath && (
              <path d={trendPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
            )}

            {/* Editable grips */}
            {editable && phases.map((p, i) => {
              const boundaryX = xFromIso(p.endDate);
              const targetX = xFromIso(midpoint(p.startDate, p.endDate));
              const targetY = yFromKg(p.targetWeight);
              const inView = p.endDate >= startIso && p.endDate <= endIso;
              return (
                <g key={`grip-${p.id}`}>
                  {inView && i < phases.length - 1 && (
                    <g>
                      <line x1={boundaryX} x2={boundaryX} y1={0} y2={innerH} stroke="#f0f4ff" strokeOpacity={0.15} />
                      <rect
                        x={boundaryX - 4}
                        y={innerH - 14}
                        width={8}
                        height={14}
                        fill="#60a5fa"
                        rx={2}
                        style={{ cursor: "ew-resize" }}
                        onPointerDown={(e) => onPointerDown(e, { kind: "boundary", phaseIdx: i, which: "end" })}
                      />
                    </g>
                  )}
                  {inView && (
                    <circle
                      cx={targetX}
                      cy={targetY}
                      r={6}
                      fill="#60a5fa"
                      stroke="#0f1624"
                      strokeWidth={2}
                      style={{ cursor: "ns-resize" }}
                      onPointerDown={(e) => onPointerDown(e, { kind: "target", phaseIdx: i })}
                    />
                  )}
                </g>
              );
            })}

            {/* Hover marker */}
            {hover && !drag && (
              <g pointerEvents="none">
                <line
                  x1={hover.px}
                  x2={hover.px}
                  y1={0}
                  y2={innerH}
                  stroke="#f0f4ff"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                />
                {hoverValues?.trend != null && (
                  <circle cx={hover.px} cy={yFromKg(hoverValues.trend)} r={5} fill="#3b82f6" stroke="#0f1624" strokeWidth={2} />
                )}
                {hoverValues?.target != null && (
                  <circle cx={hover.px} cy={yFromKg(hoverValues.target)} r={4} fill="#60a5fa" stroke="#0f1624" strokeWidth={2} />
                )}
              </g>
            )}

            {/* Axes labels */}
            {yTicks.map((v) => (
              <text key={`ty-${v}`} x={-6} y={yFromKg(v) + 3} fill="#5a7090" fontSize={10} textAnchor="end">
                {v}
              </text>
            ))}
            {tickDates.map((d) => (
              <text key={`tx-${d}`} x={xFromIso(d)} y={innerH + 14} fill="#5a7090" fontSize={10} textAnchor="middle">
                {formatTick(d)}
              </text>
            ))}
          </g>
        </svg>

        {hover && hoverValues && !drag && (hoverValues.trend != null || hoverValues.target != null || hoverValues.raw != null) && (() => {
          const flip = hover.px + MARGIN.left > size.w * 0.6;
          const leftPx = MARGIN.left + hover.px + (flip ? -12 : 12);
          const transform = flip ? "translate(-100%, 0)" : "translate(0, 0)";
          return (
            <div
              className="absolute pointer-events-none z-10"
              style={{ left: leftPx, top: MARGIN.top + 4, transform }}
            >
              <div className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-sm shadow-xl whitespace-nowrap">
                <p className="text-[#8fa3c0] text-xs mb-1">{formatTooltipDate(hover.iso)}</p>
                {hoverValues.trend != null && (
                  <p className="font-bold" style={{ color: "#3b82f6" }}>
                    Ist (7-Tage): {hoverValues.trend.toFixed(1)} kg
                  </p>
                )}
                {hoverValues.target != null && (
                  <p className="font-bold" style={{ color: "#60a5fa" }}>
                    Soll: {hoverValues.target.toFixed(1)} kg
                  </p>
                )}
                {hoverValues.raw != null && (
                  <p className="text-[11px] text-[#8fa3c0]">
                    Einzelwert: {hoverValues.raw.toFixed(1)} kg
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="flex items-center gap-4 flex-wrap text-[11px] text-[#8fa3c0]">
        <LegendDot color="#3b82f6" label="Ist (7-Tage-Trend)" />
        <LegendDot color="#60a5fa" label="Soll" dashed />
        <LegendDot color="#10b981" label="Korridor" dashed />
        <LegendDot color="#3b82f6" label="Einzelwerte" small />
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed, small }: { color: string; label: string; dashed?: boolean; small?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block"
        style={{
          width: dashed ? 14 : small ? 6 : 10,
          height: dashed ? 2 : small ? 6 : 10,
          background: dashed ? "transparent" : color,
          borderBottom: dashed ? `2px dashed ${color}` : undefined,
          borderRadius: small && !dashed ? 999 : 2,
        }}
      />
      {label}
    </span>
  );
}

function pointsToPath(points: [number, number][]): string {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

function midpoint(aIso: string, bIso: string): string {
  const a = parseISO(aIso).getTime();
  const b = parseISO(bIso).getTime();
  return toISO(new Date((a + b) / 2));
}

function formatTick(iso: string): string {
  const d = parseISO(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.`;
}

const MONTHS_DE = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];
function formatTooltipDate(iso: string): string {
  const d = parseISO(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}. ${MONTHS_DE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
