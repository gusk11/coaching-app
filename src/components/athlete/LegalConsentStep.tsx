"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PRIVACY_POLICY_TEXT, HEALTH_DATA_CONSENT_TEXT } from "@/lib/legalTexts";

export interface LegalConsentState {
  privacyAccepted: boolean;
  healthDataConsentAccepted: boolean;
  signatureFullName: string;
}

interface Props {
  onChange: (state: LegalConsentState) => void;
}

function DocSection({
  title,
  text,
  accepted,
  checkboxLabel,
  onToggle,
}: {
  title: string;
  text: string;
  accepted: boolean;
  checkboxLabel: string;
  onToggle: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-[#0f1624] border border-[#1e2d42] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
      >
        <span className="text-sm font-medium text-[#f0f4ff]">{title}</span>
        {open
          ? <ChevronUp size={16} className="text-[#5a7090] shrink-0" />
          : <ChevronDown size={16} className="text-[#5a7090] shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-[#1e2d42]">
          <div className="h-64 overflow-y-auto px-4 py-3">
            <pre className="text-xs text-[#8fa3c0] whitespace-pre-wrap font-sans leading-relaxed">
              {text}
            </pre>
          </div>
        </div>
      )}
      <div className="border-t border-[#1e2d42] px-4 py-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-[#3b82f6] cursor-pointer shrink-0"
          />
          <span className="text-xs text-[#8fa3c0] leading-snug">{checkboxLabel}</span>
        </label>
      </div>
    </div>
  );
}

export function LegalConsentStep({ onChange }: Props) {
  const [state, setState] = useState<LegalConsentState>({
    privacyAccepted: false,
    healthDataConsentAccepted: false,
    signatureFullName: "",
  });

  function update(patch: Partial<LegalConsentState>) {
    const next = { ...state, ...patch };
    setState(next);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-[#f0f4ff]">Rechtliche Dokumente</p>
        <p className="text-xs text-[#5a7090] mt-1">
          Bitte lies die folgenden Dokumente und bestätige deine Zustimmung. Klappe die Abschnitte auf, um den vollständigen Text zu lesen.
        </p>
      </div>

      <DocSection
        title="Datenschutzerklärung"
        text={PRIVACY_POLICY_TEXT}
        accepted={state.privacyAccepted}
        checkboxLabel="Ich habe die Datenschutzerklärung gelesen und akzeptiere sie."
        onToggle={(v) => update({ privacyAccepted: v })}
      />

      <DocSection
        title="Einwilligung zur Verarbeitung von Gesundheitsdaten"
        text={HEALTH_DATA_CONSENT_TEXT}
        accepted={state.healthDataConsentAccepted}
        checkboxLabel="Ich willige ausdrücklich in die Verarbeitung meiner Gesundheitsdaten gemäß der obenstehenden Einwilligungserklärung ein."
        onToggle={(v) => update({ healthDataConsentAccepted: v })}
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[#8fa3c0]">Elektronische Unterschrift</p>
        <p className="text-xs text-[#4a6080]">
          Gib deinen vollständigen Vor- und Nachnamen ein. Die Eingabe gilt als elektronische Unterschrift und bestätigt, dass du beide Dokumente zur Kenntnis genommen hast.
        </p>
        <input
          type="text"
          value={state.signatureFullName}
          onChange={(e) => update({ signatureFullName: e.target.value })}
          placeholder="Vor- und Nachname"
          className="bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2.5 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full placeholder:text-[#3b4d6a]"
        />
      </div>
    </div>
  );
}
