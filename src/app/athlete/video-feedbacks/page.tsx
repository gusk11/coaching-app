"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Athlete } from "@/types";
import { loadAuth, loadAthletes } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { VideoFeedbackOverview } from "@/components/athlete/VideoFeedbackOverview";
import { ToolIntroVideo } from "@/components/athlete/ToolIntroVideo";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AthleteVideoFeedbacksPage() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "athlete" || !auth.athleteId) { router.replace("/login"); return; }
    loadAthletes().then((athletes) => {
      const found = athletes.find((a) => a.id === auth.athleteId);
      if (!found) { router.replace("/login"); return; }
      setAthlete(found);
    });
  }, [router]);

  if (!athlete) {
    return (
      <AppShell role="athlete" title="Video-Feedbacks">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <Skeleton className="h-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="athlete" title="Video-Feedbacks">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <ToolIntroVideo athleteId={athlete.id} toolKey="videoFeedbacks" title="Einführung: Video-Feedbacks" position="top" seenToolIntros={athlete.seenToolIntros} />
        <VideoFeedbackOverview athleteId={athlete.id} />
        <ToolIntroVideo athleteId={athlete.id} toolKey="videoFeedbacks" title="Einführung: Video-Feedbacks" position="bottom" seenToolIntros={athlete.seenToolIntros} />
      </div>
    </AppShell>
  );
}
