import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, Flame, Leaf, Utensils, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth";
import { effectiveStaples } from "@/lib/staples";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Cuisine, SpiceLevel } from "@prisma/client";

const CUISINE_LABELS: Record<Cuisine, string> = {
  pakistani: "Pakistani",
  indo_chinese: "Indo-Chinese",
  chinese: "Chinese",
  japanese: "Japanese",
  italian: "Italian",
  western: "Western",
};

const SPICE_LABELS: Record<SpiceLevel, string> = {
  none: "No heat",
  mild: "Mild",
  medium: "Medium",
  hot: "Hot",
  extra_hot: "Extra hot",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { slug }, select: { title: true } });
  return { title: recipe?.title ?? "Recipe" };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireOnboardedUser();

  const [recipe, pantryItems, prefs] = await Promise.all([
    prisma.recipe.findUnique({
      where: { slug },
      include: {
        ingredients: { orderBy: { required: "desc" } },
        steps: { orderBy: { stepNumber: "asc" } },
      },
    }),
    prisma.pantryItem.findMany({
      where: { userId: session.authId },
      select: { normalizedName: true, staple: true },
    }),
    prisma.userPreferences.findUnique({
      where: { userId: session.authId },
      select: { disabledStaples: true },
    }),
  ]);

  if (!recipe) notFound();

  const have = new Set<string>([
    ...pantryItems.map((p) => p.normalizedName),
    ...effectiveStaples(prefs?.disabledStaples ?? []),
  ]);

  const requiredCount = recipe.ingredients.filter((i) => i.required).length;
  const haveRequired = recipe.ingredients.filter(
    (i) => i.required && have.has(i.normalizedName),
  ).length;
  const matchPct = requiredCount > 0 ? Math.round((haveRequired / requiredCount) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/suggest"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to suggestions
      </Link>

      <header className="mb-8 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{CUISINE_LABELS[recipe.cuisine]}</Badge>
          {recipe.vegetarian && (
            <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700">
              <Leaf className="size-3" />
              Vegetarian
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" />
            {recipe.totalTime} min
          </Badge>
          <Badge variant="outline" className="capitalize">
            {recipe.difficulty}
          </Badge>
          {recipe.spiceLevel !== "none" && (
            <Badge variant="outline" className="gap-1">
              <Flame className="size-3" />
              {SPICE_LABELS[recipe.spiceLevel]}
            </Badge>
          )}
          {requiredCount > 0 && (
            <Badge
              variant="outline"
              className={cn(
                matchPct === 100
                  ? "border-emerald-400 text-emerald-700"
                  : matchPct >= 75
                    ? "border-emerald-300 text-emerald-700"
                    : "border-amber-300 text-amber-700",
              )}
            >
              {matchPct}% match
            </Badge>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Utensils className="size-4 text-primary" />
              Ingredients
            </h2>
            <p className="text-xs text-muted-foreground">
              Serves {recipe.servings} · ✓ in your pantry / staples · ✗ you&apos;d need
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {recipe.ingredients.map((ing) => {
                const present = have.has(ing.normalizedName);
                return (
                  <li
                    key={ing.id}
                    className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex size-5 items-center justify-center rounded-full text-xs",
                          present
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : ing.required
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {present ? <Check className="size-3" /> : <X className="size-3" />}
                      </span>
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "text-sm",
                            !ing.required && !present && "text-muted-foreground",
                          )}
                        >
                          {ing.ingredientName}
                          {!ing.required && (
                            <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                          )}
                        </span>
                        {ing.notes && (
                          <span className="text-xs text-muted-foreground">{ing.notes}</span>
                        )}
                      </div>
                    </div>
                    {(ing.quantity || ing.unit) && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {ing.quantity && Number(ing.quantity)} {ing.unit ?? ""}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Method</h2>
            <p className="text-xs text-muted-foreground">
              {recipe.prepTime} min prep · {recipe.cookTime} min cook
            </p>
          </CardHeader>
          <CardContent>
            {recipe.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Steps coming soon.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {recipe.steps.map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {step.stepNumber}
                    </span>
                    <p className="text-sm leading-relaxed">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
