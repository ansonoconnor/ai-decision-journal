-- ============================================================================
-- AI Decision Journal
-- Migration 005
-- Establish Authenticated Decision Access
--
-- Purpose:
-- Move Decision Journal database access from the anonymous Supabase role
-- to the authenticated Supabase role.
--
-- This migration establishes an authentication boundary only.
-- It does not yet implement organization-, role-, or resource-level
-- authorization between authenticated users.
-- ============================================================================

-- ============================================================================
-- Decisions
-- ============================================================================

ALTER TABLE public.decisions
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on decisions"
ON public.decisions;

DROP POLICY IF EXISTS "Allow anon insert on decisions"
ON public.decisions;

DROP POLICY IF EXISTS "Allow anon update on decisions"
ON public.decisions;

DROP POLICY IF EXISTS "Allow anon delete on decisions"
ON public.decisions;

CREATE POLICY "Authenticated users can access decisions"
ON public.decisions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Decision Evidence
-- ============================================================================

ALTER TABLE public.decision_evidence
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on decision_evidence"
ON public.decision_evidence;

DROP POLICY IF EXISTS "Allow anon insert on decision_evidence"
ON public.decision_evidence;

DROP POLICY IF EXISTS "Allow anon update on decision_evidence"
ON public.decision_evidence;

DROP POLICY IF EXISTS "Allow anon delete on decision_evidence"
ON public.decision_evidence;

CREATE POLICY "Authenticated users can access decision evidence"
ON public.decision_evidence
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Decision Timeline
-- ============================================================================

ALTER TABLE public.decision_timeline
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on decision_timeline"
ON public.decision_timeline;

DROP POLICY IF EXISTS "Allow anon insert on decision_timeline"
ON public.decision_timeline;

DROP POLICY IF EXISTS "Allow anon update on decision_timeline"
ON public.decision_timeline;

DROP POLICY IF EXISTS "Allow anon delete on decision_timeline"
ON public.decision_timeline;

CREATE POLICY "Authenticated users can access decision timeline"
ON public.decision_timeline
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Decision History
-- ============================================================================

ALTER TABLE public.decision_history
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on decision_history"
ON public.decision_history;

DROP POLICY IF EXISTS "Allow anon insert on decision_history"
ON public.decision_history;

DROP POLICY IF EXISTS "Allow anon update on decision_history"
ON public.decision_history;

DROP POLICY IF EXISTS "Allow anon delete on decision_history"
ON public.decision_history;

CREATE POLICY "Authenticated users can access decision history"
ON public.decision_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Decision Approvals
-- ============================================================================

ALTER TABLE public.decision_approvals
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on decision_approvals"
ON public.decision_approvals;

DROP POLICY IF EXISTS "Allow anon insert on decision_approvals"
ON public.decision_approvals;

DROP POLICY IF EXISTS "Allow anon update on decision_approvals"
ON public.decision_approvals;

DROP POLICY IF EXISTS "Allow anon delete on decision_approvals"
ON public.decision_approvals;

CREATE POLICY "Authenticated users can access decision approvals"
ON public.decision_approvals
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Decision Tags
-- ============================================================================

ALTER TABLE public.decision_tags
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on decision_tags"
ON public.decision_tags;

DROP POLICY IF EXISTS "Allow anon insert on decision_tags"
ON public.decision_tags;

DROP POLICY IF EXISTS "Allow anon update on decision_tags"
ON public.decision_tags;

DROP POLICY IF EXISTS "Allow anon delete on decision_tags"
ON public.decision_tags;

CREATE POLICY "Authenticated users can access decision tags"
ON public.decision_tags
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);