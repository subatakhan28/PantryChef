/**
 * Shared cross-cutting types.
 *
 * Domain types (Recipe, PantryItem, etc.) come from `@prisma/client` and
 * should be imported directly from there to keep them in sync with the schema.
 *
 * This file is for types that don't belong to a single domain — API
 * envelopes, view-model helpers, etc.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type Nullable<T> = T | null;
