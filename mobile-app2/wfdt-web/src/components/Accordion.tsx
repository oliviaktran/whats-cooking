import { useId, useState, type ReactNode } from "react";

type Props = {
  title: string;
  summary: ReactNode;
  children: ReactNode;
};

export function Accordion({ title, summary, children }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div
      className="card"
      style={{
        overflow: "hidden",
        marginTop: 16,
        boxShadow: "var(--shadow-raised-x2)",
      }}
    >
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          border: "none",
          background: "var(--color-background)",
          textAlign: "left",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--color-text-strong)",
        }}
      >
        <span>{title}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="text-tiny" style={{ fontWeight: 500 }}>
            {summary}
          </span>
          <span aria-hidden style={{ fontSize: 14 }}>
            {open ? "▴" : "▾"}
          </span>
        </span>
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-btn`}
          style={{
            padding: "20px 16px 16px",
            borderTop: "1px solid var(--color-stroke-weak)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
