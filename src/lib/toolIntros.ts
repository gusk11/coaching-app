const KEY_PREFIX = "coachOS_toolIntro_";

export const TOOL_INTRO_VIDEOS: Record<string, string> = {
  dashboard: "https://youtu.be/BUmnyhOKN3w",
  checkins: "https://youtu.be/sO6nBuNA9HA",
  training: "https://youtu.be/khtTAuHIjhs",
  plans: "https://youtu.be/Ben6kEYwbbI",
  "video-feedbacks": "https://youtu.be/HC8FyaaXV-I",
  stammdaten: "https://youtu.be/HC8FyaaXV-I",
};

export function isToolIntroSeen(athleteId: string, toolKey: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${KEY_PREFIX}${athleteId}_${toolKey}`) === "1";
}

export function markToolIntroSeen(athleteId: string, toolKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${KEY_PREFIX}${athleteId}_${toolKey}`, "1");
  window.dispatchEvent(new CustomEvent("toolIntroSeen", { detail: { toolKey } }));
}
