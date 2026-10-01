"use client";
import { useState, useMemo } from "react";
import { ChevronDown, Download } from "lucide-react";
import { buildAthleteExport } from "@/lib/store";
import { downloadJson } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { DailyCheckIn, WeeklyCheckIn, ExportFieldGroup } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const FIELD_GROUPS: { id: ExportFieldGroup; label: string }[] = [
  { id: "weight", label: "Körpergewicht" },
  { id: "sleep", label: "Schlaf" },
  { id: "steps", label: "Schritte" },
  { id: "vitals", label: "Vitalwerte (HF, HRV, SpO₂)" },
  { id: "wellbeing", label: "Wohlbefinden (Energie, Stress, Stimmung)" },
  { id: "nutrition", label: "Ernährung & Makros" },
  { id: "training", label: "Training & Cardio" },
  { id: "notes", label: "Notizen (Athlet)" },
  { id: "weeklyRatings", label: "Wöchentliche Bewertungen" },
  { id: "coachNotes", label: "Coach-Notizen" },
  { id: "photos", label: "Fortschrittsbilder" },
];

interface Props {
  athleteId: string;
  athleteName: string;
  dailyCheckIns: DailyCheckIn[];
  weeklyCheckIns: WeeklyCheckIn[];
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function AthleteExportPanel({ athleteId, athleteName, dailyCheckIns, weeklyCheckIns }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 27);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [selectedFields, setSelectedFields] = useState<ExportFieldGroup[]>(
    FIELD_GROUPS.map((g) => g.id)
  );

  const earliestDate = useMemo(() => {
    const dates = [
      ...dailyCheckIns.map((c) => c.date),
      ...weeklyCheckIns.map((c) => c.date),
    ];
    return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  }, [dailyCheckIns, weeklyCheckIns]);

  function applyQuickRange(days: number | "all") {
    const today = new Date();
    setTo(toISODate(today));
    if (days === "all") {
      setFrom(earliestDate ?? toISODate(today));
    } else {
      const start = new Date(today);
      start.setDate(today.getDate() - (days - 1));
      setFrom(toISODate(start));
    }
  }

  const previewCounts = useMemo((): Record<ExportFieldGroup, number> => {
    const inRange = (date: string) => date >= from && date <= to;
    const daily = dailyCheckIns.filter((c) => inRange(c.date));
    const weekly = weeklyCheckIns.filter((c) => inRange(c.date));
    return {
      weight: daily.filter((c) => c.weight > 0).length,
      sleep: daily.filter((c) => c.sleepHours > 0).length,
      steps: daily.filter((c) => c.steps > 0).length,
      vitals: daily.filter((c) => c.restingHeartRate != null || c.hrv != null || c.spO2 != null || c.bloodPressure != null).length,
      wellbeing: daily.length,
      nutrition: daily.filter((c) => c.nutritionStatus != null || c.calories != null).length,
      training: daily.filter((c) => c.training || c.cardio).length,
      notes: daily.filter((c) => !!c.note?.trim()).length,
      weeklyRatings: weekly.length,
      coachNotes: weekly.filter((c) => !!c.coachNote?.trim()).length,
      photos: weekly.reduce((sum, c) => sum + (c.progressImages?.length ?? 0), 0),
    };
  }, [dailyCheckIns, weeklyCheckIns, from, to]);

  function toggleField(id: ExportFieldGroup) {
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  const invalid = !from || !to || from > to || selectedFields.length === 0;

  async function handleExport() {
    if (invalid) return;
    setLoading(true);
    try {
      const data = await buildAthleteExport({ athleteId, from, to, fields: selectedFields });
      const safeName = athleteName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      downloadJson(data, `klientencheck_${safeName}_${from}_${to}.json`);
      showToast("Export erfolgreich.", "success");
    } catch {
      showToast("Export fehlgeschlagen. Bitte erneut versuchen.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#0d1526] border border-[#1e2d42] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-[#f0f4ff]">Daten exportieren</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-[#5a7090]" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="export-panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-4 border-t border-[#1e2d42]">
              {/* Quick range buttons */}
              <div className="pt-3 flex flex-wrap gap-2">
                {([
                  { label: "Letzte 7 Tage", value: 7 },
                  { label: "Letzte 4 Wochen", value: 28 },
                  { label: "Letzte 12 Wochen", value: 84 },
                  { label: "Gesamter Zeitraum", value: "all" },
                ] as const).map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => applyQuickRange(value)}
                    className="px-3 py-1.5 rounded-lg bg-[#141d2e] border border-[#1e2d42] text-xs font-medium text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Date range inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#5a7090]">Von</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#5a7090]">Bis</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
              </div>

              {from && to && from > to && (
                <p className="text-xs text-[#ef4444]">&quot;Von&quot; darf nicht nach &quot;Bis&quot; liegen.</p>
              )}

              {/* Field selection */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#8fa3c0]">Felder</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedFields(FIELD_GROUPS.map((g) => g.id))}
                      className="text-[10px] text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                    >
                      Alle
                    </button>
                    <span className="text-[10px] text-[#2a3a52]">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFields([])}
                      className="text-[10px] text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                    >
                      Keine
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {FIELD_GROUPS.map(({ id, label }) => (
                    <label
                      key={id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#0f1624] border border-[#1e2d42] cursor-pointer hover:border-[#2a3a52] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(id)}
                          onChange={() => toggleField(id)}
                          className="w-3.5 h-3.5 rounded accent-[#3b82f6]"
                        />
                        <span className="text-xs text-[#c8d8f0]">{label}</span>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] tabular-nums shrink-0",
                          previewCounts[id] > 0 ? "text-[#60a5fa]" : "text-[#2a3a52]"
                        )}
                      >
                        {previewCounts[id]} Eintr.
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedFields.length === 0 && (
                <p className="text-xs text-[#ef4444]">Bitte mindestens ein Feld auswählen.</p>
              )}

              {/* Export button */}
              <button
                type="button"
                onClick={handleExport}
                disabled={loading || invalid}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  loading || invalid
                    ? "bg-[#1e2d42] text-[#5a7090] cursor-not-allowed"
                    : "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                )}
              >
                {loading ? (
                  "Wird exportiert…"
                ) : (
                  <>
                    <Download size={14} />
                    Als JSON exportieren
                  </>
                )}
              </button>

              <p className="text-[10px] text-[#5a7090] text-center">
                klientencheck_{"{name}"}_{"{von}"}_{"{bis}"}.json · Schema v1
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
