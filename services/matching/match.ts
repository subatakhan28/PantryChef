import type { Cuisine, DietaryPreference, SpiceLevel } from "@prisma/client";

export type MatchableRecipe = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cuisine: Cuisine;
  totalTime: number;
  difficulty: "easy" | "medium" | "hard";
  spiceLevel: SpiceLevel;
  vegetarian: boolean;
  ingredients: { normalizedName: string; required: boolean }[];
};

export type MatchResult = {
  recipe: MatchableRecipe;
  matchPct: number;
  haveCount: number;
  requiredCount: number;
  missing: string[];
};

export type MatchOptions = {
  pantry: Set<string>;
  staples: Set<string>;
  cuisinePreferences?: Cuisine[];
  dietaryPreference?: DietaryPreference | null;
  dislikedIngredients?: string[];
  minMatchPct?: number;
  limit?: number;
};

export function rankRecipes(recipes: MatchableRecipe[], options: MatchOptions): MatchResult[] {
  const have = new Set<string>([...options.pantry, ...options.staples]);
  const disliked = new Set(options.dislikedIngredients ?? []);
  const cuisinePref = new Set(options.cuisinePreferences ?? []);
  const dietary = options.dietaryPreference;
  const minMatchPct = options.minMatchPct ?? 0.4;
  const limit = options.limit ?? 12;

  const results: MatchResult[] = [];

  for (const recipe of recipes) {
    if (dietary === "vegetarian" && !recipe.vegetarian) continue;
    if (dietary === "vegan" && !recipe.vegetarian) continue;

    const required = recipe.ingredients.filter((i) => i.required);
    const requiredCount = required.length;
    if (requiredCount === 0) continue;

    let blockedByDislike = false;
    for (const ing of required) {
      if (disliked.has(ing.normalizedName)) {
        blockedByDislike = true;
        break;
      }
    }
    if (blockedByDislike) continue;

    let haveCount = 0;
    const missing: string[] = [];
    for (const ing of required) {
      if (have.has(ing.normalizedName)) haveCount++;
      else missing.push(ing.normalizedName);
    }

    const matchPct = haveCount / requiredCount;
    if (matchPct < minMatchPct) continue;

    results.push({ recipe, matchPct, haveCount, requiredCount, missing });
  }

  results.sort((a, b) => {
    if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    const aFav = cuisinePref.has(a.recipe.cuisine) ? 0 : 1;
    const bFav = cuisinePref.has(b.recipe.cuisine) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return a.recipe.totalTime - b.recipe.totalTime;
  });

  return results.slice(0, limit);
}
