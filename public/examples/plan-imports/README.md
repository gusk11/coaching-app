# Plan-Import — JSON-Format v1

Dieses Verzeichnis dokumentiert das JSON-Format, mit dem Trainings-,
Ernährungs- und Supplementpläne per Upload-Button in die App importiert werden
können (Coach-Tab → Pläne → "JSON hochladen").

Der Import ist tolerant: Namen von Übungen, Lebensmitteln und Supplements werden
nach einer DB-Suche aufgelöst; nicht gefundene Einträge werden als Freitext
übernommen und als Hinweis zurückgemeldet (Toast). Der komplette Plan wird in
jedem Fall gespeichert — unbekannte Einträge erzeugen *keine* harten Fehler.

## Gemeinsame Felder

| Feld | Pflicht | Wert |
|------|---------|------|
| `schemaVersion` | — | `1` (konstant; falls weggelassen = 1) |
| `planType` | — | `"training"`, `"meal"` oder `"supplement"` (optional, aber empfohlen zur Fehlerprüfung) |

IDs (`id`, `athleteId`, `createdAt`) werden **nicht** erwartet — der Server
generiert sie beim Import. Wenn du eine Datei aus einem bestehenden Export
(z. B. "Als JSON exportieren" bei einem Trainingsplan) hochlädst, erkennt der
Importer das automatisch und übernimmt den vollen Plan unverändert.

---

## 1 · Training (`planType: "training"`)

Beispiel: [`training.example.json`](./training.example.json)

```jsonc
{
  "schemaVersion": 1,
  "planType": "training",
  "title": "Push Pull Legs x Torso/Limbs", // Pflicht
  "mode": "flexible",                       // "weekday" | "flexible" (Default: "flexible")
  "coachNote": "…",                         // optional
  "schritteProTag": 10000,                  // optional
  "cardioMinuten": 90,                      // optional
  "cardioFrequenz": "woche",                // "woche" | "taeglich"
  "cardioIntensity": "Zone 2",              // optional
  "trackedFields": {                        // optional, Defaults in Klammern
    "weight": true,                         // (true)
    "reps":   true,                         // (true)
    "rir":    true,                         // (true)
    "cadence": false,                       // (false)
    "custom": { "label": "Tempo", "enabled": false } // optional
  },
  "days": [                                 // mindestens 1
    {
      "dayName": "Training A",              // Pflicht ("Montag" bei mode=weekday)
      "label":   "Push",                    // optional
      "note":    "…",                       // optional
      "cardioNote": "…",                    // optional, pro Tag
      "exercises": [
        {
          "name": "Seitheben",              // Pflicht
          "sets": 3,                        // Pflicht, Integer > 0
          "reps": "10-15",                  // optional, als Text ("8-12", "AMRAP", "20 Sek.")
          "rir":  2,                        // optional
          "rpe":  8,                        // optional
          "restSeconds": 90,                // optional
          "note": "Progressionsfokus",      // optional (individuelle Coach-Notiz)
          "videoUrl": "https://…",          // optional
          "muscleGroup": "Schultern",       // optional (überschreibt DB-Snapshot)
          "laterality": "bilateral",        // "bilateral" | "unilateral" (Default: bilateral)
          "equipmentType": "Kurzhantel",    // optional – "Maschine", "Kurzhantel", "Langhantel", "Kabelzug", "Körpergewicht", "Smith-Maschine"
          "isTimeBased": false,             // optional
          "variantLabel": "Gym Mitte",      // optional (athletenspezifische Variante)
          "cadence": { "eccentric": 3, "bottomHold": 0, "concentric": 1, "topHold": 0 }
        }
      ]
    }
  ]
}
```

**DB-Lookup:** `name` wird gegen die **ÜbungenDB** gematcht (case-insensitive,
Umlaut-tolerant). Trifft der Name eine DB-Übung, werden `muscleGroup`,
`laterality`, `isTimeBased`, `equipmentType` und die DB-Notiz übernommen —
Werte in der Datei haben Vorrang. Übungen ohne DB-Treffer werden als
Freitext-Übung angelegt.

---

## 2 · Ernährung (`planType: "meal"`)

Beispiel: [`nutrition.example.json`](./nutrition.example.json)

```jsonc
{
  "schemaVersion": 1,
  "planType": "meal",
  "title": "Tag 1 – 2.300 kcal / 172 g Protein", // Pflicht
  "mealPlanType": "fixed",                 // "fixed" | "macro_targets" (Default: fixed)
  "coachNote": "…",                        // optional
  "macroTargets": {                        // optional, nur Pflicht bei mealPlanType=macro_targets
    "kcal": 2300, "protein": 172, "carbs": 248, "fat": 63, "fiber": 30
  },
  "meals": [
    {
      "name": "Frühstück: Skyr + Müsli",   // Pflicht
      "time": "08:00",                     // optional ("HH:MM" oder null)
      "note": "…",                         // optional
      "isFreeMeal": false,                 // optional
      "entries": [
        {
          "name": "Skyr + Müsli",          // Pflicht – wird gegen FoodDB gematcht
          "amountG": 400,                  // ODER: "amount": 1, "unit": "stück"
          "kcal":    320,                  // Inline-Makros = TOTALS für die Portion
          "protein": 47,                   // (nur relevant, wenn der Name NICHT in der FoodDB ist)
          "carbs":   28,
          "fat":     3,
          "fiber":   4,                    // optional
          "salt":    0.1,                  // optional
          "category": "Frühstück"          // optional – wird zur FoodItem-Category
        }
      ]
    }
  ]
}
```

**DB-Lookup:** `name` wird gegen die **FoodDB** (Base + Custom) gematcht.
Trefferfall → der DB-Eintrag wird verwendet und `amountG` bestimmt die Portion
(interne Speicherung in Gramm; bei "1 Stück"-Lebensmitteln reicht
`amount: 1, unit: "stück"`). Kein Treffer → die Inline-Makros (`kcal`,
`protein`, `carbs`, `fat`, `fiber`, `salt`) werden als
**Totalwerte für die Portion** interpretiert und intern automatisch auf
per-100 g umgerechnet. Fehlen auch die Inline-Makros, wird der Eintrag mit
0-Makros angelegt und als Warnung zurückgemeldet.

Für die Screenshot-Variante (Mahlzeit mit kombiniertem kcal/Protein-Wert ohne
Aufschlüsselung) genügt ein einziges `entries`-Element pro Mahlzeit mit
Inline-Makros — siehe `nutrition.example.json`.

---

## 3 · Supplements (`planType: "supplement"`)

Beispiel: [`supplement.example.json`](./supplement.example.json)

```jsonc
{
  "schemaVersion": 1,
  "planType": "supplement",
  "title": "Basis-Supplementierung",       // optional
  "coachNote": "…",                        // optional
  "supplements": [                         // mindestens 1
    {
      "name": "Kreatin Monohydrat",        // Pflicht – wird gegen SupplementDB gematcht
      "dosage": "7 g täglich",             // Pflicht – individuelle Dosierung
      "timing": "Jederzeit täglich",       // optional – Default aus DB-Treffer
      "instructions": "Mit viel Wasser …", // optional – Default aus DB-Treffer
      "note": "Standarddosierung: 3–5 g",  // optional
      "link": "https://…"                  // optional
    }
  ]
}
```

**DB-Lookup:** `name` matcht gegen die **SupplementDB**. Bei Treffer werden
`standardDosage`, `timing`, `instructions`, `note` und `link` als Snapshot
übernommen; Werte in der Datei haben Vorrang. Keine Treffer → Freitext-
Supplement, Warnung im Toast.

---

## Verhalten im Detail

- **IDs werden immer neu generiert.** Mehrfach-Uploads derselben Datei legen
  jedes Mal einen neuen Plan an.
- **Mehrere Pläne pro Typ sind erlaubt.** Der neue Plan wird zum aktiven Plan
  (`isActive: true` ist Default); vorher aktive Pläne bleiben erhalten, können
  im UI auf inaktiv geschaltet werden.
- **Namen-Matching ist tolerant:** Groß/Kleinschreibung, Umlaute (ä↔a) und
  mehrfache Leerzeichen werden ignoriert.
- **Fehler vs. Warnung:** Struktur-Fehler (z. B. `sets` fehlt, `title` leer)
  brechen den Import ab (HTTP 422). Fehlende DB-Treffer sind nur Warnungen und
  verhindern den Import nicht.
- **Export ist nicht nötig:** Es ist kein Schritt erforderlich, um ein
  Beispielfile per Hand oder von Claude generieren zu lassen — alles was in
  den obigen Blöcken steht, reicht.

## Export / Round-Trip

Jeder bestehende Trainingsplan kann über das Download-Icon im Plan-Header als
JSON exportiert werden. Diese Exportdatei enthält bereits alle IDs und
Snapshot-Werte und kann unverändert in ein anderes Athletenprofil hochgeladen
werden — der Importer erkennt das volle Format und validiert gegen das strikte
Schema.
