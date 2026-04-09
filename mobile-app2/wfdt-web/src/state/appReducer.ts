import { MACRO_PRESETS } from "../data/macroPresets";
import type { AppAction, AppState } from "../types";

/** Keeps each macro 0–100 and total ≤ 100 (sequential cap). */
function capMacros(m: AppState["macros"]): AppState["macros"] {
  let protein = Math.max(0, Math.min(100, m.protein));
  let carbs = Math.max(0, Math.min(100, m.carbs));
  let fat = Math.max(0, Math.min(100, m.fat));
  protein = Math.min(protein, Math.max(0, 100 - carbs - fat));
  carbs = Math.min(carbs, Math.max(0, 100 - protein - fat));
  fat = Math.min(fat, Math.max(0, 100 - protein - carbs));
  return { protein, carbs, fat };
}

export const initialAppState: AppState = {
  servings: 2,
  selectedProteins: [],
  selectedCarbs: [],
  selectedVegetables: [],
  activeProteinTab: "chicken",
  activeCarbTab: "pasta",
  activeVegSeason: "all-year",
  calories: 500,
  macros: { protein: 30, carbs: 40, fat: 30 },
  macroPreset: "balanced",
  freeText: "",
  freeTextItems: [],
  cuisine: "any",
  isLoading: false,
  recipes: [],
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_SERVINGS":
      return { ...state, servings: Math.min(12, Math.max(1, action.payload)) };
    case "TOGGLE_LIST": {
      const list = state[action.field];
      const has = list.includes(action.item);
      return {
        ...state,
        [action.field]: has
          ? list.filter((x) => x !== action.item)
          : [...list, action.item],
      };
    }
    case "REMOVE_LIST":
      return {
        ...state,
        [action.field]: state[action.field].filter((x) => x !== action.item),
      };
    case "SET_ACTIVE_PROTEIN_TAB":
      return { ...state, activeProteinTab: action.payload };
    case "SET_ACTIVE_CARB_TAB":
      return { ...state, activeCarbTab: action.payload };
    case "SET_ACTIVE_VEG_SEASON":
      return { ...state, activeVegSeason: action.payload };
    case "SET_CALORIES":
      return {
        ...state,
        calories: Math.min(2000, Math.max(200, action.payload)),
      };
    case "SET_MACROS":
      return {
        ...state,
        macros: capMacros(action.payload),
        macroPreset: null,
      };
    case "APPLY_MACRO_PRESET": {
      const preset = MACRO_PRESETS.find((p) => p.id === action.payload);
      if (!preset) return state;
      return {
        ...state,
        macros: capMacros(preset.macros),
        macroPreset: preset.id,
      };
    }
    case "SET_FREE_TEXT":
      return { ...state, freeText: action.payload };
    case "ADD_FREE_TEXT_ITEM": {
      const t = action.payload.trim().replace(/\s+/g, " ");
      if (!t || t.length > 120) return state;
      const dup = state.freeTextItems.some(
        (x) => x.toLowerCase() === t.toLowerCase(),
      );
      if (dup) return state;
      return {
        ...state,
        freeTextItems: [...state.freeTextItems, t],
        freeText: "",
      };
    }
    case "REMOVE_FREE_TEXT_ITEM":
      return {
        ...state,
        freeTextItems: state.freeTextItems.filter((x) => x !== action.payload),
      };
    case "SET_CUISINE":
      return { ...state, cuisine: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_RECIPES":
      return { ...state, recipes: action.payload };
  }
}
