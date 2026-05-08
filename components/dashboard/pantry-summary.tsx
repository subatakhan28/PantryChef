import Link from "next/link";
import { AlertCircle, ArrowRight, Carrot, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type PantrySummaryProps = {
  totalItems: number;
  lowStockCount: number;
  stapleCount: number;
  recent: { id: string; ingredientName: string; normalizedName: string }[];
};

export function PantrySummary({
  totalItems,
  lowStockCount,
  stapleCount,
  recent,
}: PantrySummaryProps) {
  if (totalItems === 0) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="mb-2 inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Carrot className="size-5" />
          </div>
          <CardTitle className="flex items-center justify-between text-base">
            Your pantry is empty
          </CardTitle>
          <CardDescription>
            Add a few ingredients and we&apos;ll start matching recipes to what you actually have.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/pantry"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open pantry
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Carrot className="size-5" />
            </div>
            <CardTitle className="text-base">Pantry</CardTitle>
            <CardDescription>
              {totalItems} {totalItems === 1 ? "ingredient" : "ingredients"} tracked
            </CardDescription>
          </div>
          <Link
            href="/pantry"
            className="text-xs text-muted-foreground hover:text-foreground"
            aria-label="Open pantry"
          >
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {lowStockCount > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700">
              <AlertCircle className="size-3" />
              {lowStockCount} low
            </Badge>
          )}
          {stapleCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <Star className="size-3" />
              {stapleCount} staple{stapleCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>

        {recent.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Recently added</p>
            <ul className="flex flex-wrap gap-1.5">
              {recent.map((item) => (
                <li key={item.id}>
                  <Badge variant="secondary">{item.ingredientName}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
