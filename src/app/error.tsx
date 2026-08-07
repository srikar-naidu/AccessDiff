"use client";

import { useEffect } from "react";
import ErrorBoundary from "@/components/error-boundaries/ErrorBoundary";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[Global error boundary]", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ErrorBoundary
        name="AccessDiff"
        fallback={() => (
          <div
            role="alert"
            style={{
              maxWidth: 520,
              padding: "1.75rem",
              background: "#fff",
              border: "3px solid hsl(220, 22%, 40%)",
              borderRadius: 18,
              boxShadow: "6px 6px 0 0 hsl(350, 70%, 50%)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
              Something went wrong
            </h2>
            <p style={{ margin: 0, color: "hsl(220, 15%, 38%)", fontSize: "0.92rem", lineHeight: 1.6 }}>
              {error.message ?? "An unexpected error interrupted the page."}
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: 12,
                  border: "3px solid hsl(222, 26%, 20%)",
                  background: "hsl(12, 76%, 58%)",
                  color: "#fff",
                  fontWeight: 700,
                  boxShadow: "3px 3px 0 0 hsl(222, 26%, 20%)",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: 12,
                  border: "3px solid hsl(220, 22%, 40%)",
                  background: "#fff",
                  color: "hsl(222, 47%, 11%)",
                  fontWeight: 700,
                  boxShadow: "3px 3px 0 0 hsl(220, 22%, 40%)",
                  cursor: "pointer",
                }}
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}
      >
        {/* Never reached — error boundary always shows fallback here */}
        <div />
      </ErrorBoundary>
    </div>
  );
}
