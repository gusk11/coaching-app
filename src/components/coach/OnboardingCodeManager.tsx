"use client";
import { useState } from "react";
import { createOnboardingCode } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";

const inp =
  "bg-[#0f1624] border border-[#1e2d42] rounded-xl px-3 py-2 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors w-full placeholder:text-[#3b4d6a]";

export function OnboardingCodeManager() {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = code.trim();
    if (!trimmed) {
      showToast("Bitte einen Code eingeben", "error");
      return;
    }
    setSaving(true);
    try {
      await createOnboardingCode(trimmed);
      showToast("Onboarding-Code gespeichert", "success");
      setCode("");
    } catch {
      showToast("Fehler beim Speichern", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[#141d2e] border border-[#1e2d42] p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#5a7090]">Onboarding-Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="z. B. ATHLETE-2024"
          className={inp}
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-end px-5 py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-semibold hover:bg-[#2563eb] transition-colors disabled:opacity-50"
      >
        {saving ? "Speichern…" : "Speichern"}
      </button>
    </div>
  );
}
