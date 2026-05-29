import { SupplementDBItem } from "@/types";

export const seedSupplementDB: SupplementDBItem[] = [
  {
    id: "supp-kreatin",
    name: "Kreatin Monohydrat",
    standardDosage: "5 g täglich",
    timing: "morgens oder nach dem Training",
    instructions: "Mit Wasser einnehmen, täglich auch an Ruhetagen.",
    notes: "Basis-Supplement für Kraftleistung und Muskelaufbau.",
    link: "https://example.com/kreatin",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-omega3",
    name: "Omega-3",
    standardDosage: "2 Kapseln täglich",
    timing: "zu einer fetthaltigen Mahlzeit",
    instructions: "Mit einer Mahlzeit einnehmen.",
    notes: "Optional zur Unterstützung der Fettsäureversorgung.",
    link: "https://example.com/omega3",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
  {
    id: "supp-whey",
    name: "Whey Protein",
    standardDosage: "30 g nach Bedarf",
    timing: "flexibel",
    instructions: "Bei Bedarf zur Proteinabdeckung nutzen.",
    notes: "Kein Pflichtsupplement, nur praktisch zur Proteinzufuhr.",
    link: "https://example.com/whey",
    createdAt: "2026-05-29T00:00:00.000Z",
  },
];
