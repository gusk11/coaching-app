"use client";

interface CadenceValue {
  eccentric: number;
  bottomHold: number;
  concentric: number;
  topHold: number;
}

interface Props {
  value?: CadenceValue;
  onChange: (v: CadenceValue) => void;
  size?: "sm" | "xs";
}

const EMPTY: CadenceValue = { eccentric: 0, bottomHold: 0, concentric: 0, topHold: 0 };
const LABELS = ["E", "B", "K", "O"] as const;
const FIELDS = ["eccentric", "bottomHold", "concentric", "topHold"] as const;

export function CadenceInput({ value, onChange, size = "sm" }: Props) {
  const v = value ?? EMPTY;

  const inputCls =
    size === "xs"
      ? "w-9 bg-[#0f1624] border border-[#1e2d42] rounded-md px-0 py-1 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] text-center"
      : "w-12 bg-[#0f1624] border border-[#1e2d42] rounded-lg px-1 py-1.5 text-[#f0f4ff] text-xs focus:outline-none focus:border-[#3b82f6] text-center";

  function update(field: (typeof FIELDS)[number], raw: string) {
    const num = raw === "" ? 0 : Math.max(0, Number(raw));
    onChange({ ...v, [field]: num });
  }

  return (
    <div className="flex items-center gap-0.5">
      {FIELDS.map((field, i) => (
        <span key={field} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-[10px] text-[#3a5070] select-none">–</span>}
          <span className="flex flex-col items-center gap-0.5">
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={v[field] || ""}
              onChange={(e) => update(field, e.target.value)}
              placeholder="0"
              className={inputCls}
            />
            <span className="text-[8px] text-[#3a5070] leading-none select-none">
              {LABELS[i]}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
