"use client";
import { useEffect, useState, useMemo } from "react";
import { VideoFeedback } from "@/types";
import { loadVideoFeedbacks, markVideoFeedbackSeen } from "@/lib/store";
import { VideoFeedbackCategoryBadge } from "@/components/ui/VideoFeedbackCategoryBadge";
import { Video, ExternalLink, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS: { value: VideoFeedback["category"] | ""; label: string }[] = [
  { value: "", label: "Alle" },
  { value: "technik-feedback", label: "Technik" },
  { value: "checkin", label: "Check-in" },
  { value: "sonstiges", label: "Sonstiges" },
];

export function VideoFeedbackOverview({ athleteId }: { athleteId: string }) {
  const [feedbacks, setFeedbacks] = useState<VideoFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<VideoFeedback["category"] | "">("");
  const [filterDate, setFilterDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadVideoFeedbacks(athleteId)
      .then(setFeedbacks)
      .finally(() => setLoading(false));
  }, [athleteId]);

  const filtered = useMemo(() => {
    return feedbacks.filter((fb) => {
      if (filterCategory && fb.category !== filterCategory) return false;
      if (filterDate && fb.date !== filterDate) return false;
      if (searchQuery.trim()) {
        if (!fb.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [feedbacks, filterCategory, filterDate, searchQuery]);

  const hasActiveFilters = !!(filterCategory || filterDate || searchQuery.trim());

  function handleOpen(fb: VideoFeedback) {
    if (!fb.seenAt) {
      markVideoFeedbackSeen(fb.id).then(() => {
        setFeedbacks((prev) =>
          prev.map((f) => f.id === fb.id ? { ...f, seenAt: new Date().toISOString() } : f)
        );
      });
    }
  }

  function formatDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[#141d2e] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a7090]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Titel suchen…"
          className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-[#0f1624] border border-[#1e2d42] text-[#f0f4ff] text-sm placeholder:text-[#3a4f6a] focus:outline-none focus:border-[#3b82f6]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7090] hover:text-[#f0f4ff] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORY_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterCategory(value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              filterCategory === value
                ? "border-[#3b82f6] bg-[#3b82f6]/10 text-[#60a5fa]"
                : "border-[#1e2d42] text-[#5a7090] hover:border-[#2a3d5a] hover:text-[#8fa3c0]"
            )}
          >
            {label}
          </button>
        ))}

        {/* Date filter */}
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border border-[#1e2d42] bg-[#141d2e] text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
        />

        {hasActiveFilters && (
          <button
            onClick={() => { setFilterCategory(""); setFilterDate(""); setSearchQuery(""); }}
            className="px-3 py-1.5 rounded-lg text-xs border border-[#1e2d42] text-[#5a7090] hover:text-[#f0f4ff] hover:bg-[#141d2e] transition-colors"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#141d2e] flex items-center justify-center mb-4">
            <Video size={24} className="text-[#5a7090]" />
          </div>
          <p className="text-[#8fa3c0] font-medium">
            {hasActiveFilters ? "Keine Ergebnisse" : "Noch kein Video-Feedback"}
          </p>
          <p className="text-sm text-[#5a7090] mt-1">
            {hasActiveFilters
              ? "Filter anpassen oder zurücksetzen."
              : "Dein Coach hat noch kein Video-Feedback hinterlegt."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((fb) => (
            <a
              key={fb.id}
              href={fb.loomUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleOpen(fb)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-[#0f1624] border border-[#1e2d42] hover:border-[#3b82f6]/40 hover:bg-[#141d2e] transition-all group"
            >
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  fb.seenAt ? "bg-[#141d2e]" : "bg-[#1a2744]"
                )}
              >
                <Video size={18} className={fb.seenAt ? "text-[#5a7090]" : "text-[#60a5fa]"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn("text-sm font-medium truncate", fb.seenAt ? "text-[#8fa3c0]" : "text-[#f0f4ff]")}>
                    {fb.title}
                  </p>
                  {!fb.seenAt && (
                    <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#3b82f6]/20 text-[#60a5fa]">
                      NEU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-[#5a7090]">{formatDate(fb.date)}</span>
                  <VideoFeedbackCategoryBadge category={fb.category} />
                </div>
              </div>
              <ExternalLink size={16} className="text-[#5a7090] group-hover:text-[#60a5fa] transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-[#3a4f6a] text-center">
        {filtered.length} {filtered.length === 1 ? "Feedback" : "Feedbacks"}
        {hasActiveFilters && ` von ${feedbacks.length} gesamt`}
      </p>
    </div>
  );
}
