"use client";
import { Download } from "lucide-react";
import { exportAllDatabases } from "@/lib/store";

export function DatabaseExportButton() {
  async function handleExport() {
    const data = await exportAllDatabases();
    const date = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `databases_export_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2d42] text-[#8fa3c0] text-xs font-medium hover:bg-[#141d2e] hover:text-[#f0f4ff] transition-colors"
    >
      <Download size={13} />
      Alle DBs exportieren
    </button>
  );
}
