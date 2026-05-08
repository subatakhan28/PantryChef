"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { searchIngredients, type IngredientSuggestion } from "@/app/(app)/pantry/actions";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export function IngredientCombobox({
  id,
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<IngredientSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const debouncedQuery = useDebounced(value, 150);
  const lastQuery = React.useRef("");

  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setItems([]);
      return;
    }
    if (debouncedQuery === lastQuery.current) return;
    lastQuery.current = debouncedQuery;
    setLoading(true);
    startTransition(async () => {
      const results = await searchIngredients(debouncedQuery);
      setItems(results);
      setLoading(false);
    });
  }, [debouncedQuery]);

  const showPopover = open && (loading || items.length > 0);

  return (
    <Popover open={showPopover} onOpenChange={(next) => !next && setOpen(false)}>
      <PopoverAnchor asChild>
        <Input
          id={id}
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder ?? "Start typing an ingredient…"}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className={cn(className)}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Searching…
              </div>
            )}
            {!loading && items.length === 0 && value.length >= 2 && (
              <CommandEmpty>No matches — press Enter to use &quot;{value}&quot; as-is.</CommandEmpty>
            )}
            {!loading && items.length > 0 && (
              <CommandGroup heading="Suggestions">
                {items.map((item) => (
                  <CommandItem
                    key={`${item.display}::${item.normalized}`}
                    value={item.display}
                    onSelect={() => {
                      onChange(item.display);
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1">{item.display}</span>
                    {item.display !== item.normalized && (
                      <span className="text-xs text-muted-foreground">→ {item.normalized}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
