/**
 * Staples assumed to be in every user's kitchen. Recipes that need these
 * shouldn't be excluded from matches just because the user hasn't manually
 * added them to their pantry. The user can opt out of any of them on the
 * pantry page; their opt-outs are stored as `disabledStaples` on
 * UserPreferences.
 */
export type Staple = { normalized: string; display: string };

export const GLOBAL_STAPLES: readonly Staple[] = [
  { normalized: "salt", display: "Salt" },
  { normalized: "black pepper", display: "Black pepper" },
  { normalized: "olive oil", display: "Olive oil" },
  { normalized: "vegetable oil", display: "Vegetable oil" },
  { normalized: "butter", display: "Butter" },
  { normalized: "egg", display: "Eggs" },
  { normalized: "milk", display: "Milk" },
  { normalized: "onion", display: "Onion" },
  { normalized: "garlic", display: "Garlic" },
  { normalized: "sugar", display: "Sugar" },
  { normalized: "all purpose flour", display: "Flour" },
] as const;

export function effectiveStaples(disabled: string[] | undefined): string[] {
  const disabledSet = new Set(disabled ?? []);
  return GLOBAL_STAPLES.filter((s) => !disabledSet.has(s.normalized)).map((s) => s.normalized);
}
