import type { Recipe } from "../types";

export function recipeById(recipes: Recipe[], id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}
