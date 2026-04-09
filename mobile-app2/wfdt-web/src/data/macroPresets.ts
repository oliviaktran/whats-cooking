export type MacroPresetId =
  | "balanced"
  | "highProtein"
  | "lowCarb"
  | "keto"
  | "lowFat";

export interface MacroPreset {
  id: MacroPresetId;
  label: string;
  macros: { protein: number; carbs: number; fat: number };
}

/** Each preset sums to exactly 100% (P / C / F). */
export const MACRO_PRESETS: MacroPreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    macros: { protein: 30, carbs: 40, fat: 30 },
  },
  {
    id: "highProtein",
    label: "High protein",
    macros: { protein: 40, carbs: 35, fat: 25 },
  },
  {
    id: "lowCarb",
    label: "Low carb",
    macros: { protein: 35, carbs: 20, fat: 45 },
  },
  {
    id: "keto",
    label: "Keto",
    macros: { protein: 25, carbs: 5, fat: 70 },
  },
  {
    id: "lowFat",
    label: "Low fat",
    macros: { protein: 35, carbs: 55, fat: 10 },
  },
];
