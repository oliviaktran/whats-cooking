export interface Ingredient {
  id: string;
  quantity: string;
  name: string;
}

export interface Recipe {
  id: string;
  emoji: string;
  title: string;
  description: string;
  cookTime: string;
  difficulty: string;
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  ingredients: Ingredient[];
  steps: string[];
  isTopPick?: boolean;
}

export interface GenerateMealPayload {
  servings: number;
  selectedProteins: string[];
  selectedCarbs: string[];
  selectedVegetables: string[];
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  freeText: string;
  cuisine: string;
}
