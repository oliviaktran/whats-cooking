import type { AppState, Recipe } from "../types";
import { normalizeRecipes } from "./normalizeRecipes";

function composeFreeTextNotes(state: AppState): string {
  const parts = [...(state.freeTextItems ?? [])];
  const draft = state.freeText.trim();
  if (draft) parts.push(draft);
  return parts.join(". ");
}

export function buildGeneratePrompt(
  state: AppState,
  overrides?: { cuisine?: string; freeText?: string }
): string {
  const cuisineRaw = overrides?.cuisine ?? state.cuisine;
  const cuisine =
    cuisineRaw.toLowerCase() === "any" || cuisineRaw === "Any" ? "any" : cuisineRaw;
  const notes =
    overrides?.freeText !== undefined
      ? overrides.freeText
      : composeFreeTextNotes(state);

  const proteins = state.selectedProteins ?? [];
  const carbs = state.selectedCarbs ?? [];
  const vegetables = state.selectedVegetables ?? [];
  const macros = state.macros ?? { protein: 30, carbs: 40, fat: 30 };

  return `You are a professional chef. Generate 3 dinner recipe ideas based on:
- Servings: ${state.servings ?? 2}
- Protein: ${proteins.join(", ") || "any"}
- Carbs: ${carbs.join(", ") || "any"}
- Vegetables: ${vegetables.join(", ") || "any"}
- Target calories: ${state.calories ?? 500} per serving
- Macro split: ${macros.protein}% protein / ${macros.carbs}% carbs / ${macros.fat}% fat
- Extra notes: ${notes.trim() || "none"}
- Cuisine: ${cuisine}

Hard requirements:
- Return EXACTLY 3 recipes.
- Each recipe MUST include:
  - ingredients: an array of 6–10 objects, each with { "id", "quantity", "name" }.
  - steps: an array of 4–7 strings (no numbering like "1." inside the string).
- If a list is not "any", each recipe MUST use at least one item from that list.
- Keep each recipe close to the target calories and macro split.
- Titles and descriptions must name real foods only. Never use the word "any" in title or description. If the user left a category open, pick specific ingredients (e.g. chicken breast, penne, broccoli) instead of writing "any".
- Each method step must name real ingredients from the recipe (no placeholder words like "any" or "the vegetables" without naming which ones).

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

Mark exactly one recipe with "isTopPick": true. Return ONLY valid JSON, no markdown.`;
}

export async function fetchGeneratePrompt(
  state: AppState,
  prompt: string,
  overrides?: { cuisine?: string; freeText?: string }
): Promise<Recipe[]> {
  const cuisineRaw = overrides?.cuisine ?? state.cuisine;
  const cuisine =
    cuisineRaw.toLowerCase() === "any" || cuisineRaw === "Any" ? "any" : cuisineRaw;
  const notes =
    overrides?.freeText !== undefined
      ? overrides.freeText
      : composeFreeTextNotes(state);

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      servings: state.servings ?? 2,
      selectedProteins: state.selectedProteins ?? [],
      selectedCarbs: state.selectedCarbs ?? [],
      selectedVegetables: state.selectedVegetables ?? [],
      calories: state.calories ?? 500,
      macros: state.macros ?? { protein: 30, carbs: 40, fat: 30 },
      freeText: notes,
      cuisine,
    }),
  });

  const raw = await res.text();
  let json: { recipes?: unknown; error?: string };
  try {
    json = JSON.parse(raw) as { recipes?: unknown; error?: string };
  } catch {
    throw new Error(
      `Bad response from /api/generate (${res.status}). ${raw.slice(0, 80)}`
    );
  }
  if (!res.ok) throw new Error(json.error ?? "Generation failed");
  return normalizeRecipes(json.recipes);
}

export async function fetchGenerate(
  state: AppState,
  freeText?: string
): Promise<Recipe[]> {
  const prompt = buildGeneratePrompt(state, { freeText });
  return fetchGeneratePrompt(state, prompt, { freeText });
}

export async function fetchSwap(
  ingredientName: string,
  recipeName: string
): Promise<{ quantity: string; name: string }> {
  const res = await fetch("/api/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredientName, recipeName }),
  });
  const json = (await res.json()) as {
    substitute?: { quantity: string; name: string };
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? "Swap failed");
  }
  if (!json.substitute) throw new Error("No substitute returned");
  return json.substitute;
}
