"use client";
import { useState, useMemo } from "react";
import { Athlete, DailyCheckIn, DailyCheckConfig, DEFAULT_DAILY_CHECK_CONFIG, MealComplianceType } from "@/types";
import { addDailyCheckIn } from "@/lib/store";
import { todayISO, cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";

type Scale = 1 | 2 | 3 | 4 | 5;
type FieldType = "number" | "scale" | "boolean" | "nutrition" | "text";

interface FieldDef {
  key: keyof DailyCheckIn;
  label: string;
  configKey: keyof DailyCheckConfig | null;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const FIELD_DEFS: FieldDef[] = [
  { key: "weight",         label: "Gewicht",       configKey: "bodyweight",         type: "number",    min: 30,  max: 250,   step: 0.1, unit: "kg"  },
  { key: "steps",          label: "Schritte",       configKey: "steps",              type: "number",    min: 0,   max: 30000, step: 100              },
  { key: "energyLevel",    label: "Energie",        configKey: "energyLevel",        type: "scale"                                                   },
  { key: "stressLevel",    label: "Stress",         configKey: "stressLevel",        type: "scale"                                                   },
  { key: "mood",           label: "Stimmung",       configKey: "mood",               type: "scale"                                                   },
  { key: "sleepHours",     label: "Schlaf",         configKey: "sleepDuration",      type: "number",    min: 0,   max: 16,    step: 0.5, unit: "h"   },
  { key: "sleepQuality",   label: "Schlafqualität", configKey: "sleepQuality",       type: "scale"                                                   },
  { key: "appetite",       label: "Appetit",        configKey: "appetite",           type: "scale"                                                   },
  { key: "digestion",      label: "Verdauung",      configKey: "digestion",          type: "scale"                                                   },
  { key: "caffeine",       label: "Koffein",        configKey: null,                 type: "number",    min: 0,   max: 800,   step: 10,  unit: "mg"  },
  { key: "training",       label: "Training",       configKey: "trainingCompleted",  type: "boolean"                                                 },
  { key: "cardio",         label: "Cardio",         configKey: "cardioCompleted",    type: "boolean"                                                 },
  { key: "nutritionStatus",label: "Ernährung",      configKey: "nutritionCompliance",type: "nutrition"                                               },
  { key: "note",           label: "Notiz",          configKey: "notes",              type: "text"                                                    },
];

const BASE_CI: Omit<DailyCheckIn, "id" | "athleteId" | "date"> = {
  weight: 80,
  measurementTime: "07:00",
  appetite: 3 as Scale,
  digestion: 3 as Scale,
  caffeine: 200,
  steps: 8000,
  cardio: false,
  training: false,
  trainingQuality: 3 as Scale,
  sleepHours: 7,
  sleepQuality: 3 as Scale,
  energyLevel: 3 as Scale,
  stressLevel: 3 as Scale,
  mood: 3 as Scale,
  note: "",
  mealCompliance: "fully_followed" as MealComplianceType,
};

interface Props {
  athlete: Athlete;
  onUpdate: (athletes: Athlete[]) => void;
}

interface DayRowProps {
  day: string;
  weekday: string;
  dateStr: string;
  isToday: boolean;
  field: FieldDef;
  currentValue: unknown;
  isSaving: boolean;
  justSaved: boolean;
  onSave: (value: unknown) => void;
}

function DayRow({ day, weekday, dateStr, isToday, field, currentValue, isSaving, justSaved, onSave }: DayRowProps) {
  const [localVal, setLocalVal] = useState<string>(() =>
    currentValue !== undefined ? String(currentValue) : ""
  );

  const inputCls =
    "bg-[#0f1624] border border-[#1e2d42] rounded-lg px-2.5 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors";

  function handleBlur() {
    const trimmed = localVal.trim();
    if (trimmed === "" || trimmed === String(currentValue)) return;
    const num = parseFloat(trimmed);
    if (isNaN(num)) return;
    onSave(num);
  }

  const input = (() => {
    switch (field.type) {
      case "number":
        return (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={localVal}
              onChange={(e) => setLocalVal(e.target.value)}
              onBlur={handleBlur}
              placeholder="–"
              className={cn(inputCls, "w-24")}
            />
            {field.unit && <span className="text-[10px] text-[#5a7090]">{field.unit}</span>}
          </div>
        );

      case "scale":
        return (
          <div className="flex gap-1 flex-1">
            {([1, 2, 3, 4, 5] as Scale[]).map((n) => (
              <button
                key={n}
                type="button"
                disabled={isSaving}
                onClick={() => { if ((currentValue as number) !== n) onSave(n); }}
                className={cn(
                  "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                  currentValue === n
                    ? "bg-[#3b82f6] text-white"
                    : "bg-[#0f1624] border border-[#1e2d42] text-[#5a7090] hover:border-[#3b82f6]/50 hover:text-[#f0f4ff]"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        );

      case "boolean":
        return (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(!currentValue)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex-1 max-w-[80px]",
              currentValue === true
                ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#34d399]"
                : "bg-[#0f1624] border-[#1e2d42] text-[#5a7090] hover:border-[#3b82f6]/40"
            )}
          >
            {currentValue === true ? "Ja ✓" : "–"}
          </button>
        );

      case "nutrition":
        return (
          <div className="flex gap-1 flex-1 flex-wrap">
            {(
              [
                { value: "calorie_tracker_used", label: "Tracker" },
                { value: "meal_plan_followed",   label: "Plan"    },
                { value: "no_exact_info",         label: "N/A"     },
              ] as const
            ).map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={isSaving}
                onClick={() => { if (currentValue !== o.value) onSave(o.value); }}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border",
                  currentValue === o.value
                    ? "bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0f1624] border-[#1e2d42] text-[#5a7090] hover:border-[#3b82f6]/40"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        );

      case "text":
        return (
          <input
            type="text"
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={() => {
              if (localVal.trim() !== String(currentValue ?? "")) onSave(localVal.trim());
            }}
            placeholder="–"
            className={cn(inputCls, "flex-1")}
          />
        );
    }
  })();

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl",
        isToday ? "bg-[#0f1a2e]" : "bg-[#0a1018]"
      )}
    >
      <div className="w-9 shrink-0">
        <p className={cn("text-[11px] font-semibold leading-tight", isToday ? "text-[#60a5fa]" : "text-[#8fa3c0]")}>
          {weekday}
        </p>
        <p className="text-[9px] text-[#3d5269] leading-tight">{dateStr}</p>
      </div>

      <div className="flex-1 flex items-center gap-2 min-w-0">{input}</div>

      <div className="w-4 shrink-0 flex items-center justify-center">
        {isSaving ? (
          <Loader2 size={11} className="text-[#5a7090] animate-spin" />
        ) : justSaved ? (
          <Check size={11} className="text-[#10b981]" />
        ) : currentValue !== undefined ? (
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]/50" />
        ) : null}
      </div>
    </div>
  );
}

export function WeekBulkBackfill({ athlete, onUpdate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>("steps");
  const [savingDays, setSavingDays] = useState<Set<string>>(new Set());
  const [savedDays, setSavedDays] = useState<Set<string>>(new Set());

  const cfg: DailyCheckConfig = { ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig };
  const enabledFields = FIELD_DEFS.filter(
    (f) => f.configKey === null || cfg[f.configKey as keyof DailyCheckConfig]
  );
  const selectedField = enabledFields.find((f) => String(f.key) === selectedKey) ?? enabledFields[0];

  const today = todayISO();

  const days = useMemo(() => {
    const result: string[] = [];
    for (let i = 19; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d.toISOString().split("T")[0]);
    }
    return result;
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(today);

  const row1 = days.slice(0, 10);
  const row2 = days.slice(10);

  function getCI(date: string) {
    return athlete.dailyCheckIns.find((ci) => ci.date === date);
  }

  function getValueForDay(date: string): unknown {
    const ci = getCI(date);
    if (!ci || !selectedField) return undefined;
    return (ci as unknown as Record<string, unknown>)[selectedField.key as string];
  }

  async function saveForDay(date: string, value: unknown) {
    if (savingDays.has(date) || !selectedField) return;

    const existing = getCI(date);
    let patch: Record<string, unknown> = { [selectedField.key]: value };

    if (selectedField.key === "nutritionStatus") {
      const legacyMap: Record<string, MealComplianceType> = {
        calorie_tracker_used: "tracked_in_calorie_tracker",
        meal_plan_followed:   "fully_followed",
        no_exact_info:        "not_followed",
      };
      patch.mealCompliance = legacyMap[String(value)] ?? "fully_followed";
    }

    const merged: Omit<DailyCheckIn, "id" | "athleteId"> = {
      ...BASE_CI,
      ...(existing ? { ...existing } : {}),
      date,
      ...patch,
    } as Omit<DailyCheckIn, "id" | "athleteId">;

    setSavingDays((p) => new Set(p).add(date));
    try {
      const updated = await addDailyCheckIn(athlete.id, merged);
      onUpdate(updated);
      setSavedDays((p) => new Set(p).add(date));
      setTimeout(
        () =>
          setSavedDays((p) => {
            const s = new Set(p);
            s.delete(date);
            return s;
          }),
        2000
      );
    } catch {
      // silent
    } finally {
      setSavingDays((p) => {
        const s = new Set(p);
        s.delete(date);
        return s;
      });
    }
  }

  return (
    <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#192236] transition-colors"
      >
        <span className="text-xs font-medium text-[#8fa3c0]">Kompakt nachtragen</span>
        {isOpen ? (
          <ChevronUp size={14} className="text-[#5a7090]" />
        ) : (
          <ChevronDown size={14} className="text-[#5a7090]" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-[#1e2d42] p-4 flex flex-col gap-3">
          {/* Field selector */}
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            {enabledFields.map((f) => (
              <option key={String(f.key)} value={String(f.key)}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Day tiles — 2 rows of 10 */}
          <div className="flex flex-col gap-1">
            {[row1, row2].map((row, ri) => (
              <div key={ri} className="grid grid-cols-10 gap-1">
                {row.map((day) => {
                  const d = new Date(day + "T12:00:00");
                  const isToday = day === today;
                  const isSelected = day === selectedDay;
                  const hasData = getValueForDay(day) !== undefined;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex flex-col items-center py-1.5 rounded-lg text-center transition-all",
                        isSelected
                          ? "bg-[#3b82f6]/20 border border-[#3b82f6]/50"
                          : isToday
                          ? "bg-[#0f1a2e] border border-[#3b82f6]/20"
                          : "bg-[#0a1018] border border-transparent hover:border-[#1e2d42]"
                      )}
                    >
                      <span className={cn("text-[9px] font-medium leading-tight", isToday ? "text-[#60a5fa]" : "text-[#5a7090]")}>
                        {d.toLocaleDateString("de-DE", { weekday: "short" })}
                      </span>
                      <span className="text-[9px] text-[#3d5269] leading-tight">
                        {d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                      </span>
                      {hasData && <div className="w-1 h-1 rounded-full bg-[#10b981]/60 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Edit row for selected day */}
          {selectedDay && selectedField && (() => {
            const d = new Date(selectedDay + "T12:00:00");
            return (
              <DayRow
                key={`${selectedDay}-${selectedField.key}`}
                day={selectedDay}
                weekday={d.toLocaleDateString("de-DE", { weekday: "short" })}
                dateStr={d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                isToday={selectedDay === today}
                field={selectedField}
                currentValue={getValueForDay(selectedDay)}
                isSaving={savingDays.has(selectedDay)}
                justSaved={savedDays.has(selectedDay)}
                onSave={(value) => saveForDay(selectedDay, value)}
              />
            );
          })()}

          <p className="text-[10px] text-[#3d5269] text-center">
            Werte werden sofort gespeichert — kein Speichern-Button nötig.
          </p>
        </div>
      )}
    </div>
  );
}
