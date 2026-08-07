"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ErrorBoundary from "@/components/error-boundaries/ErrorBoundary";
import styles from "./error.module.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[Global error boundary]", error);
  }, [error]);

  return (
    <div className={styles.root}>
      <ErrorBoundary
        name="AccessDiff"
        fallback={() => (
          <div role="alert" className={styles.alertCard}>
            <h2 className={styles.heading}>Something went wrong</h2>
            <p className={styles.message}>
              {error.message ?? "An unexpected error interrupted the page."}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={reset}
                className={styles.btnPrimary}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className={styles.btnSecondary}
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}
      >
        <div />
      </ErrorBoundary>
    </div>
  );
}
