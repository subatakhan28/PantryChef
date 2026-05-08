"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type {
  Cuisine,
  CookingSkill,
  DietaryPreference,
  SpiceTolerance,
} from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { completeOnboarding } from "./actions";
import {
  CUISINE_DESCRIPTIONS,
  CUISINE_LABELS,
  DIETARY_DESCRIPTIONS,
  DIETARY_LABELS,
  SKILL_DESCRIPTIONS,
  SKILL_LABELS,
  SPICE_DESCRIPTIONS,
  SPICE_LABELS,
  type OnboardingInput,
} from "./schema";

type Props = {
  initial: Partial<OnboardingInput> & { fullName?: string | null };
};

const STEPS = [
  { key: "cuisines", title: "Cuisines you want to cook" },
  { key: "spice", title: "Spice tolerance" },
  { key: "skill", title: "Cooking skill" },
  { key: "dietary", title: "Dietary preference" },
  { key: "favorites", title: "Favorite ingredients" },
  { key: "dislikes", title: "Ingredients to avoid" },
] as const;

const CUISINE_VALUES = Object.keys(CUISINE_LABELS) as Cuisine[];
const SPICE_VALUES = Object.keys(SPICE_LABELS) as SpiceTolerance[];
const SKILL_VALUES = Object.keys(SKILL_LABELS) as CookingSkill[];
const DIETARY_VALUES = Object.keys(DIETARY_LABELS) as DietaryPreference[];

export function OnboardingWizard({ initial }: Props) {
  const [step, setStep] = React.useState(0);
  const [submitting, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [cuisines, setCuisines] = React.useState<Cuisine[]>(initial.cuisinePreferences ?? []);
  const [spice, setSpice] = React.useState<SpiceTolerance | undefined>(initial.spiceTolerance);
  const [skill, setSkill] = React.useState<CookingSkill | undefined>(initial.cookingSkill);
  const [dietary, setDietary] = React.useState<DietaryPreference | undefined>(
    initial.dietaryPreference,
  );
  const [favorites, setFavorites] = React.useState<string[]>(initial.favoriteIngredients ?? []);
  const [dislikes, setDislikes] = React.useState<string[]>(initial.dislikedIngredients ?? []);

  const greetingName = initial.fullName?.split(" ")[0];

  const canAdvance = (() => {
    switch (STEPS[step].key) {
      case "cuisines":
        return cuisines.length > 0;
      case "spice":
        return Boolean(spice);
      case "skill":
        return Boolean(skill);
      case "dietary":
        return Boolean(dietary);
      case "favorites":
      case "dislikes":
        return true;
    }
  })();

  const isLast = step === STEPS.length - 1;

  function next() {
    if (!canAdvance) return;
    setError(null);
    if (isLast) {
      submit();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    if (!spice || !skill || !dietary) {
      setError("Please complete every step before finishing.");
      return;
    }

    startTransition(async () => {
      const result = await completeOnboarding({
        cuisinePreferences: cuisines,
        spiceTolerance: spice,
        cookingSkill: skill,
        dietaryPreference: dietary,
        favoriteIngredients: favorites,
        dislikedIngredients: dislikes,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result?.fieldErrors) {
        const first = Object.values(result.fieldErrors)[0]?.[0];
        const msg = first ?? "Please review your answers.";
        setError(msg);
        toast.error(msg);
      }
    });
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          <span>
            Welcome{greetingName ? `, ${greetingName}` : ""} — let&apos;s personalize PantryChef
          </span>
        </div>
        <Progress value={progress} aria-label="Onboarding progress" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step].title}</span>
        </div>
      </header>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        {STEPS[step].key === "cuisines" && (
          <CuisinesStep value={cuisines} onChange={setCuisines} />
        )}
        {STEPS[step].key === "spice" && <SpiceStep value={spice} onChange={setSpice} />}
        {STEPS[step].key === "skill" && <SkillStep value={skill} onChange={setSkill} />}
        {STEPS[step].key === "dietary" && (
          <DietaryStep value={dietary} onChange={setDietary} />
        )}
        {STEPS[step].key === "favorites" && (
          <ChipStep
            title="Anything you love cooking with?"
            description="Up to 20. We'll boost recipes that feature these."
            placeholder="e.g. ginger, basil, chicken thigh"
            value={favorites}
            onChange={setFavorites}
          />
        )}
        {STEPS[step].key === "dislikes" && (
          <ChipStep
            title="Anything you'd rather avoid?"
            description="We'll downrank recipes that depend on these."
            placeholder="e.g. cilantro, anchovy, blue cheese"
            value={dislikes}
            onChange={setDislikes}
          />
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </section>

      <footer className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || submitting}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button type="button" onClick={next} disabled={!canAdvance || submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : isLast ? (
            <>
              Finish
              <ChevronRight className="size-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}

function CuisinesStep({
  value,
  onChange,
}: {
  value: Cuisine[];
  onChange: (next: Cuisine[]) => void;
}) {
  function toggle(c: Cuisine) {
    onChange(value.includes(c) ? value.filter((v) => v !== c) : [...value, c]);
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title="Which cuisines do you want PantryChef to focus on?"
        hint="Pick at least one. You can change this any time."
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {CUISINE_VALUES.map((c) => {
          const checked = value.includes(c);
          return (
            <label
              key={c}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                checked
                  ? "border-primary bg-primary/5"
                  : "border-input hover:border-muted-foreground/40",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(c)}
                aria-label={CUISINE_LABELS[c]}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{CUISINE_LABELS[c]}</span>
                <span className="text-xs text-muted-foreground">{CUISINE_DESCRIPTIONS[c]}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SpiceStep({
  value,
  onChange,
}: {
  value: SpiceTolerance | undefined;
  onChange: (next: SpiceTolerance) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title="How much heat do you like?"
        hint="We'll match recipes to your tolerance."
      />
      <RadioGroup value={value} onValueChange={(v) => onChange(v as SpiceTolerance)}>
        {SPICE_VALUES.map((s) => (
          <RadioOption
            key={s}
            value={s}
            label={SPICE_LABELS[s]}
            description={SPICE_DESCRIPTIONS[s]}
            checked={value === s}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

function SkillStep({
  value,
  onChange,
}: {
  value: CookingSkill | undefined;
  onChange: (next: CookingSkill) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        title="How would you describe your cooking skill?"
        hint="We'll filter complexity accordingly."
      />
      <RadioGroup value={value} onValueChange={(v) => onChange(v as CookingSkill)}>
        {SKILL_VALUES.map((s) => (
          <RadioOption
            key={s}
            value={s}
            label={SKILL_LABELS[s]}
            description={SKILL_DESCRIPTIONS[s]}
            checked={value === s}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

function DietaryStep({
  value,
  onChange,
}: {
  value: DietaryPreference | undefined;
  onChange: (next: DietaryPreference) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader title="Any dietary preference?" hint="We'll respect this across all recipes." />
      <RadioGroup value={value} onValueChange={(v) => onChange(v as DietaryPreference)}>
        {DIETARY_VALUES.map((d) => (
          <RadioOption
            key={d}
            value={d}
            label={DIETARY_LABELS[d]}
            description={DIETARY_DESCRIPTIONS[d]}
            checked={value === d}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

function RadioOption({
  value,
  label,
  description,
  checked,
}: {
  value: string;
  label: string;
  description: string;
  checked: boolean;
}) {
  return (
    <label
      htmlFor={`opt-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground/40",
      )}
    >
      <RadioGroupItem id={`opt-${value}`} value={value} className="mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </label>
  );
}

function ChipStep({
  title,
  description,
  placeholder,
  value,
  onChange,
}: {
  title: string;
  description: string;
  placeholder: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    if (value.length >= 20) {
      toast.error("Up to 20 ingredients here.");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeader title={title} hint={description} />
      <div>
        <Label htmlFor="chip-input" className="sr-only">
          {title}
        </Label>
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="rounded-sm p-0.5 hover:bg-muted-foreground/10"
                aria-label={`Remove ${tag}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <input
            id="chip-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter or comma to add. Backspace removes the last one.
        </p>
      </div>
    </div>
  );
}

function StepHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export default OnboardingWizard;
