import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Welcome to PantryChef" };

export default async function OnboardingPage() {
  const session = await requireAuthUser();

  if (session.record.onboardingCompleted) {
    redirect("/dashboard");
  }

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: session.authId },
  });

  return (
    <OnboardingWizard
      initial={{
        fullName: session.record.fullName,
        cuisinePreferences: preferences?.cuisinePreferences ?? [],
        favoriteIngredients: preferences?.favoriteIngredients ?? [],
        dislikedIngredients: preferences?.dislikedIngredients ?? [],
        spiceTolerance: session.record.spiceTolerance ?? undefined,
        cookingSkill: session.record.cookingSkill ?? undefined,
        dietaryPreference: session.record.dietaryPreference ?? undefined,
      }}
    />
  );
}
