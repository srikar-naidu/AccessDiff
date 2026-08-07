import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/* ════════════════════════════════════════════════════════════════════════
   POST /api/webhooks/github
   Verifies GitHub's X-Hub-Signature-256 and handles:
     • push          → trigger AccessDiff pipeline for the pushed branch
     • pull_request  → trigger regression audit (open / synchronize)
   Always stores the delivery in webhook_deliveries for audit.
   ════════════════════════════════════════════════════════════════════════ */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const eventType = request.headers.get("x-github-event") ?? "unknown";
  const deliveryId = request.headers.get("x-github-delivery") ?? undefined;

  const headers = Object.fromEntries(request.headers.entries());

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { raw };
  }

  const supabase = createAdminClient();

  /* ── 1. Resolve project by full_name (if present in payload) ── */
  const repoFullName =
    (payload?.repository as Record<string, unknown> | undefined)?.full_name as string | undefined ??
    (payload?.organization as Record<string, unknown> | undefined)?.login as string | undefined ??
    undefined;

  let projectId: string | undefined;
  let userId: string | undefined;
  if (repoFullName) {
    const { data } = await supabase
      .from("projects")
      .select("id, user_id, github_repo")
      .eq("github_repo", repoFullName)
      .limit(1)
      .maybeSingle();
    projectId = data?.id;
    userId = data?.user_id as string | undefined;
  }

  /* ── 2. Look up CICD settings for the webhook secret ── */
  let settingsRow:
    | { webhook_secret: string | null; webhook_enabled: boolean }
    | undefined;
  if (projectId) {
    const { data } = await supabase
      .from("project_cicd_settings")
      .select("webhook_secret, webhook_enabled")
      .eq("project_id", projectId)
      .limit(1)
      .maybeSingle();
    settingsRow = data ?? undefined;
  }

  const secret =
    settingsRow?.webhook_secret ?? process.env.GITHUB_WEBHOOK_SECRET ?? null;
  let verified = false;

  if (secret && signature.startsWith("sha256=")) {
    const digest = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
    try {
      verified = timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
      verified = false;
    }
  } else if (!secret) {
    /* No secret configured — accept in dev only, mark as unverified */
    verified = process.env.NODE_ENV !== "production";
  }

  /* ── 3. Skip processing if webhooks disabled or signature failed ── */
  if (settingsRow && settingsRow.webhook_enabled === false) {
    await logDelivery({
      status_code: 202,
      success: false,
      error_message: "Webhooks disabled for this project",
    });
    return NextResponse.json(
      { ok: false, message: "Webhooks disabled for this project" },
      { status: 202 }
    );
  }

  if (!verified) {
    await logDelivery({
      status_code: 401,
      success: false,
      error_message: "Invalid X-Hub-Signature-256",
    });
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 }
    );
  }

  /* ── 4. Handle push → schedule AccessDiff pipeline ── */
  let pipelineRunId: string | undefined;
  try {
    const action = (payload?.action as string | undefined) ?? null;
    const ref = (payload?.ref as string | undefined) ?? null;
    const baseRef =
      (payload?.pull_request as Record<string, unknown> | undefined)?.base as
        | Record<string, unknown>
        | undefined;
    const headRef =
      (payload?.pull_request as Record<string, unknown> | undefined)?.head as
        | Record<string, unknown>
        | undefined;

    const shouldRun =
      eventType === "push" ||
      (eventType === "pull_request" &&
        (action === "opened" || action === "synchronize" || action === "reopened"));

    if (shouldRun && projectId && userId && ref) {
      let baseSha: string | undefined;
      let headSha: string | undefined;

      if (eventType === "pull_request" && baseRef && headRef) {
        baseSha = (baseRef as Record<string, unknown>).sha as string;
        headSha = (headRef as Record<string, unknown>).sha as string;
      } else if (eventType === "push") {
        baseSha = (payload?.before as string) ?? undefined;
        headSha = (payload?.after as string) ?? undefined;
      }

      if (baseSha && headSha) {
        /* Queue a new pipeline run (status = queued) */
        const { data: run, error: runErr } = await supabase
          .from("pipeline_runs")
          .insert({
            project_id: projectId,
            user_id: userId,
            base_commit: baseSha,
            head_commit: headSha,
            branch: ref.replace("refs/heads/", ""),
            status: "queued",
            triggered_by: `github:${eventType}`,
          })
          .select("id")
          .limit(1)
          .maybeSingle();
        if (run && !runErr) pipelineRunId = run.id as string;

        /* Best-effort: kick off the imported-pipeline runner in the
           background; we don't await because the webhook response needs
           to return within GitHub's 10s window. */
        if (pipelineRunId) {
          queueMicrotask(() => {
            fetch(
              `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/pipeline/start`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  projectId,
                  pipelineRunId,
                  baseSha,
                  headSha,
                  source: "webhook",
                }),
              }
            ).catch(() => void 0);
          });
        }
      }
    }
  } catch (err) {
    await logDelivery({
      status_code: 500,
      success: false,
      error_message: err instanceof Error ? err.message : "unknown error",
    });
    return NextResponse.json(
      { ok: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }

  /* ── 5. Success ── */
  await logDelivery({ status_code: 200, success: true });
  return NextResponse.json({
    ok: true,
    event: eventType,
    pipeline_run_id: pipelineRunId ?? null,
  });

  /* ── Helper ─────────────────────────────────────────────────────── */
  async function logDelivery(opts: {
    status_code: number;
    success: boolean;
    error_message?: string;
  }) {
    try {
      await supabase.from("webhook_deliveries").insert({
        project_id: projectId ?? null,
        user_id: userId ?? null,
        direction: "inbound",
        source: "github",
        event_type: eventType,
        delivery_id: deliveryId,
        status_code: opts.status_code,
        success: opts.success,
        payload,
        headers,
        error_message: opts.error_message ?? null,
        pipeline_run_id: pipelineRunId ?? null,
      });
    } catch {
      /* delivery table failure must never mask the real response */
    }
  }
}

/* GitHub pings us the very first time when the webhook is created */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "AccessDiff Webhook Receiver v1" },
    { status: 200 }
  );
}
