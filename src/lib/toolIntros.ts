const KEY_PREFIX = "coachOS_toolIntro_";

export const INTRO_VIDEO_URL = "https://www.youtube.com/watch?v=YlHi5xeTlDE";

export function isToolIntroSeen(athleteId: string, toolKey: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${KEY_PREFIX}${athleteId}_${toolKey}`) === "1";
}

export function markToolIntroSeen(athleteId: string, toolKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${KEY_PREFIX}${athleteId}_${toolKey}`, "1");
  window.dispatchEvent(new CustomEvent("toolIntroSeen", { detail: { toolKey } }));
}
