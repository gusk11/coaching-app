"use client";
import { useState, useEffect } from "react";
import { SupplementPlan, Supplement, SupplementDBItem } from "@/types";
import { Trash2, Plus, Database, Search, X, ExternalLink } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { loadSupplementDB } from "@/lib/store";

interface Props {
  plan?: SupplementPlan;
  athleteId: string;
  onSave: (plan: SupplementPlan) => void;
}

function emptySupplement(): Supplement {
  return {
    id: `supp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    dosage: "",
    timing: "",
    instructions: "",
    note: "",
  };
}

const INPUT =
  "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full";

export function SupplementEditor({ plan, athleteId, onSave }: Props) {
  const initPlan = plan ?? {
    id: `sp-${Date.now()}`,
    athleteId,
    supplements: [],
    coachNote: "",
  };

  const [coachNote, setCoachNote] = useState(initPlan.coachNote ?? "");
  const [supplements, setSupplements] = useState<Supplement[]>(initPlan.supplements);
  const [supplementDB, setSupplementDB] = useState<SupplementDBItem[]>([]);
  const [showDBPicker, setShowDBPicker] = useState(false);
  const [dbSearch, setDbSearch] = useState("");
  const [selectedDBItem, setSelectedDBItem] = useState<SupplementDBItem | null>(null);
  const [individualDosage, setIndividualDosage] = useState("");

  useEffect(() => {
    loadSupplementDB().then(setSupplementDB);
  }, []);

  const filteredDB = supplementDB.filter((item) =>
    item.name.toLowerCase().includes(dbSearch.toLowerCase())
  );

  function openDBPicker() {
    setShowDBPicker(true);
    setDbSearch("");
    setSelectedDBItem(null);
    setIndividualDosage("");
  }

  function closeDBPicker() {
    setShowDBPicker(false);
    setDbSearch("");
    setSelectedDBItem(null);
    setIndividualDosage("");
  }

  function selectDBItem(item: SupplementDBItem) {
    setSelectedDBItem(item);
    setDbSearch(item.name);
    setIndividualDosage("");
  }

  function addFromDB() {
    if (!selectedDBItem) return;
    const newSupp: Supplement = {
      id: `supp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: selectedDBItem.name,
      standardDosage: selectedDBItem.standardDosage,
      dosage: individualDosage,
      timing: selectedDBItem.timing,
      instructions: selectedDBItem.instructions,
      note: selectedDBItem.notes,
      link: selectedDBItem.link,
      supplementDBId: selectedDBItem.id,
    };
    setSupplements((prev) => [...prev, newSupp]);
    closeDBPicker();
  }

  function deleteSupplement(id: string) {
    setSupplements((prev) => prev.filter((s) => s.id !== id));
  }

  function updateField<K extends keyof Supplement>(id: string, field: K, value: Supplement[K]) {
    setSupplements((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function handleSave() {
    onSave({ ...initPlan, coachNote, supplements });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Coach note */}
      <div className="p-4 rounded-2xl bg-[#141d2e] border border-[#1e2d42]">
        <label className="text-xs font-medium text-[#8fa3c0] block mb-1.5">Coach-Notiz zum Plan</label>
        <textarea
          value={coachNote}
          onChange={(e) => setCoachNote(e.target.value)}
          rows={2}
          placeholder="Allgemeine Hinweise zur Supplementierung..."
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors resize-none w-full"
        />
      </div>

      {/* ── DB Picker ── */}
      {showDBPicker && (
        <div className="rounded-2xl bg-[#141d2e] border border-[#3b82f6]/30 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#60a5fa] uppercase tracking-widest">
              <Database size={13} /> Supplement aus Datenbank
            </span>
            <Tooltip label="Schließen">
              <button
                type="button"
                onClick={closeDBPicker}
                aria-label="Schließen"
                className="p-1 rounded-lg hover:bg-[#1e2d42] transition-colors"
              >
                <X size={14} className="text-[#5a7090]" />
              </button>
            </Tooltip>
          </div>

          {supplementDB.length === 0 ? (
            /* Empty state */
            <div className="py-5 text-center flex flex-col gap-1.5">
              <p className="text-sm text-[#5a7090]">
                Noch keine Supplements in der SupplementDB vorhanden.
              </p>
              <p className="text-xs text-[#3a5070]">
                Bitte zuerst Supplements in der{" "}
                <a
                  href="/coach/supplement-database"
                  className="text-[#60a5fa] hover:underline"
                >
                  Supplement-Datenbank
                </a>{" "}
                anlegen.
              </p>
            </div>
          ) : !selectedDBItem ? (
            /* Search + results */
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a7090] pointer-events-none" />
                <input
                  autoFocus
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  placeholder="Supplement suchen..."
                  className="bg-[#0f1624] border border-[#1e2d42] rounded-xl pl-8 pr-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full"
                />
              </div>
              <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto">
                {filteredDB.length === 0 ? (
                  <p className="text-xs text-[#5a7090] px-2 py-3">Keine Supplements gefunden.</p>
                ) : (
                  filteredDB.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectDBItem(item)}
                      className="text-left px-3 py-2.5 rounded-xl hover:bg-[#1d4ed8]/15 transition-colors"
                    >
                      <p className="text-sm font-medium text-[#f0f4ff]">{item.name}</p>
                      <p className="text-xs text-[#5a7090] mt-0.5">
                        {item.category && <span className="text-[#3a5070]">{item.category} · </span>}
                        {item.standardDosage}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Selected item: preview + individual dosage */
            <div className="flex flex-col gap-3">
              {/* Snapshot preview */}
              <div className="p-3 rounded-xl bg-[#0f1624] border border-[#1e2d42] flex flex-col gap-1.5 text-xs">
                <p className="text-sm font-semibold text-[#f0f4ff]">{selectedDBItem.name}</p>
                <p className="text-[#8fa3c0]">
                  <span className="text-[#5a7090]">Standarddosierung: </span>
                  {selectedDBItem.standardDosage}
                </p>
                <p className="text-[#8fa3c0]">
                  <span className="text-[#5a7090]">Einnahmezeitpunkt: </span>
                  {selectedDBItem.timing}
                </p>
                {selectedDBItem.instructions && (
                  <p className="text-[#8fa3c0]">
                    <span className="text-[#5a7090]">Anleitung: </span>
                    {selectedDBItem.instructions}
                  </p>
                )}
                {selectedDBItem.notes && (
                  <p className="text-[#8fa3c0]">
                    <span className="text-[#5a7090]">Hinweise: </span>
                    {selectedDBItem.notes}
                  </p>
                )}
                {selectedDBItem.link && (
                  <a
                    href={selectedDBItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#3b82f6] hover:text-[#60a5fa] transition-colors w-fit"
                  >
                    <ExternalLink size={11} />
                    Link öffnen
                  </a>
                )}
              </div>

              {/* Individual dosage */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#5a7090]">
                  Individuelle Dosierungsmenge für diesen Athleten
                </label>
                <input
                  autoFocus
                  value={individualDosage}
                  onChange={(e) => setIndividualDosage(e.target.value)}
                  placeholder="z.B. 5 g, 2 Kapseln, 1 Scoop, 2000 I.E."
                  className={INPUT}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDBItem(null)}
                  className="flex-1 py-2 rounded-xl border border-[#1e2d42] text-[#5a7090] text-sm hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={addFromDB}
                  className="flex-1 py-2 rounded-xl bg-[#1d4ed8]/20 border border-[#3b82f6]/40 text-[#60a5fa] text-sm font-medium hover:bg-[#1d4ed8]/30 transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Supplement cards ── */}
      {supplements.map((s, idx) => (
        <div key={s.id} className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5a7090] font-medium uppercase tracking-widest">
              Supplement {idx + 1}
              {s.supplementDBId && (
                <span className="ml-2 text-[10px] normal-case tracking-normal text-[#3b82f6]/60">
                  aus DB
                </span>
              )}
            </span>
            <Tooltip label="Supplement löschen">
              <button
                type="button"
                onClick={() => deleteSupplement(s.id)}
                aria-label="Supplement löschen"
                className="p-1 rounded-lg hover:bg-[#ef4444]/10 transition-colors"
              >
                <Trash2 size={14} className="text-[#ef4444]/50 hover:text-[#ef4444]" />
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-3">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Name *</label>
              <input
                value={s.name}
                onChange={(e) => updateField(s.id, "name", e.target.value)}
                placeholder="z.B. Creatin"
                className={INPUT}
              />
            </div>

            {/* Standarddosierung (read-only, nur wenn aus DB) */}
            {s.standardDosage !== undefined && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#5a7090]">Standarddosierung (aus DB)</label>
                <input
                  value={s.standardDosage}
                  readOnly
                  className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#8fa3c0] text-sm w-full cursor-default opacity-70"
                />
              </div>
            )}

            {/* Individuelle Dosierungsmenge */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">
                {s.standardDosage !== undefined ? "Individuelle Dosierungsmenge" : "Dosierung"}
              </label>
              <input
                value={s.dosage}
                onChange={(e) => updateField(s.id, "dosage", e.target.value)}
                placeholder={
                  s.standardDosage !== undefined
                    ? "z.B. 5 g, 2 Kapseln, 1 Scoop"
                    : "z.B. 5 g"
                }
                className={INPUT}
              />
            </div>

            {/* Einnahmezeitpunkt */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Einnahmezeitpunkt</label>
              <input
                value={s.timing}
                onChange={(e) => updateField(s.id, "timing", e.target.value)}
                placeholder="z.B. Morgens, Post-Workout"
                className={INPUT}
              />
            </div>

            {/* Einnahmeanleitung */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Einnahmeanleitung</label>
              <input
                value={s.instructions}
                onChange={(e) => updateField(s.id, "instructions", e.target.value)}
                placeholder="z.B. Mit viel Wasser einnehmen"
                className={INPUT}
              />
            </div>

            {/* Hinweis */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Hinweis (optional)</label>
              <input
                value={s.note ?? ""}
                onChange={(e) => updateField(s.id, "note", e.target.value || undefined)}
                placeholder="z.B. An trainingsfreien Tagen ebenfalls nehmen"
                className={INPUT}
              />
            </div>

            {/* Link */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#5a7090]">Link (optional)</label>
              <div className="flex gap-2">
                <input
                  value={s.link ?? ""}
                  onChange={(e) => updateField(s.id, "link", e.target.value || undefined)}
                  placeholder="https://..."
                  className={INPUT}
                />
                {s.link && (
                  <Tooltip label="Link öffnen">
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Link öffnen"
                      className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-[#1d4ed8]/15 border border-[#3b82f6]/30 text-[#60a5fa] hover:bg-[#1d4ed8]/25 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── Action buttons ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={openDBPicker}
          disabled={showDBPicker}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#3b82f6]/30 text-[#60a5fa] text-sm hover:border-[#3b82f6]/60 hover:bg-[#1d4ed8]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Database size={14} /> Aus SupplementDB
        </button>
        <button
          type="button"
          onClick={() => setSupplements((prev) => [...prev, emptySupplement()])}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#1e2d42] text-[#5a7090] text-sm hover:border-[#3b82f6]/40 hover:text-[#60a5fa] transition-colors"
        >
          <Plus size={15} /> Manuell
        </button>
      </div>

      {/* ── Save ── */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors"
      >
        Plan speichern
      </button>
    </div>
  );
}
