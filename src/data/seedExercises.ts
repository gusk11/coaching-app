import { ExerciseDBItem } from "@/types";

export const seedExerciseDB: ExerciseDBItem[] = [
  // ── Brust ─────────────────────────────────────────────────────────────────────
  {
    id: "ex-bankdruecken",
    name: "Bankdrücken Langhantel",
    muscleGroup: "Brust",
    equipment: "Langhantel",
    notes: "Stabile Schulterblattposition, kontrollierte exzentrische Phase.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-schraegbank-kh",
    name: "Schrägbankdrücken Kurzhantel",
    muscleGroup: "Brust",
    equipment: "Kurzhantel",
    notes: "30–45° Bankneigung, Ellbogen leicht nach innen führen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-dips",
    name: "Dips",
    muscleGroup: "Brust",
    equipment: "Körpergewicht",
    notes: "Leicht nach vorne kippen für Brustbetonung, Ellbogen nicht nach außen drücken.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-kabelfliegende",
    name: "Kabelfliegende",
    muscleGroup: "Brust",
    equipment: "Kabelzug",
    notes: "Weite Bewegungsbahn, Spannung in der Kontraktion halten.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Rücken ────────────────────────────────────────────────────────────────────
  {
    id: "ex-latzug",
    name: "Latzug",
    muscleGroup: "Rücken",
    equipment: "Kabelzug",
    notes: "Ellbogen zur Hüfte ziehen, Schulterblätter am Ende zusammenziehen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-kreuzheben",
    name: "Kreuzheben",
    muscleGroup: "Rücken",
    equipment: "Langhantel",
    notes: "Neutraler Rücken, Stange nah am Körper führen. Hüfte als Scharnier.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-rudern-lh",
    name: "Rudern vorgebeugt Langhantel",
    muscleGroup: "Rücken",
    equipment: "Langhantel",
    notes: "Oberkörper ~45° vorgebeugt, Stange zur Hüfte ziehen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-rudern-kh-einarmig",
    name: "Kurzhantelrudern einarmig",
    muscleGroup: "Rücken",
    equipment: "Kurzhantel",
    notes: "Ellbogen zur Decke ziehen, Rumpf nicht mitrotieren.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-hyperextension",
    name: "Rückenstrecker (Hyperextension)",
    muscleGroup: "Rücken",
    equipment: "Körpergewicht",
    notes: "Keine Überstreckung am Ende, kontrolliert absenken.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Beine ─────────────────────────────────────────────────────────────────────
  {
    id: "ex-kniebeuge",
    name: "Kniebeuge",
    muscleGroup: "Beine",
    equipment: "Langhantel",
    notes: "Tiefe kontrollieren, Rumpfspannung halten. Knie in Verlängerung der Zehen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-beinpresse",
    name: "Beinpresse",
    muscleGroup: "Beine",
    equipment: "Maschine",
    notes: "Füße schulterbreit, Knie nicht vollständig strecken.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-rum-kreuzheben",
    name: "Rumänisches Kreuzheben",
    muscleGroup: "Beine",
    equipment: "Langhantel",
    notes: "Hüfte nach hinten schieben, Stange nah am Körper. Knie leicht gebeugt.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-ausfallschritte",
    name: "Ausfallschritte",
    muscleGroup: "Beine",
    equipment: "Kurzhantel",
    notes: "Knie zeigt in Richtung Zehen, Oberkörper aufrecht.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-leg-curl",
    name: "Leg Curl liegend",
    muscleGroup: "Beine",
    equipment: "Maschine",
    notes: "Hüfte auf der Bank halten, kontrollierte Exzentrik.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Schultern ─────────────────────────────────────────────────────────────────
  {
    id: "ex-seitheben",
    name: "Seitheben",
    muscleGroup: "Schultern",
    equipment: "Kurzhantel",
    notes: "Kontrollierte Bewegung, leicht nach innen rotiert. Nicht schwingen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-schulterdruecken-kh",
    name: "Schulterdrücken Kurzhantel",
    muscleGroup: "Schultern",
    equipment: "Kurzhantel",
    notes: "Sitzend oder stehend, Ellbogen leicht vor dem Körper. Kopf neutral.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-face-pull",
    name: "Face Pull",
    muscleGroup: "Schultern",
    equipment: "Kabelzug",
    notes: "Seil auf Augenhöhe, Ellbogen hoch halten, Außenrotation am Ende.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Bizeps ────────────────────────────────────────────────────────────────────
  {
    id: "ex-kh-curls",
    name: "Kurzhantelcurls",
    muscleGroup: "Bizeps",
    equipment: "Kurzhantel",
    notes: "Ellbogen am Körper halten, am Ende supinieren.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-hammercurls",
    name: "Hammercurls",
    muscleGroup: "Bizeps",
    equipment: "Kurzhantel",
    notes: "Neutraler Griff, Ellbogen fixiert.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Trizeps ───────────────────────────────────────────────────────────────────
  {
    id: "ex-trizeps-kabel",
    name: "Trizepsdrücken Kabel",
    muscleGroup: "Trizeps",
    equipment: "Kabelzug",
    notes: "Ellbogen fixiert, vollständige Streckung am Ende.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-french-press",
    name: "French Press",
    muscleGroup: "Trizeps",
    equipment: "Langhantel",
    notes: "Ellbogen zeigen zur Decke, Stange hinter den Kopf absenken.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Bauch ─────────────────────────────────────────────────────────────────────
  {
    id: "ex-crunch",
    name: "Crunch",
    muscleGroup: "Bauch",
    equipment: "Körpergewicht",
    notes: "Nur Schultern abheben, Lendenwirbelsäule bleibt am Boden.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-plank",
    name: "Plank",
    muscleGroup: "Bauch",
    equipment: "Körpergewicht",
    notes: "Gerader Körper, Hüfte nicht zu hoch oder tief. Atem gleichmäßig.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-beinheben",
    name: "Hängendes Beinheben",
    muscleGroup: "Bauch",
    equipment: "Körpergewicht",
    notes: "Langsam absenken, kein Schwung.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Gluteus ───────────────────────────────────────────────────────────────────
  {
    id: "ex-hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "Gluteus",
    equipment: "Langhantel",
    notes: "Schulterblätter auf der Bank, Hüfte voll strecken, Knie ~90° am Ende.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Waden ─────────────────────────────────────────────────────────────────────
  {
    id: "ex-wadenheben",
    name: "Wadenheben stehend",
    muscleGroup: "Waden",
    equipment: "Maschine",
    notes: "Volle Bewegungsbahn nutzen, oben kurz halten.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
];
