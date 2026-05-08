"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IngredientCombobox } from "@/components/pantry/ingredient-combobox";
import { addPantryItem } from "@/app/(app)/pantry/actions";
import { COMMON_UNITS } from "@/app/(app)/pantry/schema";

type Props = {
  variant?: "card" | "inline";
  onAdded?: () => void;
};

export function PantryAddForm({ variant = "card", onAdded }: Props) {
  const [ingredientName, setIngredientName] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [staple, setStaple] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setIngredientName("");
    setQuantity("");
    setUnit("");
    setStaple(false);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ingredientName.trim()) return;

    startTransition(async () => {
      const result = await addPantryItem({
        ingredientName,
        quantity: quantity || undefined,
        unit: unit || undefined,
        staple,
        lowStock: false,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not add item.");
        return;
      }
      toast.success(`Added ${ingredientName.trim()}.`);
      reset();
      onAdded?.();
    });
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex flex-col gap-3",
        variant === "card" && "rounded-lg border bg-card p-4 shadow-sm",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pantry-ingredient">Ingredient</Label>
        <IngredientCombobox
          id="pantry-ingredient"
          value={ingredientName}
          onChange={setIngredientName}
          placeholder="e.g. tomato, basmati rice, hari mirch"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pantry-quantity">Quantity</Label>
          <Input
            id="pantry-quantity"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="optional"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pantry-unit">Unit</Label>
          <Input
            id="pantry-unit"
            list="pantry-unit-options"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="optional"
          />
          <datalist id="pantry-unit-options">
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={staple} onCheckedChange={(v) => setStaple(v === true)} />
        <span>Mark as staple (always assume I have this)</span>
      </label>

      <Button type="submit" disabled={pending || !ingredientName.trim()}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Adding…
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Add to pantry
          </>
        )}
      </Button>
    </form>
  );
}
