"use client";
import { useState } from "react";
import { WeeklyAdjustment } from "@/types";
import { Trash2, Plus } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface Props {
  adjustments: WeeklyAdjustment[];
  onAdd: (adj: Omit<WeeklyAdjustment, "id" | "athleteId" | "createdAt">) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: { value: WeeklyAdjustment["category"]; label: string; color: string }[] = [
  { value: "nutrition", label: "Ernährung", color: "text-[#60a5fa]" },
  { value: "training", label: "Training", color: "text-[#a78bfa]" },
  { value: "cardio", label: "Cardio", color: "text-[#34d399]" },
  { value: "supplements", label: "Supplements", color: "text-[#f59e0b]" },
  { value: "general", label: "Allgemein", color: "text-[#8fa3c0]" },
];

const CAT_BADGE: Record<WeeklyAdjustment["category"], string> = {
  nutrition: "bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20",
  training: "bg-[#7c3aed]/10 text-[#a78bfa] border-[#7c3aed]/20",
  cardio: "bg-[#10b981]/10 text-[#34d399] border-[#10b981]/20",
  supplements: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  general: "bg-[#1e2d42] text-[#8fa3c0] border-[#1e2d42]",
};

function getMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function WeeklyAdjustmentsEditor({ adjustments, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<WeeklyAdjustment["category"]>("nutrition");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibleToAthlete, setVisibleToAthlete] = useState(true);

  const weekStart = getMondayISO();
  const thisWeek = adjustments.filter((a) => a.weekStart === weekStart);
  const older = adjustments.filter((a) => a.weekStart !== weekStart);

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({ weekStart, category, title: title.trim(), description: description.trim(), visibleToAthlete });
    setTitle(""); setDescription(""); setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* This week */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#5a7090] uppercase tracking-widest">Anpassungen diese Woche</p>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
          >
            <Plus size={13} /> Hinzufügen
          </button>
        </div>

        {open && (
          <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#3b82f6]/30 flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                    category === c.value
                      ? CAT_BADGE[c.value]
                      : "bg-[#0f1624] border-[#1e2d42] text-[#5a7090]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel, z.B. Reis reduziert"
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Details, z.B. Meal 3: Reis von 100g auf 80g reduziert."
              className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleToAthlete(!visibleToAthlete)}
                  className={`w-10 h-5 rounded-full transition-all relative ${visibleToAthlete ? "bg-[#3b82f6]" : "bg-[#1e2d42]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${visibleToAthlete ? "left-5" : "left-0.5"}`} />
                </button>
                <span className="text-xs text-[#8fa3c0]">Für Athleten sichtbar</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg border border-[#1e2d42] text-xs text-[#5a7090]">Abbrechen</button>
                <button onClick={handleAdd} className="px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors">Speichern</button>
              </div>
            </div>
          </div>
        )}

        {thisWeek.length === 0 && !open && (
          <p className="text-sm text-[#5a7090] py-2">Noch keine Anpassungen diese Woche.</p>
        )}
        {thisWeek.map((adj) => (
          <AdjCard key={adj.id} adj={adj} onDelete={onDelete} />
        ))}
      </div>

      {/* Older */}
      {older.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[#5a7090] uppercase tracking-widest">Frühere Anpassungen</p>
          {[...older].sort((a, b) => b.weekStart.localeCompare(a.weekStart)).slice(0, 10).map((adj) => (
            <AdjCard key={adj.id} adj={adj} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdjCard({ adj, onDelete }: { adj: WeeklyAdjustment; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-xl bg-[#141d2e] border border-[#1e2d42] p-3 flex gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded-md border text-xs font-medium ${CAT_BADGE[adj.category]}`}>
            {CATEGORIES.find((c) => c.value === adj.category)?.label}
          </span>
          {!adj.visibleToAthlete && (
            <span className="text-xs text-[#5a7090]">· Coach-intern</span>
          )}
        </div>
        <p className="text-sm font-medium text-[#f0f4ff]">{adj.title}</p>
        {adj.description && <p className="text-xs text-[#8fa3c0] mt-0.5">{adj.description}</p>}
        <p className="text-xs text-[#5a7090] mt-1">KW {new Date(adj.weekStart).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}</p>
      </div>
      <Tooltip label="Anpassung löschen">
        <button
          type="button"
          onClick={() => onDelete(adj.id)}
          aria-label="Anpassung löschen"
          className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 transition-colors self-start"
        >
          <Trash2 size={13} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
        </button>
      </Tooltip>
    </div>
  );
}
