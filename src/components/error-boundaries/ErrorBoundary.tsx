"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  /** Optional label describing what this boundary guards. E.g. "Pipeline view" */
  name?: string;
  /** Optional fallback. If not supplied the default one is used. */
  fallback?: (err: Error, reset: () => void) => ReactNode;
  /** Children to render when there is no error. */
  children: ReactNode;
}

interface State {
  error: Error | null;
  hasError: boolean;
}

/**
 * Generic React error boundary.
 * Catches errors in its subtree and renders a neobrutalist-styled fallback
 * panel, with an optional "Try again" reset and, in dev, a stack-trace panel.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    /* eslint-disable no-console */
    console.group(
      `%cErrorBoundary${this.props.name ? ` · ${this.props.name}` : ""}`,
      "background:hsl(350,70%,50%);color:#fff;padding:2px 8px;border-radius:4px;"
    );
    console.error(error);
    console.info("componentStack:", info.componentStack);
    console.groupEnd();
    /* eslint-enable no-console */
  }

  private reset = () => {
    this.setState({ error: null, hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    if (typeof this.props.fallback === "function") {
      return this.props.fallback(this.state.error, this.reset);
    }

    const name = this.props.name ?? "This section";

    return (
      <div
        className={styles.wrap}
        role="alert"
        aria-live="assertive"
      >
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.icon} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>{name} ran into a problem</h2>
              <p className={styles.message}>{this.state.error.message}</p>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error.stack ? (
            <details className={styles.stack} open={false}>
              <summary>Stack trace (dev only)</summary>
              <pre>{this.state.error.stack}</pre>
            </details>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={this.reset}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Reload page
            </button>
          </div>

          <p className={styles.footer}>
            If this keeps happening,{" "}
            <a href="mailto:hello@accessdiff.dev" className={styles.link}>
              let the AccessDiff team know
            </a>
            .
          </p>
        </div>
      </div>
    );
  }
}
