import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/* ───────────────────────────────────────────────────────────────────────
   GET /api/projects/[id]/cicd  —  fetch CICD settings for a project
   PUT /api/projects/[id]/cicd  —  upsert CICD settings (webhook enabled,
                                   thresholds, auto-approve rules, toggles)
   POST /api/projects/[id]/cicd/rotate-secret — regenerate webhook secret
   ─────────────────────────────────────────────────────────────────────── */

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, github_repo")
    .eq("id", id)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let { data: settings } = await supabase
    .from("project_cicd_settings")
    .select("*")
    .eq("project_id", id)
    .limit(1)
    .maybeSingle();

  /* If no settings row yet, upsert defaults with a fresh secret so the UI
     always has something to render */
  if (!settings) {
    const secret = generateWebhookSecret();
    const { data: inserted } = await supabase
      .from("project_cicd_settings")
      .insert({
        project_id: id,
        user_id: user.id,
        webhook_secret: secret,
        webhook_url: defaultWebhookUrl(),
      })
      .select("*")
      .limit(1)
      .maybeSingle();
    settings = inserted ?? null;
  }

  /* Recent webhook deliveries, for the audit timeline */
  const { data: deliveries } = await supabase
    .from("webhook_deliveries")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    data: {
      settings,
      deliveries: deliveries ?? [],
      workflowYamlReference: ".github/workflows/accessdiff-ci.yml",
      github: {
        webhook_url: settings?.webhook_url ?? defaultWebhookUrl(),
        repo: (project as Record<string, unknown>).github_repo as string | undefined,
      },
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const allowed = [
    "github_actions_enabled",
    "webhook_enabled",
    "fail_on_critical",
    "fail_on_major",
    "fail_on_minor",
    "tolerance_critical",
    "tolerance_major",
    "tolerance_minor",
    "auto_approve_low_risk",
    "auto_approve_confidence",
    "pr_comment_enabled",
    "pr_status_check_enabled",
  ];
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) clean[key] = body[key];
  }
  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ data: null, error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("project_cicd_settings")
    .update({ ...clean, user_id: user.id })
    .eq("project_id", id)
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    /* Unique constraint hasn't been created yet → insert */
    const { data: inserted, error: insErr } = await supabase
      .from("project_cicd_settings")
      .insert({ project_id: id, user_id: user.id, ...clean })
      .select("*")
      .limit(1)
      .maybeSingle();
    if (insErr) {
      return NextResponse.json(
        { data: null, error: insErr.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: inserted, error: null });
  }
  return NextResponse.json({ data, error: null });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();

  if (action === "rotate-secret") {
    const newSecret = generateWebhookSecret();
    const { data, error } = await supabase
      .from("project_cicd_settings")
      .update({ webhook_secret: newSecret })
      .eq("project_id", id)
      .eq("user_id", user.id)
      .select("webhook_secret, webhook_url")
      .limit(1)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data, error: null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 404 });
}

/* ─────────────── helpers ──────────────────────────────────────────────── */
function generateWebhookSecret(): string {
  return `adwh_${crypto.randomBytes(32).toString("hex")}`;
}
function defaultWebhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/webhooks/github`;
}
