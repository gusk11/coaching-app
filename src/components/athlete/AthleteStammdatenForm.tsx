"use client";
import { useState } from "react";
import {
  Athlete, DailyCheckConfig,
  ExperienceLevel, GoalType, LegalConsent, TrackingDevice,
} from "@/types";
import { cn, getGoalLabel } from "@/lib/utils";
import { Pencil, Check, X } from "lucide-react";
import { ProfileDisplaySections, ProfileEditSections } from "@/components/athlete/ProfileSections";
import { showToast } from "@/components/ui/Toast";
import { FloatingSaveButton } from "@/components/ui/FloatingSaveButton";

const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "cut", label: "Diät / Abnehmen" },
  { value: "bulk", label: "Muskelaufbau" },
  { value: "recomp", label: "Recomposition" },
  { value: "maintenance", label: "Erhaltung" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Anfänger" },
  { value: "intermediate", label: "Fortgeschritten" },
  { value: "advanced", label: "Erfahren" },
  { value: "elite", label: "Elite / Wettkampf" },
];

const TRACKING_DEVICE_OPTIONS: { value: TrackingDevice; label: string }[] = [
  { value: "apple_watch", label: "Apple Watch" },
  { value: "garmin", label: "Garmin" },
  { value: "fitbit", label: "Fitbit" },
  { value: "whoop", label: "Whoop" },
  { value: "oura", label: "Oura Ring" },
  { value: "none", label: "Kein Trackinggerät" },
  { value: "other", label: "Sonstiges" },
];

const CHECKIN_DAY_OPTIONS: { value: 0 | 1 | 2 | 3 | 4 | 5 | 6; label: string }[] = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 0, label: "So" },
];

export const CHECK_CONFIG_LABELS: { key: keyof DailyCheckConfig; label: string }[] = [
  { key: "bodyweight", label: "Körpergewicht" },
  { key: "sleepDuration", label: "Schlafdauer" },
  { key: "sleepQuality", label: "Schlafqualität (1–10)" },
  { key: "sleepScore", label: "Schlafscore (Gerät, 0–100)" },
  { key: "steps", label: "Schritte" },
  { key: "restingHeartRate", label: "Ruheherzfrequenz" },
  { key: "hrv", label: "HRV / Herzratenvariabilität" },
  { key: "spO2", label: "Sauerstoffsättigung / SpO₂" },
  { key: "bloodPressure", label: "Blutdruck" },
  { key: "stressLevel", label: "Stresslevel" },
  { key: "energyLevel", label: "Energielevel" },
  { key: "mood", label: "Stimmung" },
  { key: "appetite", label: "Appetit" },
  { key: "digestion", label: "Verdauung" },
  { key: "trainingQuality", label: "Trainingsqualität" },
  { key: "cardioCompleted", label: "Cardio absolviert" },
  { key: "trainingCompleted", label: "Training absolviert" },
  { key: "nutritionCompliance", label: "Ernährungsplan Compliance" },
  { key: "calorieTracking", label: "Kalorien getrackt" },
  { key: "notes", label: "Tagesanmerkung" },
];

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Anfänger",
  intermediate: "Fortgeschritten",
  advanced: "Erfahren",
  elite: "Elite / Wettkampf",
};

const TRACKING_DEVICE_LABELS: Record<TrackingDevice, string> = {
  apple_watch: "Apple Watch",
  garmin: "Garmin",
  fitbit: "Fitbit",
  whoop: "Whoop",
  oura: "Oura Ring",
  none: "Kein Trackinggerät",
  other: "Sonstiges",
};

const CHECKIN_DAY_LABELS: Record<number, string> = {
  0: "Sonntag", 1: "Montag", 2: "Dienstag", 3: "Mittwoch",
  4: "Donnerstag", 5: "Freitag", 6: "Samstag",
};

function formatDate(iso?: string): string {
  if (!iso) return "–";
  return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

const inputCls = "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full";

function SectionHeader({ children }: { children: string }) {
  return <p className="text-xs text-[#5a7090] uppercase tracking-widest mb-3">{children}</p>;
}

function DataRow({ label, value }: { label: string; value?: string | number | null }) {
  const display = value != null && value !== "" ? String(value) : "–";
  return (
    <div className="flex justify-between items-start gap-3 py-2 border-b border-[#1e2d42]/60 last:border-0">
      <span className="text-xs text-[#5a7090] shrink-0">{label}</span>
      <span className="text-sm text-[#f0f4ff] text-right">{display}</span>
    </div>
  );
}

function LegalSection({ consent, coachMode = false }: { consent?: LegalConsent; coachMode?: boolean }) {
  if (!consent) {
    return (
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-2">
        <SectionHeader>Rechtliches</SectionHeader>
        <p className="text-sm text-[#5a7090]">Keine Zustimmungsdaten vorhanden.</p>
      </div>
    );
  }
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  return (
    <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
      <SectionHeader>Rechtliches</SectionHeader>
      <DataRow
        label="Datenschutzerklärung"
        value={consent.privacyAccepted ? `Akzeptiert am ${fmtDate(consent.privacyAcceptedAt)}` : "Nicht akzeptiert"}
      />
      <DataRow
        label="Coaching-Vertrag"
        value={consent.contractAccepted ? `Akzeptiert am ${fmtDate(consent.contractAcceptedAt)}` : "Nicht akzeptiert"}
      />
      <DataRow label="Vertragsversion" value={consent.legalVersion} />
      {consent.signedName && <DataRow label="Bestätigungsname" value={consent.signedName} />}
      {coachMode && consent.signatureDataUrl && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-xs text-[#5a7090]">Digitale Unterschrift</span>
          <div className="rounded-xl border border-[#2e4060] bg-[#0a0f1a] overflow-hidden p-2">
            <img src={consent.signatureDataUrl} alt="Unterschrift" className="max-h-[80px] w-auto" />
          </div>
        </div>
      )}
      {!coachMode && consent.signatureDataUrl && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-xs text-[#5a7090]">Digitale Unterschrift</span>
          <div className="rounded-xl border border-[#2e4060] bg-[#0a0f1a] overflow-hidden p-2">
            <img src={consent.signatureDataUrl} alt="Unterschrift" className="max-h-[80px] w-auto" />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "text", placeholder, rows }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#5a7090]">{label}</label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
          placeholder={placeholder} className={`${inputCls} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={inputCls} />
      )}
    </div>
  );
}

function SelBtn({ active, onClick, children, className }: {
  active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn(
      "px-3 py-2 rounded-xl border text-xs font-medium transition-all",
      active
        ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
        : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0] hover:border-[#3b82f6]/20 hover:text-[#f0f4ff]",
      className,
    )}>
      {children}
    </button>
  );
}

interface Props {
  athlete: Athlete;
  /** "athlete" = view/edit toggle, no coach-only fields.
   *  "coach"   = always-edit form, includes specialNotes, no weight/goal/checkInDay fields. */
  mode: "coach" | "athlete";
  onSave: (updates: Partial<Athlete>) => void;
  /** Coach mode only: called when a questionnaire section is saved. */
  onSaveProfile?: (profile: import("@/types").AthleteProfile) => void;
}

export function AthleteStammdatenForm({ athlete, mode, onSave, onSaveProfile }: Props) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Shared fields
  const [height, setHeight] = useState(String(athlete.height ?? ""));
  const [startDate, setStartDate] = useState(athlete.startDate ?? "");
  const [competitionDate, setCompetitionDate] = useState(athlete.competitionDate ?? "");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(athlete.experienceLevel ?? "");
  const [injuries, setInjuries] = useState(athlete.injuries ?? "");
  const [trainingHistory, setTrainingHistory] = useState(athlete.trainingHistory ?? "");
  const [trackingDevice, setTrackingDevice] = useState<TrackingDevice | "">(athlete.trackingDevice ?? "");
  const [trackingDeviceCustom, setTrackingDeviceCustom] = useState(athlete.trackingDeviceCustom ?? "");

  // Athlete-mode-only fields
  const [name, setName] = useState(athlete.name);
  const [startWeight, setStartWeight] = useState(String(athlete.startWeight));
  const [currentWeight, setCurrentWeight] = useState(String(athlete.currentWeight));
  const [targetWeight, setTargetWeight] = useState(String(athlete.targetWeight));
  const [goalType, setGoalType] = useState<GoalType>(athlete.goalType);
  const [goalText, setGoalText] = useState(athlete.goalText ?? "");
  const [checkInDay, setCheckInDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(athlete.checkInDay);

  // Coach-mode-only fields
  const [specialNotes, setSpecialNotes] = useState(athlete.specialNotes ?? "");

  function resetToAthlete(a: Athlete) {
    setHeight(String(a.height ?? ""));
    setStartDate(a.startDate ?? "");
    setCompetitionDate(a.competitionDate ?? "");
    setExperienceLevel(a.experienceLevel ?? "");
    setInjuries(a.injuries ?? "");
    setTrainingHistory(a.trainingHistory ?? "");
    setTrackingDevice(a.trackingDevice ?? "");
    setTrackingDeviceCustom(a.trackingDeviceCustom ?? "");
    setName(a.name);
    setStartWeight(String(a.startWeight));
    setCurrentWeight(String(a.currentWeight));
    setTargetWeight(String(a.targetWeight));
    setGoalType(a.goalType);
    setGoalText(a.goalText ?? "");
    setCheckInDay(a.checkInDay);
    setSpecialNotes(a.specialNotes ?? "");
  }

  function buildUpdates(): Partial<Athlete> {
    const common: Partial<Athlete> = {
      height: height ? Number(height) : undefined,
      startDate: startDate || undefined,
      competitionDate: competitionDate || undefined,
      experienceLevel: (experienceLevel as ExperienceLevel) || undefined,
      trainingHistory: trainingHistory.trim() || undefined,
      injuries: injuries.trim() || undefined,
      trackingDevice: (trackingDevice as TrackingDevice) || undefined,
      trackingDeviceCustom: trackingDeviceCustom.trim() || undefined,
    };
    if (mode === "athlete") {
      return {
        ...common,
        name: name.trim() || athlete.name,
        startWeight: startWeight ? Number(startWeight) : athlete.startWeight,
        currentWeight: currentWeight ? Number(currentWeight) : athlete.currentWeight,
        targetWeight: targetWeight ? Number(targetWeight) : athlete.targetWeight,
        goalType,
        goalText: goalText.trim() || undefined,
        checkInDay,
      };
    }
    return { ...common, specialNotes: specialNotes.trim() || undefined, checkInDay };
  }

  function handleSave() {
    try {
      onSave(buildUpdates());
      if (mode === "athlete") {
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      showToast("Fehler beim Speichern. Bitte erneut versuchen.", "error");
    }
  }

  function handleCancel() {
    resetToAthlete(athlete);
    setEditing(false);
    setSaved(false);
  }

  // ── ATHLETE MODE ─────────────────────────────────────────────────────────────
  if (mode === "athlete") {
    const trackingLabel = athlete.trackingDevice
      ? (athlete.trackingDevice === "other" && athlete.trackingDeviceCustom
          ? athlete.trackingDeviceCustom
          : TRACKING_DEVICE_LABELS[athlete.trackingDevice])
      : undefined;

    return (
      <div className="flex flex-col gap-5">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#f0f4ff]">Meine Stammdaten</h2>
          {!editing ? (
            <button
              onClick={() => { resetToAthlete(athlete); setEditing(true); setSaved(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2d42] bg-[#141d2e] text-xs font-medium text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-all"
            >
              <Pencil size={13} /> Bearbeiten
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b82f6] text-xs font-medium text-white hover:bg-[#2563eb] transition-all"
              >
                <Check size={13} /> Speichern
              </button>
              <button onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2d42] bg-[#141d2e] text-xs font-medium text-[#8fa3c0] hover:text-[#f0f4ff] transition-all"
              >
                <X size={13} /> Abbrechen
              </button>
            </div>
          )}
        </div>

        {saved && (
          <div className="px-4 py-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-sm text-[#10b981]">
            Stammdaten wurden gespeichert.
          </div>
        )}

        {/* Profil */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
          <SectionHeader>Profil</SectionHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1d4ed8]/20 flex items-center justify-center shrink-0">
              {athlete.profileImage
                ? <img src={athlete.profileImage.url} alt={athlete.name} className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-[#60a5fa]">{athlete.avatarInitials}</span>
              }
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {editing
                ? <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vollständiger Name" className={inputCls} />
                : <p className="text-base font-semibold text-[#f0f4ff]">{athlete.name}</p>
              }
            </div>
          </div>
        </div>

        {/* Körperdaten & Ziel */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
          <SectionHeader>Körperdaten &amp; Ziel</SectionHeader>
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Körpergröße (cm)" value={height} onChange={setHeight} type="number" placeholder="z. B. 180" />
                <FieldInput label="Startgewicht (kg)" value={startWeight} onChange={setStartWeight} type="number" placeholder="z. B. 90.0" />
                <FieldInput label="Aktuelles Gewicht (kg)" value={currentWeight} onChange={setCurrentWeight} type="number" placeholder="z. B. 87.5" />
                <FieldInput label="Zielgewicht (kg)" value={targetWeight} onChange={setTargetWeight} type="number" placeholder="z. B. 80.0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#5a7090]">Ziel</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((o) => (
                    <SelBtn key={o.value} active={goalType === o.value} onClick={() => setGoalType(o.value)}>{o.label}</SelBtn>
                  ))}
                </div>
              </div>
              <FieldInput label="Zielbeschreibung (optional)" value={goalText} onChange={setGoalText} placeholder="z. B. Wettkampf Mai 2026" />
            </>
          ) : (
            <>
              <DataRow label="Körpergröße" value={athlete.height ? `${athlete.height} cm` : undefined} />
              <DataRow label="Startgewicht" value={`${athlete.startWeight} kg`} />
              <DataRow label="Aktuelles Gewicht" value={`${athlete.currentWeight} kg`} />
              <DataRow label="Zielgewicht" value={`${athlete.targetWeight} kg`} />
              <DataRow label="Ziel" value={getGoalLabel(athlete.goalType)} />
              {athlete.goalText && <DataRow label="Zielbeschreibung" value={athlete.goalText} />}
            </>
          )}
        </div>

        {/* Coachingdaten */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
          <SectionHeader>Coachingdaten</SectionHeader>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Coaching-Startdatum" value={startDate} onChange={setStartDate} type="date" />
              <FieldInput label="Wettkampfdatum (optional)" value={competitionDate} onChange={setCompetitionDate} type="date" />
            </div>
          ) : (
            <>
              <DataRow label="Coaching-Startdatum" value={formatDate(athlete.startDate)} />
              <DataRow label="Wettkampfdatum" value={formatDate(athlete.competitionDate)} />
              <DataRow label="Dabei seit" value={new Date(athlete.joinedAt).getFullYear().toString()} />
            </>
          )}
        </div>

        {/* Check-in */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
          <SectionHeader>Check-in</SectionHeader>
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#5a7090]">Check-in-Tag</label>
              <div className="flex flex-wrap gap-2">
                {CHECKIN_DAY_OPTIONS.map((o) => (
                  <SelBtn key={o.value} active={checkInDay === o.value} onClick={() => setCheckInDay(o.value)} className="min-w-[44px] text-center">
                    {o.label}
                  </SelBtn>
                ))}
              </div>
            </div>
          ) : (
            <DataRow label="Check-in-Tag" value={CHECKIN_DAY_LABELS[athlete.checkInDay]} />
          )}
        </div>

        {/* Coaching-Profil (Onboarding-Daten) */}
        {athlete.profile ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#5a7090] uppercase tracking-widest">Coaching-Profil</p>
            </div>
            <ProfileDisplaySections profile={athlete.profile} trackingDeviceLabel={trackingLabel} />
          </div>
        ) : !editing ? (
          <div className="flex flex-col gap-3">
            {trackingLabel && (
              <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
                <p className="text-xs text-[#5a7090] uppercase tracking-widest">Alltag / Tracking</p>
                <DataRow label="Trackinggerät" value={trackingLabel} />
              </div>
            )}
            <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
              <p className="text-sm text-[#5a7090]">Kein Coaching-Fragebogen ausgefüllt.</p>
            </div>
          </div>
        ) : null}

        {/* Rechtliches */}
        {!editing && <LegalSection consent={athlete.legalConsent} />}

        {editing && <FloatingSaveButton onClick={handleSave} label="Speichern" />}
      </div>
    );
  }

  // ── COACH MODE (always-edit form) ─────────────────────────────────────────────
  const coachTrackingLabel = athlete.trackingDevice
    ? (athlete.trackingDevice === "other" && athlete.trackingDeviceCustom
        ? athlete.trackingDeviceCustom
        : TRACKING_DEVICE_LABELS[athlete.trackingDevice])
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Stammdaten (coach-intern) */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Athleten-Stammdaten (Coach-intern)</p>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Körpergröße (cm)" value={height} onChange={setHeight} type="number" placeholder="z.B. 180" />
          <FieldInput label="Startdatum Coaching" value={startDate} onChange={setStartDate} type="date" />
          <FieldInput label="Wettkampfdatum (optional)" value={competitionDate} onChange={setCompetitionDate} type="date" />
        </div>
        <FieldInput label="Besonderheiten / Coach-Notizen" value={specialNotes} onChange={setSpecialNotes} placeholder="Interne Anmerkungen zum Athleten" rows={2} />
      </div>

      {/* Coaching-Fragebogen */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Coaching-Fragebogen</p>
        {athlete.profile && onSaveProfile ? (
          <ProfileEditSections profile={athlete.profile} onSave={onSaveProfile} />
        ) : athlete.profile ? (
          <ProfileDisplaySections profile={athlete.profile} trackingDeviceLabel={coachTrackingLabel} />
        ) : (
          <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
            <p className="text-sm text-[#5a7090]">Kein Coaching-Fragebogen ausgefüllt. Der Athlet muss sich über den Registrierungs-Prozess anmelden.</p>
          </div>
        )}
      </div>

      {/* Rechtliches */}
      <LegalSection consent={athlete.legalConsent} coachMode />

      <FloatingSaveButton onClick={handleSave} label="Profil speichern" />
    </div>
  );
}
