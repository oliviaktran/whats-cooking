import type { ReactNode } from "react";

type Props = {
  value: number;
  onChange: (n: number) => void;
  labelId?: string;
  /** Shown on a second row, centered under the middle (value) column */
  secondaryLabel?: ReactNode;
};

const SIDE = 44;

export function Stepper({ value, onChange, labelId, secondaryLabel }: Props) {
  const gridCols = `${SIDE}px auto ${SIDE}px`;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          alignItems: "center",
          justifyItems: "stretch",
          background: "var(--color-fill)",
          borderRadius: 12,
          border: "1px solid var(--color-stroke-strong)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          aria-label="Decrease servings"
          onClick={() => onChange(value - 1)}
          style={{
            width: SIDE,
            height: SIDE,
            border: "none",
            background: "transparent",
            fontSize: 22,
            color: "var(--color-text-strong)",
          }}
        >
          −
        </button>
        <span
          aria-labelledby={labelId}
          style={{
            minWidth: 36,
            textAlign: "center",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {value}
        </span>
        <button
          type="button"
          aria-label="Increase servings"
          onClick={() => onChange(value + 1)}
          style={{
            width: SIDE,
            height: SIDE,
            border: "none",
            background: "transparent",
            fontSize: 22,
            color: "var(--color-text-strong)",
          }}
        >
          +
        </button>
      </div>
      {secondaryLabel != null && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            alignItems: "start",
          }}
        >
          <span aria-hidden />
          <span
            className="text-tiny"
            style={{
              textAlign: "center",
              fontWeight: 700,
              color: "var(--color-text-strong)",
              lineHeight: 1.25,
              padding: "0 2px",
            }}
          >
            {secondaryLabel}
          </span>
          <span aria-hidden />
        </div>
      )}
    </div>
  );
}
