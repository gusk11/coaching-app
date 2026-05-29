"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { athletes } from "@/data/athletes";
import { saveAuth } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0].id);

  function loginAsCoach() {
    saveAuth("coach", null);
    router.push("/coach/dashboard");
  }

  function loginAsAthlete() {
    saveAuth("athlete", selectedAthleteId);
    router.push("/athlete/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Logo" className="h-40 w-auto" />
          </div>
          <p className="text-sm text-[#5a7090] mt-2">Gustav Kaufmann Coaching</p>
        </div>

        <div className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs text-[#5a7090] font-medium uppercase tracking-wide">Als Athlet anmelden</p>
          <select
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-4 py-3 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button
            onClick={loginAsAthlete}
            className="py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors"
          >
            Als Athlet anmelden
          </button>
        </div>

        <div className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs text-[#5a7090] font-medium uppercase tracking-wide">Als Coach anmelden</p>
          <button
            onClick={loginAsCoach}
            className="py-3 rounded-xl bg-[#1e2d42] text-[#f0f4ff] font-semibold text-sm hover:bg-[#243350] transition-colors border border-[#2e4060]"
          >
            Als Coach anmelden
          </button>
        </div>
      </div>
    </div>
  );
}
