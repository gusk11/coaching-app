"use client";
import { useEffect, useState } from "react";
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/store";
import { MaintenanceMode } from "@/types";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const DEFAULT: MaintenanceMode = {
  isActive: false,
  startTime: "",
  endTime: "",
  message: "",
};

const DEFAULT_MESSAGE =
  "Die App befindet sich momentan in der Wartung. Bitte versuche es später erneut.";

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn("w-10 h-5 rounded-full transition-all relative shrink-0", active ? "bg-[#ef4444]" : "bg-[#1e2d42]")}
    >
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", active ? "left-5" : "left-0.5")} />
    </button>
  );
}

export function MaintenanceEditor() {
  const [data, setData] = useState<MaintenanceMode>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMaintenanceMode().then((m) => {
      if (m) setData(m);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await setMaintenanceMode(data);
      showToast("Wartungsmodus gespeichert", "success");
    } catch {
      showToast("Fehler beim Speichern", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#5a7090]">Lade…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#f0f4ff]">Wartungsarbeiten aktivieren</p>
            <p className="text-xs text-[#5a7090] mt-0.5">
              Athleten-Login und Onboarding werden blockiert.
            </p>
          </div>
          <Toggle active={data.isActive} onToggle={() => setData((d) => ({ ...d, isActive: !d.isActive }))} />
        </div>

        <div className="h-px bg-[#1e2d42]" />

        {/* Time range */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs text-[#5a7090]">Von</label>
            <input
              type="datetime-local"
              value={data.startTime}
              onChange={(e) => setData((d) => ({ ...d, startTime: e.target.value }))}
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs text-[#5a7090]">Bis</label>
            <input
              type="datetime-local"
              value={data.endTime}
              onChange={(e) => setData((d) => ({ ...d, endTime: e.target.value }))}
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#5a7090]">Nachricht an Athleten</label>
          <textarea
            rows={3}
            value={data.message ?? ""}
            onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
            placeholder={DEFAULT_MESSAGE}
            className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none placeholder:text-[#3b4d6a]"
          />
        </div>
      </div>

      {data.isActive && (
        <div className="rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#fca5a5]">Wartungsmodus ist aktiv</p>
            <p className="text-xs text-[#f87171] mt-0.5">
              Athleten können sich nicht anmelden, bis du ihn deaktivierst.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              const updated = { ...data, isActive: false };
              setData(updated);
              setSaving(true);
              try {
                await setMaintenanceMode(updated);
                showToast("Wartungsmodus deaktiviert", "success");
              } catch {
                showToast("Fehler beim Speichern", "error");
              } finally {
                setSaving(false);
              }
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#fca5a5] text-xs font-semibold hover:bg-[#ef4444]/30 transition-colors disabled:opacity-50"
          >
            Deaktivieren
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-end px-5 py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-semibold hover:bg-[#2563eb] transition-colors disabled:opacity-50"
      >
        {saving ? "Speichern…" : "Speichern"}
      </button>
    </div>
  );
}
