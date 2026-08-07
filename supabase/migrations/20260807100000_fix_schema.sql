-- Corrective migration: create tables and columns the app reads/writes but
-- that were missing from the baseline migrations (see Schema.md + code usage).

-- ===========================================================================
-- 1. Missing columns on existing tables
-- ===========================================================================

-- `fixes.updated_at` is written by /api/fixes/[id]/{approve,reject,rollback}
ALTER TABLE public.fixes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- `users.preferences` documented in Schema.md (not yet used by app code)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "theme": "dark",
    "language": "en",
    "notifications": true,
    "auto_approve_low_risk": false
  }'::jsonb;

-- ===========================================================================
-- 2. governance_records
--    Written by the pipeline (persistGovernanceRecords) and by the
--    approve/reject/rollback API routes; read by /api/governance.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.governance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  agent_name TEXT,
  action TEXT NOT NULL,
  reasoning TEXT,
  confidence NUMERIC(5,2) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_records_run ON public.governance_records(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_governance_records_created ON public.governance_records(created_at DESC);

-- ===========================================================================
-- 3. governance_logs (documented alternate audit table, read by /api/governance)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.governance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  fix_id UUID REFERENCES public.fixes(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  reasoning TEXT,
  confidence NUMERIC(5,2) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 100),
  trust_score NUMERIC(5,2) CHECK (trust_score IS NULL OR trust_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  verification_status TEXT,
  approval_status TEXT,
  input_data JSONB,
  output_data JSONB,
  before_code TEXT,
  after_code TEXT,
  wcag_rule TEXT,
  file_path TEXT,
  is_rollback BOOLEAN NOT NULL DEFAULT false,
  rollback_of UUID REFERENCES public.governance_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_logs_run ON public.governance_logs(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_governance_logs_project ON public.governance_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_governance_logs_created ON public.governance_logs(created_at DESC);

-- ===========================================================================
-- 4. pull_requests (written by /api/pull-requests/create, read by /api/pull-requests)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  github_pr_number INTEGER NOT NULL DEFAULT 0,
  github_pr_url TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  files_modified INTEGER NOT NULL DEFAULT 0 CHECK (files_modified >= 0),
  issues_addressed INTEGER NOT NULL DEFAULT 0 CHECK (issues_addressed >= 0),
  score_improvement NUMERIC(5,2) CHECK (score_improvement IS NULL OR score_improvement BETWEEN -100 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pull_requests_run ON public.pull_requests(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_pull_requests_project ON public.pull_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_pull_requests_user_created ON public.pull_requests(user_id, created_at DESC);

-- ===========================================================================
-- 5. chat_history (written/read by /api/chat)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  context JSONB,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_project ON public.chat_history(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON public.chat_history(created_at DESC);

-- ===========================================================================
-- 6. accessibility_scores (read by /api/projects/[id]/timeline)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.accessibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  pipeline_run_id UUID REFERENCES public.pipeline_runs(id) ON DELETE SET NULL,
  commit_sha TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  total_issues INTEGER NOT NULL DEFAULT 0 CHECK (total_issues >= 0),
  critical_issues INTEGER NOT NULL DEFAULT 0 CHECK (critical_issues >= 0),
  major_issues INTEGER NOT NULL DEFAULT 0 CHECK (major_issues >= 0),
  minor_issues INTEGER NOT NULL DEFAULT 0 CHECK (minor_issues >= 0),
  advisory_issues INTEGER NOT NULL DEFAULT 0 CHECK (advisory_issues >= 0),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, commit_sha)
);

CREATE INDEX IF NOT EXISTS idx_scores_project ON public.accessibility_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_scores_measured ON public.accessibility_scores(project_id, measured_at DESC);

-- ===========================================================================
-- 7. updated_at triggers (match Schema.md section 4.1)
-- ===========================================================================
DROP TRIGGER IF EXISTS update_pipeline_runs_updated_at ON public.pipeline_runs;
CREATE TRIGGER update_pipeline_runs_updated_at
  BEFORE UPDATE ON public.pipeline_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_issues_updated_at ON public.issues;
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fixes_updated_at ON public.fixes;
CREATE TRIGGER update_fixes_updated_at
  BEFORE UPDATE ON public.fixes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pull_requests_updated_at ON public.pull_requests;
CREATE TRIGGER update_pull_requests_updated_at
  BEFORE UPDATE ON public.pull_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_governance_records_updated_at ON public.governance_records;
CREATE TRIGGER update_governance_records_updated_at
  BEFORE UPDATE ON public.governance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================================================
-- 8. Row Level Security (defense-in-depth; app uses the service role for these)
-- ===========================================================================
ALTER TABLE public.governance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pull_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own governance records" ON public.governance_records;
CREATE POLICY "Users can access own governance records"
  ON public.governance_records FOR ALL
  USING (
    pipeline_run_id IN (
      SELECT id FROM public.pipeline_runs WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pipeline_run_id IN (
      SELECT id FROM public.pipeline_runs WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access own governance logs" ON public.governance_logs;
CREATE POLICY "Users can access own governance logs"
  ON public.governance_logs FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can access own PRs" ON public.pull_requests;
CREATE POLICY "Users can access own PRs"
  ON public.pull_requests FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own chat history" ON public.chat_history;
CREATE POLICY "Users can access own chat history"
  ON public.chat_history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can access own scores" ON public.accessibility_scores;
CREATE POLICY "Users can access own scores"
  ON public.accessibility_scores FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );
