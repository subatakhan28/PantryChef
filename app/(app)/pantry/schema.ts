import { z } from "zod";

export const COMMON_UNITS = [
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "piece",
  "bunch",
  "can",
  "jar",
  "pack",
] as const;

const quantityField = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  });

const unitField = z
  .string()
  .trim()
  .max(24)
  .optional()
  .transform((v) => (v ? v.toLowerCase() : undefined));

export const addPantrySchema = z.object({
  ingredientName: z.string().trim().min(1, "Ingredient is required").max(80),
  quantity: quantityField,
  unit: unitField,
  lowStock: z.boolean().optional().default(false),
  staple: z.boolean().optional().default(false),
});

export const updatePantrySchema = z.object({
  id: z.string().uuid(),
  ingredientName: z.string().trim().min(1).max(80),
  quantity: quantityField,
  unit: unitField,
  lowStock: z.boolean().optional().default(false),
  staple: z.boolean().optional().default(false),
});

export const togglePantrySchema = z.object({
  id: z.string().uuid(),
  field: z.enum(["lowStock", "staple"]),
  value: z.boolean(),
});

export const removePantrySchema = z.object({
  id: z.string().uuid(),
});

export type AddPantryInput = z.input<typeof addPantrySchema>;
export type UpdatePantryInput = z.input<typeof updatePantrySchema>;
export type TogglePantryInput = z.infer<typeof togglePantrySchema>;
export type RemovePantryInput = z.infer<typeof removePantrySchema>;
