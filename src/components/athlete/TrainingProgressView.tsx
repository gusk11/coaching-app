"use client";
import { useState } from "react";
import { Athlete } from "@/types";
import { TrainingProgress } from "./TrainingProgress";
import { AllTrainings } from "./AllTrainings";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentTransition } from "@/lib/motion";

interface Props {
  athlete: Athlete;
  onUpdate: (athletes: Athlete[]) => void;
  mode?: "athlete" | "coach";
}

type SubTab = "exercises" | "alltrainings";

export function TrainingProgressView({ athlete, onUpdate, mode = "athlete" }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("exercises");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-xl bg-[#0f1624] border border-[#1e2d42] p-1 gap-1">
        {([
          { key: "exercises" as const, label: "Übungen" },
          { key: "alltrainings" as const, label: "Gesamte Trainings" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
              subTab === key
                ? "bg-[#1e2d42] text-[#f0f4ff]"
                : "text-[#5a7090] hover:text-[#8fa3c0]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {subTab === "exercises" && (
          <motion.div key="exercises" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
            <TrainingProgress trainingLogs={athlete.trainingLogs ?? []} mode={mode} />
          </motion.div>
        )}
        {subTab === "alltrainings" && (
          <motion.div key="alltrainings" variants={tabContentTransition} initial="hidden" animate="visible" exit="exit">
            <AllTrainings
              trainingLogs={athlete.trainingLogs ?? []}
              athleteId={athlete.id}
              onUpdate={onUpdate}
              mode={mode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
