import type { Ingredient, Recipe } from "../types";

function splitIngredientLine(line: string): { quantity: string; name: string } {
  const s = line.trim().replace(/\s+/g, " ");
  if (!s) return { quantity: "", name: "" };

  const paren = s.match(/^(.*)\(([^)]+)\)\s*$/);
  if (paren) {
    const name = paren[1].trim();
    const quantity = paren[2].trim();
    if (name && quantity) return { quantity, name };
  }

  const qtyMatch = s.match(
    /^(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|tbsp|tsp|cup|cups|oz|lb|lbs|pinch|clove|cloves|slice|slices|can|cans|piece|pieces))\s+(.+)$/i,
  );
  if (qtyMatch) return { quantity: qtyMatch[1]!.trim(), name: qtyMatch[2]!.trim() };

  const firstWordQty = s.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (firstWordQty) return { quantity: firstWordQty[1]!, name: firstWordQty[2]!.trim() };

  return { quantity: "", name: s };
}

function asIngredient(raw: unknown, index: number): Ingredient {
  if (typeof raw === "string") {
    const { quantity, name } = splitIngredientLine(raw);
    return { id: String(index + 1), quantity, name };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const id = String(o.id ?? index + 1);
    const quantity = String(
      o.quantity ?? o.qty ?? o.amount ?? o.measure ?? o.size ?? "",
    ).trim();
    const name = String(
      o.name ??
        o.ingredient ??
        o.item ??
        o.product ??
        o.food ??
        o.label ??
        "",
    ).trim();
    return { id, quantity, name };
  }
  return { id: String(index + 1), quantity: "", name: "" };
}

function normalizeSteps(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((s) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object") {
          const o = s as Record<string, unknown>;
          return String(o.step ?? o.text ?? o.instruction ?? o.direction ?? "");
        }
        return String(s);
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const lines = raw
      .split(/\r?\n+/)
      .map((l) => l.replace(/^\s*\d+[).\s-]+/, "").trim())
      .filter(Boolean);
    if (lines.length > 0) return lines;
    return raw.trim() ? [raw.trim()] : [];
  }
  return [];
}

/** Remove placeholder "any" from display strings (model sometimes echoes prompt). */
function scrubAnyWords(s: string): string {
  return s
    .replace(/\bany\b/gi, "")
    .replace(/\s*,\s*,/g, ",")
    .replace(/^\s*,|,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*([&,])\s*/g, "$1 ")
    .trim();
}

const TITLE_CASE_SMALL = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "from",
  "if",
  "in",
  "into",
  "nor",
  "of",
  "on",
  "or",
  "over",
  "per",
  "the",
  "to",
  "vs",
  "via",
  "with",
]);

/** Title Case for recipe names (hyphen-aware; small words lowercased mid-title). */
function toRecipeTitleCase(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return t;
  const words = t.split(" ");
  return words
    .map((word, wordIndex) => {
      const segments = word.split("-");
      return segments
        .map((seg, segIndex) => {
          const lower = seg.toLowerCase();
          const atStart = wordIndex === 0 && segIndex === 0;
          const atEnd =
            wordIndex === words.length - 1 && segIndex === segments.length - 1;
          if (!atStart && !atEnd && TITLE_CASE_SMALL.has(lower)) return lower;
          if (!seg) return seg;
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("-");
    })
    .join(" ");
}

/** Sentence case for method lines (first letter + after . ! ?). */
function toMethodSentenceCase(s: string): string {
  let t = s.trim().replace(/\s+/g, " ");
  if (!t) return t;
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.replace(/([.!?])\s+([a-z])/g, (_, p, letter) => `${p} ${letter.toUpperCase()}`);
}

function asRecipe(raw: unknown, index: number): Recipe | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === "string" && o.id ? o.id : `recipe-${index}-${Date.now()}`;
  const titleRaw = String(
    o.title ?? o.name ?? o.recipeName ?? o.recipe_title ?? "Untitled",
  );
  const title = toRecipeTitleCase(scrubAnyWords(titleRaw) || "Untitled");
  const ingredientsField =
    o.ingredients ??
    o.ingredientList ??
    o.ingredient_list ??
    o.ingredientsList ??
    o.items;
  const ingredientsRaw = (() => {
    if (Array.isArray(ingredientsField)) return ingredientsField;
    if (typeof ingredientsField === "string") {
      return ingredientsField
        .split(/\r?\n+/)
        .map((l) => l.replace(/^\s*[-•]\s*/, "").trim())
        .filter(Boolean);
    }
    if (ingredientsField && typeof ingredientsField === "object") {
      const io = ingredientsField as Record<string, unknown>;
      const maybe = io.ingredients ?? io.items ?? io.list;
      if (Array.isArray(maybe)) return maybe;
      if (typeof maybe === "string") {
        return maybe
          .split(/\r?\n+/)
          .map((l) => l.replace(/^\s*[-•]\s*/, "").trim())
          .filter(Boolean);
      }
    }
    return [];
  })();

  const steps = normalizeSteps(o.steps ?? o.method ?? o.directions)
    .map((s) => toMethodSentenceCase(scrubAnyWords(s)))
    .filter(Boolean);
  const macros = o.macros && typeof o.macros === "object" ? o.macros : {};
  const m = macros as Record<string, unknown>;

  return {
    id,
    emoji: String(o.emoji ?? "🍽️"),
    title,
    description: toMethodSentenceCase(
      scrubAnyWords(String(o.description ?? "")),
    ),
    cookTime: String(o.cookTime ?? o.time ?? "—"),
    difficulty: String(o.difficulty ?? "Easy"),
    calories: Number(o.calories) || 0,
    macros: {
      protein: Number(m.protein) || 0,
      carbs: Number(m.carbs) || 0,
      fat: Number(m.fat) || 0,
    },
    ingredients: ingredientsRaw
      .map(asIngredient)
      .filter((x) => x.name || x.quantity),
    steps,
    isTopPick: Boolean(o.isTopPick),
  };
}

export function normalizeRecipes(data: unknown): Recipe[] {
  if (!Array.isArray(data)) return [];
  return data
    .map(asRecipe)
    .filter((r): r is Recipe => r !== null)
    .slice(0, 4);
}
