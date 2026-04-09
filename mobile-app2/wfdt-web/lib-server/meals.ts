import { extractJsonArray, extractJsonObject } from "./anthropic";
import { callLlm } from "./llm";

export interface GeneratePayload {
  servings: number;
  selectedProteins: string[];
  selectedCarbs: string[];
  selectedVegetables: string[];
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  freeText: string;
  cuisine: string;
}

function norm(s: string) {
  return s.toLowerCase().trim();
}

function tokens(s: string): string[] {
  return norm(s)
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

const CUT_WORDS = new Set([
  "breast",
  "thigh",
  "thighs",
  "leg",
  "legs",
  "wing",
  "wings",
  "drumstick",
  "drumsticks",
  "loin",
  "belly",
  "shoulder",
  "rib",
  "ribs",
  "chop",
  "chops",
  "steak",
  "steaks",
  "fillet",
  "filet",
  "mince",
  "ground",
  "sausage",
  "sausages",
]);

/**
 * Matching rule:
 * - If the selection is multi-word (e.g. "chicken breast"), require ALL tokens.
 * - If it's a single word (e.g. "chicken"), treat it as a category and match the token.
 */
function matchesSelection(haystack: string, selection: string): boolean {
  const h = norm(haystack);
  let selToks = tokens(selection).filter((t) => t.length >= 3);
  // Heuristic: if the user picked a cut ("duck breast"), treat the animal token as
  // the intent so Gemini outputs like "duck legs" still pass validation.
  if (selToks.length >= 2) {
    const withoutCuts = selToks.filter((t) => !CUT_WORDS.has(t));
    if (withoutCuts.length >= 1) selToks = withoutCuts;
  }
  if (selToks.length === 0) return false;
  if (selToks.length === 1) {
    return h.includes(selToks[0]!);
  }
  return selToks.every((t) => h.includes(t));
}

function includesAny(haystack: string, needles: string[]) {
  const h = norm(haystack);
  return needles.some((n) => matchesSelection(h, n));
}

function recipeUsesSelections(
  recipe: unknown,
  payload: GeneratePayload
): { ok: boolean; reason?: string } {
  if (!recipe || typeof recipe !== "object") return { ok: false, reason: "not an object" };
  const o = recipe as Record<string, unknown>;
  const title = String(o.title ?? "");
  const ingredientsRaw = Array.isArray(o.ingredients) ? o.ingredients : [];
  const ingredientText = ingredientsRaw
    .map((x) => {
      if (typeof x === "string") return x;
      if (!x || typeof x !== "object") return "";
      const xo = x as Record<string, unknown>;
      return String(
        xo.name ??
          xo.ingredient ??
          xo.item ??
          xo.product ??
          xo.food ??
          xo.label ??
          ""
      );
    })
    .join(" | ");
  const stepsRaw = Array.isArray(o.steps) ? o.steps : [];
  const stepText = stepsRaw
    .map((s) => {
      if (typeof s === "string") return s;
      if (s && typeof s === "object") {
        const so = s as Record<string, unknown>;
        return String(so.step ?? so.text ?? so.instruction ?? so.direction ?? "");
      }
      return "";
    })
    .join(" | ");
  const combined = `${title} | ${ingredientText} | ${stepText}`;

  if (ingredientsRaw.length < 6) {
    return { ok: false, reason: "missing ingredients" };
  }
  if (stepsRaw.length < 4) {
    return { ok: false, reason: "missing steps" };
  }

  if (
    payload.selectedProteins.length > 0 &&
    !includesAny(combined, payload.selectedProteins)
  ) {
    return { ok: false, reason: "missing selected protein" };
  }
  if (
    payload.selectedCarbs.length > 0 &&
    !includesAny(combined, payload.selectedCarbs)
  ) {
    return { ok: false, reason: "missing selected carb" };
  }
  if (
    payload.selectedVegetables.length > 0 &&
    !includesAny(combined, payload.selectedVegetables)
  ) {
    return { ok: false, reason: "missing selected vegetable" };
  }
  return { ok: true };
}

export function buildMealPrompt(p: GeneratePayload): string {
  const cuisine = p.cuisine?.trim() || "any";
  const mustUseProtein = p.selectedProteins.length > 0;
  const mustUseCarb = p.selectedCarbs.length > 0;
  const mustUseVeg = p.selectedVegetables.length > 0;
  const strictProteins = p.selectedProteins.filter((x) => tokens(x).length >= 2);
  const strictCarbs = p.selectedCarbs.filter((x) => tokens(x).length >= 2);
  const strictVeg = p.selectedVegetables.filter((x) => tokens(x).length >= 2);
  return `You are a professional chef. Generate 3 dinner recipe ideas based on:
- Servings: ${p.servings}
- Protein: ${p.selectedProteins.join(", ") || "any"}
- Carbs: ${p.selectedCarbs.join(", ") || "any"}
- Vegetables: ${p.selectedVegetables.join(", ") || "any"}
- Target calories: ${p.calories} per serving
- Macro split: ${p.macros.protein}% protein / ${p.macros.carbs}% carbs / ${p.macros.fat}% fat
- Extra notes: ${p.freeText.trim() || "none"}
- Cuisine: ${cuisine}

Hard requirements:
- Return EXACTLY 3 recipes.
- Titles and descriptions must name real foods only. Never use the word "any" in title or description. If a category was left open in the inputs, choose specific ingredients instead.
- Method steps must use those same concrete ingredient names (e.g. "Dice the broccoli" not "prep the vegetables"). Never use the word "any" in steps.
- Each recipe MUST include:
  - ingredients: an array of 6–10 objects, each with { "id", "quantity", "name" }.
  - steps: an array of 4–7 strings (no numbering like "1." inside the string).
- If a list is not "any", each recipe MUST use at least one item from that list:
  - Protein required: ${mustUseProtein ? "YES" : "no"}
  - Carbs required: ${mustUseCarb ? "YES" : "no"}
  - Vegetables required: ${mustUseVeg ? "YES" : "no"}
- If Protein required is YES, do NOT use proteins outside the provided Protein list.
- If Carbs required is YES, do NOT use carbs outside the provided Carbs list.
- If Vegetables required is YES, do NOT use vegetables outside the provided Vegetables list.
- If a selected item is specific (multi-word), you MUST use that exact ingredient (not just a related one):
  - Specific proteins: ${strictProteins.join(", ") || "none"}
  - Specific carbs: ${strictCarbs.join(", ") || "none"}
  - Specific vegetables: ${strictVeg.join(", ") || "none"}
- Keep each recipe close to the target calories and macro split.
- Keep output short so it fits in one response:
  - description: max 120 characters
  - cookTime: one string like "25 mins"

Return a JSON array of 3 recipes. Each object must include:
{
  "id": "unique-slug",
  "emoji": "single food emoji",
  "title": "Recipe Name",
  "description": "1-2 sentence tagline",
  "cookTime": "X mins",
  "difficulty": "Easy | Medium | Hard",
  "calories": 500,
  "macros": { "protein": 38, "carbs": 50, "fat": 17 },
  "ingredients": [{ "id": "1", "quantity": "300g", "name": "salmon" }],
  "steps": ["Step 1.", "Step 2."],
  "isTopPick": true
}

Mark exactly one recipe with "isTopPick": true (the best match). Others false.
Return ONLY valid JSON, no markdown, no extra text.`;
}

type GenerateInput =
  | { payload: GeneratePayload }
  | { payload: GeneratePayload; prompt: string };

export async function generateRecipes(input: GeneratePayload | GenerateInput): Promise<unknown> {
  const isWrapped =
    typeof input === "object" && input !== null && "payload" in input;
  const payload: GeneratePayload = isWrapped
    ? (input as GenerateInput).payload
    : (input as GeneratePayload);
  const basePrompt =
    isWrapped && "prompt" in (input as GenerateInput)
      ? (input as { payload: GeneratePayload; prompt: string }).prompt
      : buildMealPrompt(payload);

  async function runOnce(extraInstruction?: string) {
    const prompt = basePrompt + (extraInstruction ? `\n\nCRITICAL FIX:\n${extraInstruction}\n` : "");
    const text = await callLlm(prompt, 4096);
    const parsed = extractJsonArray(text);

    // Accept the ideal shape: [...]
    if (Array.isArray(parsed)) return parsed;

    // Sometimes we get JSON-in-a-string (either top-level or nested).
    if (typeof parsed === "string") {
      try {
        const inner = JSON.parse(parsed) as unknown;
        if (Array.isArray(inner)) return inner;
        if (inner && typeof inner === "object") {
          const o = inner as Record<string, unknown>;
          const v = Object.values(o).find((x) => Array.isArray(x));
          if (Array.isArray(v)) return v;
        }
      } catch {
        // ignore
      }
    }

    // Sometimes models wrap the array: { recipes: [...] } or { data: [...] } etc.
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const direct =
        o.recipes ??
        o.recipe ??
        o.items ??
        o.data ??
        o.result ??
        o.results ??
        o.output ??
        o.response;
      if (Array.isArray(direct)) return direct;
      if (typeof direct === "string") {
        try {
          const inner = JSON.parse(direct) as unknown;
          if (Array.isArray(inner)) return inner;
        } catch {
          // ignore
        }
      }

      // If it's a wrapper object with exactly one array field, take it.
      const arrays = Object.values(o).filter((v) => Array.isArray(v));
      if (arrays.length === 1) return arrays[0] as unknown[];
    }

    throw new Error(
      `Model returned JSON but not a recipe array. First 220 chars: ${String(text).slice(0, 220)}`
    );
  }

  const recipes1 = await runOnce();
  if (Array.isArray(recipes1) && recipes1.length > 0) {
    const allOk = recipes1.every((r) => recipeUsesSelections(r, payload).ok);
    if (allOk) return recipes1;
  }

  const fix = `You violated the user's constraints. Regenerate all 3 recipes.\n- Include full details: ingredients array (6–10 objects with id/quantity/name) and steps array (4–7 strings).\n- Every recipe MUST include at least one of the selected proteins: ${payload.selectedProteins.join(
    ", "
  ) || "(none)"}\n- Every recipe MUST include at least one of the selected carbs: ${payload.selectedCarbs.join(
    ", "
  ) || "(none)"}\n- Every recipe MUST include at least one of the selected vegetables: ${payload.selectedVegetables.join(
    ", "
  ) || "(none)"}\nReturn ONLY a JSON array.`;
  const recipes2 = await runOnce(fix);
  if (Array.isArray(recipes2) && recipes2.length > 0) {
    const allOk = recipes2.every((r) => recipeUsesSelections(r, payload).ok);
    if (allOk) return recipes2;
  }

  throw new Error(
    "Model returned recipes but they did not match the selected ingredients. Try selecting more specific items (e.g. 'Chicken breast' instead of a category) or regenerate."
  );
}

export function buildSwapPrompt(
  ingredient: string,
  recipeName: string
): string {
  return `Suggest one substitute for "${ingredient}" in ${recipeName}.
Return ONLY JSON: { "quantity": "300g", "name": "substitute" }`;
}

export async function swapIngredient(
  ingredient: string,
  recipeName: string
): Promise<{ quantity: string; name: string }> {
  const text = await callLlm(buildSwapPrompt(ingredient, recipeName), 256);
  const parsed = extractJsonObject(text) as {
    quantity?: string;
    name?: string;
  };
  if (!parsed?.name || !parsed?.quantity) {
    throw new Error("Invalid swap response");
  }
  return { quantity: parsed.quantity, name: parsed.name };
}
