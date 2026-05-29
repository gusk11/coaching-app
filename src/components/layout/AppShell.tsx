"use client";
import { cn } from "@/lib/utils";
import { clearAuth } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  LayoutDashboard, Dumbbell,
  Pill, ClipboardCheck, Users, BookOpen, LogOut, ChevronRight,
  Salad, Flame, ListChecks,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const athleteNav: NavItem[] = [
  { label: "Dashboard", href: "/athlete/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Kalorientracker", href: "/athlete/calorie-tracker", icon: <Flame size={20} /> },
  { label: "Trainingstracker", href: "/athlete/training", icon: <Dumbbell size={20} /> },
  { label: "Pläne", href: "/athlete/plans", icon: <Salad size={20} /> },
  { label: "Weekly Check-in", href: "/athlete/weekly-checkin", icon: <ClipboardCheck size={20} /> },
];

const coachNav: NavItem[] = [
  { label: "Athleten", href: "/coach/dashboard", icon: <Users size={20} /> },
  { label: "Food DB", href: "/coach/food-database", icon: <BookOpen size={20} /> },
  { label: "Supplement DB", href: "/coach/supplement-database", icon: <Pill size={20} /> },
  { label: "ÜbungenDB", href: "/coach/exercise-database", icon: <ListChecks size={20} /> },
];

interface AppShellProps {
  children: ReactNode;
  role: "athlete" | "coach";
  title?: string;
}

export function AppShell({ children, role, title }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const nav = role === "athlete" ? athleteNav : coachNav;

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-[#0a0f1a] overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0f1624] border-r border-[#1e2d42] shrink-0">
        <div className="p-6 pb-4 border-b border-[#1e2d42]">
          <span className="text-lg font-bold tracking-tight text-[#f0f4ff]">Coach<span className="text-[#3b82f6]">OS</span></span>
          <p className="text-xs text-[#5a7090] mt-1 capitalize">{role === "coach" ? "Coach-Bereich" : "Athleten-Bereich"}</p>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left",
                  active
                    ? "bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20"
                    : "text-[#8fa3c0] hover:bg-[#141d2e] hover:text-[#f0f4ff]"
                )}
              >
                <span className={active ? "text-[#3b82f6]" : ""}>{item.icon}</span>
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto text-[#3b82f6]" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1e2d42]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8fa3c0] hover:bg-[#141d2e] hover:text-[#ef4444] transition-all w-full"
          >
            <LogOut size={20} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        {title && (
          <header className="shrink-0 px-6 py-4 border-b border-[#1e2d42] bg-[#0f1624] flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[#f0f4ff]">{title}</h1>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-[#1e2d42] bg-[#0f1624] pb-safe">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-all",
                  active ? "text-[#3b82f6]" : "text-[#5a7090] hover:text-[#8fa3c0]"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
