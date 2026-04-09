import { NavLink } from "react-router-dom";

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 600,
  border: "1px solid var(--color-stroke-strong)",
  whiteSpace: "nowrap",
};

export function HeaderNav() {
  return (
    <nav
      className="tab-row"
      style={{ gap: 10, marginBottom: 20 }}
      aria-label="Primary"
    >
      <NavLink
        to="/"
        end
        aria-label="AI powered meal generator"
        style={({ isActive }) => ({
          ...pill,
          background: isActive ? "var(--color-primary)" : "var(--color-background)",
          color: isActive ? "var(--color-on-primary)" : "var(--color-text-strong)",
          borderColor: isActive ? "var(--color-primary)" : "var(--color-stroke-strong)",
        })}
      >
        ✨ AI powered meal generator
      </NavLink>
      <NavLink
        to="/design"
        aria-label="Design system reference"
        style={({ isActive }) => ({
          ...pill,
          background: isActive ? "var(--color-pill)" : "var(--color-background)",
          color: isActive ? "#fff" : "var(--color-text-strong)",
          borderColor: isActive ? "var(--color-pill)" : "var(--color-stroke-strong)",
        })}
      >
        🎨 Design system
      </NavLink>
    </nav>
  );
}
