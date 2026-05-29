"use client";
import { WeeklyCheckIn } from "@/types";
import { X } from "lucide-react";

interface Props {
  ci: WeeklyCheckIn;
  onClose: () => void;
}

function stars(val: number | undefined, max = 5): string {
  if (val == null) return "–";
  return "★".repeat(val) + "☆".repeat(max - val) + ` (${val}/5)`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#1e2d42] last:border-0 gap-3">
      <span className="text-xs text-[#5a7090] flex-shrink-0 w-44">{label}</span>
      <span className="text-xs text-[#f0f4ff] text-right break-words">{value ?? "–"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">{title}</p>
      <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] px-4 py-1">
        {children}
      </div>
    </section>
  );
}

function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function WeeklyCheckDetailModal({ ci, onClose }: Props) {
  const dateLabel = new Date(ci.date + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0f1624] border border-[#1e2d42] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42] flex-shrink-0">
          <div>
            <p className="text-xs text-[#5a7090] mb-0.5">
              Weekly Check-in · {weekRangeLabel(ci.weekStart)}
            </p>
            <h2 className="text-sm font-semibold text-[#f0f4ff]">{dateLabel}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#141d2e] transition-colors">
            <X size={16} className="text-[#8fa3c0]" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex flex-col gap-5">
          <Section title="Gesamtbewertung">
            <Row label="Gesamte Woche" value={stars(ci.overallWeekRating)} />
            <Row label="Wochenzufriedenheit" value={stars(ci.weekSatisfaction)} />
            <Row label="Selbstzufriedenheit" value={stars(ci.selfSatisfaction)} />
          </Section>

          <Section title="Training">
            <Row label="Trainingseinschätzung" value={stars(ci.trainingRating)} />
            <Row
              label="Erholung"
              value={ci.recoveryRating != null ? stars(ci.recoveryRating) : "–"}
            />
          </Section>

          <Section title="Ernährung">
            <Row label="Plan-Umsetzung" value={stars(ci.nutritionAdherence)} />
            <Row label="Hunger & Cravings" value={ci.hungerCravings || "–"} />
          </Section>

          <Section title="Wohlbefinden (Wochendurchschnitt)">
            <Row label="Energielevel Ø" value={`${ci.energyAvg} / 5`} />
            <Row label="Stresslevel Ø" value={`${ci.stressAvg} / 5`} />
            <Row
              label="Schlafdauer Ø"
              value={ci.sleepAvg != null ? `${ci.sleepAvg} h` : "–"}
            />
          </Section>

          {ci.specialEvents && (
            <section>
              <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Besondere Ereignisse</p>
              <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] p-4">
                <p className="text-sm text-[#8fa3c0] leading-relaxed whitespace-pre-wrap">{ci.specialEvents}</p>
              </div>
            </section>
          )}

          {ci.freeNote && (
            <section>
              <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Freie Anmerkung</p>
              <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] p-4">
                <p className="text-sm text-[#8fa3c0] leading-relaxed whitespace-pre-wrap">{ci.freeNote}</p>
              </div>
            </section>
          )}

          {ci.coachNote && (
            <section>
              <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">Coach-Notiz</p>
              <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] p-4">
                <p className="text-sm text-[#8fa3c0] leading-relaxed whitespace-pre-wrap">{ci.coachNote}</p>
              </div>
            </section>
          )}

          {ci.photos && ci.photos.length > 0 && (
            <section>
              <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-2">
                Fotos ({ci.photos.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ci.photos.map((photo, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="rounded-xl w-full object-cover aspect-square"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
