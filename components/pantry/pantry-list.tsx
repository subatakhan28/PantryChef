"use client";

import * as React from "react";
import { AlertCircle, Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IngredientCombobox } from "@/components/pantry/ingredient-combobox";
import { COMMON_UNITS } from "@/app/(app)/pantry/schema";
import {
  removePantryItem,
  togglePantryFlag,
  updatePantryItem,
} from "@/app/(app)/pantry/actions";

export type PantryItemView = {
  id: string;
  ingredientName: string;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  lowStock: boolean;
  staple: boolean;
  mapped: boolean;
};

export function PantryList({ items }: { items: PantryItemView[] }) {
  const [editing, setEditing] = React.useState<PantryItemView | null>(null);

  const lowStock = items.filter((i) => i.lowStock);
  const staples = items.filter((i) => i.staple && !i.lowStock);
  const others = items.filter((i) => !i.lowStock && !i.staple);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
        <p className="text-sm font-medium">Your pantry is empty.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add a few ingredients on the left and we&apos;ll start matching recipes.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {lowStock.length > 0 && (
          <Section
            title="Running low"
            description="You marked these as low — restock soon."
            tone="warning"
          >
            {lowStock.map((item) => (
              <Row key={item.id} item={item} onEdit={() => setEditing(item)} />
            ))}
          </Section>
        )}

        {staples.length > 0 && (
          <Section title="Staples" description="Always assumed available when matching recipes.">
            {staples.map((item) => (
              <Row key={item.id} item={item} onEdit={() => setEditing(item)} />
            ))}
          </Section>
        )}

        {others.length > 0 && (
          <Section title={lowStock.length || staples.length ? "Everything else" : "Pantry"}>
            {others.map((item) => (
              <Row key={item.id} item={item} onEdit={() => setEditing(item)} />
            ))}
          </Section>
        )}
      </div>

      <EditDialog item={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function Section({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description?: string;
  tone?: "warning";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm",
        tone === "warning" && "border-amber-300/70 bg-amber-50/40 dark:bg-amber-950/20",
      )}
    >
      <header className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {tone === "warning" && <AlertCircle className="size-4 text-amber-600" />}
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      <ul className="divide-y">{children}</ul>
    </section>
  );
}

function Row({ item, onEdit }: { item: PantryItemView; onEdit: () => void }) {
  const [busy, startTransition] = React.useTransition();
  // Optimistic local copy so flag toggles flip the moment the user taps,
  // instead of waiting for the server round-trip. We revert on failure.
  const [optimistic, setOptimistic] = React.useState({
    staple: item.staple,
    lowStock: item.lowStock,
  });
  React.useEffect(() => {
    setOptimistic({ staple: item.staple, lowStock: item.lowStock });
  }, [item.staple, item.lowStock]);

  function handleToggle(field: "lowStock" | "staple", value: boolean) {
    const prev = optimistic;
    setOptimistic({ ...optimistic, [field]: value });
    startTransition(async () => {
      const result = await togglePantryFlag({ id: item.id, field, value });
      if (!result.ok) {
        setOptimistic(prev);
        toast.error(result.error ?? "Update failed.");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removePantryItem({ id: item.id });
      if (!result.ok) toast.error(result.error ?? "Could not remove.");
      else toast.success(`Removed ${item.ingredientName}.`);
    });
  }

  const quantityLabel = item.quantity != null ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : null;

  return (
    <li className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.ingredientName}</span>
          {!item.mapped ? (
            <Badge
              variant="outline"
              className="border-amber-300 text-[10px] font-normal text-amber-700"
              title="Not in our ingredient list — recipes won't match this. Try a more common name (e.g. 'tomato' instead of 'roma tomatoes')."
            >
              unmapped
            </Badge>
          ) : item.normalizedName !== item.ingredientName.trim().toLowerCase() ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              {item.normalizedName}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {quantityLabel && <span>{quantityLabel}</span>}
          <button
            type="button"
            onClick={() => handleToggle("staple", !optimistic.staple)}
            className={cn(
              "inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:text-foreground active:bg-accent/60",
              optimistic.staple && "text-amber-600",
            )}
          >
            <Star className={cn("size-3", optimistic.staple && "fill-current")} />
            {optimistic.staple ? "Staple" : "Make staple"}
          </button>
          <button
            type="button"
            onClick={() => handleToggle("lowStock", !optimistic.lowStock)}
            className="inline-flex min-h-8 items-center rounded-md px-1.5 py-1 transition-colors hover:text-foreground active:bg-accent/60"
          >
            {optimistic.lowStock ? "Restocked" : "Mark low"}
          </button>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${item.ingredientName}`}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={busy}
          aria-label={`Remove ${item.ingredientName}`}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </div>
    </li>
  );
}

function EditDialog({
  item,
  onClose,
}: {
  item: PantryItemView | null;
  onClose: () => void;
}) {
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [lowStock, setLowStock] = React.useState(false);
  const [staple, setStaple] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!item) return;
    setName(item.ingredientName);
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUnit(item.unit ?? "");
    setLowStock(item.lowStock);
    setStaple(item.staple);
  }, [item]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;

    startTransition(async () => {
      const result = await updatePantryItem({
        id: item.id,
        ingredientName: name,
        quantity: quantity || undefined,
        unit: unit || undefined,
        lowStock,
        staple,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Update failed.");
        return;
      }
      toast.success(`Updated ${name.trim()}.`);
      onClose();
    });
  }

  return (
    <Dialog open={!!item} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit pantry item</DialogTitle>
          <DialogDescription>
            Update quantity, unit, or flags. The normalized name updates automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-ingredient">Ingredient</Label>
            <IngredientCombobox id="edit-ingredient" value={name} onChange={setName} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-unit">Unit</Label>
              <Input
                id="edit-unit"
                list="edit-unit-options"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
              <datalist id="edit-unit-options">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={staple} onCheckedChange={(v) => setStaple(v === true)} />
              <span>Staple (always assumed available)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={lowStock} onCheckedChange={(v) => setLowStock(v === true)} />
              <span>Running low</span>
            </label>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
