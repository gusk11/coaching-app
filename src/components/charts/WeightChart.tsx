"use client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Dot,
} from "recharts";
import { DailyCheckIn } from "@/types";
import { formatDateShort } from "@/lib/utils";

interface WeightChartProps {
  checkIns: DailyCheckIn[];
  targetWeight: number;
  startWeight: number;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-[#8fa3c0] text-xs mb-0.5">{label}</p>
        <p className="text-[#f0f4ff] font-bold">{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
};

export function WeightChart({ checkIns, targetWeight, startWeight, height = 220 }: WeightChartProps) {
  const sorted = [...checkIns]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-28);

  const data = sorted.map((c) => ({
    date: formatDateShort(c.date),
    weight: c.weight,
  }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-36 text-[#5a7090] text-sm">
        Noch keine Daten vorhanden.
      </div>
    );
  }

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights, targetWeight) - 1;
  const maxW = Math.max(...weights, startWeight) + 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#5a7090", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minW, maxW]}
          tick={{ fill: "#5a7090", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}`}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={targetWeight}
          stroke="#10b981"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: "Ziel", fill: "#10b981", fontSize: 10, position: "right" }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={data.length <= 14 ? { fill: "#3b82f6", r: 3, strokeWidth: 0 } : false}
          activeDot={{ fill: "#60a5fa", r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
