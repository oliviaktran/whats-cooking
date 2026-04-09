import { Link } from "react-router-dom";
import { HeaderNav } from "../components/HeaderNav";
import { MacroBar } from "../components/MacroBar";

const swatches = [
  { name: "primary", var: "--color-primary", usage: "Wine — brand, selected, CTA" },
  { name: "onPrimary", var: "--color-on-primary", usage: "Text on primary surfaces" },
  { name: "textStrong", var: "--color-text-strong", usage: "Primary text" },
  { name: "textWeak", var: "--color-text-weak", usage: "Secondary text" },
  { name: "strokeStrong", var: "--color-stroke-strong", usage: "Borders" },
  { name: "strokeWeak", var: "--color-stroke-weak", usage: "Page background" },
  { name: "fill", var: "--color-fill", usage: "Inputs, stepper bg" },
  { name: "background", var: "--color-background", usage: "Cards, chips" },
  { name: "pill", var: "--color-pill", usage: "Selected pill / dark btn" },
] as const;

export function DesignPage() {
  return (
    <div style={{ padding: "20px 16px 48px" }}>
      <HeaderNav />
      <h1 style={{ marginBottom: 8 }}>Design system</h1>
      <p className="text-tiny" style={{ marginBottom: 24 }}>
        Reference for <Link to="/">Forkcast</Link> tokens and primitives.
      </p>

      <section className="card" style={{ padding: 16, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Colour tokens</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {swatches.map((s) => (
            <div
              key={s.name}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `var(${s.var})`,
                  border: "1px solid var(--color-stroke-strong)",
                }}
              />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                  {s.name}
                </p>
                <p className="text-tiny" style={{ margin: 0 }}>
                  {s.usage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 16, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Typography</h3>
        <h1>Heading 1</h1>
        <h2 style={{ marginTop: 12 }}>Heading 2</h2>
        <h3 style={{ marginTop: 12 }}>Heading 3</h3>
        <p style={{ marginTop: 12 }}>Body / Small 16px</p>
        <p className="text-tiny" style={{ marginTop: 8 }}>
          Tiny metadata 14px
        </p>
      </section>

      <section className="card" style={{ padding: 16, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Buttons</h3>
        <button
          type="button"
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "var(--color-primary)",
            color: "var(--color-on-primary)",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Primary
        </button>
        <button
          type="button"
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid var(--color-stroke-strong)",
            background: "var(--color-background)",
            color: "var(--color-text-strong)",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Secondary
        </button>
        <button
          type="button"
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "var(--color-pill)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Dark
        </button>
      </section>

      <section className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Macro bar</h3>
        <MacroBar
          macros={{ protein: 38, carbs: 50, fat: 17 }}
        />
      </section>
    </div>
  );
}
