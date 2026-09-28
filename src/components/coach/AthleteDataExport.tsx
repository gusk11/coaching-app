"use client";
import { useState } from "react";
import { Download, X } from "lucide-react";
import { exportAthleteData } from "@/lib/store";
import { downloadJson, getDefaultExportRange } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  athleteId: string;
  athleteName: string;
}

export function AthleteDataExport({ athleteId, athleteName }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpen() {
    const defaults = getDefaultExportRange();
    setFrom(defaults.from);
    setTo(defaults.to);
    setOpen(true);
  }

  function applyQuickRange(days: number) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    setTo(today.toISOString().slice(0, 10));
    setFrom(start.toISOString().slice(0, 10));
  }

  async function handleExport() {
    if (from > to) {
      showToast('"Von" darf nicht nach "Bis" liegen.', "error");
      return;
    }
    setLoading(true);
    try {
      const data = await exportAthleteData(athleteId, from, to);
      const safeName = athleteName.replace(/\s+/g, "_");
      downloadJson(data, `athlet-${safeName}_${from}_${to}.json`);
      setOpen(false);
      showToast("Export erfolgreich.", "success");
    } catch {
      showToast("Export fehlgeschlagen. Bitte erneut versuchen.", "error");
    } finally {
      setLoading(false);
    }
  }

  const invalid = !from || !to || from > to;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#141d2e] border border-[#1e2d42] text-xs font-medium text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors self-start"
      >
        <Download size={13} />
        Athletendaten als JSON exportieren
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl bg-[#0d1526] border-t border-[#1e2d42] pb-8"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e2d42]">
                <div>
                  <p className="text-[10px] text-[#5a7090] uppercase tracking-wider mb-0.5">Daten exportieren</p>
                  <p className="text-sm font-semibold text-[#f0f4ff]">{athleteName}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#1e2d42] transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 pt-4 flex flex-col gap-4">
                <div className="flex gap-2">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => applyQuickRange(d)}
                      className="flex-1 py-1.5 rounded-lg bg-[#141d2e] border border-[#1e2d42] text-xs font-medium text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors"
                    >
                      {d} Tage
                    </button>
                  ))}
                </div>

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
                  Zeitraumgebundene Daten werden gefiltert. Pläne und Stammdaten als aktueller Snapshot.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
