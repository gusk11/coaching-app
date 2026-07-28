"use client";
import { useState } from "react";
import { SupplementPlan } from "@/types";
import { Pill, ExternalLink } from "lucide-react";
import { PlanSwitcher } from "@/components/ui/PlanSwitcher";

function SingleSupplementList({ plan }: { plan: SupplementPlan }) {
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

export function SupplementList({ plan, plans, onSetActive }: { plan?: SupplementPlan; plans?: SupplementPlan[]; onSetActive?: (planId: string) => void }) {
  const allPlans = plans ?? (plan ? [plan] : []);
  const defaultIdx = Math.max(0, allPlans.findIndex((p) => p.isActive));
  const [activeIdx, setActiveIdx] = useState(defaultIdx);

  if (allPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-4">💊</p>
        <p className="text-[#8fa3c0] font-medium">Noch kein Supplementplan</p>
      </div>
    );
  }

  const activePlan = allPlans[Math.min(activeIdx, allPlans.length - 1)];

  function handlePlanSelect(planId: string) {
    const idx = allPlans.findIndex((p) => p.id === planId);
    if (idx !== -1) setActiveIdx(idx);
    onSetActive?.(planId);
  }

  return (
    <div className="flex flex-col gap-3">
      <PlanSwitcher
        plans={allPlans.map((p, i) => ({ id: p.id, title: p.title ?? `Plan ${i + 1}`, isActive: i === activeIdx }))}
        onSelect={handlePlanSelect}
      />
      <SingleSupplementList plan={activePlan} />
    </div>
  );
}
