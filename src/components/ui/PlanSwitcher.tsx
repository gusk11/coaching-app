"use client";

export interface PlanSwitcherItem {
  id: string;
  title: string;
  isActive: boolean;
}

interface PlanSwitcherProps {
  plans: PlanSwitcherItem[];
  onSelect: (id: string) => void;
}

export function PlanSwitcher({ plans, onSelect }: PlanSwitcherProps) {
  if (plans.length <= 1) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {plans.map((plan) => (
        <button
          key={plan.id}
          type="button"
          onClick={() => onSelect(plan.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
            plan.isActive
              ? "bg-[#3b82f6] text-white"
              : "bg-[#141d2e] text-[#8fa3c0] hover:text-[#f0f4ff] border border-[#1e2d42]"
          }`}
        >
          {plan.title}
        </button>
      ))}
    </div>
  );
}
