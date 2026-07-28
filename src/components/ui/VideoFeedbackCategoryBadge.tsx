import { Dumbbell, ClipboardCheck, Tag } from "lucide-react";
import { ReactNode } from "react";
import { VideoFeedback } from "@/types";

const CONFIGS: Record<
  VideoFeedback["category"],
  { label: string; icon: ReactNode; className: string }
> = {
  "technik-feedback": {
    label: "Technik-Feedback",
    icon: <Dumbbell size={11} />,
    className: "text-[#f59e0b] bg-[#f59e0b]/10",
  },
  checkin: {
    label: "Check-in",
    icon: <ClipboardCheck size={11} />,
    className: "text-[#22c55e] bg-[#22c55e]/10",
  },
  sonstiges: {
    label: "Sonstiges",
    icon: <Tag size={11} />,
    className: "text-[#8fa3c0] bg-[#8fa3c0]/10",
  },
};

export { CONFIGS as VIDEO_FEEDBACK_CATEGORY_CONFIGS };

export function VideoFeedbackCategoryBadge({
  category,
}: {
  category: VideoFeedback["category"];
}) {
  const config = CONFIGS[category] ?? CONFIGS.sonstiges;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
