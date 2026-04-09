import { Link } from "react-router-dom";
import type { Recipe } from "../types";
import { MacroBar } from "./MacroBar";

type Props = {
  recipe: Recipe;
  index: number;
};

export function RecipeCard({ recipe, index }: Props) {
  const to = `/recipe/${encodeURIComponent(recipe.id)}`;
  return (
    <Link
      to={to}
      className="card recipe-card-animate recipe-card-link"
      aria-label={`Open recipe: ${recipe.title}`}
      style={{
        display: "block",
        padding: 16,
        color: "inherit",
        textDecoration: "none",
        animationDelay: `${index * 100}ms`,
        ...(recipe.isTopPick
          ? { border: "2px solid var(--color-primary)" }
          : {}),
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {recipe.isTopPick ? (
          <span
            style={{
              alignSelf: "flex-start",
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 999,
              lineHeight: 1.2,
            }}
          >
            ✨ Top pick
          </span>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span
            aria-hidden
            style={{
              fontSize: 36,
              lineHeight: 1.15,
              flexShrink: 0,
            }}
          >
            {recipe.emoji}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "0 0 8px" }}>{recipe.title}</h3>
            <p
              className="text-tiny"
              style={{ color: "var(--color-text-weak)", marginBottom: 12 }}
            >
              {recipe.description}
            </p>
            <p
              className="text-tiny"
              style={{ marginBottom: 12, color: "var(--color-text-strong)" }}
            >
              ⏱ {recipe.cookTime} · {recipe.difficulty} · 🔥 {recipe.calories}{" "}
              kcal
            </p>
            <MacroBar macros={recipe.macros} />
            <span
              className="text-tiny"
              style={{
                display: "inline-block",
                marginTop: 14,
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              View recipe →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
