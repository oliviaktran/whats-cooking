import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cuisineOptions, vegetableTabs } from "../data/taxonomy";
import { RecipeCard } from "../components/RecipeCard";
import { buildGeneratePrompt, fetchGeneratePrompt } from "../lib/api";
import { useApp } from "../state/useApp";

function seasonLabel(activeId: string) {
  return vegetableTabs.find((t) => t.id === activeId)?.label ?? activeId;
}

export function ResultsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const meta = useMemo(
    () =>
      `${seasonLabel(state.activeVegSeason)} · ${state.calories} kcal · ${state.servings} servings`,
    [state.activeVegSeason, state.calories, state.servings]
  );

  async function runGenerate(cuisine: string) {
    dispatch({ type: "SET_CUISINE", payload: cuisine });
    dispatch({ type: "SET_LOADING", payload: true });
    setBusy(true);
    try {
      const next = { ...state, cuisine };
      const prompt = buildGeneratePrompt(next, { cuisine });
      const recipes = await fetchGeneratePrompt(next, prompt, { cuisine });
      dispatch({ type: "SET_RECIPES", payload: recipes });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
      setBusy(false);
    }
  }

  if (state.recipes.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <p>No recipes yet.</p>
        <Link to="/">Back to generator</Link>
      </div>
    );
  }

  const cuisineKey = state.cuisine.toLowerCase();
  const showRegenCuisine =
    cuisineKey !== "any" && cuisineKey !== "" && state.cuisine !== "Any";

  return (
    <div style={{ padding: "20px 16px 32px" }}>
      <header style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            fontWeight: 700,
            color: "var(--color-text-strong)",
            textDecoration: "underline",
            marginBottom: 16,
          }}
          aria-label="Go back"
        >
          ← Back
        </button>
        <h2 style={{ marginBottom: 8, lineHeight: 1.25 }}>Here&apos;s what you can make</h2>
        <p className="text-tiny" style={{ margin: 0 }}>
          {meta}
        </p>
      </header>

      <div
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {state.recipes.map((r, i) => (
          <RecipeCard key={r.id} recipe={r} index={i} />
        ))}
      </div>

      <section style={{ marginTop: 28 }}>
        <p className="text-tiny" style={{ marginBottom: 10, fontWeight: 700 }}>
          🌍 Try a cuisine
        </p>
        <div className="chip-grid">
          {cuisineOptions.map((c) => {
            const active =
              (c === "Any" && cuisineKey === "any") ||
              state.cuisine.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => dispatch({ type: "SET_CUISINE", payload: c })}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid var(--color-stroke-strong)`,
                  background: active
                    ? "var(--color-primary)"
                    : "var(--color-background)",
                  color: active
                    ? "var(--color-on-primary)"
                    : "var(--color-text-strong)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {showRegenCuisine && (
          <button
            type="button"
            disabled={busy || state.isLoading}
            onClick={() => runGenerate(state.cuisine)}
            style={{
              marginTop: 14,
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "none",
              background: "var(--color-pill)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ✨ Regenerate as {state.cuisine}
          </button>
        )}

        <button
          type="button"
          disabled={busy || state.isLoading}
          onClick={() => {
            dispatch({ type: "SET_CUISINE", payload: "any" });
            void runGenerate("any");
          }}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid var(--color-stroke-strong)",
            background: "var(--color-background)",
            color: "var(--color-text-strong)",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          🔄 Regenerate ideas
        </button>
      </section>
    </div>
  );
}
