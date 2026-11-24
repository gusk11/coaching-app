"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Eye, Images, Pencil, Send } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { showToast } from "@/components/ui/Toast";
import { PhotoComparison, PhotoPairViewer } from "@/components/coach/PhotoComparison";
import { ProgressAnalytics } from "@/components/coach/ProgressAnalytics";
import { SeasonPlanEditor } from "@/components/coach/SeasonPlanEditor";
import { GeneralPlansView } from "@/components/coach/GeneralPlansView";
import { DailyCheckDetailBody } from "@/components/coach/DailyCheckDetailModal";
import { WeeklyCheckDetailBody } from "@/components/coach/WeeklyCheckDetailModal";
import { addVideoFeedback, loadAthletes, loadAuth, setCheckInDone, updateAthlete } from "@/lib/store";
import { useAutosave } from "@/lib/useAutosave";
import { usePlanHandlers } from "@/lib/usePlanHandlers";
import { cn, getCheckInWeekStart, todayISO } from "@/lib/utils";
import { Athlete } from "@/types";

const fmtDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function CheckInWorkspacePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const date = useSearchParams().get("date") ?? todayISO();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [photoDates, setPhotoDates] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);
  const planHandlers = usePlanHandlers(athlete, setAthlete);

  useEffect(() => {
    if (loadAuth().role !== "coach") { router.replace("/login"); return; }
    loadAthletes().then((all) => {
      const found = all.find((a) => a.id === id);
      if (!found) { router.replace("/coach/dashboard"); return; }
      setAthlete(found);
    });
  }, [router, id]);

  const weekStart = athlete ? getCheckInWeekStart(date, athlete.checkInDay) : date;
  const weekly = useMemo(
    () => athlete?.weeklyCheckIns.find((w) => w.weekStart === weekStart) ?? athlete?.weeklyCheckIns.find((w) => w.date === date),
    [athlete, weekStart, date]
  );

  async function finish() {
    if (!athlete || finishing) return;
    setFinishing(true);
    try {
      await setCheckInDone(athlete, date, true);
      showToast("Check-in als erledigt markiert.", "success");
      router.push("/coach/dashboard");
    } catch {
      showToast("Check-in konnte nicht abgeschlossen werden.", "error");
      setFinishing(false);
    }
  }

  if (!athlete) {
    return (
      <AppShell role="coach">
        <LoadingScreen />
      </AppShell>
    );
  }

  const finishButton = (
    <button
      onClick={finish}
      disabled={finishing}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-black text-sm font-semibold"
    >
      <Check size={16} strokeWidth={3} /> Weekly Check beendet
    </button>
  );

  return (
    <AppShell role="coach">
      <div className="flex flex-col gap-4">
        {/* 1: athlete left, notes right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <div className="rounded-2xl bg-[#0d1526] border border-[#1e2d42] p-4 flex flex-col justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/coach/dashboard")} aria-label="Zurück" className="p-2 rounded-xl text-[#8fa3c0] hover:text-[#f0f4ff] hover:bg-[#141d2e]">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-[#f0f4ff]">{athlete.name}</h1>
                <p className="text-xs text-[#60a5fa]">Check-in Woche {fmtDate(weekStart)} – {fmtDate(date)}</p>
              </div>
            </div>
            <div className="flex justify-end">{finishButton}</div>
          </div>
          <NotesPanel athlete={athlete} onSaved={setAthlete} />
        </div>

        {/* 2: comparison photos */}
        <PhotosPanel athleteId={athlete.id} onDatesChange={setPhotoDates} />

        {/* 3: weekly left (open), daily right (sections collapsed) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <Panel title="Weekly Check-in">
            {weekly
              ? <WeeklyCheckDetailBody ci={weekly} />
              : <p className="text-sm text-[#5a7090]">Für diese Woche wurde noch kein Weekly Check-in eingereicht.</p>}
          </Panel>
          <Panel title="Daily Check-ins">
            <DailyPanel athlete={athlete} from={weekStart} to={date} />
          </Panel>
        </div>

        {/* 4: analysis */}
        <Panel title="Datenanalyse">
          <ProgressAnalytics checkIns={athlete.dailyCheckIns} seasonPlan={athlete.seasonPlan} markerDates={photoDates} />
        </Panel>

        {/* 5: secondary tools, collapsed where less important */}
        <Panel title="Video-Feedback">
          <VideoPanel athlete={athlete} weekLabel={fmtDate(date)} weeklyId={weekly?.id} />
        </Panel>
        <Panel title="Jahresplan" defaultOpen={false}>
          <SeasonPlanEditor athlete={athlete} />
        </Panel>
        <Panel title="Pläne" defaultOpen={false}>
          <GeneralPlansView athlete={athlete} {...planHandlers} />
        </Panel>

        <div className="flex justify-end pt-2 pb-6">{finishButton}</div>
      </div>
    </AppShell>
  );
}

/** Window with a title bar that folds it open/closed; closed content is not mounted. */
function Panel({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl bg-[#0d1526] border border-[#1e2d42] flex flex-col min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn("flex items-center justify-between px-4 py-3 text-left", open && "border-b border-[#1e2d42]")}
      >
        <span className="text-xs text-[#8fa3c0] uppercase tracking-widest">{title}</span>
        <ChevronDown size={16} className={cn("text-[#5a7090] transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="p-4 min-w-0">{children}</div>}
    </section>
  );
}

function NotesPanel({ athlete, onSaved }: { athlete: Athlete; onSaved: (a: Athlete) => void }) {
  const [text, setText] = useState(athlete.coachNote ?? "");
  const save = useCallback(async (value: string) => {
    const rows = await updateAthlete(athlete.id, { coachNote: value });
    const fresh = rows.find((a) => a.id === athlete.id);
    if (fresh) onSaved(fresh);
  }, [athlete.id, onSaved]);
  const { status } = useAutosave({ value: text, save, isValid: true });
  return (
    <section className="rounded-2xl bg-[#0d1526] border border-[#1e2d42] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#8fa3c0] uppercase tracking-widest">Notizen</p>
        <span className="text-[10px] text-[#5a7090]">
          {status === "saving" ? "Speichert…" : status === "saved" ? "Gespeichert" : status === "error" ? "Fehler beim Speichern" : "intern"}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="z. B. WhatsApp-Nachrichten hier reinkopieren…"
        className="flex-1 min-h-[140px] bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6] resize-y"
      />
    </section>
  );
}

function PhotosPanel({ athleteId, onDatesChange }: { athleteId: string; onDatesChange: (d: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <section className="rounded-2xl bg-[#0d1526] border border-[#1e2d42] p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs text-[#8fa3c0] uppercase tracking-widest"><Images size={14} /> Vergleichsbilder</p>
        <button
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs bg-[#141d2e] border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
        >
          {editing ? <><Eye size={12} /> Ansehen</> : <><Pencil size={12} /> Bilder hinzufügen / ordnen</>}
        </button>
      </div>
      {/* Only one is mounted at a time, so both always read the current photos from the browser store. */}
      {editing
        ? <PhotoComparison athleteId={athleteId} onDatesChange={onDatesChange} />
        : <PhotoPairViewer athleteId={athleteId} onDatesChange={onDatesChange} />}
    </section>
  );
}

function DailyPanel({ athlete, from, to }: { athlete: Athlete; from: string; to: string }) {
  const days = useMemo(
    () => athlete.dailyCheckIns.filter((c) => c.date >= from && c.date <= to).sort((a, b) => a.date.localeCompare(b.date)),
    [athlete.dailyCheckIns, from, to]
  );
  const [selected, setSelected] = useState<string | null>(null);
  const ci = days.find((d) => d.date === selected) ?? days[days.length - 1];
  if (!ci) return <p className="text-sm text-[#5a7090]">Keine Daily Check-ins in dieser Woche.</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 flex-wrap">
        {days.map((d) => (
          <button
            key={d.date}
            onClick={() => setSelected(d.date)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              d.date === ci.date ? "bg-[#3b82f6] text-white" : "bg-[#0f1624] border border-[#1e2d42] text-[#8fa3c0] hover:text-[#f0f4ff]"
            )}
          >
            {new Date(d.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
          </button>
        ))}
      </div>
      <DailyCheckDetailBody key={ci.date} ci={ci} athlete={athlete} collapsible />
    </div>
  );
}

function VideoPanel({ athlete, weekLabel, weeklyId }: { athlete: Athlete; weekLabel: string; weeklyId?: string }) {
  const [title, setTitle] = useState(`Check-in Woche ${weekLabel}`);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try { new URL(url.trim()); } catch { showToast("Bitte eine gültige URL eingeben.", "error"); return; }
    if (!title.trim()) { showToast("Titel darf nicht leer sein.", "error"); return; }
    setSaving(true);
    try {
      await addVideoFeedback({
        athleteId: athlete.id,
        title: title.trim(),
        date: todayISO(),
        loomUrl: url.trim(),
        category: "checkin",
        linkedWeeklyCheckInId: weeklyId,
      });
      setSent(true);
      setUrl("");
      showToast("Video Feedback gespeichert.", "success");
    } catch (err) {
      showToast(`Fehler beim Speichern: ${err instanceof Error ? err.message : "unbekannt"}`, "error");
    } finally {
      setSaving(false);
    }
  }

  const input = "bg-[#0f1624] border border-[#1e2d42] rounded-lg px-3 py-2 text-sm text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]";
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-xs text-[#5a7090]">
        Für {athlete.name} · Kategorie Check-in{weeklyId ? " · mit dem Weekly Check-in dieser Woche verknüpft" : ""}
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[#5a7090]">Titel</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[#5a7090]">Video-Link (Loom o. ä.)</span>
        <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setSent(false); }} placeholder="https://www.loom.com/share/…" className={input} />
      </label>
      <div className="flex items-center justify-end gap-3">
        {sent && <span className="text-xs text-[#10b981]">Gesendet ✓</span>}
        <button
          type="submit"
          disabled={saving || !url.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1e2d42] disabled:text-[#5a7090] text-white text-xs font-medium"
        >
          <Send size={12} /> Feedback speichern
        </button>
      </div>
    </form>
  );
}
