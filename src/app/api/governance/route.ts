import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const agentFilter = searchParams.get("agent");
    const actionFilter = searchParams.get("action");
    const searchFilter = searchParams.get("search");
    const projectIdFilter = searchParams.get("projectId");

    const admin = createAdminClient();

    // ── Resolve the user's own project IDs ────────────────────────────────────
    let projectQuery = admin
      .from("projects")
      .select("id, github_repo")
      .eq("user_id", user.id);
    if (projectIdFilter) {
      projectQuery = projectQuery.eq("id", projectIdFilter);
    }
    const { data: userProjects } = await projectQuery;
    const ownProjectIds = (userProjects ?? []).map((p) => p.id);

    if (ownProjectIds.length === 0) {
      return NextResponse.json({ data: { records: [] }, error: null });
    }

    // ── Resolve the user's own pipeline run IDs (scoped to their projects) ────
    const { data: userRuns } = await admin
      .from("pipeline_runs")
      .select("id")
      .in("project_id", ownProjectIds)
      .eq("user_id", user.id);
    const ownRunIds = (userRuns ?? []).map((r) => r.id);

    if (ownRunIds.length === 0) {
      return NextResponse.json({ data: { records: [] }, error: null });
    }

    const recordsMap = new Map<string, {
      id: string;
      pipelineRunId: string;
      projectId: string | null;
      agentName: string;
      action: string;
      reasoning: string;
      confidence: number;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }>();

    // 1. governance_records (primary table written by the pipeline service)
    try {
      const { data: recs } = await admin
        .from("governance_records")
        .select("*")
        .in("pipeline_run_id", ownRunIds)
        .order("created_at", { ascending: false });

      for (const r of recs ?? []) {
        recordsMap.set(r.id, {
          id: r.id,
          pipelineRunId: r.pipeline_run_id ?? "",
          projectId: r.metadata?.projectId as string ?? null,
          agentName: r.agent_name ?? "GovernanceAgent",
          action: r.action ?? "AUDIT_LOGGED",
          reasoning: r.reasoning ?? "AI decision recorded.",
          confidence: (r.metadata?.confidence as number) ?? 0.92,
          metadata: r.metadata ?? null,
          createdAt: r.created_at ?? new Date().toISOString(),
        });
      }
    } catch {
      // table may not exist yet
    }

    // 2. governance_logs (legacy/alternative schema)
    try {
      const { data: logs } = await admin
        .from("governance_logs")
        .select("*")
        .in("pipeline_run_id", ownRunIds)
        .order("created_at", { ascending: false });

      for (const l of logs ?? []) {
        if (!recordsMap.has(l.id)) {
          recordsMap.set(l.id, {
            id: l.id,
            pipelineRunId: l.pipeline_run_id ?? "",
            projectId: l.project_id ?? null,
            agentName: l.agent_name ?? "GovernanceAgent",
            action: l.action ?? "AUDIT_LOGGED",
            reasoning: l.reasoning ?? "AI decision recorded.",
            confidence: l.confidence ?? 0.95,
            metadata: {
              trustScore: l.trust_score,
              riskLevel: l.risk_level,
              inputData: l.input_data,
              outputData: l.output_data,
            },
            createdAt: l.created_at ?? new Date().toISOString(),
          });
        }
      }
    } catch {
      // table may not exist
    }

    // 3. Synthesize from pipeline_stages (one entry per agent execution)
    try {
      const { data: stages } = await admin
        .from("pipeline_stages")
        .select("*")
        .in("pipeline_run_id", ownRunIds)
        .order("created_at", { ascending: false });

      for (const s of stages ?? []) {
        if (!recordsMap.has(s.id)) {
          recordsMap.set(s.id, {
            id: s.id,
            pipelineRunId: s.pipeline_run_id ?? "",
            projectId: null,
            agentName: s.agent_name ?? stageToAgentName(s.stage_name),
            action:
              s.status === "completed"
                ? `${(s.stage_name ?? "STAGE").toUpperCase()}_COMPLETED`
                : s.status === "skipped"
                  ? `${(s.stage_name ?? "STAGE").toUpperCase()}_SKIPPED`
                  : `${(s.stage_name ?? "STAGE").toUpperCase()}_FAILED`,
            reasoning:
              s.error_message ??
              `Stage ${s.stage_name ?? "analysis"} executed successfully in ${s.duration_ms ?? 0}ms.`,
            confidence: 0.92,
            metadata: {
              stageName: s.stage_name,
              durationMs: s.duration_ms,
              output: s.output_data,
            },
            createdAt: s.created_at ?? new Date().toISOString(),
          });
        }
      }
    } catch {
      // pipeline_stages may not exist
    }

    // 4. Synthesize from fixes (one entry per AI fix action)
    try {
      const { data: fixes } = await admin
        .from("fixes")
        .select("*")
        .in("pipeline_run_id", ownRunIds)
        .order("created_at", { ascending: false });

      for (const f of fixes ?? []) {
        const key = `fix-${f.id}`;
        if (!recordsMap.has(key)) {
          recordsMap.set(key, {
            id: f.id,
            pipelineRunId: f.pipeline_run_id ?? "",
            projectId: null,
            agentName: "AccessibilityFixAgent",
            action: `FIX_${(f.status ?? "generated").toUpperCase()}`,
            reasoning: f.reasoning ?? `Generated code fix for file ${f.file_path}`,
            confidence: ((f.trust_score ?? f.confidence ?? 85) as number) / 100,
            metadata: {
              filePath: f.file_path,
              trustScore: f.trust_score,
              status: f.status,
              verificationResult: f.verification_result,
            },
            createdAt: f.updated_at ?? f.created_at ?? new Date().toISOString(),
          });
        }
      }
    } catch {
      // fixes
    }

    // 5. Fallback: synthesize from pipeline_runs themselves
    if (recordsMap.size === 0) {
      try {
        const { data: runs } = await admin
          .from("pipeline_runs")
          .select("*")
          .in("id", ownRunIds)
          .order("created_at", { ascending: false });

        for (const r of runs ?? []) {
          recordsMap.set(r.id, {
            id: r.id,
            pipelineRunId: r.id,
            projectId: r.project_id ?? null,
            agentName: "HelixOrchestrator",
            action: `PIPELINE_${(r.status ?? "COMPLETED").toUpperCase()}`,
            reasoning:
              r.summary ??
              r.error_message ??
              `Pipeline execution ${r.status}. Discovered ${r.total_issues ?? 0} regressions, generated ${r.fixes_generated ?? 0} fixes.`,
            confidence: 0.95,
            metadata: {
              totalIssues: r.total_issues,
              fixesGenerated: r.fixes_generated,
              fixesVerified: r.fixes_verified,
              baseCommit: r.base_commit_sha,
              headCommit: r.head_commit_sha,
            },
            createdAt: r.created_at ?? new Date().toISOString(),
          });
        }
      } catch {
        // pipeline_runs
      }
    }

    let records = Array.from(recordsMap.values());

    // ── Optional filters ───────────────────────────────────────────────────────
    if (agentFilter && agentFilter !== "all") {
      const lower = agentFilter.toLowerCase();
      records = records.filter((r) => r.agentName.toLowerCase().includes(lower));
    }

    if (actionFilter && actionFilter !== "all") {
      const lower = actionFilter.toLowerCase();
      records = records.filter((r) => r.action.toLowerCase().includes(lower));
    }

    if (searchFilter) {
      const lower = searchFilter.toLowerCase();
      records = records.filter(
        (r) =>
          r.agentName.toLowerCase().includes(lower) ||
          r.action.toLowerCase().includes(lower) ||
          r.reasoning.toLowerCase().includes(lower)
      );
    }

    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ data: { records }, error: null });
  } catch (caught: unknown) {
    const message =
      caught instanceof Error ? caught.message : "Failed to fetch governance records.";
    return NextResponse.json(
      { data: null, error: { message, code: "FETCH_GOVERNANCE_FAILED" } },
      { status: 500 }
    );
  }
}

function stageToAgentName(stageName?: string | null): string {
  switch (stageName?.toLowerCase()) {
    case "spec":
      return "RepositoryAgent";
    case "build":
      return "AccessibilityFixAgent";
    case "evaluate":
      return "VerificationAgent";
    case "diagnose":
      return "DiagnosisAgent";
    case "optimize":
      return "OptimizationAgent";
    case "governance":
      return "GovernanceAgent";
    default:
      return "HelixAgent";
  }
}
