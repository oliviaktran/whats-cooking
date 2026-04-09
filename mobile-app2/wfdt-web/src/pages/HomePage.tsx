import { useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { MACRO_PRESETS } from "../data/macroPresets";
import { carbTabs, proteinTabs, vegetableTabs } from "../data/taxonomy";
import { HeaderNav } from "../components/HeaderNav";
import { Stepper } from "../components/Stepper";
import { Accordion } from "../components/Accordion";
import { VoiceMicIcon } from "../components/VoiceMicIcon";
import { adjustMacroSplit } from "../lib/adjustMacroSplit";
import { buildGeneratePrompt, fetchGeneratePrompt } from "../lib/api";
import { useApp } from "../state/useApp";

type WebSpeechCtor = new () => {
  lang: string;
  start(): void;
  onresult:
    | ((this: unknown, ev: { results: Iterable<{ 0: { transcript: string } }> }) => void)
    | null;
};

function servingsLabel(n: number) {
  if (n === 1) return "Just me";
  if (n === 2) return "Two of us";
  return `${n} servings`;
}

function TabRow({
  tabs,
  activeId,
  onChange,
  label,
}: {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="tab-row">
      {tabs.map((t) => {
        const selected = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`tab-${t.id}`}
            onClick={() => onChange(t.id)}
            style={{
              flex: "0 0 auto",
              padding: "10px 14px",
              borderRadius: 999,
              border: selected
                ? "none"
                : "1px solid var(--color-stroke-strong)",
              background: selected ? "var(--color-pill)" : "var(--color-background)",
              color: selected ? "#fff" : "var(--color-text-strong)",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Chip({
  selected,
  onToggle,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid var(--color-stroke-strong)`,
        background: selected ? "var(--color-primary)" : "var(--color-background)",
        color: selected ? "var(--color-on-primary)" : "var(--color-text-strong)",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

function ChipSection({
  items,
  selected,
  onToggle,
  onAddCustom,
  searchPlaceholder,
  panelId,
  customAddCategoryLabel,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onAddCustom: (item: string) => void;
  searchPlaceholder: string;
  panelId: string;
  customAddCategoryLabel: string;
}) {
  const [q, setQ] = useState("");
  const trimmed = q.trim().replace(/\s+/g, " ");
  const filtered = useMemo(
    () =>
      items.filter((i) => i.toLowerCase().includes(trimmed.toLowerCase())),
    [items, trimmed]
  );

  const alreadySelected =
    trimmed.length > 0 &&
    selected.some((s) => s.toLowerCase() === trimmed.toLowerCase());

  const showAddCustom =
    trimmed.length > 0 &&
    filtered.length === 0 &&
    !alreadySelected &&
    trimmed.length <= 120;

  function addCustom() {
    if (!showAddCustom) return;
    onAddCustom(trimmed);
    setQ("");
  }

  return (
    <div
      id={panelId}
      role="tabpanel"
      className="tab-panel-enter"
      style={{ marginTop: 12 }}
    >
      <label className="sr-only" htmlFor={`${panelId}-search`}>
        Search ingredients
      </label>
      <input
        id={`${panelId}-search`}
        type="search"
        placeholder={searchPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && showAddCustom) {
            e.preventDefault();
            addCustom();
          }
        }}
        aria-label={searchPlaceholder}
        aria-describedby={
          showAddCustom ? `${panelId}-add-custom-hint` : undefined
        }
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid var(--color-stroke-strong)",
          background: "var(--color-fill)",
          marginBottom: 12,
          fontSize: 16,
        }}
      />
      {showAddCustom && (
        <div
          id={`${panelId}-add-custom-hint`}
          style={{ marginBottom: 12 }}
        >
          <p className="text-tiny" style={{ margin: "0 0 8px" }}>
            No matches in this category. You can still add it.
          </p>
          <button
            type="button"
            onClick={addCustom}
            aria-label={`Add ${trimmed} as ${customAddCategoryLabel}`}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid var(--color-stroke-strong)",
              background: "var(--color-primary)",
              color: "var(--color-on-primary)",
              fontSize: 14,
              fontWeight: 700,
              width: "100%",
            }}
          >
            + Add &quot;{trimmed}&quot; as {customAddCategoryLabel}
          </button>
        </div>
      )}
      <div className="chip-grid">
        {filtered.map((item) => (
          <Chip
            key={item}
            selected={selected.includes(item)}
            onToggle={() => onToggle(item)}
          >
            {item}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function SelectedPills({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (item: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="chip-grid" style={{ marginTop: 10 }}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-label={`Remove ${item}`}
          onClick={() => onRemove(item)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            border: "none",
            background: "var(--color-pill)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {item}
          <span aria-hidden>×</span>
        </button>
      ))}
    </div>
  );
}

export function HomePage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [generateError, setGenerateError] = useState<string | null>(null);

  const proteinTab = proteinTabs.find((t) => t.id === state.activeProteinTab);
  const carbTab = carbTabs.find((t) => t.id === state.activeCarbTab);
  const vegTab = vegetableTabs.find((t) => t.id === state.activeVegSeason);

  async function onGenerate() {
    setGenerateError(null);
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const prompt = buildGeneratePrompt(state);
      const recipes = await fetchGeneratePrompt(state, prompt);
      dispatch({ type: "SET_RECIPES", payload: recipes });
      dispatch({ type: "SET_CUISINE", payload: "any" });
      if (recipes.length === 0) {
        setGenerateError(
          "No recipes came back from the model. Try again or tweak your choices.",
        );
        return;
      }
      navigate("/results");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setGenerateError(msg);
      console.error("[generate]", msg);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  function startVoice() {
    const w = window as typeof window & {
      SpeechRecognition?: WebSpeechCtor;
      webkitSpeechRecognition?: WebSpeechCtor;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (ev: { results: Iterable<{ 0: { transcript: string } }> }) => {
      const text = Array.from(ev.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) {
        dispatch({
          type: "SET_FREE_TEXT",
          payload: state.freeText ? `${state.freeText} ${text}` : text,
        });
      }
    };
    rec.start();
  }

  const macroSummary = `${state.calories} kcal · ${state.macros.protein}P/${state.macros.carbs}C/${state.macros.fat}F`;

  const servingsId = "servings-label";

  return (
    <div style={{ padding: "20px 16px 120px" }}>
      <HeaderNav />

      <h1
        className="heading-1-schoolbell"
        style={{ marginBottom: 8, color: "var(--color-primary)" }}
      >
        🍴 What’s Cooking?
      </h1>
      <p className="text-tiny" style={{ marginBottom: 24 }}>
        Pick ingredients and we&apos;ll suggest meals with full nutrition.
      </p>

      <section style={{ marginBottom: 4 }}>
        <p id={servingsId} style={{ fontWeight: 700, margin: "0 0 10px" }}>
          How many servings?
        </p>
        <Stepper
          labelId={servingsId}
          value={state.servings}
          onChange={(n) => dispatch({ type: "SET_SERVINGS", payload: n })}
          secondaryLabel={servingsLabel(state.servings)}
        />
      </section>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Protein</h3>
        <TabRow
          label="Protein category"
          tabs={proteinTabs}
          activeId={state.activeProteinTab}
          onChange={(id) =>
            dispatch({ type: "SET_ACTIVE_PROTEIN_TAB", payload: id })
          }
        />
        {proteinTab && (
          <ChipSection
            panelId="protein-panel"
            items={proteinTab.items}
            selected={state.selectedProteins}
            onToggle={(item) =>
              dispatch({ type: "TOGGLE_LIST", field: "selectedProteins", item })
            }
            onAddCustom={(item) =>
              dispatch({ type: "TOGGLE_LIST", field: "selectedProteins", item })
            }
            customAddCategoryLabel="protein"
            searchPlaceholder={`Search ${proteinTab.label.replace(/^[^\s]+\s/, "")}...`}
          />
        )}
        <SelectedPills
          items={state.selectedProteins}
          onRemove={(item) =>
            dispatch({ type: "REMOVE_LIST", field: "selectedProteins", item })
          }
        />
      </section>

      <section style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Carbs</h3>
        <TabRow
          label="Carb category"
          tabs={carbTabs}
          activeId={state.activeCarbTab}
          onChange={(id) =>
            dispatch({ type: "SET_ACTIVE_CARB_TAB", payload: id })
          }
        />
        {carbTab && (
          <ChipSection
            panelId="carb-panel"
            items={carbTab.items}
            selected={state.selectedCarbs}
            onToggle={(item) =>
              dispatch({ type: "TOGGLE_LIST", field: "selectedCarbs", item })
            }
            onAddCustom={(item) =>
              dispatch({ type: "TOGGLE_LIST", field: "selectedCarbs", item })
            }
            customAddCategoryLabel="carb"
            searchPlaceholder="Search carbs..."
          />
        )}
        <SelectedPills
          items={state.selectedCarbs}
          onRemove={(item) =>
            dispatch({ type: "REMOVE_LIST", field: "selectedCarbs", item })
          }
        />
      </section>

      <section style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Vegetables</h3>
        <TabRow
          label="Vegetable season"
          tabs={vegetableTabs}
          activeId={state.activeVegSeason}
          onChange={(id) =>
            dispatch({ type: "SET_ACTIVE_VEG_SEASON", payload: id })
          }
        />
        {vegTab && (
          <ChipSection
            panelId="veg-panel"
            items={vegTab.items}
            selected={state.selectedVegetables}
            onToggle={(item) =>
              dispatch({
                type: "TOGGLE_LIST",
                field: "selectedVegetables",
                item,
              })
            }
            onAddCustom={(item) =>
              dispatch({
                type: "TOGGLE_LIST",
                field: "selectedVegetables",
                item,
              })
            }
            customAddCategoryLabel="vegetable"
            searchPlaceholder="Search vegetables..."
          />
        )}
        <SelectedPills
          items={state.selectedVegetables}
          onRemove={(item) =>
            dispatch({
              type: "REMOVE_LIST",
              field: "selectedVegetables",
              item,
            })
          }
        />
      </section>

      <Accordion title="Calorie and macro details" summary={macroSummary}>
        <label className="text-tiny" htmlFor="kcal-input" style={{ display: "block", marginBottom: 6 }}>
          Target kcal per serving
        </label>
        <input
          id="kcal-input"
          className="input-kcal-no-spin"
          type="number"
          inputMode="numeric"
          min={200}
          max={2000}
          step={1}
          value={state.calories}
          onChange={(e) =>
            dispatch({
              type: "SET_CALORIES",
              payload: Number(e.target.value) || 500,
            })
          }
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid var(--color-stroke-strong)",
            marginBottom: 16,
            fontSize: 16,
          }}
        />
        <p className="text-tiny" style={{ margin: "0 0 8px", fontWeight: 700 }}>
          Macro split (100% total)
        </p>
        <div
          className="macro-preset-row"
          role="group"
          aria-label="Macro preset"
        >
          {MACRO_PRESETS.map((p) => {
            const selected = state.macroPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                aria-label={`${p.label}: ${p.macros.protein}% protein, ${p.macros.carbs}% carbs, ${p.macros.fat}% fat`}
                onClick={() =>
                  dispatch({ type: "APPLY_MACRO_PRESET", payload: p.id })
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1px solid var(--color-stroke-strong)`,
                  background: selected
                    ? "var(--color-primary)"
                    : "var(--color-background)",
                  color: selected
                    ? "var(--color-on-primary)"
                    : "var(--color-text-strong)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <p className="text-tiny" style={{ margin: "0 0 12px" }}>
          Fine-tune below — sliders switch you to a custom split.
        </p>
        {(["protein", "carbs", "fat"] as const).map((key) => {
          const trackColor =
            key === "protein"
              ? "#3b82f6"
              : key === "carbs"
                ? "#f59e0b"
                : "#ef4444";
          const wrapStyle = {
            "--macro-fill": `${state.macros[key]}%`,
            "--macro-track-fill": trackColor,
          } as CSSProperties;

          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <label
                className="text-tiny"
                htmlFor={`macro-${key}`}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ textTransform: "capitalize" }}>{key}</span>
                <span>{state.macros[key]}%</span>
              </label>
              <div className="macro-range-wrap" style={wrapStyle}>
                <input
                  id={`macro-${key}`}
                  className="macro-range"
                  type="range"
                  min={0}
                  max={100}
                  value={state.macros[key]}
                  onChange={(e) => {
                    const next = adjustMacroSplit(
                      key,
                      Number(e.target.value),
                      state.macros
                    );
                    dispatch({ type: "SET_MACROS", payload: next });
                  }}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={state.macros[key]}
                  aria-label={`${key} percent of calories`}
                />
              </div>
            </div>
          );
        })}
        <p className="text-tiny">
          Total:{" "}
          {state.macros.protein + state.macros.carbs + state.macros.fat}% (each
          bar is 0–100%; changing one rescales the others).
        </p>
      </Accordion>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Anything else?</h3>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 6,
            background: "var(--color-fill)",
            borderRadius: 12,
            border: "1px solid var(--color-stroke-strong)",
            padding: "4px 8px 4px 12px",
          }}
        >
          <input
            type="text"
            placeholder="e.g. nothing spicy, use up leftovers"
            value={state.freeText}
            onChange={(e) =>
              dispatch({ type: "SET_FREE_TEXT", payload: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              dispatch({ type: "ADD_FREE_TEXT_ITEM", payload: state.freeText });
            }}
            aria-label="Extra notes for the recipe"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: 16,
              minWidth: 0,
              padding: "10px 4px",
            }}
          />
          <button
            type="button"
            aria-label="Speak into this field"
            title="Speak into this field"
            onClick={startVoice}
            style={{
              flex: "0 0 48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "var(--color-background)",
              borderRadius: 10,
              color: "var(--color-text-strong)",
            }}
          >
            <VoiceMicIcon size={22} />
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          <SelectedPills
            items={state.freeTextItems}
            onRemove={(item) =>
              dispatch({ type: "REMOVE_FREE_TEXT_ITEM", payload: item })
            }
          />
        </div>
      </section>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: 430,
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
            background:
              "linear-gradient(180deg, transparent, var(--color-stroke-weak) 35%)",
          }}
        >
          {generateError ? (
            <div
              role="alert"
              style={{
                marginBottom: 10,
                padding: "12px 14px",
                borderRadius: 12,
                background: "color-mix(in srgb, #dc2626 12%, var(--color-background))",
                border: "1px solid color-mix(in srgb, #dc2626 35%, transparent)",
                color: "var(--color-text-strong)",
                fontSize: 14,
                lineHeight: 1.45,
              }}
            >
              {generateError}
            </div>
          ) : null}
          <button
            type="button"
            disabled={state.isLoading}
            onClick={onGenerate}
            className={state.isLoading ? "generate-loading" : undefined}
            aria-busy={state.isLoading}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 14,
              border: "none",
              fontWeight: 700,
              fontSize: 16,
              background: state.isLoading
                ? "var(--color-pill)"
                : "var(--color-primary)",
              color: state.isLoading ? "#fff" : "var(--color-on-primary)",
            }}
          >
            {state.isLoading ? "✨ Thinking up ideas..." : "✨ Generate meal"}
          </button>
        </div>
      </div>
    </div>
  );
}
