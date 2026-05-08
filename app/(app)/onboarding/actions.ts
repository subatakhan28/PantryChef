"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { normalizeIngredient } from "@/lib/ingredients/normalize";
import { onboardingSchema, type OnboardingInput } from "./schema";

export type OnboardingState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function uniqueNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const n = normalizeIngredient(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await requireAuthUser();

  const favorites = uniqueNormalized(parsed.data.favoriteIngredients);
  const dislikes = uniqueNormalized(parsed.data.dislikedIngredients);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.authId },
      data: {
        spiceTolerance: parsed.data.spiceTolerance,
        cookingSkill: parsed.data.cookingSkill,
        dietaryPreference: parsed.data.dietaryPreference,
        onboardingCompleted: true,
      },
    }),
    prisma.userPreferences.upsert({
      where: { userId: session.authId },
      create: {
        userId: session.authId,
        cuisinePreferences: parsed.data.cuisinePreferences,
        favoriteIngredients: favorites,
        dislikedIngredients: dislikes,
      },
      update: {
        cuisinePreferences: parsed.data.cuisinePreferences,
        favoriteIngredients: favorites,
        dislikedIngredients: dislikes,
      },
    }),
  ]);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
