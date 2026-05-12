"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth";
import { normalizeIngredient } from "@/lib/ingredients/normalize";
import { INGREDIENT_ALIASES } from "@/lib/ingredients/aliases";
import {
  addPantrySchema,
  removePantrySchema,
  togglePantrySchema,
  updatePantrySchema,
  type AddPantryInput,
  type RemovePantryInput,
  type TogglePantryInput,
  type UpdatePantryInput,
} from "./schema";

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const ok: ActionState = { ok: true };

export async function addPantryItem(input: AddPantryInput): Promise<ActionState> {
  const parsed = addPantrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await requireOnboardedUser();
  const normalizedName = normalizeIngredient(parsed.data.ingredientName);
  if (!normalizedName) {
    return { ok: false, error: "Could not understand that ingredient." };
  }

  try {
    await prisma.pantryItem.create({
      data: {
        userId: session.authId,
        ingredientName: parsed.data.ingredientName.trim(),
        normalizedName,
        quantity: parsed.data.quantity ?? null,
        unit: parsed.data.unit ?? null,
        lowStock: parsed.data.lowStock ?? false,
        staple: parsed.data.staple ?? false,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: `You already have "${normalizedName}" in your pantry. Edit it to update quantity.`,
      };
    }
    throw err;
  }

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
  return ok;
}

export async function updatePantryItem(input: UpdatePantryInput): Promise<ActionState> {
  const parsed = updatePantrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await requireOnboardedUser();
  const normalizedName = normalizeIngredient(parsed.data.ingredientName);
  if (!normalizedName) {
    return { ok: false, error: "Could not understand that ingredient." };
  }

  try {
    const result = await prisma.pantryItem.updateMany({
      where: { id: parsed.data.id, userId: session.authId },
      data: {
        ingredientName: parsed.data.ingredientName.trim(),
        normalizedName,
        quantity: parsed.data.quantity ?? null,
        unit: parsed.data.unit ?? null,
        lowStock: parsed.data.lowStock ?? false,
        staple: parsed.data.staple ?? false,
      },
    });
    if (result.count === 0) return { ok: false, error: "Item not found." };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: `You already have "${normalizedName}" in your pantry under a different entry.`,
      };
    }
    throw err;
  }

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
  return ok;
}

export async function togglePantryFlag(input: TogglePantryInput): Promise<ActionState> {
  const parsed = togglePantrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const session = await requireOnboardedUser();
  const data: Prisma.PantryItemUpdateManyMutationInput = {};
  if (parsed.data.field === "lowStock") data.lowStock = parsed.data.value;
  if (parsed.data.field === "staple") data.staple = parsed.data.value;

  const result = await prisma.pantryItem.updateMany({
    where: { id: parsed.data.id, userId: session.authId },
    data,
  });
  if (result.count === 0) return { ok: false, error: "Item not found." };

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
  return ok;
}

export async function removePantryItem(input: RemovePantryInput): Promise<ActionState> {
  const parsed = removePantrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const session = await requireOnboardedUser();
  const result = await prisma.pantryItem.deleteMany({
    where: { id: parsed.data.id, userId: session.authId },
  });
  if (result.count === 0) return { ok: false, error: "Item not found." };

  revalidatePath("/pantry");
  revalidatePath("/dashboard");
  return ok;
}

export async function toggleStaple(
  normalizedName: string,
  enabled: boolean,
): Promise<ActionState> {
  if (!normalizedName) return { ok: false, error: "Invalid staple." };
  const session = await requireOnboardedUser();

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.authId },
  });
  const current = new Set(prefs?.disabledStaples ?? []);
  if (enabled) current.delete(normalizedName);
  else current.add(normalizedName);

  await prisma.userPreferences.upsert({
    where: { userId: session.authId },
    create: { userId: session.authId, disabledStaples: Array.from(current) },
    update: { disabledStaples: Array.from(current) },
  });

  revalidatePath("/pantry");
  revalidatePath("/suggest");
  return ok;
}

export type IngredientSuggestion = {
  display: string;
  normalized: string;
};

const SEARCH_CANDIDATES: IngredientSuggestion[] = (() => {
  const seen = new Set<string>();
  const out: IngredientSuggestion[] = [];
  for (const row of INGREDIENT_ALIASES) {
    const display = row.alias;
    const key = display.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ display, normalized: row.normalized });
  }
  for (const row of INGREDIENT_ALIASES) {
    const key = row.normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ display: row.normalized, normalized: row.normalized });
  }
  return out.sort((a, b) => a.display.localeCompare(b.display));
})();

export async function searchIngredients(query: string): Promise<IngredientSuggestion[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const startsWith: IngredientSuggestion[] = [];
  const includes: IngredientSuggestion[] = [];
  for (const candidate of SEARCH_CANDIDATES) {
    const lower = candidate.display.toLowerCase();
    if (lower.startsWith(q)) startsWith.push(candidate);
    else if (lower.includes(q)) includes.push(candidate);
    if (startsWith.length >= 8) break;
  }
  return [...startsWith, ...includes].slice(0, 10);
}
