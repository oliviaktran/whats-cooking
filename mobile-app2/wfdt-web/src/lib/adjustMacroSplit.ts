import type { AppState } from "../types";

type MacroKey = "protein" | "carbs" | "fat";

/**
 * Sets one macro to `newVal` (0–100) and scales the other two proportionally
 * so protein + carbs + fat always equals 100.
 */
export function adjustMacroSplit(
  key: MacroKey,
  raw: number,
  current: AppState["macros"]
): AppState["macros"] {
  const v = Math.max(0, Math.min(100, Math.round(Number(raw))));
  const others = (["protein", "carbs", "fat"] as const).filter((k) => k !== key);
  const oa = others[0];
  const ob = others[1];
  const rem = 100 - v;

  if (rem <= 0) {
    return {
      protein: key === "protein" ? v : 0,
      carbs: key === "carbs" ? v : 0,
      fat: key === "fat" ? v : 0,
    };
  }

  const sumOther = current[oa] + current[ob];
  let va: number;
  let vb: number;

  if (sumOther <= 0) {
    va = Math.floor(rem / 2);
    vb = rem - va;
  } else {
    va = Math.round((rem * current[oa]) / sumOther);
    va = Math.max(0, Math.min(rem, va));
    vb = rem - va;
  }

  return {
    protein: key === "protein" ? v : oa === "protein" ? va : vb,
    carbs: key === "carbs" ? v : oa === "carbs" ? va : vb,
    fat: key === "fat" ? v : oa === "fat" ? va : vb,
  };
}
