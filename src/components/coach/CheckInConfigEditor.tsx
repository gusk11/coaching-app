"use client";
import { useState } from "react";
import {
  Athlete, DailyCheckConfig, DEFAULT_DAILY_CHECK_CONFIG,
  WeeklyCheckConfig, DEFAULT_WEEKLY_CHECK_CONFIG, CustomCheckField,
} from "@/types";
import { CHECK_CONFIG_LABELS } from "@/components/athlete/AthleteStammdatenForm";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { FloatingSaveButton } from "@/components/ui/FloatingSaveButton";

const WEEKLY_CONFIG_LABELS: { key: keyof Omit<WeeklyCheckConfig, "customFields">; label: string }[] = [
  { key: "overallWeekRating", label: "Gesamtbewertung der Woche" },
  { key: "weekSatisfaction", label: "Wochenzufriedenheit" },
  { key: "selfSatisfaction", label: "Selbstzufriedenheit" },
  { key: "nutritionAdherence", label: "Ernährungs-Adherenz" },
  { key: "hungerCravings", label: "Hunger & Cravings" },
  { key: "trainingRating", label: "Training-Bewertung" },
  { key: "stressAvg", label: "Stress-Ø" },
  { key: "energyAvg", label: "Energie-Ø" },
  { key: "recoveryRating", label: "Erholung" },
  { key: "sleepAvg", label: "Schlaf-Ø (Stunden)" },
  { key: "specialEvents", label: "Besondere Ereignisse" },
  { key: "freeNote", label: "Freitext" },
  { key: "progressPhotos", label: "Fortschrittsfotos" },
];

const FIELD_TYPE_LABELS: Record<CustomCheckField["type"], string> = {
  scale_1_5: "Skala 1–5",
  number: "Zahl",
  boolean: "Ja / Nein",
  text: "Freitext",
};

interface Props {
  athlete: Athlete;
  onSave: (updates: Partial<Athlete>) => void;
}

interface FieldFormState {
  label: string;
  type: CustomCheckField["type"];
  unit: string;
}

const EMPTY_FIELD_FORM: FieldFormState = { label: "", type: "scale_1_5", unit: "" };

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn("w-10 h-5 rounded-full transition-all relative shrink-0", active ? "bg-[#3b82f6]" : "bg-[#1e2d42]")}
    >
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", active ? "left-5" : "left-0.5")} />
    </button>
  );
}

function SectionHeader({
  title, count, open, onToggle,
}: { title: string; count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between w-full group"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#f0f4ff] group-hover:text-white transition-colors">{title}</span>
        <span className="text-[10px] text-[#5a7090] bg-[#1e2d42] px-1.5 py-0.5 rounded-full">{count} aktiv</span>
      </div>
      <ChevronDown
        size={16}
        className={cn("text-[#5a7090] transition-transform", open && "rotate-180")}
      />
    </button>
  );
}

function CustomFieldForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FieldFormState;
  onSave: (f: FieldFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FieldFormState>(initial);
  const valid = form.label.trim().length > 0;

  return (
    <div className="rounded-xl border border-[#3b82f6]/30 bg-[#0f1624] p-3 flex flex-col gap-3 mt-1">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-[#5a7090] uppercase tracking-wide">Feldname *</label>
        <input
          autoFocus
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="z. B. Muskelkater, Wohlbefinden …"
          className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#5a7090] uppercase tracking-wide">Typ</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CustomCheckField["type"] }))}
            className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            {(Object.keys(FIELD_TYPE_LABELS) as CustomCheckField["type"][]).map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[#5a7090] uppercase tracking-wide">Einheit (optional)</label>
          <input
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            placeholder="z. B. kg, min, kcal"
            className="bg-[#141d2e] border border-[#1e2d42] rounded-lg px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a]"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#8fa3c0] hover:text-[#f0f4ff] transition-colors"
        >
          <X size={12} /> Abbrechen
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => valid && onSave(form)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[#3b82f6] text-white font-medium disabled:opacity-40 hover:bg-[#2563eb] transition-colors"
        >
          <Check size={12} /> Speichern
        </button>
      </div>
    </div>
  );
}

export function CheckInConfigEditor({ athlete, onSave }: Props) {
  const [dailyOpen, setDailyOpen] = useState(true);
  const [weeklyOpen, setWeeklyOpen] = useState(false);

  const [dailyCfg, setDailyCfg] = useState<DailyCheckConfig>({
    ...DEFAULT_DAILY_CHECK_CONFIG,
    ...athlete.dailyCheckConfig,
  });
  const [weeklyCfg, setWeeklyCfg] = useState<WeeklyCheckConfig>({
    ...DEFAULT_WEEKLY_CHECK_CONFIG,
    ...athlete.weeklyCheckConfig,
  });

  // Custom field editing state
  const [dailyAddingField, setDailyAddingField] = useState(false);
  const [dailyEditingId, setDailyEditingId] = useState<string | null>(null);
  const [weeklyAddingField, setWeeklyAddingField] = useState(false);
  const [weeklyEditingId, setWeeklyEditingId] = useState<string | null>(null);

  const dailyActiveCount = (Object.keys(DEFAULT_DAILY_CHECK_CONFIG) as (keyof DailyCheckConfig)[])
    .filter((k) => k !== "customFields" && dailyCfg[k as keyof Omit<DailyCheckConfig, "customFields">])
    .length + (dailyCfg.customFields?.length ?? 0);

  const weeklyActiveCount = (Object.keys(DEFAULT_WEEKLY_CHECK_CONFIG) as (keyof WeeklyCheckConfig)[])
    .filter((k) => k !== "customFields" && weeklyCfg[k as keyof Omit<WeeklyCheckConfig, "customFields">])
    .length + (weeklyCfg.customFields?.length ?? 0);

  function saveDailyConfig(cfg: DailyCheckConfig) {
    setDailyCfg(cfg);
    onSave({ dailyCheckConfig: cfg });
  }

  function saveWeeklyConfig(cfg: WeeklyCheckConfig) {
    setWeeklyCfg(cfg);
    onSave({ weeklyCheckConfig: cfg });
  }

  function toggleDailyField(key: keyof Omit<DailyCheckConfig, "customFields">) {
    saveDailyConfig({ ...dailyCfg, [key]: !dailyCfg[key] });
  }

  function toggleWeeklyField(key: keyof Omit<WeeklyCheckConfig, "customFields">) {
    saveWeeklyConfig({ ...weeklyCfg, [key]: !weeklyCfg[key] });
  }

  function addDailyCustomField(form: FieldFormState) {
    const field: CustomCheckField = {
      id: crypto.randomUUID(),
      label: form.label.trim(),
      type: form.type,
      unit: form.unit.trim() || undefined,
    };
    saveDailyConfig({ ...dailyCfg, customFields: [...(dailyCfg.customFields ?? []), field] });
    setDailyAddingField(false);
  }

  function editDailyCustomField(id: string, form: FieldFormState) {
    saveDailyConfig({
      ...dailyCfg,
      customFields: (dailyCfg.customFields ?? []).map((f) =>
        f.id === id ? { ...f, label: form.label.trim(), type: form.type, unit: form.unit.trim() || undefined } : f
      ),
    });
    setDailyEditingId(null);
  }

  function deleteDailyCustomField(id: string) {
    saveDailyConfig({ ...dailyCfg, customFields: (dailyCfg.customFields ?? []).filter((f) => f.id !== id) });
  }

  function addWeeklyCustomField(form: FieldFormState) {
    const field: CustomCheckField = {
      id: crypto.randomUUID(),
      label: form.label.trim(),
      type: form.type,
      unit: form.unit.trim() || undefined,
    };
    saveWeeklyConfig({ ...weeklyCfg, customFields: [...(weeklyCfg.customFields ?? []), field] });
    setWeeklyAddingField(false);
  }

  function editWeeklyCustomField(id: string, form: FieldFormState) {
    saveWeeklyConfig({
      ...weeklyCfg,
      customFields: (weeklyCfg.customFields ?? []).map((f) =>
        f.id === id ? { ...f, label: form.label.trim(), type: form.type, unit: form.unit.trim() || undefined } : f
      ),
    });
    setWeeklyEditingId(null);
  }

  function deleteWeeklyCustomField(id: string) {
    saveWeeklyConfig({ ...weeklyCfg, customFields: (weeklyCfg.customFields ?? []).filter((f) => f.id !== id) });
  }

  function handleSave() {
    onSave({ dailyCheckConfig: dailyCfg, weeklyCheckConfig: weeklyCfg });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Daily ── */}
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
        <div className="px-4 py-3.5">
          <SectionHeader
            title="Daily Check-in Felder"
            count={dailyActiveCount}
            open={dailyOpen}
            onToggle={() => setDailyOpen((v) => !v)}
          />
        </div>

        {dailyOpen && (
          <div className="border-t border-[#1e2d42] px-4 pt-3 pb-4 flex flex-col gap-1">
            {/* Built-in fields */}
            {CHECK_CONFIG_LABELS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between py-1.5 border-b border-[#1e2d42]/50 last:border-0"
              >
                <span className="text-sm text-[#8fa3c0]">{label}</span>
                <Toggle
                  active={dailyCfg[key as keyof Omit<DailyCheckConfig, "customFields">] as boolean}
                  onToggle={() => toggleDailyField(key as keyof Omit<DailyCheckConfig, "customFields">)}
                />
              </div>
            ))}

            {/* Custom fields */}
            {(dailyCfg.customFields ?? []).length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-t border-[#1e2d42]/50 pt-2">
                <p className="text-[10px] text-[#5a7090] uppercase tracking-wide mb-1">Custom-Felder</p>
                {(dailyCfg.customFields ?? []).map((field) => (
                  <div key={field.id}>
                    {dailyEditingId === field.id ? (
                      <CustomFieldForm
                        initial={{ label: field.label, type: field.type, unit: field.unit ?? "" }}
                        onSave={(form) => editDailyCustomField(field.id, form)}
                        onCancel={() => setDailyEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between py-1.5 border-b border-[#1e2d42]/50 last:border-0 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-[#f0f4ff] truncate">{field.label}</span>
                          <span className="text-[10px] text-[#5a7090] bg-[#0f1624] px-1.5 py-0.5 rounded shrink-0">
                            {FIELD_TYPE_LABELS[field.type]}{field.unit ? ` · ${field.unit}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => { setDailyAddingField(false); setDailyEditingId(field.id); }}
                            className="p-1.5 rounded-lg hover:bg-[#1e2d42] text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDailyCustomField(field.id)}
                            className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 text-[#5a7090] hover:text-[#ef4444] transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add custom field */}
            {dailyAddingField ? (
              <CustomFieldForm
                initial={EMPTY_FIELD_FORM}
                onSave={addDailyCustomField}
                onCancel={() => setDailyAddingField(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => { setDailyEditingId(null); setDailyAddingField(true); }}
                className="mt-2 flex items-center gap-1.5 text-xs text-[#5a7090] hover:text-[#60a5fa] transition-colors self-start"
              >
                <Plus size={13} /> Feld hinzufügen
              </button>
            )}
          </div>
        )}
      </div>

      <FloatingSaveButton onClick={handleSave} label="Konfiguration speichern" />

      {/* ── Weekly ── */}
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] overflow-hidden">
        <div className="px-4 py-3.5">
          <SectionHeader
            title="Weekly Check-in Felder"
            count={weeklyActiveCount}
            open={weeklyOpen}
            onToggle={() => setWeeklyOpen((v) => !v)}
          />
        </div>

        {weeklyOpen && (
          <div className="border-t border-[#1e2d42] px-4 pt-3 pb-4 flex flex-col gap-1">
            {/* Built-in fields */}
            {WEEKLY_CONFIG_LABELS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between py-1.5 border-b border-[#1e2d42]/50 last:border-0"
              >
                <span className="text-sm text-[#8fa3c0]">{label}</span>
                <Toggle
                  active={weeklyCfg[key] as boolean}
                  onToggle={() => toggleWeeklyField(key)}
                />
              </div>
            ))}

            {/* Custom fields */}
            {(weeklyCfg.customFields ?? []).length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border-t border-[#1e2d42]/50 pt-2">
                <p className="text-[10px] text-[#5a7090] uppercase tracking-wide mb-1">Custom-Felder</p>
                {(weeklyCfg.customFields ?? []).map((field) => (
                  <div key={field.id}>
                    {weeklyEditingId === field.id ? (
                      <CustomFieldForm
                        initial={{ label: field.label, type: field.type, unit: field.unit ?? "" }}
                        onSave={(form) => editWeeklyCustomField(field.id, form)}
                        onCancel={() => setWeeklyEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between py-1.5 border-b border-[#1e2d42]/50 last:border-0 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-[#f0f4ff] truncate">{field.label}</span>
                          <span className="text-[10px] text-[#5a7090] bg-[#0f1624] px-1.5 py-0.5 rounded shrink-0">
                            {FIELD_TYPE_LABELS[field.type]}{field.unit ? ` · ${field.unit}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => { setWeeklyAddingField(false); setWeeklyEditingId(field.id); }}
                            className="p-1.5 rounded-lg hover:bg-[#1e2d42] text-[#5a7090] hover:text-[#60a5fa] transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteWeeklyCustomField(field.id)}
                            className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 text-[#5a7090] hover:text-[#ef4444] transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add custom field */}
            {weeklyAddingField ? (
              <CustomFieldForm
                initial={EMPTY_FIELD_FORM}
                onSave={addWeeklyCustomField}
                onCancel={() => setWeeklyAddingField(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => { setWeeklyEditingId(null); setWeeklyAddingField(true); }}
                className="mt-2 flex items-center gap-1.5 text-xs text-[#5a7090] hover:text-[#60a5fa] transition-colors self-start"
              >
                <Plus size={13} /> Feld hinzufügen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
