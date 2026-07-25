import { NextRequest, NextResponse } from "next/server";

interface OffProduct {
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  nutriments?: Record<string, number | undefined>;
}

export interface ExternalFoodResult {
  name: string;
  brand?: string;
  category: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  saltPer100g: number;
  servingLabel: string;
  defaultAmount: number;
}

// Keyword lists per internal category (checked against OFF categories_tags)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Protein: [
    "meats", "meat", "poultry", "chicken", "beef", "pork", "lamb", "veal",
    "fish", "seafood", "tuna", "salmon", "egg", "eggs", "dairy", "cheese",
    "yogurt", "quark", "cottage", "turkey", "whey", "casein",
    "fleisch", "geflügel", "fisch", "käse", "eier",
  ],
  Kohlenhydrate: [
    "breads", "bread", "pasta", "rice", "cereals", "grains", "grain",
    "wheat", "oats", "noodles", "bakery", "crackers", "potatoes", "corn",
    "legumes", "beans", "lentils", "peas", "tortillas",
  ],
  Fettquelle: [
    "oils-and-fats", "oils", "oil", "butter", "nuts", "nut", "seeds",
    "avocados", "fats", "margarine", "spreads", "peanut-butter",
  ],
  Gemüse: [
    "vegetables", "vegetable", "salads", "herbs", "tomatoes", "carrots",
    "broccoli", "spinach", "lettuce", "cabbage", "onions", "peppers",
    "cucumbers", "courgettes", "gemüse",
  ],
  Obst: [
    "fruits", "fruit", "berries", "berry", "apples", "bananas", "oranges",
    "grapes", "strawberries", "melons", "obst", "früchte",
  ],
};

function mapCategory(tags?: string[]): string {
  if (!tags || tags.length === 0) return "Weitere";
  const normalized = tags.map((t) => t.toLowerCase().replace(/^[a-z]{2}:/, ""));
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => normalized.some((tag) => tag.includes(kw)))) {
      return cat;
    }
  }
  return "Weitere";
}

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

function mapProduct(p: OffProduct): ExternalFoodResult | null {
  const name = p.product_name?.trim();
  if (!name) return null;

  const n = p.nutriments ?? {};

  // kcal: prefer energy-kcal_100g, fall back to energy_100g (kJ) / 4.184
  let kcal: number | null = null;
  if (typeof n["energy-kcal_100g"] === "number" && n["energy-kcal_100g"] > 0) {
    kcal = n["energy-kcal_100g"];
  } else if (typeof n["energy_100g"] === "number" && n["energy_100g"] > 0) {
    kcal = n["energy_100g"] / 4.184;
  }
  if (kcal === null) return null;

  // Salt: prefer salt_100g, fall back to sodium_100g × 2.5
  let salt = 0;
  if (typeof n["salt_100g"] === "number") {
    salt = n["salt_100g"];
  } else if (typeof n["sodium_100g"] === "number") {
    salt = n["sodium_100g"] * 2.5;
  }

  return {
    name,
    brand: p.brands?.trim() || undefined,
    category: mapCategory(p.categories_tags),
    kcalPer100g: r1(kcal),
    proteinPer100g: typeof n["proteins_100g"] === "number" ? r1(n["proteins_100g"]) : 0,
    carbsPer100g: typeof n["carbohydrates_100g"] === "number" ? r1(n["carbohydrates_100g"]) : 0,
    fatPer100g: typeof n["fat_100g"] === "number" ? r1(n["fat_100g"]) : 0,
    fiberPer100g: typeof n["fiber_100g"] === "number" ? r1(n["fiber_100g"]) : 0,
    saltPer100g: r1(salt),
    servingLabel: "100 g",
    defaultAmount: 100,
  };
}

// 24-hour in-memory cache keyed by lowercase search term
const cache = new Map<string, { results: ExternalFoodResult[]; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expiresAt) {
    return NextResponse.json({ results: hit.results });
  }

  try {
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", q);
    url.searchParams.set("search_simple", "1");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "20");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "coaching-app/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`OFF returned ${res.status}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await res.json()) as { products?: any[] };
    const products: OffProduct[] = Array.isArray(body.products) ? body.products : [];

    const results = products
      .map(mapProduct)
      .filter((r): r is ExternalFoodResult => r !== null)
      .slice(0, 15);

    cache.set(key, { results, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[external-search]", err);
    return NextResponse.json(
      { results: [], error: "Externe Datenbank momentan nicht erreichbar." },
      { status: 200 }
    );
  }
}
