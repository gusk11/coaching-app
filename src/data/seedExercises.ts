import { ExerciseDBItem } from "@/types";

export const seedExerciseDB: ExerciseDBItem[] = [
  {
    id: "ex-bankdruecken",
    name: "Bankdrücken Langhantel",
    muscleGroup: "Brust",
    notes: "Saubere Schulterblattposition, kontrollierte Exzentrik.",
    executionLink: "https://example.com/bankdruecken",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-kniebeuge",
    name: "Kniebeuge",
    muscleGroup: "Beine",
    notes: "Tiefe kontrollieren, Rumpfspannung halten.",
    executionLink: "https://example.com/kniebeuge",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-latzug",
    name: "Latzug",
    muscleGroup: "Rücken",
    notes: "Ellbogen nach unten ziehen, nicht reißen.",
    executionLink: "https://example.com/latzug",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "ex-seitheben",
    name: "Seitheben",
    muscleGroup: "Schulter",
    notes: "Kontrollierte Bewegung, nicht schwingen.",
    executionLink: "https://example.com/seitheben",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
];
