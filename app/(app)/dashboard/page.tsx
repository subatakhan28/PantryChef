import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PantryAddForm } from "@/components/pantry/pantry-add-form";
import { PantrySummary } from "@/components/dashboard/pantry-summary";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireOnboardedUser();

  const [totalItems, lowStockCount, stapleCount, recent] = await Promise.all([
    prisma.pantryItem.count({ where: { userId: session.authId } }),
    prisma.pantryItem.count({ where: { userId: session.authId, lowStock: true } }),
    prisma.pantryItem.count({ where: { userId: session.authId, staple: true } }),
    prisma.pantryItem.findMany({
      where: { userId: session.authId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, ingredientName: true, normalizedName: true },
    }),
  ]);

  const greetingName = session.record.fullName?.split(" ")[0] ?? "chef";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-10 flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Hi {greetingName}</h1>
        <p className="text-sm text-muted-foreground">
          {totalItems === 0
            ? "Let's start with what's in your kitchen."
            : `You have ${totalItems} ${totalItems === 1 ? "ingredient" : "ingredients"} in your pantry.`}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PantrySummary
          totalItems={totalItems}
          lowStockCount={lowStockCount}
          stapleCount={stapleCount}
          recent={recent}
        />

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Quick add</CardTitle>
            <CardDescription>Toss in an ingredient without leaving the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <PantryAddForm variant="inline" />
          </CardContent>
        </Card>
      </div>

      {totalItems > 0 && (
        <Card className="mt-6 bg-primary text-primary-foreground">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex size-9 items-center justify-center rounded-md bg-primary-foreground/20">
                <Sparkles className="size-5" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">What can I cook?</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Get dish ideas tailored to your pantry, tastes, and time.
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="secondary">
              <Link href="/suggest">
                Suggest dishes
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
        </Card>
      )}
    </main>
  );
}
