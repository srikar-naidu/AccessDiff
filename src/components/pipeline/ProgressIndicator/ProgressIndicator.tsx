"use client";

import type { ReactNode } from "react";
import type { PipelineStatus } from "../PipelineView/PipelineView";
import styles from "./ProgressIndicator.module.css";

export interface ProgressStep {
  id: string;
  label: string;
  status: PipelineStatus;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStageId?: string | null;
}

const CANONICAL_STAGES = [
  { id: "spec", label: "Spec" },
  { id: "build", label: "Build" },
  { id: "evaluate", label: "Evaluate" },
  { id: "diagnose", label: "Diagnose" },
  { id: "optimize", label: "Optimize" },
  { id: "governance", label: "Governance" },
];

/**
 * Visual ProgressIndicator displaying ADL pipeline stages with progress bar.
 * Automatically groups raw sub-agent executions into single stage indicators.
 *
 * Status resolution priority per canonical stage:
 *  1. If any sub-agent has "failed"   → "failed"
 *  2. If any sub-agent has "running"  → "running"
 *  3. If all sub-agents are "skipped" → "skipped"
 *  4. If all sub-agents are "completed" (or mix of completed+skipped) → "completed"
 *  5. currentStageId match            → "running"
 *  6. Otherwise                       → "pending"
 */
export default function ProgressIndicator({
  steps,
  currentStageId,
}: ProgressIndicatorProps): ReactNode {
  const displaySteps = CANONICAL_STAGES.map((canonical) => {
    const matchingEvents = steps.filter(
      (s) => s.label.toLowerCase() === canonical.id.toLowerCase()
    );

    let status: PipelineStatus = "pending";

    if (matchingEvents.length > 0) {
      if (matchingEvents.some((e) => e.status === "failed")) {
        status = "failed";
      } else if (matchingEvents.some((e) => e.status === "running")) {
        status = "running";
      } else if (matchingEvents.every((e) => e.status === "skipped")) {
        status = "skipped";
      } else if (matchingEvents.every((e) => e.status === "completed" || e.status === "skipped")) {
        status = "completed";
      } else {
        status = "running";
      }
    } else if (currentStageId?.toLowerCase() === canonical.id.toLowerCase()) {
      status = "running";
    }

    return {
      id: canonical.id,
      label: canonical.label,
      status,
    };
  });

  // Only count completed stages toward progress (skipped stages are not blocked — treat them as done)
  const doneCount = displaySteps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;
  const progressPercent = Math.round((doneCount / displaySteps.length) * 100);

  return (
    <div className={styles.container} role="region" aria-label="Pipeline progress">
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className={styles.stepsGrid}>
        {displaySteps.map((step) => {
          const itemClass = [
            styles.stepItem,
            styles[step.status] ?? styles.pending,
          ].join(" ");

          return (
            <div key={step.id} className={itemClass}>
              <span className={styles.stepDot} aria-hidden="true" />
              <div className={styles.stepText}>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepStatus}>{step.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
