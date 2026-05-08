import { INGREDIENT_ALIASES } from "./aliases";

const STOPWORDS = new Set([
  "fresh",
  "freshly",
  "dried",
  "ground",
  "whole",
  "chopped",
  "minced",
  "diced",
  "sliced",
  "grated",
  "shredded",
  "crushed",
  "raw",
  "cooked",
  "boiled",
  "roasted",
  "toasted",
  "organic",
  "ripe",
  "large",
  "small",
  "medium",
  "extra",
  "fine",
  "coarse",
  "light",
  "dark",
  "low",
  "fat",
  "free",
  "free-range",
  "boneless",
  "skinless",
]);

const aliasMap = new Map<string, string>(
  INGREDIENT_ALIASES.map((row) => [row.alias.toLowerCase(), row.normalized]),
);

function basicClean(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(word: string) {
  if (word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("zes")) return word.slice(0, -2);
  if (word.endsWith("ches") || word.endsWith("shes")) return word.slice(0, -2);
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function stripFiller(cleaned: string) {
  return cleaned
    .split(" ")
    .filter((token) => token.length > 0 && !STOPWORDS.has(token))
    .map(singularize)
    .join(" ")
    .trim();
}

/**
 * Normalize a free-text ingredient string into a canonical name.
 *
 * Strategy (highest priority first):
 *   1. Exact alias hit on the cleaned input ("hari mirch" → "green chili").
 *   2. Exact alias hit after stop-word stripping + singularization.
 *   3. Best fuzzy match (Dice coefficient on bigrams) against alias keys
 *      and known canonical names, with a minimum threshold.
 *   4. Otherwise return the cleaned, singularized form.
 *
 * This is intentionally pure and synchronous — it runs in the hot path of
 * the recipe matching engine and on every pantry write.
 */
export function normalizeIngredient(input: string): string {
  if (!input) return "";

  const cleaned = basicClean(input);
  if (!cleaned) return "";

  const direct = aliasMap.get(cleaned);
  if (direct) return direct;

  const stripped = stripFiller(cleaned);
  if (!stripped) return cleaned;

  const strippedHit = aliasMap.get(stripped);
  if (strippedHit) return strippedHit;

  const fuzzy = bestFuzzyMatch(stripped);
  if (fuzzy) return fuzzy;

  return stripped;
}

// ---------------------------------------------------------------------------
// Fuzzy matching (Dice coefficient on character bigrams)
// ---------------------------------------------------------------------------

function bigrams(s: string): Map<string, number> {
  const grams = new Map<string, number>();
  if (s.length < 2) {
    grams.set(s, 1);
    return grams;
  }
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    grams.set(g, (grams.get(g) ?? 0) + 1);
  }
  return grams;
}

function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  let intersection = 0;
  let totalA = 0;
  let totalB = 0;
  for (const v of aGrams.values()) totalA += v;
  for (const v of bGrams.values()) totalB += v;
  for (const [g, count] of aGrams) {
    const other = bGrams.get(g);
    if (other) intersection += Math.min(count, other);
  }
  return (2 * intersection) / (totalA + totalB);
}

const FUZZY_THRESHOLD = 0.78;

const fuzzyCandidates: string[] = Array.from(
  new Set([
    ...INGREDIENT_ALIASES.map((r) => r.alias.toLowerCase()),
    ...INGREDIENT_ALIASES.map((r) => r.normalized),
  ]),
);

function bestFuzzyMatch(query: string): string | null {
  let bestScore = 0;
  let bestKey: string | null = null;

  for (const candidate of fuzzyCandidates) {
    const score = diceCoefficient(query, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestKey = candidate;
    }
  }

  if (bestKey && bestScore >= FUZZY_THRESHOLD) {
    return aliasMap.get(bestKey) ?? bestKey;
  }
  return null;
}

/**
 * Normalize many ingredients at once, deduplicating identical results.
 * Used by the matching engine on the user's pantry list.
 */
export function normalizeIngredients(inputs: string[]): string[] {
  const seen = new Set<string>();
  for (const input of inputs) {
    const n = normalizeIngredient(input);
    if (n) seen.add(n);
  }
  return Array.from(seen);
}
