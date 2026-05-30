"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { findAthleteByLogin, saveAuth } from "@/lib/store";
import { OnboardingWizard } from "@/components/athlete/OnboardingWizard";
import { cn } from "@/lib/utils";

type View = "login" | "register";
type LoginTab = "athlete" | "coach";

const COACH_PASSWORD = "123";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [loginTab, setLoginTab] = useState<LoginTab>("athlete");

  // Athlete login
  const [nameOrEmail, setNameOrEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");

  // Coach login
  const [coachPassword, setCoachPassword] = useState("");
  const [coachError, setCoachError] = useState("");

  function handleAthleteLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!nameOrEmail.trim() || !pin.trim()) {
      setLoginError("Bitte Name/E-Mail und PIN eingeben.");
      return;
    }
    const athlete = findAthleteByLogin(nameOrEmail, pin);
    if (!athlete) {
      setLoginError("Name/E-Mail oder PIN ungültig.");
      return;
    }
    saveAuth("athlete", athlete.id);
    router.push("/athlete/dashboard");
  }

  function handleCoachLogin(e: React.FormEvent) {
    e.preventDefault();
    setCoachError("");
    if (coachPassword === COACH_PASSWORD) {
      saveAuth("coach", null);
      router.push("/coach/dashboard");
    } else {
      setCoachError("Falsches Coach-Passwort.");
    }
  }

  function handleRegistrationComplete(athleteId: string) {
    saveAuth("athlete", athleteId);
    router.push("/athlete/dashboard");
  }

  if (view === "register") {
    return (
      <OnboardingWizard
        onComplete={handleRegistrationComplete}
        onCancel={() => setView("login")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Logo" className="h-36 w-auto" />
          </div>
          <p className="text-sm text-[#5a7090]">Gustav Kaufmann Coaching</p>
        </div>

        {/* Tab: Athlet / Coach */}
        <div className="flex bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-1 gap-1">
          {(["athlete", "coach"] as LoginTab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setLoginTab(t); setLoginError(""); setCoachError(""); }}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                loginTab === t
                  ? "bg-[#3b82f6] text-white"
                  : "text-[#5a7090] hover:text-[#f0f4ff]"
              )}
            >
              {t === "athlete" ? "Athlet" : "Coach"}
            </button>
          ))}
        </div>

        {loginTab === "athlete" ? (
          <form onSubmit={handleAthleteLogin} className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs text-[#5a7090] font-medium uppercase tracking-wide">Athlet anmelden</p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={nameOrEmail}
                onChange={(e) => setNameOrEmail(e.target.value)}
                placeholder="Name oder E-Mail"
                autoComplete="username"
                className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-4 py-3 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a]"
              />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                autoComplete="current-password"
                className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-4 py-3 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a]"
              />
            </div>
            {loginError && (
              <p className="text-xs text-[#ef4444]">{loginError}</p>
            )}
            <button
              type="submit"
              className="py-3 rounded-xl bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#2563eb] transition-colors"
            >
              Anmelden
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1e2d42]" />
              <span className="text-xs text-[#3b4d6a]">neu hier?</span>
              <div className="flex-1 h-px bg-[#1e2d42]" />
            </div>
            <button
              type="button"
              onClick={() => setView("register")}
              className="py-3 rounded-xl border border-[#3b82f6]/30 text-[#60a5fa] font-semibold text-sm hover:bg-[#3b82f6]/10 transition-colors"
            >
              Jetzt registrieren
            </button>
          </form>
        ) : (
          <form onSubmit={handleCoachLogin} className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs text-[#5a7090] font-medium uppercase tracking-wide">Coach anmelden</p>
            <input
              type="password"
              value={coachPassword}
              onChange={(e) => setCoachPassword(e.target.value)}
              placeholder="Passwort"
              autoComplete="current-password"
              className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-4 py-3 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a]"
            />
            {coachError && (
              <p className="text-xs text-[#ef4444]">{coachError}</p>
            )}
            <button
              type="submit"
              className="py-3 rounded-xl bg-[#1e2d42] text-[#f0f4ff] font-semibold text-sm hover:bg-[#243350] transition-colors border border-[#2e4060]"
            >
              Einloggen
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
