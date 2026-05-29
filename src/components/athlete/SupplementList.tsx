import { SupplementPlan } from "@/types";
import { Pill, ExternalLink } from "lucide-react";

export function SupplementList({ plan }: { plan: SupplementPlan }) {
  return (
    <div className="flex flex-col gap-3">
      {plan.coachNote && (
        <div className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42]">
          <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Coach-Hinweis</p>
          <p className="text-sm text-[#8fa3c0]">{plan.coachNote}</p>
        </div>
      )}
      {plan.supplements.map((s) => (
        <div key={s.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1d4ed8]/20 flex items-center justify-center shrink-0">
              <Pill size={16} className="text-[#60a5fa]" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <p className="text-sm font-semibold text-[#f0f4ff]">{s.name}</p>

              {/* Individuelle Dosierungsmenge */}
              {s.dosage && (
                <p className="text-xs text-[#3b82f6] font-medium">{s.dosage}</p>
              )}

              {/* Standarddosierung aus DB */}
              {s.standardDosage && (
                <p className="text-xs text-[#5a7090]">
                  Standarddosierung: {s.standardDosage}
                </p>
              )}

              <p className="text-xs text-[#8fa3c0]">{s.timing}</p>

              {s.instructions && (
                <p className="text-xs text-[#5a7090] mt-1">{s.instructions}</p>
              )}
              {s.note && (
                <p className="text-xs text-[#5a7090] italic mt-1">{s.note}</p>
              )}

              {/* Produktempfehlung */}
              <div className="mt-2 pt-2 border-t border-[#1e2d42]">
                <p className="text-xs text-[#5a7090] mb-1">Produktempfehlung:</p>
                {s.link ? (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors w-fit"
                  >
                    <ExternalLink size={11} />
                    Link öffnen
                  </a>
                ) : (
                  <p className="text-xs text-[#3a5070] italic">Keine Produktempfehlung hinterlegt</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
