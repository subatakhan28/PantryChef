import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Leaf, ShoppingBag, Utensils } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { rankRecipes, type MatchableRecipe, type MatchResult } from "@/services/matching/match";

export const metadata: Metadata = { title: "What can I cook?" };

const CUISINE_LABELS: Record<MatchableRecipe["cuisine"], string> = {
  pakistani: "Pakistani",
  indo_chinese: "Indo-Chinese",
  chinese: "Chinese",
  japanese: "Japanese",
  italian: "Italian",
  western: "Western",
};

export default async function SuggestPage() {
  const session = await requireOnboardedUser();

  const [pantryItems, prefs, recipes] = await Promise.all([
    prisma.pantryItem.findMany({
      where: { userId: session.authId },
      select: { normalizedName: true, staple: true },
    }),
    prisma.userPreferences.findUnique({ where: { userId: session.authId } }),
    prisma.recipe.findMany({
      include: {
        ingredients: { select: { normalizedName: true, required: true } },
      },
    }),
  ]);

  if (pantryItems.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Header />
        <Card>
          <CardHeader>
            <CardTitle>Your pantry is empty</CardTitle>
            <CardDescription>
              Add a few ingredients on the pantry page, then come back and I&apos;ll suggest dishes
              you can cook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pantry">Open pantry</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const pantry = new Set<string>();
  const staples = new Set<string>();
  for (const item of pantryItems) {
    if (item.staple) staples.add(item.normalizedName);
    else pantry.add(item.normalizedName);
  }

  const matchable: MatchableRecipe[] = recipes.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    cuisine: r.cuisine,
    totalTime: r.totalTime,
    difficulty: r.difficulty,
    spiceLevel: r.spiceLevel,
    vegetarian: r.vegetarian,
    ingredients: r.ingredients,
  }));

  const matches = rankRecipes(matchable, {
    pantry,
    staples,
    cuisinePreferences: prefs?.cuisinePreferences ?? [],
    dietaryPreference: session.record.dietaryPreference,
    dislikedIngredients: prefs?.dislikedIngredients ?? [],
    minMatchPct: 0.4,
    limit: 12,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Header />
      <p className="mb-6 text-sm text-muted-foreground">
        Using your {pantryItems.length} pantry{" "}
        {pantryItems.length === 1 ? "ingredient" : "ingredients"} and your onboarding
        preferences, ranked across {recipes.length} dishes.
      </p>

      {matches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nothing matches yet</CardTitle>
            <CardDescription>
              Add a few more ingredients — even basics like onion, garlic, or eggs unlock a lot.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <li key={m.recipe.id}>
              <SuggestionCard match={m} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="mb-8 flex flex-col gap-1">
      <h1 className="text-3xl font-semibold tracking-tight">What can I cook?</h1>
      <p className="text-sm text-muted-foreground">
        PantryChef ranks dishes by how close you are to making each one.
      </p>
    </header>
  );
}

function SuggestionCard({ match }: { match: MatchResult }) {
  const matchPct = Math.round(match.matchPct * 100);
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{match.recipe.title}</CardTitle>
          <Utensils className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{CUISINE_LABELS[match.recipe.cuisine]}</Badge>
          {match.recipe.vegetarian && (
            <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700">
              <Leaf className="size-3" />
              Vegetarian
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            ~{match.recipe.totalTime} min
          </Badge>
          <Badge
            variant="outline"
            className={
              matchPct === 100
                ? "border-emerald-400 text-emerald-700"
                : matchPct >= 75
                  ? "border-emerald-300 text-emerald-700"
                  : "border-amber-300 text-amber-700"
            }
          >
            {matchPct}% match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {match.recipe.description && (
          <p className="text-sm text-muted-foreground">{match.recipe.description}</p>
        )}
        {match.missing.length > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <ShoppingBag className="mt-0.5 size-3 shrink-0" />
            <span>
              You&apos;d need:{" "}
              <span className="font-medium">{match.missing.join(", ")}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
