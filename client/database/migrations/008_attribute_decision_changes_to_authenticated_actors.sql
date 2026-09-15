-- ============================================================================
-- AI Decision Journal
-- Migration 008
-- Attribute Decision Changes to Authenticated Actors
--
-- Purpose:
-- Preserve canonical authenticated-user provenance for newly accepted
-- Decision history entries.
--
-- This migration:
-- - Adds canonical authenticated actor identity to Decision history
-- - Allows legacy history to remain unattributed
-- - Requires new history actor identity to match auth.uid()
-- - Prevents authenticated clients from updating existing history
-- - Relies on the parent Decision cascade for authorized deletion
--
-- The existing updated_by field remains a descriptive display label.
-- actor_user_id is the authoritative identity reference.
-- ============================================================================

-- ============================================================================
-- Canonical Actor Identity
-- ============================================================================

ALTER TABLE public.decision_history
ADD COLUMN IF NOT EXISTS actor_user_id uuid
REFERENCES auth.users(id)
ON DELETE SET NULL;

COMMENT ON COLUMN public.decision_history.actor_user_id IS
  'Authenticated user responsible for the accepted Decision change. NULL is retained for legacy or non-user history.';

CREATE INDEX IF NOT EXISTS idx_decision_history_actor_user
ON public.decision_history(actor_user_id);

-- ============================================================================
-- Replace Broad History Access
-- ============================================================================
--
-- Migration 007 allowed organization members to perform all operations on
-- Decision history through the authorized parent Decision.
--
-- History is now append-only while its parent Decision exists:
-- - SELECT derives authority from the parent Decision
-- - INSERT derives authority from the parent and requires auth.uid()
-- - UPDATE is intentionally unsupported
-- - DELETE occurs only through the authorized parent Decision cascade

DROP POLICY IF EXISTS
  "Organization members can access decision history"
ON public.decision_history;

DROP POLICY IF EXISTS
  "Organization members can view decision history"
ON public.decision_history;

DROP POLICY IF EXISTS
  "Organization members can add decision history"
ON public.decision_history;

DROP POLICY IF EXISTS
  "Organization members can delete decision history"
ON public.decision_history;

CREATE POLICY
  "Organization members can view decision history"
ON public.decision_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_history.decision_id
  )
);

CREATE POLICY
  "Organization members can add decision history"
ON public.decision_history
FOR INSERT
TO authenticated
WITH CHECK (
  actor_user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_history.decision_id
  )
);
