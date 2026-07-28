"use client";
import { MaintenanceEditor } from "@/components/coach/MaintenanceEditor";

export default function MaintenancePage() {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 py-6 px-4">
      <div>
        <h1 className="text-lg font-semibold text-[#f0f4ff]">Wartungsarbeiten</h1>
        <p className="text-xs text-[#5a7090] mt-1">
          Blockiert den Athleten-Login und das Onboarding während der Wartung.
        </p>
      </div>
      <MaintenanceEditor />
    </div>
  );
}
