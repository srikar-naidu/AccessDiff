-- Phase 13: CI/CD settings & webhook delivery tables

-- ===========================================================================
-- 1. project_cicd_settings — per-project CI/CD toggles, webhook secrets,
--    failure thresholds, and auto-approve rules for the settings UI.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.project_cicd_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- GitHub Actions integration
  github_actions_enabled BOOLEAN NOT NULL DEFAULT false,
  github_actions_workflow_path TEXT NOT NULL DEFAULT '.github/workflows/accessdiff-ci.yml',

  -- Webhook delivery (used by the /api/webhooks/github endpoint)
  webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_secret TEXT,
  webhook_url TEXT,
  webhook_last_delivered_at TIMESTAMPTZ,

  -- Failure thresholds (pipeline fails when exceeded)
  fail_on_critical BOOLEAN NOT NULL DEFAULT true,
  fail_on_major BOOLEAN NOT NULL DEFAULT false,
  fail_on_minor BOOLEAN NOT NULL DEFAULT false,
  tolerance_critical INTEGER NOT NULL DEFAULT 0 CHECK (tolerance_critical >= 0),
  tolerance_major INTEGER NOT NULL DEFAULT 0 CHECK (tolerance_major >= 0),
  tolerance_minor INTEGER NOT NULL DEFAULT 5 CHECK (tolerance_minor >= 0),

  -- Auto-approval gates
  auto_approve_low_risk BOOLEAN NOT NULL DEFAULT false,
  auto_approve_confidence NUMERIC(5,2) CHECK (auto_approve_confidence IS NULL OR auto_approve_confidence BETWEEN 0 AND 100),

  -- PR decoration
  pr_comment_enabled BOOLEAN NOT NULL DEFAULT true,
  pr_status_check_enabled BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cicd_settings_project ON public.project_cicd_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_cicd_settings_user    ON public.project_cicd_settings(user_id);

-- ===========================================================================
-- 2. webhook_deliveries — append-only audit log of every webhook received
--    and every outbound webhook sent from AccessDiff.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  source TEXT NOT NULL DEFAULT 'github',                -- github, accessdiff, generic
  event_type TEXT NOT NULL,                              -- push, pull_request, pipeline.completed, …
  delivery_id TEXT,                                      -- GitHub's X-GitHub-Delivery

  status_code INTEGER,                                   -- HTTP status (outbound) or 200 (inbound handled)
  success BOOLEAN NOT NULL DEFAULT false,

  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  pipeline_run_id UUID REFERENCES public.pipeline_runs(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_project ON public.webhook_deliveries(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_user    ON public.webhook_deliveries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event   ON public.webhook_deliveries(event_type, created_at DESC);

-- ===========================================================================
-- 3. updated_at trigger
-- ===========================================================================
DROP TRIGGER IF EXISTS update_cicd_settings_updated_at ON public.project_cicd_settings;
CREATE TRIGGER update_cicd_settings_updated_at
  BEFORE UPDATE ON public.project_cicd_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================================================
-- 4. RLS
-- ===========================================================================
ALTER TABLE public.project_cicd_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their CICD settings" ON public.project_cicd_settings;
CREATE POLICY "Users own their CICD settings"
  ON public.project_cicd_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own their webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Users own their webhook deliveries"
  ON public.webhook_deliveries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
