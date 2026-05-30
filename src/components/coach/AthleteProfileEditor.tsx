"use client";
import { useRef, useState } from "react";
import {
  Athlete, ExperienceLevel, TrackingDevice,
  DailyCheckConfig, DEFAULT_DAILY_CHECK_CONFIG, ProgressImage,
} from "@/types";
import { Check, X, Upload, Trash2 } from "lucide-react";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface Props {
  athlete: Athlete;
  onSave: (updates: Partial<Athlete>) => void;
}

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

const CHECK_CONFIG_LABELS: { key: keyof DailyCheckConfig; label: string }[] = [
  { key: "bodyweight", label: "Körpergewicht" },
  { key: "sleepDuration", label: "Schlafdauer" },
  { key: "sleepQuality", label: "Schlafqualität (1–10)" },
  { key: "sleepScore", label: "Schlafscore (Gerät, 0–100)" },
  { key: "steps", label: "Schritte" },
  { key: "restingHeartRate", label: "Ruheherzfrequenz" },
  { key: "hrv", label: "HRV / Herzratenvariabilität (ms)" },
  { key: "spO2", label: "Sauerstoffsättigung / SpO₂ (%)" },
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

function FieldInput({
  label, value, onChange, type = "text", placeholder, rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  rows?: number;
}) {
  const cls = "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#5a7090]">{label}</label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
          placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

export function AthleteProfileEditor({ athlete, onSave }: Props) {
  const [height, setHeight] = useState(String(athlete.height ?? ""));
  const [startDate, setStartDate] = useState(athlete.startDate ?? "");
  const [competitionDate, setCompetitionDate] = useState(athlete.competitionDate ?? "");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(athlete.experienceLevel ?? "");
  const [trainingHistory, setTrainingHistory] = useState(athlete.trainingHistory ?? "");
  const [injuries, setInjuries] = useState(athlete.injuries ?? "");
  const [specialNotes, setSpecialNotes] = useState(athlete.specialNotes ?? "");
  const [trackingDevice, setTrackingDevice] = useState<TrackingDevice | "">(athlete.trackingDevice ?? "");
  const [trackingDeviceCustom, setTrackingDeviceCustom] = useState(athlete.trackingDeviceCustom ?? "");

  const initConfig: DailyCheckConfig = { ...DEFAULT_DAILY_CHECK_CONFIG, ...athlete.dailyCheckConfig };
  const [checkConfig, setCheckConfig] = useState<DailyCheckConfig>(initConfig);

  // Profile image state
  const [profileImage, setProfileImage] = useState<ProgressImage | undefined>(athlete.profileImage);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageFile(file: File) {
    setImageError("");
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Nur JPG, PNG und WebP Dateien erlaubt.");
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setImageError("Maximale Dateigröße: 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setProfileImage({
        id: `pf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        url,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setProfileImage(undefined);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleConfig(key: keyof DailyCheckConfig) {
    setCheckConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    onSave({
      profileImage,
      height: height ? Number(height) : undefined,
      startDate: startDate || undefined,
      competitionDate: competitionDate || undefined,
      experienceLevel: (experienceLevel as ExperienceLevel) || undefined,
      trainingHistory: trainingHistory || undefined,
      injuries: injuries || undefined,
      specialNotes: specialNotes || undefined,
      trackingDevice: (trackingDevice as TrackingDevice) || undefined,
      trackingDeviceCustom: trackingDeviceCustom || undefined,
      dailyCheckConfig: checkConfig,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Profile image */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-4">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Profilbild</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1d4ed8]/20 flex items-center justify-center shrink-0">
            {profileImage ? (
              <img src={profileImage.url} alt="Profilbild" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[#60a5fa]">{athlete.avatarInitials}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-[#1e2d42] bg-[#0f1624] text-xs text-[#8fa3c0] hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-all flex items-center gap-2 justify-center"
            >
              <Upload size={13} />
              {profileImage ? "Bild ändern" : "Bild hochladen"}
            </button>
            {profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-3 py-2 rounded-xl border border-[#ef4444]/20 bg-transparent text-xs text-[#ef4444]/70 hover:border-[#ef4444]/40 hover:text-[#ef4444] transition-all flex items-center gap-2 justify-center"
              >
                <Trash2 size={13} />
                Bild entfernen
              </button>
            )}
            <p className="text-[10px] text-[#3b4d6a]">JPG, PNG, WebP · max. 5 MB</p>
          </div>
        </div>
        {imageError && <p className="text-xs text-[#ef4444]">{imageError}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); e.target.value = ""; }}
          className="hidden"
        />
      </div>

      {/* Basic athlete data */}
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
              <button
                key={o.value}
                type="button"
                onClick={() => setExperienceLevel(o.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  experienceLevel === o.value
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <FieldInput label="Trainingshistorie" value={trainingHistory} onChange={setTrainingHistory} placeholder="z.B. 5 Jahre Kraftsport, früher Fußball" rows={2} />
        <FieldInput label="Verletzungen / Einschränkungen" value={injuries} onChange={setInjuries} placeholder="z.B. linkes Knie, keine tiefen Kniebeugen" rows={2} />
        <FieldInput label="Besonderheiten / Coach-Notizen" value={specialNotes} onChange={setSpecialNotes} placeholder="Interne Anmerkungen zum Athleten" rows={2} />
      </div>

      {/* Tracking device */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Trackinggerät</p>
        <div className="grid grid-cols-2 gap-2">
          {TRACKING_DEVICE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setTrackingDevice(o.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                trackingDevice === o.value
                  ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#60a5fa]"
                  : "bg-[#0f1624] border-[#1e2d42] text-[#8fa3c0]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {trackingDevice === "other" && (
          <FieldInput label="Gerät angeben" value={trackingDeviceCustom} onChange={setTrackingDeviceCustom} placeholder="z.B. Polar Vantage" />
        )}
      </div>

      {/* Daily check-in config */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42] flex flex-col gap-3">
        <p className="text-xs text-[#5a7090] uppercase tracking-widest">Daily Check-in Felder</p>
        <p className="text-xs text-[#5a7090]">Welche Daten soll dieser Athlet täglich tracken?</p>
        <div className="flex flex-col gap-2">
          {CHECK_CONFIG_LABELS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-1.5 border-b border-[#1e2d42]/60 last:border-0"
            >
              <span className="text-sm text-[#8fa3c0]">{label}</span>
              <button
                type="button"
                onClick={() => toggleConfig(key)}
                className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${
                  checkConfig[key] ? "bg-[#3b82f6]" : "bg-[#1e2d42]"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  checkConfig[key] ? "left-5" : "left-0.5"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2"
      >
        <Check size={15} /> Profil speichern
      </button>
    </div>
  );
}
