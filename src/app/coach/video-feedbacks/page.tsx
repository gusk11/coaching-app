"use client";
import { useState, useEffect } from "react";
import { Athlete, VideoFeedback } from "@/types";
import {
  loadAthletes, loadVideoFeedbacks, addVideoFeedback, deleteVideoFeedback, loadAuth,
} from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";
import { Plus, Trash2, X, ExternalLink, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modalOverlay, modalContent } from "@/lib/motion";
import { todayISO } from "@/lib/utils";

function emptyForm() {
  return { athleteId: "", title: "", date: todayISO(), loomUrl: "" };
}

function AddFeedbackModal({
  athletes,
  onSave,
  onClose,
}: {
  athletes: Athlete[];
  onSave: (data: Omit<VideoFeedback, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.athleteId) errs.athleteId = "Bitte einen Athleten auswählen.";
    if (!form.title.trim()) errs.title = "Titel darf nicht leer sein.";
    if (!form.date) errs.date = "Bitte ein Datum wählen.";
    if (!form.loomUrl.trim()) {
      errs.loomUrl = "Bitte eine URL eingeben.";
    } else {
      try { new URL(form.loomUrl.trim()); } catch { errs.loomUrl = "Bitte eine gültige URL eingeben."; }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ athleteId: form.athleteId, title: form.title.trim(), date: form.date, loomUrl: form.loomUrl.trim() });
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlay} initial="hidden" animate="visible" exit="hidden"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={modalContent} initial="hidden" animate="visible" exit="hidden"
          className="w-full max-w-md bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-6 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#f0f4ff]">Feedback hinzufügen</h2>
            <button onClick={onClose} className="text-[#5a7090] hover:text-[#f0f4ff] transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Athlet */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#8fa3c0]">Athlet</label>
              <select
                value={form.athleteId}
                onChange={(e) => set("athleteId", e.target.value)}
                className="w-full rounded-xl bg-[#141d2e] border border-[#1e2d42] text-[#f0f4ff] px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="">Athleten auswählen…</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.athleteId && <p className="text-xs text-red-400">{errors.athleteId}</p>}
            </div>

            {/* Datum */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#8fa3c0]">Datum</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full rounded-xl bg-[#141d2e] border border-[#1e2d42] text-[#f0f4ff] px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
              />
              {errors.date && <p className="text-xs text-red-400">{errors.date}</p>}
            </div>

            {/* Titel */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#8fa3c0]">Titel</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="z.B. Kniebeuge Technik KW 30"
                className="w-full rounded-xl bg-[#141d2e] border border-[#1e2d42] text-[#f0f4ff] px-3 py-2 text-sm placeholder:text-[#3a4f6a] focus:outline-none focus:border-[#3b82f6]"
              />
              {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
            </div>

            {/* Loom URL */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#8fa3c0]">Loom / Video-URL</label>
              <input
                type="url"
                value={form.loomUrl}
                onChange={(e) => set("loomUrl", e.target.value)}
                placeholder="https://www.loom.com/share/…"
                className="w-full rounded-xl bg-[#141d2e] border border-[#1e2d42] text-[#f0f4ff] px-3 py-2 text-sm placeholder:text-[#3a4f6a] focus:outline-none focus:border-[#3b82f6]"
              />
              {errors.loomUrl && <p className="text-xs text-red-400">{errors.loomUrl}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:bg-[#141d2e] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#2563eb] transition-colors"
              >
                Speichern
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CoachVideoFeedbacks() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [feedbacks, setFeedbacks] = useState<VideoFeedback[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") { router.replace("/login"); return; }
    Promise.all([loadAthletes(), loadVideoFeedbacks()]).then(([aths, fbs]) => {
      setAthletes(aths);
      setFeedbacks(fbs);
    });
  }, [router]);

  async function handleAdd(data: Omit<VideoFeedback, "id" | "createdAt">) {
    try {
      const updated = await addVideoFeedback(data);
      setFeedbacks(updated);
      setShowModal(false);
      showToast("Video Feedback gespeichert.", "success");
    } catch {
      showToast("Fehler beim Speichern.", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      const updated = await deleteVideoFeedback(id);
      setFeedbacks(updated);
      showToast("Feedback gelöscht.", "success");
    } catch {
      showToast("Fehler beim Löschen.", "error");
    }
  }

  function getAthleteName(athleteId: string) {
    return athletes.find((a) => a.id === athleteId)?.name ?? "Unbekannt";
  }

  function formatDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return (
    <AppShell role="coach" title="Video Feedbacks">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#f0f4ff]">Video Feedbacks</h1>
            <p className="text-xs text-[#5a7090] mt-0.5">{feedbacks.length} {feedbacks.length === 1 ? "Eintrag" : "Einträge"}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3b82f6] text-white text-sm font-medium hover:bg-[#2563eb] transition-colors"
          >
            <Plus size={16} />
            Feedback hinzufügen
          </button>
        </div>

        {/* List */}
        {feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#141d2e] flex items-center justify-center mb-4">
              <Video size={24} className="text-[#5a7090]" />
            </div>
            <p className="text-[#8fa3c0] font-medium">Noch keine Video Feedbacks</p>
            <p className="text-sm text-[#5a7090] mt-1">Füge das erste Feedback über den Button oben hinzu.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="flex items-center gap-3 p-4 rounded-2xl bg-[#0f1624] border border-[#1e2d42] hover:border-[#2a3d5a] transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#141d2e] flex items-center justify-center">
                  <Video size={18} className="text-[#3b82f6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f0f4ff] truncate">{fb.title}</p>
                  <p className="text-xs text-[#5a7090]">
                    {getAthleteName(fb.athleteId)} · {formatDate(fb.date)}
                    {fb.seenAt && <span className="ml-2 text-[#22c55e]">· gesehen</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={fb.loomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-[#5a7090] hover:text-[#60a5fa] hover:bg-[#1e2d42] transition-colors"
                    title="Video öffnen"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => handleDelete(fb.id)}
                    className="p-2 rounded-lg text-[#5a7090] hover:text-red-400 hover:bg-[#1e2d42] transition-colors"
                    title="Löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddFeedbackModal
          athletes={athletes}
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </AppShell>
  );
}
