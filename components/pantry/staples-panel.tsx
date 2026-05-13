"use client";

import * as React from "react";
import { Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GLOBAL_STAPLES } from "@/lib/staples";
import { toggleStaple } from "@/app/(app)/pantry/actions";

type Props = {
  disabledStaples: string[];
};

export function StaplesPanel({ disabledStaples: initialDisabled }: Props) {
  const [disabled, setDisabled] = React.useState<Set<string>>(new Set(initialDisabled));
  const [pendingFor, setPendingFor] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  function toggle(normalized: string) {
    const willBeEnabled = disabled.has(normalized);
    const optimistic = new Set(disabled);
    if (willBeEnabled) optimistic.delete(normalized);
    else optimistic.add(normalized);
    setDisabled(optimistic);
    setPendingFor(normalized);

    startTransition(async () => {
      const result = await toggleStaple(normalized, willBeEnabled);
      if (!result.ok) {
        // revert
        setDisabled(new Set(initialDisabled));
        toast.error(result.error ?? "Could not update.");
      }
      setPendingFor(null);
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <header className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">Assumed staples</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          We assume you have these. Recipes that need them won&apos;t be marked &quot;missing&quot;.
          Tap to opt out of any.
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        {GLOBAL_STAPLES.map((s) => {
          const isDisabled = disabled.has(s.normalized);
          const isPending = pendingFor === s.normalized;
          return (
            <button
              key={s.normalized}
              type="button"
              onClick={() => toggle(s.normalized)}
              disabled={isPending}
              className={cn(
                "inline-flex min-h-9 select-none items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-95",
                isDisabled
                  ? "border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground line-through active:bg-muted/50"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200",
                isPending && "opacity-60",
              )}
              aria-pressed={!isDisabled}
            >
              {isDisabled ? <X className="size-3" /> : <Check className="size-3" />}
              {s.display}
            </button>
          );
        })}
      </div>
    </section>
  );
}
