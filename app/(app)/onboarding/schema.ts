import { z } from "zod";
import { Cuisine, CookingSkill, DietaryPreference, SpiceTolerance } from "@prisma/client";

export const cuisineEnum = z.nativeEnum(Cuisine);
export const spiceEnum = z.nativeEnum(SpiceTolerance);
export const skillEnum = z.nativeEnum(CookingSkill);
export const dietaryEnum = z.nativeEnum(DietaryPreference);

export const onboardingSchema = z.object({
  cuisinePreferences: z.array(cuisineEnum).min(1, "Pick at least one cuisine"),
  spiceTolerance: spiceEnum,
  cookingSkill: skillEnum,
  dietaryPreference: dietaryEnum,
  favoriteIngredients: z.array(z.string().trim().min(1)).max(20, "Up to 20 favorites"),
  dislikedIngredients: z.array(z.string().trim().min(1)).max(20, "Up to 20 dislikes"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const CUISINE_LABELS: Record<Cuisine, string> = {
  pakistani: "Pakistani",
  indo_chinese: "Indo-Chinese",
  chinese: "Chinese",
  japanese: "Japanese",
  italian: "Italian",
  western: "Western comfort",
};

export const CUISINE_DESCRIPTIONS: Record<Cuisine, string> = {
  pakistani: "Karahi, biryani, daal, kebabs",
  indo_chinese: "Manchurian, hakka noodles, chilli paneer",
  chinese: "Stir-fries, fried rice, dumplings",
  japanese: "Donburi, ramen, teriyaki, curry",
  italian: "Pasta, risotto, pizza, focaccia",
  western: "Burgers, salads, roast chicken, brunch",
};

export const SPICE_LABELS: Record<SpiceTolerance, string> = {
  none: "No heat",
  mild: "Mild",
  medium: "Medium",
  hot: "Hot",
  extra_hot: "Extra hot",
};

export const SPICE_DESCRIPTIONS: Record<SpiceTolerance, string> = {
  none: "I don't enjoy heat at all.",
  mild: "A little warmth is fine.",
  medium: "Comfortable with moderate spice.",
  hot: "I like a real kick.",
  extra_hot: "Bring the chili oil.",
};

export const SKILL_LABELS: Record<CookingSkill, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const SKILL_DESCRIPTIONS: Record<CookingSkill, string> = {
  beginner: "Simple recipes, fewer steps, basic techniques.",
  intermediate: "Comfortable cooking most weeknight meals.",
  advanced: "Confident with complex techniques and timing.",
};

export const DIETARY_LABELS: Record<DietaryPreference, string> = {
  none: "No restriction",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  halal: "Halal",
};

export const DIETARY_DESCRIPTIONS: Record<DietaryPreference, string> = {
  none: "I eat everything.",
  vegetarian: "No meat, fish, or seafood.",
  vegan: "No animal products at all.",
  pescatarian: "Fish and seafood, no other meat.",
  halal: "Only halal-permissible ingredients.",
};
