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

export interface AppState {
  servings: number;
  selectedProteins: string[];
  selectedCarbs: string[];
  selectedVegetables: string[];
  activeProteinTab: string;
  activeCarbTab: string;
  activeVegSeason: string;
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  /** Last macro template chosen; null after manual slider edits. */
  macroPreset: string | null;
  /** Draft line in the “Anything else?” field (committed with Enter). */
  freeText: string;
  /** Committed extra notes shown as pills (sent to the API with any draft). */
  freeTextItems: string[];
  cuisine: string;
  isLoading: boolean;
  recipes: Recipe[];
}

export type AppAction =
  | { type: "SET_SERVINGS"; payload: number }
  | { type: "TOGGLE_LIST"; field: "selectedProteins" | "selectedCarbs" | "selectedVegetables"; item: string }
  | { type: "REMOVE_LIST"; field: "selectedProteins" | "selectedCarbs" | "selectedVegetables"; item: string }
  | { type: "SET_ACTIVE_PROTEIN_TAB"; payload: string }
  | { type: "SET_ACTIVE_CARB_TAB"; payload: string }
  | { type: "SET_ACTIVE_VEG_SEASON"; payload: string }
  | { type: "SET_CALORIES"; payload: number }
  | { type: "SET_MACROS"; payload: { protein: number; carbs: number; fat: number } }
  | { type: "APPLY_MACRO_PRESET"; payload: string }
  | { type: "SET_FREE_TEXT"; payload: string }
  | { type: "ADD_FREE_TEXT_ITEM"; payload: string }
  | { type: "REMOVE_FREE_TEXT_ITEM"; payload: string }
  | { type: "SET_CUISINE"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_RECIPES"; payload: Recipe[] };
