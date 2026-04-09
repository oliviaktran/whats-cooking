import { useEffect } from "react";

export function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 96,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "min(430px, 100% - 32px)",
        width: "100%",
        textAlign: "center",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          display: "inline-block",
          background: "var(--color-pill)",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: 12,
          boxShadow: "var(--shadow-overlay)",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {message}
      </span>
    </div>
  );
}
