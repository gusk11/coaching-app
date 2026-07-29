"use client";
import { useState, useEffect, useRef } from "react";
import { PlayCircle, X, RefreshCw } from "lucide-react";
import { isToolIntroSeen, markToolIntroSeen, TOOL_INTRO_VIDEOS } from "@/lib/toolIntros";
import { markAthleteToolIntroSeen } from "@/lib/store";

function getEmbedUrl(url: string): string {
  const shortM = url.match(/youtu\.be\/([^?&]+)/);
  if (shortM) return `https://www.youtube.com/embed/${shortM[1]}?autoplay=1`;
  const longM = url.match(/[?&]v=([^&]+)/);
  return longM ? `https://www.youtube.com/embed/${longM[1]}?autoplay=1` : url;
}

interface Props {
  athleteId: string;
  toolKey: string;
  title: string;
  /** "top" renders the orange banner (only when unseen). "bottom" renders the compact replay link (only when seen). */
  position: "top" | "bottom";
  /** seenToolIntros from the Supabase-loaded athlete; used for auto-open decision. */
  seenToolIntros?: string[];
}

export function ToolIntroVideo({ athleteId, toolKey, title, position, seenToolIntros }: Props) {
  const [seen, setSeen] = useState(true); // start true to avoid flash on load
  const [open, setOpen] = useState(false);
  const hasAutoOpened = useRef(false);

  useEffect(() => {
    const supabaseSeen = seenToolIntros !== undefined
      ? seenToolIntros.includes(toolKey)
      : null;
    const isSeen = supabaseSeen !== null ? supabaseSeen : isToolIntroSeen(athleteId, toolKey);
    setSeen(isSeen);
    if (!isSeen && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      setOpen(true);
    }
  }, [athleteId, toolKey, seenToolIntros]);

  function doMarkSeen() {
    markAthleteToolIntroSeen(athleteId, toolKey).catch(() => {});
    markToolIntroSeen(athleteId, toolKey);
    setSeen(true);
  }

  function handleClose() {
    setOpen(false);
    if (!seen) doMarkSeen();
  }

  function handleWatch() {
    if (!seen) doMarkSeen();
    setOpen(true);
  }

  if (position === "top" && seen) return null;
  if (position === "bottom" && !seen) return null;

  return (
    <>
      {position === "top" ? (
        <div className="rounded-2xl bg-[#451a03]/40 border border-[#f59e0b]/30 p-4 flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center">
            <PlayCircle size={22} className="text-[#f59e0b]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#f59e0b] font-semibold text-sm">{title}</p>
            <p className="text-[#a16207] text-xs mt-0.5 leading-snug">
              Schau dir das kurze Einführungsvideo an, bevor du loslegst.
            </p>
          </div>
          <button
            onClick={handleWatch}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f59e0b] text-[#0a0f1a] text-sm font-semibold hover:bg-[#fbbf24] transition-colors"
          >
            <PlayCircle size={14} />
            Ansehen
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center py-3">
          <button
            onClick={handleWatch}
            className="flex items-center gap-1.5 text-xs text-[#5a7090] hover:text-[#8fa3c0] transition-colors"
          >
            <RefreshCw size={12} />
            Einführungsvideo nochmal ansehen
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-black"
            style={{ aspectRatio: "16/9" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <X size={16} />
            </button>
            <iframe
              src={getEmbedUrl(TOOL_INTRO_VIDEOS[toolKey] ?? "")}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
