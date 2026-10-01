"use client";
import { DraftMeta } from "@/lib/useDraft";

interface Props {
  draftMeta: DraftMeta;
  onRestore: () => void;
  onDiscard: () => void;
  serverIsNewer?: boolean;
}

function formatDraftTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const time = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  return date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" }) + " " + time;
}

export function DraftRestoreBanner({ draftMeta, onRestore, onDiscard, serverIsNewer }: Props) {
  return (
    <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs font-medium text-[#f0f4ff]">
            Entwurf von {formatDraftTime(draftMeta.savedAt)} gefunden
          </p>
          {serverIsNewer && (
            <p className="text-[10px] text-[#f59e0b]">
              Hinweis: Die gespeicherte Version ist neuer als dieser Entwurf.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="flex-1 py-1.5 rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-xs font-medium text-[#fbbf24] hover:bg-[#f59e0b]/25 transition-colors"
        >
          Wiederherstellen
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="flex-1 py-1.5 rounded-lg bg-[#1e2d42] border border-[#243650] text-xs text-[#5a7090] hover:text-[#8fa3c0] transition-colors"
        >
          Verwerfen
        </button>
      </div>
    </div>
  );
}
