"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadAuth } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import { DatabaseExportButton } from "@/components/ui/DatabaseExportButton";
import { DatabaseTabs } from "@/components/coach/DatabaseTabs";

export default function DatabasesPage() {
  const router = useRouter();
  useEffect(() => {
    const auth = loadAuth();
    if (auth.role !== "coach") router.replace("/login");
  }, [router]);

  return (
    <AppShell role="coach" title="Datenbanken">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <DatabaseExportButton />
        </div>
        <DatabaseTabs />
      </div>
    </AppShell>
  );
}
