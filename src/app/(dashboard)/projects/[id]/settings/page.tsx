"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import styles from "./page.module.css";

interface CicdSettings {
  id: string;
  project_id: string;
  github_actions_enabled: boolean;
  github_actions_workflow_path: string;
  webhook_enabled: boolean;
  webhook_secret?: string | null;
  webhook_url?: string | null;
  webhook_last_delivered_at?: string | null;
  fail_on_critical: boolean;
  fail_on_major: boolean;
  fail_on_minor: boolean;
  tolerance_critical: number;
  tolerance_major: number;
  tolerance_minor: number;
  auto_approve_low_risk: boolean;
  auto_approve_confidence: number | null;
  pr_comment_enabled: boolean;
  pr_status_check_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface WebhookDelivery {
  id: string;
  event_type: string;
  status_code: number;
  success: boolean;
  source: string;
  created_at: string;
  pipeline_run_id: string | null;
}

interface CicdPayload {
  data: {
    settings: CicdSettings;
    deliveries: WebhookDelivery[];
    workflowYamlReference: string;
    github: {
      webhook_url: string;
      repo: string;
    };
  };
}

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payload, setPayload] = useState<CicdPayload | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [revealSecret, setRevealSecret] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/cicd`);
        const json = (await res.json()) as CicdPayload;
        setPayload(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const settings = payload?.data.settings ?? null;

  async function updateSetting<K extends keyof CicdSettings>(
    key: K,
    value: CicdSettings[K]
  ) {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cicd`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const json = (await res.json()) as { data: CicdSettings | null };
      if (json.data) {
        setPayload((p) =>
          p ? { ...p, data: { ...p.data, settings: json.data! } } : p
        );
      }
      flash("Saved");
    } finally {
      setSaving(false);
    }
  }

  async function rotateSecret() {
    if (!confirm("Rotate the webhook secret? Existing GitHub webhooks will stop delivering.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cicd/rotate-secret`, {
        method: "POST",
      });
      const json = (await res.json()) as { data: { webhook_secret: string } | null };
      if (json.data && settings) {
        setPayload((p) =>
          p
            ? {
                ...p,
                data: {
                  ...p.data,
                  settings: {
                    ...p.data.settings,
                    webhook_secret: json.data!.webhook_secret,
                  },
                },
              }
            : p
        );
      }
      flash("Secret rotated");
      setRevealSecret(true);
    } finally {
      setSaving(false);
    }
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height={40} />
        <Skeleton height={320} style={{ marginTop: "1rem" }} />
        <Skeleton height={260} style={{ marginTop: "1rem" }} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.empty}>
          <h2>Failed to load CI/CD settings</h2>
          <p>Refresh the page to try again.</p>
        </Card>
      </div>
    );
  }

  const deliveries = payload?.data.deliveries ?? [];

  return (
    <div className={styles.container}>
      <div>
        <p className={styles.eyebrow}>Project Settings · {payload?.data.github.repo ?? projectId}</p>
        <h1 className={styles.title}>CI/CD & Webhooks</h1>
        <p className={styles.description}>
          Auto-run AccessDiff accessibility regression audits on every push and PR. Configure thresholds,
          PR decoration, and rotating webhook credentials.
        </p>
      </div>

      {/* 1. GitHub Actions */}
      <Card padding="lg" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>GitHub Actions Integration</h2>
            <p className={styles.sectionSub}>
              Add the AccessDiff workflow to your repository to run audits on every push and PR.
            </p>
          </div>
          <Toggle
            checked={settings.github_actions_enabled}
            onChange={(v) => updateSetting("github_actions_enabled", v)}
            disabled={saving}
          />
        </div>

        <div className={styles.codeBlock}>
          <div className={styles.codeTitle}>
            <span>{payload?.data.workflowYamlReference ?? ".github/workflows/accessdiff-ci.yml"}</span>
            <Badge variant="outline" size="sm">
              YAML
            </Badge>
          </div>
          <pre className={styles.code} aria-label="AccessDiff workflow YAML sample">
{`name: AccessDiff CI
on: [push, pull_request]
jobs:
  accessdiff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npx accessdiff-audit \\
          --repo=\${{ github.repository }} \\
          --base=\${{ github.event.pull_request.base.sha || github.event.before }} \\
          --head=\${{ github.event.pull_request.head.sha || github.event.after }} \\
          --fail-on=major`}
          </pre>
        </div>

        <p className={styles.hint}>
          Required secrets in your repo: <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>GROQ_API_KEY</code>
        </p>
      </Card>

      {/* 2. Webhooks */}
      <Card padding="lg" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>GitHub Webhooks</h2>
            <p className={styles.sectionSub}>
              Ingest push and PR events and trigger AccessDiff pipelines automatically.
            </p>
          </div>
          <Toggle
            checked={settings.webhook_enabled}
            onChange={(v) => updateSetting("webhook_enabled", v)}
            disabled={saving}
          />
        </div>

        <div className={styles.webhookGrid}>
          <Field
            label="Payload URL"
            value={settings.webhook_url ?? payload?.data.github.webhook_url ?? ""}
            mono
            copyable
          />
          <div>
            <label className={styles.fieldLabel}>Secret</label>
            <div className={styles.secretRow}>
              <code className={styles.mono}>
                {revealSecret ? settings.webhook_secret ?? "—" : "••••••••••••••••"}
              </code>
              <Button variant="ghost" size="sm" onClick={() => setRevealSecret((v) => !v)}>
                {revealSecret ? "Hide" : "Reveal"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rotateSecret}
                isLoading={saving}
              >
                Rotate
              </Button>
            </div>
          </div>
          <Field
            label="Last delivery"
            value={
              settings.webhook_last_delivered_at
                ? new Date(settings.webhook_last_delivered_at).toLocaleString()
                : "No deliveries yet"
            }
            mono={false}
          />
        </div>

        <div className={styles.hintBox}>
          <p className={styles.hintTitle}>How to set up in GitHub</p>
          <ol className={styles.steps}>
            <li>
              Go to <strong>Repo → Settings → Webhooks → Add webhook</strong>
            </li>
            <li>Paste the Payload URL and Secret above</li>
            <li>
              Content type → <code>application/json</code>
            </li>
            <li>
              SSL verification → Enable
            </li>
            <li>
              Events → <strong>Just the push event</strong> +{" "}
              <strong>Pull requests</strong>
            </li>
          </ol>
        </div>
      </Card>

      {/* 3. Thresholds */}
      <Card padding="lg" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Failure Thresholds</h2>
            <p className={styles.sectionSub}>
              Fail the pipeline when NEW regressions of a given severity exceed your tolerance.
            </p>
          </div>
        </div>

        <div className={styles.thresholdGrid}>
          <ThresholdRow
            severity="critical"
            label="Critical"
            failOn={settings.fail_on_critical}
            tolerance={settings.tolerance_critical}
            onChangeFail={(v) => updateSetting("fail_on_critical", v)}
            onChangeTol={(v) => updateSetting("tolerance_critical", v)}
          />
          <ThresholdRow
            severity="major"
            label="Major"
            failOn={settings.fail_on_major}
            tolerance={settings.tolerance_major}
            onChangeFail={(v) => updateSetting("fail_on_major", v)}
            onChangeTol={(v) => updateSetting("tolerance_major", v)}
          />
          <ThresholdRow
            severity="minor"
            label="Minor"
            failOn={settings.fail_on_minor}
            tolerance={settings.tolerance_minor}
            onChangeFail={(v) => updateSetting("fail_on_minor", v)}
            onChangeTol={(v) => updateSetting("tolerance_minor", v)}
          />
        </div>
      </Card>

      {/* 4. Auto-approve & PR decoration */}
      <Card padding="lg" className={styles.section}>
        <h2 className={styles.sectionTitle}>Automation & PR Decoration</h2>
        <p className={styles.sectionSub}>
          Auto-approve low-risk fixes and leave inline feedback on pull requests.
        </p>

        <div className={styles.toggleList}>
          <ToggleRow
            label="Auto-approve low-risk fixes"
            description="Automatically mark fixes with 'low' risk as approved when confidence meets threshold."
            checked={settings.auto_approve_low_risk}
            onChange={(v) => updateSetting("auto_approve_low_risk", v)}
          />
          <div className={styles.confidenceRow}>
            <label className={styles.fieldLabel}>
              Min confidence for auto-approve (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={settings.auto_approve_confidence ?? 0}
              disabled={!settings.auto_approve_low_risk}
              onChange={(e) =>
                updateSetting(
                  "auto_approve_confidence",
                  Number(e.target.value)
                )
              }
              className={styles.numberInput}
            />
          </div>
          <ToggleRow
            label="Comment on PRs"
            description="Post a PR comment summary of the AccessDiff audit result."
            checked={settings.pr_comment_enabled}
            onChange={(v) => updateSetting("pr_comment_enabled", v)}
          />
          <ToggleRow
            label="Status check on commits"
            description="Create a GitHub commit status so PRs can be blocked by regressions."
            checked={settings.pr_status_check_enabled}
            onChange={(v) => updateSetting("pr_status_check_enabled", v)}
          />
        </div>
      </Card>

      {/* 5. Recent deliveries */}
      <Card padding="lg" className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Webhook Deliveries</h2>
        {deliveries.length === 0 ? (
          <div className={styles.emptyInline}>
            No deliveries yet. Trigger a push or PR to populate this list.
          </div>
        ) : (
          <ul className={styles.deliveryList}>
            {deliveries.map((d) => (
              <li key={d.id} className={styles.deliveryItem}>
                <Badge
                  variant={d.success ? "success" : "error"}
                  size="sm"
                >
                  {d.status_code}
                </Badge>
                <span className={styles.deliveryEvent}>{d.event_type}</span>
                <span className={styles.deliverySource}>{d.source}</span>
                <span className={styles.deliveryTime}>
                  {new Date(d.created_at).toLocaleString()}
                </span>
                {d.pipeline_run_id ? (
                  <Badge variant="outline" size="sm">
                    {d.pipeline_run_id.slice(0, 8)}…
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {toast ? <div className={styles.toast} role="status">{toast}</div> : null}
    </div>
  );
}

/* ───────────────── sub-components ───────────────── */

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={styles.toggleRow}>
      <div>
        <div className={styles.toggleRowLabel}>{label}</div>
        <div className={styles.toggleRowDesc}>{description}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldValue}>
        <span className={mono ? styles.mono : ""}>{value}</span>
        {copyable ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard?.writeText(value)}
          >
            Copy
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ThresholdRow({
  severity,
  label,
  failOn,
  tolerance,
  onChangeFail,
  onChangeTol,
}: {
  severity: "critical" | "major" | "minor";
  label: string;
  failOn: boolean;
  tolerance: number;
  onChangeFail: (v: boolean) => void;
  onChangeTol: (v: number) => void;
}) {
  return (
    <div className={`${styles.thresholdRow} ${styles[`severity_${severity}`]}`}>
      <div className={styles.thresholdHeader}>
        <span className={styles.thresholdLabel}>{label}</span>
        <Toggle checked={failOn} onChange={onChangeFail} />
      </div>
      <div className={styles.thresholdBody}>
        <label className={styles.fieldLabel}>
          Tolerance (allowed NEW {label.toLowerCase()} regressions)
        </label>
        <input
          type="number"
          min={0}
          step={1}
          value={tolerance}
          onChange={(e) => onChangeTol(Math.max(0, Number(e.target.value)))}
          className={styles.numberInput}
          disabled={!failOn}
        />
      </div>
    </div>
  );
}
