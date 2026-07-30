"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete, TrainingPlan, TrainingLog } from "@/types";
import { loadAuth, loadAthletes, saveTrainingLog, loadVideoFeedbacks, markVideoFeedbackSeen, setActiveTrainingPlan, buildRepeatSession, saveActiveSession } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { TrainingAccordion } from "@/components/athlete/TrainingAccordion";
import { TrainingLogger } from "@/components/athlete/TrainingLogger";
import { ToolIntroVideo } from "@/components/athlete/ToolIntroVideo";
import { TrainingProgressView } from "@/components/athlete/TrainingProgressView";
import { todayISO } from "@/lib/utils";
import { VideoFeedback } from "@/types";
import { ExternalLink, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentTransition } from "@/lib/motion";

type Tab = "log" | "plan" | "progress" | "feedback";

export default function AthleteTraining() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [tab, setTab] = useState<Tab>("log");
  const [videoFeedbacks, setVideoFeedbacks] = useState<VideoFeedback[]>([]);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    loadAthletes().then((athletes) => {
      const found = athletes.find((a) => a.id === auth.athleteId);
      if (!found) { router.replace("/login"); return; }
      setAthlete(found);
      loadVideoFeedbacks(auth.athleteId!).then(setVideoFeedbacks);
    });
  }, [router]);

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Trainingstracker">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  const today = todayISO();

  async function handleSaveLog(log: Parameters<typeof saveTrainingLog>[1]) {
    try {
      const updated = await saveTrainingLog(athlete!.id, log);
      setAthlete(updated.find((a) => a.id === athlete!.id)!);
      showToast("Training gespeichert.", "success");
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  function handleUpdateLogs(athletes: Athlete[]) {
    const updated = athletes.find((a) => a.id === athlete!.id);
    if (updated) setAthlete(updated);
  }

  async function handleSetActiveTrainingPlan(planId: string) {
    if (!athlete) return;
    try {
      const updated = await setActiveTrainingPlan(athlete.id, planId);
      setAthlete(updated.find((a) => a.id === athlete!.id) ?? null);
    } catch { /* ignore */ }
  }

  function handlePlanReordered(updatedPlan: TrainingPlan) {
    setAthlete((prev) => {
      if (!prev) return prev;
      const trainingPlans = (prev.trainingPlans ?? (prev.trainingPlan ? [prev.trainingPlan] : [])).map(
        (p) => (p.id === updatedPlan.id ? updatedPlan : p)
      );
      return { ...prev, trainingPlan: updatedPlan, trainingPlans };
    });
  }

  function handleRepeatLog(log: TrainingLog) {
    if (!athlete) return;
    const session = buildRepeatSession(athlete.id, log, today);
    saveActiveSession(session);
    setTab("log");
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "log", label: "Training tracken" },
    { key: "plan", label: "Trainingsplan" },
    { key: "progress", label: "Trainingsfortschritt" },
    { key: "feedback", label: "Technik-Feedback" },
  ];

  const noplan = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl mb-4">🏋️</p>
      <p className="text-[#8fa3c0] font-medium">Noch kein Trainingsplan</p>
      <p className="text-sm text-[#5a7090] mt-1">Gustav arbeitet gerade daran.</p>
    </div>
  );

  return (
    <AppShell role="athlete" title="Trainingstracker">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <ToolIntroVideo athleteId={athlete.id} toolKey="trainingstracker" title="Einführung: Trainingstracker" position="top" seenToolIntros={athlete.seenToolIntros} />
        {/* Tab selector */}
        <div className="flex rounded-xl bg-[#0f1624] border border-[#1e2d42] p-1 gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium transition-colors leading-tight px-1",
                tab === key
                  ? "bg-[#1e2d42] text-[#f0f4ff]"
                  : "text-[#5a7090] hover:text-[#8fa3c0]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {tab === "log" && (
            <motion.div key="log" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              {athlete.trainingPlan ? (
                <TrainingLogger
                  trainingPlan={athlete.trainingPlan}
                  existingLogs={athlete.trainingLogs ?? []}
                  today={today}
                  athleteId={athlete.id}
                  onSave={handleSaveLog}
                  onPlanReordered={handlePlanReordered}
                  videoFeedbacks={videoFeedbacks}
                />
              ) : noplan}
            </motion.div>
          )}

          {tab === "plan" && (
            <motion.div key="plan" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              {(() => {
                const trainingPlans = athlete.trainingPlans?.length ? athlete.trainingPlans : (athlete.trainingPlan ? [athlete.trainingPlan] : []);
                return trainingPlans.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[#f0f4ff]">
                        {trainingPlans.length === 1 ? trainingPlans[0].title : `${trainingPlans.length} Trainingspläne`}
                      </h2>
                      <p className="text-xs text-[#5a7090]">Wochenübersicht — tippe auf einen Tag zum Aufklappen</p>
                    </div>
                    <TrainingAccordion plans={trainingPlans} onSetActive={handleSetActiveTrainingPlan} />
                  </div>
                ) : noplan;
              })()}
            </motion.div>
          )}

          {tab === "progress" && (
            <motion.div key="progress" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              <TrainingProgressView athlete={athlete} onUpdate={handleUpdateLogs} onRepeatLog={handleRepeatLog} />
            </motion.div>
          )}

          {tab === "feedback" && (
            <motion.div key="feedback" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
              {(() => {
                const techFeedbacks = videoFeedbacks.filter((fb) => fb.category === "technik-feedback");
                return techFeedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#141d2e] flex items-center justify-center mb-4">
                    <Video size={24} className="text-[#5a7090]" />
                  </div>
                  <p className="text-[#8fa3c0] font-medium">Noch kein Technik-Feedback</p>
                  <p className="text-sm text-[#5a7090] mt-1">Gustav hat noch kein Video-Feedback hinterlegt.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {techFeedbacks.map((fb) => (
                    <a
                      key={fb.id}
                      href={fb.loomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { if (!fb.seenAt) markVideoFeedbackSeen(fb.id).then(() => setVideoFeedbacks((prev) => prev.map((f) => f.id === fb.id ? { ...f, seenAt: new Date().toISOString() } : f))); }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-[#0f1624] border border-[#1e2d42] hover:border-[#3b82f6]/40 hover:bg-[#141d2e] transition-all group"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${fb.seenAt ? "bg-[#141d2e]" : "bg-[#1a2744]"}`}>
                        <Video size={18} className={fb.seenAt ? "text-[#5a7090]" : "text-[#60a5fa]"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${fb.seenAt ? "text-[#8fa3c0]" : "text-[#f0f4ff]"}`}>{fb.title}</p>
                        <p className="text-xs text-[#5a7090]">
                          {new Date(fb.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          {!fb.seenAt && <span className="ml-2 text-[#60a5fa] font-medium">· Neu</span>}
                        </p>
                      </div>
                      <ExternalLink size={16} className="text-[#5a7090] group-hover:text-[#60a5fa] transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
        <ToolIntroVideo athleteId={athlete.id} toolKey="trainingstracker" title="Einführung: Trainingstracker" position="bottom" seenToolIntros={athlete.seenToolIntros} />
      </div>
    </AppShell>
  );
}
