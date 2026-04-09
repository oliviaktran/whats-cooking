import { useLayoutEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchGeneratePrompt, fetchSwap } from "../lib/api";
import { MacroBar } from "../components/MacroBar";
import { Toast } from "../components/Toast";
import { recipeById } from "../lib/recipeById";
import { useApp } from "../state/useApp";
import type { Ingredient } from "../types";

export function RecipePage() {
  const { id } = useParams();
  const rid = id ? decodeURIComponent(id) : "";
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const recipe = recipeById(state.recipes, rid);

  const [ings, setIngs] = useState<Ingredient[]>([]);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Which ingredient field is focused: `"<id>:quantity"` | `"<id>:name"` | null */
  const [focusedIngredientKey, setFocusedIngredientKey] = useState<string | null>(
    null,
  );

  useLayoutEffect(() => {
    if (recipe) {
      setIngs(recipe.ingredients.map((x) => ({ ...x })));
      setIsEditing(false);
      setFocusedIngredientKey(null);
    }
  }, [recipe]);

  if (!recipe) {
    return (
      <div style={{ padding: 24 }}>
        <p>Recipe not found.</p>
        <button type="button" onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    );
  }

  const activeRecipe = recipe;

  const ingredientsText = useMemo(
    () =>
      ings
        .map((i) => `${(i.quantity ?? "").trim()} ${(i.name ?? "").trim()}`.trim())
        .filter(Boolean)
        .join("\n"),
    [ings],
  );

  async function onSwap(ing: Ingredient) {
    setSwappingId(ing.id);
    try {
      const sub = await fetchSwap(ing.name, activeRecipe.title);
      setIngs((prev) =>
        prev.map((x) =>
          x.id === ing.id
            ? { ...x, quantity: sub.quantity, name: sub.name }
            : x
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setSwappingId(null);
    }
  }

  function onRemove(ing: Ingredient) {
    setIngs((prev) => prev.filter((x) => x.id !== ing.id));
  }

  function onChangeIng(
    ingId: string,
    patch: Partial<Pick<Ingredient, "quantity" | "name">>,
  ) {
    setIngs((prev) => prev.map((x) => (x.id === ingId ? { ...x, ...patch } : x)));
  }

  function blurIngredientRow(ingId: string) {
    window.setTimeout(() => {
      const a = document.activeElement;
      if (
        a instanceof HTMLElement &&
        a.getAttribute("data-ing-row") === ingId
      ) {
        return;
      }
      setFocusedIngredientKey((k) =>
        k?.startsWith(`${ingId}:`) ? null : k,
      );
    }, 0);
  }

  async function onRegenerateFromIngredients() {
    setRegenerating(true);
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const prompt = `You are a professional chef. Regenerate recipe ideas using this ingredient list.

Context:
- The user is editing the ingredients for: "${activeRecipe.title}".
- Use the edited ingredient list below as the PRIMARY constraint.

Edited ingredient list (quantity + ingredient):
${ingredientsText || "(empty)"}

Hard requirements:
- Return EXACTLY 3 recipes.
- Each recipe MUST include:
  - ingredients: an array of 6–12 objects, each with { "id", "quantity", "name" }.
  - steps: an array of 4–8 strings (no numbering like "1." inside the string).
- Each recipe MUST use at least 6 ingredients from the edited list (same ingredient names, close matches ok).
- If an ingredient list item is obviously a protein/carb/veg, do not replace it with a different one.
- Keep steps specific and name real ingredients from the recipe.
- Return ONLY valid JSON, no markdown.

Return a JSON array of 3 recipes. Each object must include:
{
  "id": "unique-slug",
  "emoji": "single food emoji",
  "title": "Recipe Name",
  "description": "1-2 sentence tagline",
  "cookTime": "X mins",
  "difficulty": "Easy | Medium | Hard",
  "calories": 500,
  "macros": { "protein": 38, "carbs": 50, "fat": 17 },
  "ingredients": [{ "id": "1", "quantity": "300g", "name": "salmon" }],
  "steps": ["Step 1.", "Step 2."],
  "isTopPick": true
}

Mark exactly one recipe with "isTopPick": true.`;

      const recipes = await fetchGeneratePrompt(state, prompt, {
        freeText: `Ingredient edits for ${activeRecipe.title}:\n${ingredientsText}`,
      });

      dispatch({ type: "SET_RECIPES", payload: recipes });
      const top = recipes.find((r) => r.isTopPick) ?? recipes[0];
      if (top) {
        navigate(`/recipe/${encodeURIComponent(top.id)}`);
        setToast("Regenerated recipes ✓");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
      setRegenerating(false);
    }
  }

  async function exportList() {
    const text = ings.map((i) => `${i.quantity} ${i.name}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied to clipboard ✓");
    } catch {
      setToast("Could not copy — try again");
    }
  }

  return (
    <div style={{ padding: "20px 16px 40px" }}>
      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            fontWeight: 700,
            textDecoration: "underline",
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => void exportList()}
          aria-label="Export ingredients"
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid var(--color-stroke-strong)",
            background: "var(--color-background)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ↑ Export ingredients
        </button>
      </header>

      <p style={{ fontSize: 48, margin: "0 0 8px" }} aria-hidden>
        {recipe.emoji}
      </p>
      <h1 style={{ marginBottom: 12 }}>{recipe.title}</h1>
      <div className="chip-grid" style={{ marginBottom: 16 }}>
        <span
          className="text-tiny"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--color-fill)",
            border: "1px solid var(--color-stroke-strong)",
          }}
        >
          ⏱ {recipe.cookTime}
        </span>
        <span
          className="text-tiny"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--color-fill)",
            border: "1px solid var(--color-stroke-strong)",
          }}
        >
          {recipe.difficulty}
        </span>
        <span
          className="text-tiny"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: "var(--color-fill)",
            border: "1px solid var(--color-stroke-strong)",
          }}
        >
          🔥 {recipe.calories} kcal
        </span>
      </div>
      <MacroBar macros={recipe.macros} />

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h3>Ingredients</h3>
          <span className="text-tiny">{isEditing ? "edit ingredients" : "swap or remove"}</span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {ings.map((ing, index) => (
            <li
              key={ing.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 0",
                borderBottom:
                  index < ings.length - 1
                    ? "1px solid var(--color-stroke-strong)"
                    : "none",
              }}
            >
              {isEditing ? (
                <span
                  style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "110px 1fr",
                    gap: 10,
                  }}
                >
                  <input
                    value={ing.quantity}
                    data-ing-row={ing.id}
                    onChange={(e) => onChangeIng(ing.id, { quantity: e.target.value })}
                    onFocus={() => setFocusedIngredientKey(`${ing.id}:quantity`)}
                    onBlur={() => blurIngredientRow(ing.id)}
                    placeholder="qty"
                    aria-label={`Quantity for ${ing.name}`}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        focusedIngredientKey === `${ing.id}:quantity`
                          ? "2px solid var(--color-primary)"
                          : "2px solid var(--color-stroke-strong)",
                      background: "var(--color-background)",
                      color: "var(--color-text-strong)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  />
                  <input
                    value={ing.name}
                    data-ing-row={ing.id}
                    onChange={(e) => onChangeIng(ing.id, { name: e.target.value })}
                    onFocus={() => setFocusedIngredientKey(`${ing.id}:name`)}
                    onBlur={() => blurIngredientRow(ing.id)}
                    placeholder="ingredient"
                    aria-label={`Ingredient name for ${ing.name}`}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        focusedIngredientKey === `${ing.id}:name`
                          ? "2px solid var(--color-primary)"
                          : "2px solid var(--color-stroke-strong)",
                      background: "var(--color-background)",
                      color: "var(--color-text-strong)",
                      fontWeight: 600,
                      fontSize: 14,
                      width: "100%",
                    }}
                  />
                </span>
              ) : (
                <span style={{ flex: 1 }} className="ingredient-swap-in">
                  <strong>{ing.quantity}</strong> {ing.name}
                </span>
              )}
              <button
                type="button"
                aria-label={isEditing ? "Edit ingredients" : `Swap ${ing.name}`}
                disabled={isEditing ? false : swappingId === ing.id}
                onClick={() => {
                  if (!isEditing) setIsEditing(true);
                  else void onSwap(ing);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  background: "var(--color-primary)",
                  fontWeight: 700,
                  color: "var(--color-on-primary)",
                }}
              >
                ↻
              </button>
              <button
                type="button"
                aria-label={`Remove ${ing.name}`}
                onClick={() => onRemove(ing)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "1px solid var(--color-stroke-strong)",
                  background: "var(--color-background)",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {isEditing ? (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              disabled={regenerating || state.isLoading}
              onClick={() => void onRegenerateFromIngredients()}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "none",
                background: "var(--color-pill)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              ✨ Regenerate recipe from ingredients
            </button>
            <button
              type="button"
              onClick={() => {
                setFocusedIngredientKey(null);
                setIsEditing(false);
              }}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid var(--color-stroke-strong)",
                background: "var(--color-background)",
                color: "var(--color-text-strong)",
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              Done editing
            </button>
          </div>
        ) : null}
      </section>

      <section style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 16 }}>Method</h3>
        <ol style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
          {recipe.steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 14,
                alignItems: "flex-start",
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: "0 0 32px",
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  color: "var(--color-on-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, paddingTop: 4 }}>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
