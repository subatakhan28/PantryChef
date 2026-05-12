import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth";
import { isCanonicalIngredient } from "@/lib/ingredients/aliases";
import { PantryAddForm } from "@/components/pantry/pantry-add-form";
import { PantryList, type PantryItemView } from "@/components/pantry/pantry-list";
import { StaplesPanel } from "@/components/pantry/staples-panel";

export const metadata: Metadata = { title: "Pantry" };

export default async function PantryPage() {
  const session = await requireOnboardedUser();

  const [items, prefs] = await Promise.all([
    prisma.pantryItem.findMany({
      where: { userId: session.authId },
      orderBy: [{ lowStock: "desc" }, { staple: "desc" }, { ingredientName: "asc" }],
    }),
    prisma.userPreferences.findUnique({
      where: { userId: session.authId },
      select: { disabledStaples: true },
    }),
  ]);

  const view: PantryItemView[] = items.map((item) => ({
    id: item.id,
    ingredientName: item.ingredientName,
    normalizedName: item.normalizedName,
    quantity: item.quantity != null ? Number(item.quantity) : null,
    unit: item.unit,
    lowStock: item.lowStock,
    staple: item.staple,
    mapped: isCanonicalIngredient(item.normalizedName),
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Pantry</h1>
        <p className="text-sm text-muted-foreground">
          What do you have at home? PantryChef ranks recipes by how close you are to cooking each
          one.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-8">
        <div className="flex flex-col gap-6">
          <StaplesPanel disabledStaples={prefs?.disabledStaples ?? []} />
          <PantryList items={view} />
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <PantryAddForm />
        </aside>
      </div>
    </main>
  );
}
