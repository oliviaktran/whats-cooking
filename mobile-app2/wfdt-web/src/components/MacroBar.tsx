import type { Recipe } from "../types";

type Macros = Recipe["macros"];

export function MacroBar({ macros }: { macros: Macros }) {
  const total = macros.protein + macros.carbs + macros.fat || 1;
  const p = (macros.protein / total) * 100;
  const c = (macros.carbs / total) * 100;
  const f = (macros.fat / total) * 100;
  /** PRD-style values are usually % (sum ~100); models sometimes return grams. */
  const sumPercentLike = Math.abs(total - 100) <= 15;
  const unit = sumPercentLike ? "%" : "g";

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "var(--color-fill)",
        }}
        aria-hidden
      >
        <div style={{ width: `${p}%`, background: "#3b82f6" }} />
        <div style={{ width: `${c}%`, background: "#f59e0b" }} />
        <div style={{ width: `${f}%`, background: "#ef4444" }} />
      </div>
      <p
        className="text-tiny"
        style={{
          margin: "8px 0 0",
          color: "var(--color-text-strong)",
        }}
      >
        P {macros.protein}
        {unit} · C {macros.carbs}
        {unit} · F {macros.fat}
        {unit}
      </p>
    </div>
  );
}
