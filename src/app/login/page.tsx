"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { findAthleteByLogin, saveAuth, addLoginHelpRequest } from "@/lib/store";
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

  // Forgot credentials modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotName, setForgotName] = useState("");
  const [forgotNote, setForgotNote] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    if (!forgotName.trim()) {
      setForgotError("Bitte einen Namen eingeben.");
      return;
    }
    addLoginHelpRequest(forgotName.trim(), forgotNote.trim() || undefined);
    setForgotSent(true);
  }

  function closeForgotModal() {
    setShowForgotModal(false);
    setForgotName("");
    setForgotNote("");
    setForgotSent(false);
    setForgotError("");
  }

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
    <>
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
          <div className="flex flex-col gap-2">
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
            </form>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-[#3b4d6a] hover:text-[#5a7090] transition-colors self-center py-1"
            >
              Name oder PIN vergessen?
            </button>
          </div>
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
      {/* Onboarding-CTA */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#1e2d42]" />
          <span className="text-xs text-[#3b4d6a]">neu hier?</span>
          <div className="flex-1 h-px bg-[#1e2d42]" />
        </div>
        <div className="bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-5 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-[#f0f4ff]">Neu im Coaching?</p>
            <p className="text-xs text-[#5a7090] mt-1">Starte dein persönliches Onboarding.</p>
          </div>
          <button
            type="button"
            onClick={() => setView("register")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#1a2f50] to-[#0f1e38] border border-[#3b82f6]/25 text-[#93c5fd] font-semibold text-sm hover:border-[#3b82f6]/50 hover:text-[#bfdbfe] transition-all tracking-wide"
          >
            Onboarding starten
          </button>
        </div>
      </div>
    </div>
  </div>

      {/* Forgot credentials modal */}

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0f1624] border border-[#1e2d42] rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
            {!forgotSent ? (
              <>
                <div>
                  <p className="text-base font-semibold text-[#f0f4ff]">Anmeldedaten vergessen</p>
                  <p className="text-xs text-[#5a7090] mt-1">
                    Dein Coach sieht die Anfrage und meldet sich bei dir.
                  </p>
                </div>
                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5a7090]">Welchen Namen sollen wir deinem Coach anzeigen? *</label>
                    <input
                      type="text"
                      value={forgotName}
                      onChange={(e) => setForgotName(e.target.value)}
                      placeholder="z. B. Max Mustermann"
                      autoFocus
                      className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-4 py-3 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5a7090]">Weitere Hinweise (optional)</label>
                    <textarea
                      value={forgotNote}
                      onChange={(e) => setForgotNote(e.target.value)}
                      placeholder="z. B. Ich bin der Athlet aus Hamburg..."
                      rows={2}
                      className="bg-[#141d2e] border border-[#1e2d42] rounded-xl px-4 py-3 text-[#f0f4ff] text-sm focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#3b4d6a] resize-none"
                    />
                  </div>
                  {forgotError && (
                    <p className="text-xs text-[#ef4444]">{forgotError}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="flex-1 py-2.5 rounded-xl border border-[#1e2d42] text-[#8fa3c0] text-sm font-medium hover:bg-[#141d2e] transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] text-white text-sm font-semibold hover:bg-[#2563eb] transition-colors"
                    >
                      Anfrage senden
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-[#10b981]/15 flex items-center justify-center text-xl">✓</div>
                  <p className="text-sm font-semibold text-[#f0f4ff] text-center">Anfrage gesendet</p>
                  <p className="text-xs text-[#5a7090] text-center leading-relaxed">
                    Deine Anfrage wurde an den Coach weitergegeben.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="py-2.5 rounded-xl bg-[#141d2e] border border-[#1e2d42] text-[#f0f4ff] text-sm font-medium hover:bg-[#192236] transition-colors"
                >
                  Schließen
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
