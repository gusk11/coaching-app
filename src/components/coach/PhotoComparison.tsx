"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, X } from "lucide-react";

export type Side = "left" | "right";
export type ComparePhoto = { id: string; blob: Blob; date: string; side?: Side };

// shortcut: photos live only in this browser's IndexedDB (no upload), move to Supabase storage if they must sync across devices.
const DB_NAME = "coachPhotoCompare";
const STORE = "photos";

function withStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = fn(open.result.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
  });
}

/** Older photos had no side: they were stored as consecutive pairs (even = left, odd = right). */
export function withSides(photos: ComparePhoto[]): ComparePhoto[] {
  return photos.map((p, i) => (p.side ? p : { ...p, side: i % 2 === 0 ? "left" : "right" }));
}

export const loadPhotos = (athleteId: string) =>
  withStore<ComparePhoto[] | undefined>("readonly", (s) => s.get(athleteId)).then((v) => withSides(v ?? []));
const savePhotos = (athleteId: string, photos: ComparePhoto[]) =>
  withStore("readwrite", (s) => s.put(photos, athleteId));

/** Row i of the comparison = i-th left photo next to i-th right photo. */
export function pairsOf(photos: ComparePhoto[]): [ComparePhoto | undefined, ComparePhoto | undefined][] {
  const left = photos.filter((p) => p.side === "left");
  const right = photos.filter((p) => p.side === "right");
  return Array.from({ length: Math.max(left.length, right.length) }, (_, i) => [left[i], right[i]]);
}

/** Moves a photo to `side`, before `beforeId` (null = end of that side). */
export function movePhoto(photos: ComparePhoto[], id: string, side: Side, beforeId: string | null): ComparePhoto[] {
  const moving = photos.find((p) => p.id === id);
  if (!moving || id === beforeId) return photos;
  const rest = photos.filter((p) => p.id !== id);
  const at = beforeId ? rest.findIndex((p) => p.id === beforeId) : -1;
  rest.splice(at === -1 ? rest.length : at, 0, { ...moving, side });
  return rest;
}

function isoWeek(iso: string): number {
  const d = new Date(iso + "T12:00:00Z");
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}
/** Photos belong to a week; it is stored as the ISO date of that week's Monday. */
export function mondayOf(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dm = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
const fmt = (iso: string) => {
  if (!iso) return "ohne Woche";
  const mon = mondayOf(iso);
  return `KW ${isoWeek(mon)} · ${dm(mon)}–${dm(addDays(mon, 6))}${addDays(mon, 6).slice(0, 4)}`;
};
const thisMonday = () => mondayOf(new Date().toISOString().slice(0, 10));

/** Week dropdown: this week and the 103 weeks before it. */
function WeekSelect({ value, onChange, label, className }: { value: string; onChange: (monday: string) => void; label: string; className?: string }) {
  const weeks = useMemo(() => Array.from({ length: 104 }, (_, i) => addDays(thisMonday(), -7 * i)), []);
  const current = value ? mondayOf(value) : "";
  return (
    <select value={current} onChange={(e) => onChange(e.target.value)} aria-label={label} className={`[color-scheme:dark] ${className ?? ""}`}>
      {!current && <option value="">ohne Woche</option>}
      {current && !weeks.includes(current) && <option value={current}>{fmt(current)}</option>}
      {weeks.map((w, i) => (
        <option key={w} value={w}>{i === 0 ? "Diese Woche · " : i === 1 ? "Letzte Woche · " : ""}{fmt(w)}</option>
      ))}
    </select>
  );
}

// One object URL per image blob, reused across re-renders and reorders so the browser never re-decodes the photos.
const urlCache = new WeakMap<Blob, string>();
function urlFor(blob: Blob): string {
  let url = urlCache.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    urlCache.set(blob, url);
  }
  return url;
}
function releaseUrl(blob: Blob) {
  const url = urlCache.get(blob);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(blob);
  }
}

/** Frees the image URLs this component showed once it unmounts. */
function useReleaseOnUnmount(photos: ComparePhoto[]) {
  const [owned] = useState(() => new Set<Blob>());
  useEffect(() => { photos.forEach((p) => owned.add(p.blob)); }, [photos, owned]);
  useEffect(() => () => owned.forEach(releaseUrl), [owned]);
}

/** Calls onDatesChange only when the set of weeks changes, not on every reorder. */
function useReportDates(photos: ComparePhoto[], onDatesChange?: (dates: string[]) => void) {
  const key = photos.map((p) => p.date).filter(Boolean).sort().join(",");
  useEffect(() => { onDatesChange?.(key ? key.split(",") : []); }, [key, onDatesChange]);
}

interface Props {
  athleteId: string;
  /** Called with the ISO dates of all dated photos, for chart markers. */
  onDatesChange?: (dates: string[]) => void;
}

/** Compact editor: per side pick a week, add a batch of photos, then drag the small tiles into order. */
export function PhotoComparison({ athleteId, onDatesChange }: Props) {
  const [photos, setPhotos] = useState<ComparePhoto[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loaded = loadedFor === athleteId;
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos(athleteId).then(setPhotos).catch(() => setPhotos([])).finally(() => setLoadedFor(athleteId));
  }, [athleteId]);

  useEffect(() => {
    if (!loaded) return;
    savePhotos(athleteId, photos).catch((e) => console.error("Fotos konnten nicht gespeichert werden", e));
  }, [photos, loaded, athleteId]);
  useReportDates(loaded ? photos : [], onDatesChange);
  useReleaseOnUnmount(photos);

  function addFiles(files: FileList | null, side: Side, date: string) {
    const imgs = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setPhotos((prev) => [...prev, ...imgs.map((blob) => ({ id: crypto.randomUUID(), blob, date, side }))]);
  }

  function clearAll() {
    if (photos.length && confirm(`Alle ${photos.length} Vergleichsbilder dieses Athleten aus diesem Browser löschen? Das lässt sich nicht rückgängig machen.`)) {
      photos.forEach((p) => releaseUrl(p.blob));
      setPhotos([]);
    }
  }

  const column = (side: Side) => (
    <PhotoColumn
      side={side}
      photos={photos.filter((p) => p.side === side)}
      dragId={dragId}
      setDragId={setDragId}
      onAdd={(files, date) => addFiles(files, side, date)}
      onMove={(id, beforeId) => setPhotos((prev) => movePhoto(prev, id, side, beforeId))}
      onDate={(id, date) => setPhotos((prev) => prev.map((x) => (x.id === id ? { ...x, date } : x)))}
      onRemove={(id) => {
        const gone = photos.find((x) => x.id === id);
        if (gone) releaseUrl(gone.blob);
        setPhotos((prev) => prev.filter((x) => x.id !== id));
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {column("left")}
        {column("right")}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-[#5a7090]">
          Zeile für Zeile wird links mit rechts verglichen. Kacheln ziehen zum Sortieren, auch auf die andere Seite. Nur in diesem Browser gespeichert.
        </p>
        {photos.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10"
          >
            <Trash2 size={12} /> Alle löschen
          </button>
        )}
      </div>
    </div>
  );
}

function PhotoColumn({ side, photos, dragId, setDragId, onAdd, onMove, onDate, onRemove }: {
  side: Side;
  photos: ComparePhoto[];
  dragId: string | null;
  setDragId: (id: string | null) => void;
  onAdd: (files: FileList | null, date: string) => void;
  onMove: (id: string, beforeId: string | null) => void;
  onDate: (id: string, date: string) => void;
  onRemove: (id: string) => void;
}) {
  // Left = last week (before), right = this week (now).
  const [date, setDate] = useState(() => (side === "left" ? addDays(thisMonday(), -7) : thisMonday()));
  const [fileOver, setFileOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFiles = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");

  return (
    <div
      onDragOver={(e) => { if (dragId || isFiles(e)) { e.preventDefault(); setFileOver(isFiles(e)); } }}
      onDragLeave={() => setFileOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setFileOver(false);
        if (isFiles(e)) onAdd(e.dataTransfer.files, date);
        else if (dragId) { onMove(dragId, null); setDragId(null); }
      }}
      className={`flex flex-col gap-2 rounded-xl border border-dashed p-2 min-w-0 transition-colors ${fileOver ? "border-[#3b82f6] bg-[#3b82f6]/5" : "border-[#1e2d42]"}`}
    >
      <p className="text-[10px] text-[#5a7090] uppercase tracking-widest">{side === "left" ? "Links" : "Rechts"}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <WeekSelect
          value={date}
          onChange={setDate}
          label={`Woche für neue Bilder ${side === "left" ? "links" : "rechts"}`}
          className="min-w-0 flex-1 bg-[#141d2e] border border-[#1e2d42] rounded-lg px-2 py-1 text-xs text-[#f0f4ff] focus:outline-none focus:border-[#3b82f6]"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa] text-xs hover:bg-[#3b82f6]/20"
        >
          <ImagePlus size={12} /> Bilder hinzufügen
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onAdd(e.target.files, date); e.target.value = ""; }} />
      </div>

      {photos.map((p, i) => (
        <div
          key={p.id}
          draggable
          onDragStart={(e) => { e.stopPropagation(); setDragId(p.id); }}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => { if (dragId) { e.preventDefault(); e.stopPropagation(); } }}
          onDrop={(e) => {
            if (!dragId) return;
            e.preventDefault();
            e.stopPropagation();
            onMove(dragId, p.id);
            setDragId(null);
          }}
          className={`flex items-center gap-2 rounded-lg bg-[#0f1624] border p-1 cursor-grab active:cursor-grabbing ${dragId === p.id ? "border-[#3b82f6] opacity-50" : "border-[#1e2d42]"}`}
        >
          <span className="w-4 text-center text-[10px] text-[#5a7090]">{i + 1}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlFor(p.blob)} alt={fmt(p.date)} draggable={false} decoding="async" className="w-12 h-12 object-cover rounded-md shrink-0" />
          <WeekSelect
            value={p.date}
            onChange={(w) => onDate(p.id, w)}
            label="Woche des Bildes"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-[#8fa3c0] focus:outline-none"
          />
          <button type="button" onClick={() => onRemove(p.id)} aria-label="Bild entfernen" className="p-1 rounded text-[#5a7090] hover:text-[#ef4444]">
            <X size={12} />
          </button>
        </div>
      ))}
      {photos.length === 0 && <p className="text-[11px] text-[#5a7090] text-center py-3">Bilder hierher ziehen</p>}
    </div>
  );
}

/** Large read-only view of the photo pairs, flipping through them with arrows or ←/→ keys. */
export function PhotoPairViewer({ athleteId, onDatesChange }: Props) {
  const [photos, setPhotos] = useState<ComparePhoto[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    loadPhotos(athleteId).then(setPhotos).catch(() => setPhotos([]));
  }, [athleteId]);
  useReportDates(photos, onDatesChange);
  useReleaseOnUnmount(photos);
  const pairs = useMemo(() => pairsOf(photos), [photos]);
  const count = pairs.length;

  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (count === 0) {
    return <p className="text-sm text-[#5a7090] text-center py-10">Noch keine Vergleichsbilder. Über „Bilder hinzufügen / ordnen“ anlegen.</p>;
  }
  const current = index % count;
  const go = (d: number) => setIndex((i) => (i + d + count) % count);

  return (
    <div className="flex items-center gap-2">
      {count > 1 && (
        <button type="button" onClick={() => go(-1)} aria-label="Vorheriges Paar" className="p-2 rounded-xl text-[#8fa3c0] hover:text-[#f0f4ff] hover:bg-[#1e2d42]">
          <ChevronLeft size={22} />
        </button>
      )}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="grid grid-cols-2 gap-3">
          {pairs[current].map((p, i) => (
            <figure key={p?.id ?? i} className="flex flex-col gap-1.5">
              {p ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urlFor(p.blob)} alt={`Foto ${fmt(p.date)}`} className="w-full h-[55vh] object-contain rounded-xl bg-[#0f1624]" />
              ) : (
                <div className="w-full h-[55vh] rounded-xl bg-[#0f1624] flex items-center justify-center text-xs text-[#5a7090]">kein Bild</div>
              )}
              <figcaption className="text-xs text-[#8fa3c0] text-center">{p ? fmt(p.date) : ""}</figcaption>
            </figure>
          ))}
        </div>
        {count > 1 && <p className="text-[10px] text-[#5a7090] text-center">Paar {current + 1} von {count}</p>}
      </div>
      {count > 1 && (
        <button type="button" onClick={() => go(1)} aria-label="Nächstes Paar" className="p-2 rounded-xl text-[#8fa3c0] hover:text-[#f0f4ff] hover:bg-[#1e2d42]">
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}
