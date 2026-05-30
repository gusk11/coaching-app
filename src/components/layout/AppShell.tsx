"use client";
import { cn } from "@/lib/utils";
import { clearAuth } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  LayoutDashboard, Dumbbell,
  Pill, ClipboardCheck, Users, BookOpen, LogOut, ChevronRight,
  Salad, Flame, ListChecks, User,
} from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { pageTransition } from "@/lib/motion";

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
  { label: "Stammdaten", href: "/athlete/stammdaten", icon: <User size={20} /> },
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
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen bg-[#0a0f1a] overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 bg-[#0f1624] border-r border-[#1e2d42] shrink-0">
          <div className="p-6 pb-4 border-b border-[#1e2d42]">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
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

          {/* Mobile-only top header */}
          <div className="md:hidden bg-[#0f1624] border-b border-[#1e2d42] shrink-0">
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
                <span className="text-xs text-[#5a7090]">
                  {role === "coach" ? "Coach-Bereich" : "Athleten-Bereich"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Abmelden"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#8fa3c0] hover:text-[#ef4444] hover:bg-[#ef4444]/5 transition-all"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>

            <nav className="flex overflow-x-auto px-3 pb-2.5 gap-1 scrollbar-none" aria-label="Hauptnavigation">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                      active
                        ? "bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20"
                        : "text-[#5a7090] hover:text-[#8fa3c0]"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop-only title bar */}
          {title && (
            <header className="hidden md:flex shrink-0 px-6 py-4 border-b border-[#1e2d42] bg-[#0f1624] items-center gap-3">
              <h1 className="text-lg font-semibold text-[#f0f4ff]">{title}</h1>
            </header>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="p-4 md:p-6 min-h-full w-full max-w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
