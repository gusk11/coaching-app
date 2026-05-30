"use client";
import { useRef, useState } from "react";
import {
  Athlete, DailyCheckConfig, DEFAULT_DAILY_CHECK_CONFIG,
  ExperienceLevel, GoalType, ProgressImage, TrackingDevice,
} from "@/types";
import { cn, getGoalLabel } from "@/lib/utils";
import { Upload, Trash2, Pencil, Check, X } from "lucide-react";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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

function CheckConfigToggles({ config, onToggle }: {
  config: DailyCheckConfig; onToggle: (key: keyof DailyCheckConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {CHECK_CONFIG_LABELS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between py-1.5 border-b border-[#1e2d42]/60 last:border-0">
          <span className="text-sm text-[#8fa3c0]">{label}</span>
          <button type="button" onClick={() => onToggle(key)}
            className={cn("w-10 h-5 rounded-full transition-all relative shrink-0", config[key] ? "bg-[#3b82f6]" : "bg-[#1e2d42]")}
          >
            <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", config[key] ? "left-5" : "left-0.5")} />
          </button>
        </div>
      ))}
    </div>
  );
}

interface Props {
  athlete: Athlete;
  /** "athlete" = view/edit toggle, no coach-only fields.
   *  "coach"   = always-edit form, includes specialNotes, no weight/goal/checkInDay fields. */
  mode: "coach" | "athlete";
  onSave: (updates: Partial<Athlete>) => void;
}

export function AthleteStammdatenForm({ athlete, mode, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile image
  const [profileImage, setProfileImage] = useState<ProgressImage | undefined>(athlete.profileImage);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared fields
  const [height, setHeight] = useState(String(athlete.height ?? ""));
  const [startDate, setStartDate] = useState(athlete.startDate ?? "");
  const [competitionDate, setCompetitionDate] = useState(athlete.competitionDate ?? "");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(athlete.experienceLevel ?? "");
  const [injuries, setInjuries] = useState(athlete.injuries ?? "");
  const [trainingHistory, setTrainingHistory] = useState(athlete.trainingHistory ?? "");
  const [trackingDevice, setTrackingDevice] = useState<TrackingDevice | "">(athlete.trackingDevice ?? "");
  const [trackingDeviceCustom, setTrackingDeviceCustom] = useState(athlete.trackingDeviceCustom ?? "");
  const [checkConfig, setCheckConfig] = useState<DailyCheckConfig>({ ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig });

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
    setProfileImage(a.profileImage);
    setHeight(String(a.height ?? ""));
    setStartDate(a.startDate ?? "");
    setCompetitionDate(a.competitionDate ?? "");
    setExperienceLevel(a.experienceLevel ?? "");
    setInjuries(a.injuries ?? "");
    setTrainingHistory(a.trainingHistory ?? "");
    setTrackingDevice(a.trackingDevice ?? "");
    setTrackingDeviceCustom(a.trackingDeviceCustom ?? "");
    setCheckConfig({ ...DEFAULT_DAILY_CHECK_CONFIG, ...a.dailyCheckConfig });
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
      profileImage,
      height: height ? Number(height) : undefined,
      startDate: startDate || undefined,
      competitionDate: competitionDate || undefined,
      experienceLevel: (experienceLevel as ExperienceLevel) || undefined,
      trainingHistory: trainingHistory.trim() || undefined,
      injuries: injuries.trim() || undefined,
      trackingDevice: (trackingDevice as TrackingDevice) || undefined,
      trackingDeviceCustom: trackingDeviceCustom.trim() || undefined,
      dailyCheckConfig: checkConfig,
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
    return { ...common, specialNotes: specialNotes.trim() || undefined };
  }

  function handleSave() {
    onSave(buildUpdates());
    if (mode === "athlete") {
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  function handleCancel() {
    resetToAthlete(athlete);
    setEditing(false);
    setSaved(false);
  }

  function handleImageFile(file: File) {
    setImageError("");
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) { setImageError("Nur JPG, PNG und WebP Dateien erlaubt."); return; }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) { setImageError("Maximale Dateigröße: 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img: ProgressImage = {
        id: `pf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name, url,
        uploadedAt: new Date().toISOString(), size: file.size, type: file.type,
      };
      setProfileImage(img);
      if (mode === "athlete") onSave({ profileImage: img });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setProfileImage(undefined);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (mode === "athlete") onSave({ profileImage: undefined });
  }

  function toggleConfig(key: keyof DailyCheckConfig) {
    setCheckConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const imageFileInput = (
    <input ref={fileInputRef} type="file"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); e.target.value = ""; }}
      className="hidden" />
  );

  const imageButtons = (
    <>
      <button type="button" onClick={() => fileInputRef.current?.click()}
        className="px-3 py-2 rounded-xl border border-[#1e2d42] bg-[#0f1624] text-xs text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-all flex items-center gap-2 justify-center"
      >
        <Upload size={13} />
        {profileImage ? "Bild ändern" : "Bild hochladen"}
      </button>
      {profileImage && (
        <button type="button" onClick={handleRemoveImage}
          className="px-3 py-2 rounded-xl border border-[#ef4444]/20 bg-transparent text-xs text-[#ef4444]/70 hover:border-[#ef4444]/40 hover:text-[#ef4444] transition-all flex items-center gap-2 justify-center"
        >
          <Trash2 size={13} /> Bild entfernen
        </button>
      )}
      <p className="text-[10px] text-[#3b4d6a]">JPG, PNG, WebP · max. 5 MB</p>
    </>
  );

  // ── ATHLETE MODE ─────────────────────────────────────────────────────────────
  if (mode === "athlete") {
    const effectiveConfig = { ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig };
    const activeCheckFields = CHECK_CONFIG_LABELS.filter(({ key }) => effectiveConfig[key]);
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
              {profileImage
                ? <img src={profileImage.url} alt={athlete.name} className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-[#60a5fa]">{athlete.avatarInitials}</span>
              }
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {editing
                ? <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vollständiger Name" className={inputCls} />
                : <p className="text-base font-semibold text-[#f0f4ff]">{athlete.name}</p>
              }
              {imageButtons}
            </div>
          </div>
          {imageError && <p className="text-xs text-[#ef4444]">{imageError}</p>}
          {imageFileInput}
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#5a7090]">Erfahrungslevel</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <SelBtn key={o.value} active={experienceLevel === o.value} onClick={() => setExperienceLevel(o.value)}>{o.label}</SelBtn>
                  ))}
                </div>
              </div>
              <FieldInput label="Verletzungen / Einschränkungen" value={injuries} onChange={setInjuries} placeholder="z. B. linkes Knie, keine tiefen Kniebeugen" rows={2} />
              <FieldInput label="Trainingshistorie" value={trainingHistory} onChange={setTrainingHistory} placeholder="z. B. 5 Jahre Kraftsport, früher Fußball" rows={2} />
            </>
          ) : (
            <>
              <DataRow label="Körpergröße" value={athlete.height ? `${athlete.height} cm` : undefined} />
              <DataRow label="Startgewicht" value={`${athlete.startWeight} kg`} />
              <DataRow label="Aktuelles Gewicht" value={`${athlete.currentWeight} kg`} />
              <DataRow label="Zielgewicht" value={`${athlete.targetWeight} kg`} />
              <DataRow label="Ziel" value={getGoalLabel(athlete.goalType)} />
              {athlete.goalText && <DataRow label="Zielbeschreibung" value={athlete.goalText} />}
              <DataRow label="Erfahrungslevel" value={athlete.experienceLevel ? EXPERIENCE_LABELS[athlete.experienceLevel] : undefined} />
              {athlete.injuries && <DataRow label="Verletzungen / Einschränkungen" value={athlete.injuries} />}
              {athlete.trainingHistory && <DataRow label="Trainingshistorie" value={athlete.trainingHistory} />}
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

        {/* Tracking */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
          <SectionHeader>Tracking</SectionHeader>
          {editing ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#5a7090]">Trackinggerät</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRACKING_DEVICE_OPTIONS.map((o) => (
                    <SelBtn key={o.value} active={trackingDevice === o.value} onClick={() => setTrackingDevice(o.value)}>{o.label}</SelBtn>
                  ))}
                </div>
                {trackingDevice === "other" && (
                  <div className="mt-1">
                    <FieldInput label="Gerät angeben" value={trackingDeviceCustom} onChange={setTrackingDeviceCustom} placeholder="z. B. Polar Vantage" />
                  </div>
                )}
              </div>
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
            </>
          ) : (
            <>
              <DataRow label="Trackinggerät" value={trackingLabel} />
              <DataRow label="Check-in-Tag" value={CHECKIN_DAY_LABELS[athlete.checkInDay]} />
            </>
          )}
        </div>

        {/* Daily Check-in Felder */}
        <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
          <SectionHeader>Daily Check-in Felder</SectionHeader>
          {editing ? (
            <CheckConfigToggles config={checkConfig} onToggle={toggleConfig} />
          ) : activeCheckFields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeCheckFields.map(({ label }) => (
                <span key={label} className="px-2.5 py-1 rounded-lg bg-[#1e2d42] text-xs text-[#8fa3c0] border border-[#2a3d58]">
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5a7090]">Keine Felder aktiv.</p>
          )}
        </div>

        {/* Bottom save/cancel */}
        {editing && (
          <div className="flex gap-3">
            <button type="button" onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
            >
              <Check size={15} /> Speichern
            </button>
            <button type="button" onClick={handleCancel}
              className="px-6 py-3 rounded-xl border border-[#1e2d42] text-[#8fa3c0] font-semibold text-sm hover:bg-[#141d2e] transition-colors"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── COACH MODE (always-edit form) ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Profilbild */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Profilbild</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1d4ed8]/20 flex items-center justify-center shrink-0">
            {profileImage
              ? <img src={profileImage.url} alt="Profilbild" className="w-full h-full object-cover" />
              : <span className="text-xl font-bold text-[#60a5fa]">{athlete.avatarInitials}</span>
            }
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {imageButtons}
          </div>
        </div>
        {imageError && <p className="text-xs text-[#ef4444]">{imageError}</p>}
        {imageFileInput}
      </div>

      {/* Stammdaten (coach-intern) */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Athleten-Stammdaten (Coach-intern)</p>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Körpergröße (cm)" value={height} onChange={setHeight} type="number" placeholder="z.B. 180" />
          <FieldInput label="Startdatum Coaching" value={startDate} onChange={setStartDate} type="date" />
          <FieldInput label="Wettkampfdatum (optional)" value={competitionDate} onChange={setCompetitionDate} type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#5a7090]">Erfahrungslevel</label>
          <div className="grid grid-cols-2 gap-2">
            {EXPERIENCE_OPTIONS.map((o) => (
              <SelBtn key={o.value} active={experienceLevel === o.value} onClick={() => setExperienceLevel(o.value)}>{o.label}</SelBtn>
            ))}
          </div>
        </div>
        <FieldInput label="Trainingshistorie" value={trainingHistory} onChange={setTrainingHistory} placeholder="z.B. 5 Jahre Kraftsport, früher Fußball" rows={2} />
        <FieldInput label="Verletzungen / Einschränkungen" value={injuries} onChange={setInjuries} placeholder="z.B. linkes Knie, keine tiefen Kniebeugen" rows={2} />
        <FieldInput label="Besonderheiten / Coach-Notizen" value={specialNotes} onChange={setSpecialNotes} placeholder="Interne Anmerkungen zum Athleten" rows={2} />
      </div>

      {/* Trackinggerät */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Trackinggerät</p>
        <div className="grid grid-cols-2 gap-2">
          {TRACKING_DEVICE_OPTIONS.map((o) => (
            <SelBtn key={o.value} active={trackingDevice === o.value} onClick={() => setTrackingDevice(o.value)}>{o.label}</SelBtn>
          ))}
        </div>
        {trackingDevice === "other" && (
          <FieldInput label="Gerät angeben" value={trackingDeviceCustom} onChange={setTrackingDeviceCustom} placeholder="z.B. Polar Vantage" />
        )}
      </div>

      {/* Daily Check-in Felder */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Daily Check-in Felder</p>
        <p className="text-xs text-[#5a7090]">Welche Daten soll dieser Athlet täglich tracken?</p>
        <CheckConfigToggles config={checkConfig} onToggle={toggleConfig} />
      </div>

      <button type="button" onClick={handleSave}
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
      >
        <Check size={15} /> Profil speichern
      </button>
    </div>
  );
}
