"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAuth, loadAthletes, addAthlete, loadCheckInDone, setCheckInDone } from "@/lib/store";
import { Athlete, GoalType } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { AthleteCard } from "@/components/coach/AthleteCard";
import { analyzeWeek } from "@/lib/utils";
import { UserPlus, X } from "lucide-react";

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "cut", label: "Diät / Abnehmen" },
  { value: "bulk", label: "Muskelaufbau" },
  { value: "recomp", label: "Recomposition" },
  { value: "maintenance", label: "Erhaltung" },
];

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function CoachDashboard() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [checkInDone, setCheckInDoneState] = useState<Record<string, boolean>>({});

  // New athlete form state
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newGoal, setNewGoal] = useState<GoalType>("cut");
  const [newGoalText, setNewGoalText] = useState("");
  const [newStartWeight, setNewStartWeight] = useState(80);
  const [newTargetWeight, setNewTargetWeight] = useState(75);
  const [newCheckInDay, setNewCheckInDay] = useState<0|1|2|3|4|5|6>(1);
  const [newCoachNote, setNewCoachNote] = useState("");
  const [newVisibleNote, setNewVisibleNote] = useState("");

  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") { router.replace("/login"); return; }
    setAthletes(loadAthletes());
    setCheckInDoneState(loadCheckInDone());
  }, [router]);

  const todayDayOfWeek = new Date().getDay() as 0|1|2|3|4|5|6;
  const todayStr = todayDateString();

  const totalAthletes = athletes.length;
  const athletesWithCheckInToday = athletes.filter((a) => a.checkInDay === todayDayOfWeek);
  const checkInsToday = athletesWithCheckInToday.length;
  const checkInsProcessed = athletesWithCheckInToday.filter(
    (a) => checkInDone[`${a.id}_${todayStr}`] === true
  ).length;

  const sortedAthletes = [
    ...athletesWithCheckInToday,
    ...athletes.filter((a) => a.checkInDay !== todayDayOfWeek),
  ];

  function handleToggleDone(athleteId: string) {
    const key = `${athleteId}_${todayStr}`;
    const current = checkInDone[key] ?? false;
    const updated = setCheckInDone(athleteId, todayStr, !current);
    setCheckInDoneState(updated);
  }

  function handleCreateAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || newPin.length < 4) return;
    const initials = newName.trim().split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    const newAthlete: Athlete = {
      id: `a${Date.now()}`,
      name: newName.trim(),
      pin: newPin,
      avatarInitials: initials,
      startWeight: newStartWeight,
      currentWeight: newStartWeight,
      targetWeight: newTargetWeight,
      goalType: newGoal,
      goalText: newGoalText.trim() || undefined,
      checkInDay: newCheckInDay,
      coachNote: newCoachNote,
      visibleNote: newVisibleNote,
      dailyCheckIns: [],
      weeklyCheckIns: [],
      notes: [],
      joinedAt: new Date().toISOString(),
    };
    const updated = addAthlete(newAthlete);
    setAthletes(updated);
    setShowModal(false);
    // Reset form
    setNewName(""); setNewPin(""); setNewGoal("cut"); setNewGoalText("");
    setNewStartWeight(80); setNewTargetWeight(75); setNewCheckInDay(1);
    setNewCoachNote(""); setNewVisibleNote("");
  }

  return (
    <AppShell role="coach" title="Athleten-Übersicht">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
            <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Athleten gesamt</p>
            <p className="text-2xl font-bold text-[#f0f4ff]">{totalAthletes}</p>
          </div>
          <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
            <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Check-ins heute</p>
            <p className="text-2xl font-bold text-[#f0f4ff]">{checkInsToday}</p>
          </div>
          <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
            <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Bearbeitet</p>
            <p className="text-2xl font-bold text-[#f0f4ff]">
              {checkInsToday === 0 ? "0 / 0" : `${checkInsProcessed} / ${checkInsToday}`}
            </p>
          </div>
          <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4">
            <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-1">Wochentag</p>
            <p className="text-base font-bold text-[#f0f4ff]">{DAY_NAMES[todayDayOfWeek]}</p>
            <p className="text-[11px] text-[#5a7090] mt-0.5">{todayStr.split("-").reverse().join(".")}</p>
          </div>
        </div>

        {/* Add athlete button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#3b82f6]/40 text-[#60a5fa] text-sm font-medium hover:bg-[#3b82f6]/5 transition-colors"
        >
          <UserPlus size={16} />
          Neuen Athleten anlegen
        </button>

        {/* Athlete cards */}
        <div className="flex flex-col gap-3">
          {sortedAthletes.map((a) => {
            const isCheckInToday = a.checkInDay === todayDayOfWeek;
            const isDone = checkInDone[`${a.id}_${todayStr}`] === true;
            return (
              <AthleteCard
                key={a.id}
                athlete={a}
                isCheckInToday={isCheckInToday}
                isDone={isDone}
                onToggleDone={isCheckInToday ? () => handleToggleDone(a.id) : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Create athlete modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0f1624] border border-[#1e2d42] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d42]">
              <h2 className="text-base font-semibold text-[#f0f4ff]">Neuen Athleten anlegen</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-[#141d2e] transition-colors">
                <X size={18} className="text-[#8fa3c0]" />
              </button>
            </div>

            <form onSubmit={handleCreateAthlete} className="overflow-y-auto p-5 flex flex-col gap-4">
              {/* Name + PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8fa3c0]">Name *</label>
                  <input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8fa3c0]">PIN (4-stellig) *</label>
                  <input
                    required
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234"
                    className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
              </div>

              {/* Goal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8fa3c0]">Ziel</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setNewGoal(o.value)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        newGoal === o.value
                          ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                          : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/30"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8fa3c0]">Individuelles Ziel (optional)</label>
                <input
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="z.B. Wettkampfvorbereitung Mai 2026"
                  className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                />
              </div>

              {/* Weights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8fa3c0]">Startgewicht (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStartWeight}
                    onChange={(e) => setNewStartWeight(Number(e.target.value))}
                    className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#8fa3c0]">Zielgewicht (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTargetWeight}
                    onChange={(e) => setNewTargetWeight(Number(e.target.value))}
                    className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                  />
                </div>
              </div>

              {/* Check-in day */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8fa3c0]">Check-in Tag</label>
                <div className="flex gap-1 flex-wrap">
                  {DAY_NAMES.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewCheckInDay(i as 0|1|2|3|4|5|6)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                        newCheckInDay === i
                          ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                          : "bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0]"
                      }`}
                    >
                      {d.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8fa3c0]">Interne Coach-Notiz</label>
                <textarea
                  value={newCoachNote}
                  onChange={(e) => setNewCoachNote(e.target.value)}
                  rows={2}
                  placeholder="Nur für den Coach sichtbar..."
                  className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8fa3c0]">Hinweis für Athleten (sichtbar)</label>
                <textarea
                  value={newVisibleNote}
                  onChange={(e) => setNewVisibleNote(e.target.value)}
                  rows={2}
                  placeholder="Dieser Text ist für den Athleten sichtbar..."
                  className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm hover:border-[#3b82f6]/40 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors"
                >
                  Athlet anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
