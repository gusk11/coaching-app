"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Athlete, SeasonPhase, SeasonPlan, PhaseType } from "@/types";
import { saveSeasonPlan, deleteSeasonPlan } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { SeasonChart, SeasonChartRange } from "@/components/charts/SeasonChart";
import {
  DEFAULT_CORRIDOR_KG, DEFAULT_GREEN_PCT, DEFAULT_YELLOW_PCT,
  activePhase, actualRate, ampelColor, createTemplate, daysBetween,
  defaultStartWeight, forecastEndDate, formatDeviationPct, formatPct, formatRate, formatSignedKg,
  phaseStatus, phaseTypeColor, phaseTypeLabel, planWarnings, progress, ratePct,
  recomputePhase, shiftPhasesAfter, todayISO, TemplateName, addDays,
} from "@/lib/seasonUtils";
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, AlertTriangle, Sparkles, X } from "lucide-react";

interface Props {
  athlete: Athlete;
  /** Fires ONLY after a successful save or delete, never on in-flight edits. */
  onSaved?: () => void;
}

const PHASE_TYPES: { value: PhaseType; label: string }[] = [
  { value: "bulk", label: "Aufbau" },
  { value: "cut", label: "Diät" },
  { value: "mini_cut", label: "Mini-Cut" },
  { value: "maintenance", label: "Erhalt" },
  { value: "peak", label: "Peak" },
  { value: "other", label: "Sonstiges" },
];

const TEMPLATES: { value: TemplateName; label: string; description: string }[] = [
  { value: "aufbau_minicut_peak", label: "Aufbau → Mini-Cut → Peak", description: "~23 Wochen Aufbau, 8 Wochen Mini-Cut, 12 Wochen Peak" },
  { value: "klassische_diaet", label: "Klassische Diät", description: "16 Wochen Fettabbau" },
  { value: "aufbau", label: "Aufbau", description: "20 Wochen moderater Aufbau" },
];

export function SeasonPlanEditor({ athlete, onSaved }: Props) {
  // Local-only state: the editor is fully uncontrolled with respect to the
  // athlete prop. Prop changes do NOT reset in-flight edits — only switching
  // to a different athlete does. Persistence happens on explicit Save.
  const [plan, setPlan] = useState<SeasonPlan | undefined>(athlete.seasonPlan);
  const [range, setRange] = useState<SeasonChartRange>("plan");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [shiftOpenPhaseId, setShiftOpenPhaseId] = useState<string | null>(null);
  const [shiftDays, setShiftDays] = useState<number>(0);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);

  // Only reset local state when the athlete identity changes (navigating to a
  // different athlete), never on an unrelated field update of the same athlete.
  const [syncedAthleteId, setSyncedAthleteId] = useState(athlete.id);
  if (syncedAthleteId !== athlete.id) {
    setSyncedAthleteId(athlete.id);
    setPlan(athlete.seasonPlan);
    setDirty(false);
    setExpandedPhaseId(null);
  }

  // Warn before closing the tab/window with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const entries = useMemo(() => athlete.dailyCheckIns ?? [], [athlete.dailyCheckIns]);
  const warnings = useMemo(() => plan ? planWarnings(plan) : [], [plan]);
  const current = useMemo(() => plan ? activePhase(plan) : undefined, [plan]);
  const curStatus = useMemo(() => current ? phaseStatus(current, entries) : null, [current, entries]);
  const curForecast = useMemo(() => current ? forecastEndDate(current, entries) : null, [current, entries]);
  const curProgress = useMemo(() => current && plan ? progress(current, plan) : null, [current, plan]);

  // Range for rate calculation
  const rateRange = useMemo(() => {
    const today = todayISO();
    switch (range) {
      case "7": return { from: addDays(today, -7), to: today };
      case "30": return { from: addDays(today, -30), to: today };
      case "90": return { from: addDays(today, -90), to: today };
      case "all":
      case "plan":
      default:
        if (current) return { from: current.startDate, to: today };
        return { from: addDays(today, -30), to: today };
    }
  }, [range, current]);

  const ist = useMemo(() => actualRate(entries, rateRange.from, rateRange.to), [entries, rateRange]);

  // Local-only edit: never calls the parent so an unrelated reload of the
  // athlete cannot overwrite in-flight edits.
  const update = useCallback((next: SeasonPlan | undefined) => {
    setPlan(next);
    setDirty(true);
  }, []);

  async function handleSave() {
    if (!plan) return;
    setSaving(true);
    try {
      await saveSeasonPlan(plan);
      setDirty(false);
      showToast("Jahresplan gespeichert");
      onSaved?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Speichern fehlgeschlagen", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!plan) return;
    if (!confirm("Jahresplan wirklich löschen?")) return;
    setSaving(true);
    try {
      await deleteSeasonPlan(athlete.id);
      setPlan(undefined);
      setDirty(false);
      onSaved?.();
      showToast("Jahresplan gelöscht");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Löschen fehlgeschlagen", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleCreateFromTemplate(tpl: TemplateName) {
    const sw = entries.length ? (defaultStartWeight(undefined, todayISO(), entries) || athlete.currentWeight) : athlete.currentWeight;
    const next = createTemplate(tpl, todayISO(), sw, athlete.id);
    update(next);
    setShowTemplate(false);
  }

  function addPhase() {
    if (!plan) return;
    const sorted = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const last = sorted[sorted.length - 1];
    const startDate = last ? last.endDate : todayISO();
    const sw = last ? last.targetWeight : defaultStartWeight(plan, startDate, entries);
    const newPhase: SeasonPhase = recomputePhase({
      id: `ph-${Date.now()}`,
      name: "Neue Phase",
      type: "other",
      startDate,
      endDate: addDays(startDate, 56),
      inputMode: "target_and_date",
      startWeight: sw,
      targetWeight: sw,
      targetRatePerWeek: 0,
      toleranceGreenPct: DEFAULT_GREEN_PCT,
      toleranceYellowPct: DEFAULT_YELLOW_PCT,
    });
    update({ ...plan, phases: [...plan.phases, newPhase], updatedAt: new Date().toISOString() });
    setExpandedPhaseId(newPhase.id);
  }

  function updatePhase(id: string, patch: Partial<SeasonPhase>) {
    if (!plan) return;
    const next = plan.phases.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...patch };
      return recomputePhase(merged);
    });
    update({ ...plan, phases: next, updatedAt: new Date().toISOString() });
  }

  function removePhase(id: string) {
    if (!plan) return;
    if (!confirm("Phase löschen?")) return;
    update({ ...plan, phases: plan.phases.filter((p) => p.id !== id), updatedAt: new Date().toISOString() });
  }

  function duplicatePhase(id: string) {
    if (!plan) return;
    const sorted = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const idx = sorted.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const src = sorted[idx];
    const dur = daysBetween(src.startDate, src.endDate);
    const newStart = src.endDate;
    const copy: SeasonPhase = {
      ...src,
      id: `ph-${Date.now()}`,
      startDate: newStart,
      endDate: addDays(newStart, dur),
      startWeight: src.targetWeight,
      targetWeight: src.targetWeight + (src.targetWeight - src.startWeight),
    };
    update({ ...plan, phases: [...plan.phases, recomputePhase(copy)], updatedAt: new Date().toISOString() });
  }

  function movePhase(id: string, dir: -1 | 1) {
    if (!plan) return;
    const sorted = [...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const idx = sorted.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const other = idx + dir;
    if (other < 0 || other >= sorted.length) return;
    // Swap start/end to keep order of durations but exchange positions
    const a = sorted[idx], b = sorted[other];
    const aDur = daysBetween(a.startDate, a.endDate);
    const bDur = daysBetween(b.startDate, b.endDate);
    if (dir === 1) {
      const newA = { ...a, startDate: b.startDate, endDate: addDays(b.startDate, aDur) };
      const newB = { ...b, startDate: newA.endDate, endDate: addDays(newA.endDate, bDur) };
      sorted[idx] = recomputePhase(newA);
      sorted[other] = recomputePhase(newB);
    } else {
      const newB = { ...b, startDate: a.startDate, endDate: addDays(a.startDate, bDur) };
      const newA = { ...a, startDate: newB.endDate, endDate: addDays(newB.endDate, aDur) };
      sorted[other] = recomputePhase(newB);
      sorted[idx] = recomputePhase(newA);
    }
    update({ ...plan, phases: sorted, updatedAt: new Date().toISOString() });
  }

  function handleShift() {
    if (!plan || !shiftOpenPhaseId || !shiftDays) {
      setShiftOpenPhaseId(null);
      return;
    }
    update(shiftPhasesAfter(plan, shiftOpenPhaseId, shiftDays));
    setShiftOpenPhaseId(null);
    setShiftDays(0);
  }

  if (!plan) {
    return (
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-6 flex flex-col items-center gap-4">
        <p className="text-sm text-[#8fa3c0] text-center">Noch kein Jahresplan angelegt.</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setShowTemplate(true)}
            className="px-4 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium flex items-center gap-2"
          >
            <Sparkles size={16} /> Aus Vorlage erstellen
          </button>
          <button
            onClick={() => {
              const sw = defaultStartWeight(undefined, todayISO(), entries) || athlete.currentWeight;
              const empty: SeasonPlan = {
                id: `sp-${Date.now()}`,
                athleteId: athlete.id,
                title: "Jahresplan",
                phases: [recomputePhase({
                  id: `ph-${Date.now()}`,
                  name: "Phase 1",
                  type: "bulk",
                  startDate: todayISO(),
                  endDate: addDays(todayISO(), 56),
                  inputMode: "target_and_date",
                  startWeight: sw,
                  targetWeight: sw + 1,
                  targetRatePerWeek: 0,
                })],
                visibleToAthlete: false,
                showStatusToAthlete: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              update(empty);
            }}
            className="px-4 py-2 rounded-xl bg-[#0f1624] border border-[#1e2d42] hover:border-[#3b82f6] text-[#f0f4ff] text-sm font-medium"
          >
            Leeren Plan starten
          </button>
        </div>
        {showTemplate && (
          <TemplateChooser onPick={handleCreateFromTemplate} onCancel={() => setShowTemplate(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <input
          type="text"
          value={plan.title}
          onChange={(e) => update({ ...plan, title: e.target.value })}
          className="bg-transparent border-b border-[#1e2d42] focus:border-[#3b82f6] text-[#f0f4ff] text-base font-semibold py-1 focus:outline-none flex-1 min-w-[180px]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplate(true)}
            className="px-3 py-1.5 rounded-lg bg-[#0f1624] border border-[#1e2d42] hover:border-[#3b82f6] text-[#8fa3c0] hover:text-[#f0f4ff] text-xs font-medium flex items-center gap-1.5"
          >
            <Sparkles size={14} /> Vorlage
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-4 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1e2d42] disabled:text-[#5a7090] text-white text-xs font-medium"
          >
            {saving ? "Speichern…" : dirty ? "Speichern" : "Gespeichert"}
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg bg-transparent border border-[#ef4444]/30 hover:bg-[#ef4444]/10 text-[#ef4444] text-xs font-medium"
            title="Plan löschen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
        <SeasonChart
          plan={plan}
          entries={entries}
          editable
          onChange={update}
          range={range}
          onRangeChange={setRange}
        />
      </div>

      {/* KPI boxes */}
      <div className="grid grid-cols-3 gap-3">
        <KpiBox
          label="Soll-Rate"
          value={current ? formatRate(current.targetRatePerWeek) : "–"}
          sub={current ? formatPct(ratePct(current.targetRatePerWeek, current.startWeight)) : undefined}
        />
        <KpiBox
          label="Ist-Rate"
          value={formatRate(ist.kgPerWeek)}
          sub={formatPct(ist.percentPerWeek)}
        />
        <KpiBox
          label="Abweichung"
          value={curStatus ? formatSignedKg(curStatus.deviationKg) : "–"}
          sub={curStatus ? formatDeviationPct(curStatus.deviationKg, curStatus.targetToday) : undefined}
          accent={curStatus ? ampelColor(curStatus.ampel) : undefined}
        />
      </div>

      {/* Current phase status */}
      {current && curStatus && (
        <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ background: ampelColor(curStatus.ampel) }} />
              <div>
                <p className="text-sm font-semibold text-[#f0f4ff]">
                  Aktuelle Phase: {current.name} <span className="text-xs text-[#5a7090]">({phaseTypeLabel(current.type)})</span>
                </p>
                <p className="text-xs text-[#8fa3c0]">
                  {current.startDate} → {current.endDate} · {curStatus.reason}
                </p>
              </div>
            </div>
            {curProgress && (
              <div className="flex gap-4 text-xs text-[#8fa3c0]">
                <div>
                  <p className="text-[#5a7090]">Phase</p>
                  <p className="text-[#f0f4ff] font-semibold">{curProgress.phasePercent} %</p>
                </div>
                <div>
                  <p className="text-[#5a7090]">Gesamtplan</p>
                  <p className="text-[#f0f4ff] font-semibold">{curProgress.overallPercent} %</p>
                </div>
              </div>
            )}
          </div>

          {/* Forecast */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="text-[#5a7090]">Prognose-Enddatum:</span>
            {curForecast?.unreachable ? (
              <span className="text-[#ef4444]">Bei aktueller Rate nicht erreichbar</span>
            ) : curForecast?.endDate ? (
              <>
                <span className="text-[#f0f4ff] font-medium">{curForecast.endDate}</span>
                {curForecast.diffDays != null && (
                  <span className={curForecast.diffDays > 7 ? "text-[#f59e0b]" : curForecast.diffDays < -7 ? "text-[#60a5fa]" : "text-[#8fa3c0]"}>
                    ({curForecast.diffDays > 0 ? "+" : ""}{curForecast.diffDays} Tage ggü. Plan)
                  </span>
                )}
                {curForecast.diffDays != null && curForecast.diffDays !== 0 && (
                  <button
                    onClick={() => {
                      setShiftOpenPhaseId(current.id);
                      setShiftDays(curForecast.diffDays ?? 0);
                    }}
                    className="ml-2 px-2 py-1 rounded-lg bg-[#0f1624] border border-[#1e2d42] hover:border-[#3b82f6] text-[#8fa3c0] hover:text-[#f0f4ff]"
                  >
                    Folgende Phasen verschieben
                  </button>
                )}
              </>
            ) : (
              <span className="text-[#5a7090]">–</span>
            )}
          </div>
        </div>
      )}

      {/* Visibility switches */}
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-3">
        <ToggleRow
          label="Für Athlet sichtbar"
          checked={plan.visibleToAthlete}
          onChange={(v) => update({ ...plan, visibleToAthlete: v })}
        />
        <ToggleRow
          label="Status / Ampel für Athlet anzeigen"
          checked={plan.showStatusToAthlete}
          onChange={(v) => update({ ...plan, showStatusToAthlete: v })}
          disabled={!plan.visibleToAthlete}
        />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-2xl bg-[#1a1200] border border-[#f59e0b]/30 p-4 flex flex-col gap-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#fbbf24]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Phase list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#f0f4ff]">Phasen</p>
          <button
            onClick={addPhase}
            className="px-3 py-1.5 rounded-lg bg-[#0f1624] border border-[#1e2d42] hover:border-[#3b82f6] text-[#8fa3c0] hover:text-[#f0f4ff] text-xs font-medium flex items-center gap-1.5"
          >
            <Plus size={14} /> Phase hinzufügen
          </button>
        </div>
        {[...plan.phases].sort((a, b) => a.startDate.localeCompare(b.startDate)).map((p, i, arr) => {
          const expanded = expandedPhaseId === p.id;
          const st = phaseStatus(p, entries);
          return (
            <div key={p.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
              <button
                onClick={() => setExpandedPhaseId(expanded ? null : p.id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#0f1624] text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: phaseTypeColor(p.type) }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#f0f4ff] truncate">{p.name}</p>
                    <p className="text-xs text-[#8fa3c0] truncate">
                      {phaseTypeLabel(p.type)} · {p.startDate} → {p.endDate} · {p.startWeight.toFixed(1)} → {p.targetWeight.toFixed(1)} kg · {formatRate(p.targetRatePerWeek)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full" style={{ background: ampelColor(st.ampel) }} />
                  <IconBtn title="Nach oben" disabled={i === 0} onClick={(e) => { e.stopPropagation(); movePhase(p.id, -1); }}>
                    <ArrowUp size={14} />
                  </IconBtn>
                  <IconBtn title="Nach unten" disabled={i === arr.length - 1} onClick={(e) => { e.stopPropagation(); movePhase(p.id, 1); }}>
                    <ArrowDown size={14} />
                  </IconBtn>
                  <IconBtn title="Duplizieren" onClick={(e) => { e.stopPropagation(); duplicatePhase(p.id); }}>
                    <Copy size={14} />
                  </IconBtn>
                  <IconBtn title="Löschen" onClick={(e) => { e.stopPropagation(); removePhase(p.id); }}>
                    <Trash2 size={14} />
                  </IconBtn>
                </div>
              </button>
              {expanded && (
                <PhaseForm
                  phase={p}
                  onChange={(patch) => updatePhase(p.id, patch)}
                  onShiftLater={() => {
                    setShiftOpenPhaseId(p.id);
                    setShiftDays(7);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Shift modal */}
      {shiftOpenPhaseId && (
        <ShiftModal
          days={shiftDays}
          onChange={setShiftDays}
          onConfirm={handleShift}
          onCancel={() => setShiftOpenPhaseId(null)}
        />
      )}

      {showTemplate && (
        <TemplateChooser onPick={handleCreateFromTemplate} onCancel={() => setShowTemplate(false)} />
      )}
    </div>
  );
}

function KpiBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42] flex flex-col gap-1">
      <p className="text-xs text-[#5a7090]">{label}</p>
      <p className="text-sm font-bold" style={{ color: accent ?? "#f0f4ff" }}>{value}</p>
      {sub && sub !== "–" && <p className="text-[11px] text-[#8fa3c0]">({sub})</p>}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-3 ${disabled ? "opacity-50" : ""}`}>
      <span className="text-sm text-[#f0f4ff]">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-[#3b82f6]" : "bg-[#1e2d42]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}

function IconBtn({ children, onClick, title, disabled }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 rounded-lg hover:bg-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff] disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

/** Guards against intermediate garbage emitted by browser date inputs while
 *  typing (e.g. "20270-10-21" when the year field accepts 5 digits), which
 *  can otherwise explode the target-curve loop into a renderer crash. */
function isSanePhaseDate(iso: string): boolean {
  if (!iso) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const y = Number(m[1]);
  return y >= 2000 && y <= 2100;
}

function PhaseForm({ phase, onChange, onShiftLater }: {
  phase: SeasonPhase;
  onChange: (patch: Partial<SeasonPhase>) => void;
  onShiftLater: () => void;
}) {
  const isCorridor = phase.type === "maintenance" || phase.type === "peak";
  return (
    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#1e2d42]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
        <Field label="Name">
          <input
            type="text"
            value={phase.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>
        <Field label="Typ">
          <select
            value={phase.type}
            onChange={(e) => onChange({ type: e.target.value as PhaseType })}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          >
            {PHASE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Startdatum">
          <input
            type="date"
            min="2000-01-01"
            max="2100-12-31"
            value={phase.startDate}
            onChange={(e) => { if (isSanePhaseDate(e.target.value)) onChange({ startDate: e.target.value }); }}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>
        <Field label="Enddatum">
          <input
            type="date"
            min="2000-01-01"
            max="2100-12-31"
            value={phase.endDate}
            onChange={(e) => { if (isSanePhaseDate(e.target.value)) onChange({ endDate: e.target.value, inputMode: "target_and_date" }); }}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>

        <Field label="Eingabemodus">
          <div className="flex gap-1">
            <ModeBtn active={phase.inputMode === "target_and_date"} onClick={() => onChange({ inputMode: "target_and_date" })}>Ziel &amp; Datum</ModeBtn>
            <ModeBtn active={phase.inputMode === "target_and_rate"} onClick={() => onChange({ inputMode: "target_and_rate" })}>Ziel &amp; Rate</ModeBtn>
          </div>
        </Field>
        <Field label="Startgewicht (kg)">
          <input
            type="number" step="0.1"
            value={phase.startWeight}
            onChange={(e) => onChange({ startWeight: parseFloat(e.target.value) || 0 })}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>
        <Field label="Zielgewicht (kg)">
          <input
            type="number" step="0.1"
            value={phase.targetWeight}
            onChange={(e) => onChange({ targetWeight: parseFloat(e.target.value) || 0 })}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>
        <Field label="Rate (kg/Woche)">
          <input
            type="number" step="0.01"
            value={phase.targetRatePerWeek}
            onChange={(e) => onChange({ targetRatePerWeek: parseFloat(e.target.value) || 0, inputMode: "target_and_rate" })}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>

        {isCorridor && (
          <Field label="Korridor (±kg)">
            <input
              type="number" step="0.1"
              value={phase.corridorKg ?? DEFAULT_CORRIDOR_KG}
              onChange={(e) => onChange({ corridorKg: parseFloat(e.target.value) || 0 })}
              className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
            />
          </Field>
        )}
        <Field label="Toleranz grün (±%)">
          <input
            type="number" step="1"
            value={phase.toleranceGreenPct ?? DEFAULT_GREEN_PCT}
            onChange={(e) => onChange({ toleranceGreenPct: parseFloat(e.target.value) || 0 })}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>
        <Field label="Toleranz gelb (±%)">
          <input
            type="number" step="1"
            value={phase.toleranceYellowPct ?? DEFAULT_YELLOW_PCT}
            onChange={(e) => onChange({ toleranceYellowPct: parseFloat(e.target.value) || 0 })}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
          />
        </Field>
      </div>

      <Field label="Coach-Notiz (nur Coach)">
        <textarea
          value={phase.coachNote ?? ""}
          onChange={(e) => onChange({ coachNote: e.target.value })}
          rows={2}
          className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] resize-none"
        />
      </Field>
      <Field label="Notiz für Athlet">
        <textarea
          value={phase.athleteNote ?? ""}
          onChange={(e) => onChange({ athleteNote: e.target.value })}
          rows={2}
          className="bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] resize-none"
        />
      </Field>

      <div className="flex justify-end">
        <button
          onClick={onShiftLater}
          className="px-3 py-1.5 rounded-lg bg-[#0f1624] border border-[#1e2d42] hover:border-[#3b82f6] text-[#8fa3c0] hover:text-[#f0f4ff] text-xs font-medium"
        >
          Folgende Phasen verschieben…
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[#5a7090]">{label}</span>
      {children}
    </label>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-2 py-2 text-xs rounded-lg transition-colors ${
        active ? "bg-[#3b82f6] text-white" : "bg-[#0f1624] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
      }`}
    >
      {children}
    </button>
  );
}

function TemplateChooser({ onPick, onCancel }: { onPick: (t: TemplateName) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-5 max-w-md w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#f0f4ff]">Vorlage auswählen</p>
          <button onClick={onCancel} className="text-[#8fa3c0] hover:text-[#f0f4ff]"><X size={16} /></button>
        </div>
        {TEMPLATES.map((t) => (
          <button
            key={t.value}
            onClick={() => onPick(t.value)}
            className="text-left p-3 rounded-xl bg-[#141d2e] border border-[#1e2d42] hover:border-[#3b82f6] transition-colors"
          >
            <p className="text-sm font-semibold text-[#f0f4ff]">{t.label}</p>
            <p className="text-xs text-[#8fa3c0] mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ShiftModal({ days, onChange, onConfirm, onCancel }: {
  days: number;
  onChange: (d: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-5 max-w-sm w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#f0f4ff]">Folgende Phasen verschieben</p>
          <button onClick={onCancel} className="text-[#8fa3c0] hover:text-[#f0f4ff]"><X size={16} /></button>
        </div>
        <p className="text-xs text-[#8fa3c0]">Alle Phasen nach dieser werden um die angegebene Anzahl Tage verschoben.</p>
        <input
          type="number"
          value={days}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs text-[#8fa3c0] hover:text-[#f0f4ff]">Abbrechen</button>
          <button onClick={onConfirm} className="px-4 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-medium">Verschieben</button>
        </div>
      </div>
    </div>
  );
}
