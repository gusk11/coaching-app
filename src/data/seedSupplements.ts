import { SupplementDBItem } from "@/types";

export const seedSupplementDB: SupplementDBItem[] = [
  // ── Aminosäuren ───────────────────────────────────────────────────────────────
  {
    id: "supp-kreatin-monohydrat",
    name: "Kreatin Monohydrat",
    category: "Aminosäuren",
    standardDosage: "3–5 g täglich",
    timing: "flexibel, täglich zur gleichen Zeit",
    instructions: "Mit ausreichend Wasser einnehmen. Bei Verdauungsbeschwerden Dosis auf morgens und abends aufteilen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-glycin",
    name: "Glycin",
    category: "Aminosäuren",
    standardDosage: "3 g täglich",
    timing: "vor dem Schlafengehen",
    instructions: "In Wasser einrühren und vor dem Schlafengehen einnehmen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-n-acetyl-cystein",
    name: "N-Acetyl-Cystein",
    category: "Aminosäuren",
    standardDosage: "600 mg täglich",
    timing: "flexibel, zu einer Mahlzeit oder nüchtern",
    instructions: "Mit ausreichend Wasser einnehmen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Adaptogene ────────────────────────────────────────────────────────────────
  {
    id: "supp-ashwagandha",
    name: "Ashwagandha",
    category: "Adaptogene",
    standardDosage: "300–600 mg täglich",
    timing: "abends oder zu einer Mahlzeit",
    instructions: "Mit einer Mahlzeit einnehmen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Fettsäuren ────────────────────────────────────────────────────────────────
  {
    id: "supp-omega-3",
    name: "Omega-3",
    category: "Fettsäuren",
    standardDosage: "1–3 g EPA/DHA täglich",
    timing: "zu einer fettreichen Mahlzeit",
    instructions: "Mit einer Mahlzeit einnehmen, idealerweise mit Fettanteil.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Mineralstoffe ─────────────────────────────────────────────────────────────
  {
    id: "supp-chrom",
    name: "Chrom",
    category: "Mineralstoffe",
    standardDosage: "100–200 µg täglich",
    timing: "zu einer Mahlzeit",
    instructions: "Mit einer Mahlzeit einnehmen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-magnesiumbisglycinat",
    name: "Magnesiumbisglycinat",
    category: "Mineralstoffe",
    standardDosage: "200–400 mg elementares Magnesium täglich",
    timing: "über den Tag verteilt oder vor dem Schlafengehen",
    instructions: "Bei höherer Dosierung auf 2 Einnahmen verteilen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-zink",
    name: "Zink",
    category: "Mineralstoffe",
    standardDosage: "10–25 mg täglich",
    timing: "vor dem Schlafengehen oder zu einer Mahlzeit",
    instructions: "Nicht nüchtern einnehmen, falls Magenprobleme auftreten.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Schlaf & Erholung ─────────────────────────────────────────────────────────
  {
    id: "supp-melatonin",
    name: "Melatonin",
    category: "Schlaf & Erholung",
    standardDosage: "0,5–1 mg bei Bedarf",
    timing: "2–3 Stunden vor dem Schlafengehen",
    instructions: "Nur bei Bedarf verwenden, nicht dauerhaft ohne individuelle Prüfung.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-5-htp",
    name: "5-HTP",
    category: "Schlaf & Erholung",
    standardDosage: "50–100 mg bei Bedarf",
    timing: "2–3 Stunden vor dem Schlafengehen",
    instructions: "Nicht mit serotonergen Medikamenten kombinieren, ohne ärztliche Rücksprache.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },

  // ── Vitamine ──────────────────────────────────────────────────────────────────
  {
    id: "supp-d3-k2",
    name: "Vitamin D3 + K2",
    category: "Vitamine",
    standardDosage: "1000–4000 I.E. Vitamin D3 täglich",
    timing: "zu einer fettreichen Mahlzeit",
    instructions: "Mit einer fetthaltigen Mahlzeit einnehmen.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-vitamin-c",
    name: "Vitamin C",
    category: "Vitamine",
    standardDosage: "250–500 mg täglich",
    timing: "flexibel, zu einer Mahlzeit",
    instructions: "Mit oder ohne Mahlzeit möglich.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-multivitamin",
    name: "Multivitaminpräparat",
    category: "Vitamine",
    standardDosage: "1 Portion täglich nach Herstellerangabe",
    timing: "zu einer fettreichen Mahlzeit",
    instructions: "Mit einer Mahlzeit einnehmen, idealerweise mit Fettanteil.",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
];
