"use client";

// Catches errors thrown in the root layout itself. Must render its own <html>.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <img src="/icons/icon-192.png" alt="Medipix" width={56} height={56} style={{ borderRadius: 14 }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#64748b", margin: 0, maxWidth: 320 }}>
          The app hit an unexpected error. Try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Reload app
        </button>
      </body>
    </html>
  );
}
