-- ============================================================================
-- AI Decision Journal
-- Migration 007
-- Enforce Organization-Scoped Decision Access
--
-- Purpose:
-- Replace broad authenticated Decision access with organization-scoped
-- authorization based on the authenticated user's membership.
--
-- This migration:
-- - Completes Decision organization ownership by enforcing NOT NULL
-- - Allows authenticated users to read only their own memberships
-- - Allows members to read organizations they belong to
-- - Restricts Decision access to members of the owning organization
-- - Restricts Decision child records through their parent Decision
--
-- Role-specific mutation authority is intentionally out of scope.
-- ============================================================================

-- ============================================================================
-- Complete Decision Organization Ownership
-- ============================================================================
--
-- Migration 006 connects existing Decisions to the established Momentum Co.
-- organization. Any Decisions created during the transitional period may still
-- have NULL organization ownership, so assign those records before enforcing
-- the invariant.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = 'org-momentum-co'
  ) THEN
    RAISE EXCEPTION
      'Required organization org-momentum-co was not found.';
  END IF;

  UPDATE public.decisions
  SET organization_id = 'org-momentum-co'
  WHERE organization_id IS NULL;
END
$$;

ALTER TABLE public.decisions
ALTER COLUMN organization_id SET NOT NULL;

-- ============================================================================
-- Organization Memberships
-- ============================================================================
--
-- The browser may resolve organization context by reading membership rows,
-- but an authenticated user may see only memberships belonging to auth.uid().
--
-- No client INSERT, UPDATE, or DELETE policy is introduced here.

GRANT SELECT
ON public.organization_memberships
TO authenticated;

DROP POLICY IF EXISTS
  "Authenticated users can view own organization memberships"
ON public.organization_memberships;

CREATE POLICY
  "Authenticated users can view own organization memberships"
ON public.organization_memberships
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- ============================================================================
-- Organizations
-- ============================================================================
--
-- Authenticated users may read organizations only when they have a membership
-- relationship to that organization.
--
-- No client mutation policy is introduced here.

ALTER TABLE public.organizations
ENABLE ROW LEVEL SECURITY;

GRANT SELECT
ON public.organizations
TO authenticated;

DROP POLICY IF EXISTS
  "Organization members can view organizations"
ON public.organizations;

CREATE POLICY
  "Organization members can view organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships AS membership
    WHERE
      membership.organization_id = organizations.id
      AND membership.user_id = auth.uid()
  )
);

-- ============================================================================
-- Decisions
-- ============================================================================
--
-- Migration 005 allowed every authenticated user to access every Decision.
-- Replace that broad policy with membership-aware resource authorization.

DROP POLICY IF EXISTS
  "Authenticated users can access decisions"
ON public.decisions;

CREATE POLICY
  "Organization members can access decisions"
ON public.decisions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships AS membership
    WHERE
      membership.organization_id = decisions.organization_id
      AND membership.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships AS membership
    WHERE
      membership.organization_id = decisions.organization_id
      AND membership.user_id = auth.uid()
  )
);

-- ============================================================================
-- Decision Evidence
-- ============================================================================
--
-- Child-record authority derives from access to the parent Decision rather
-- than duplicating organization ownership onto child tables.

DROP POLICY IF EXISTS
  "Authenticated users can access decision evidence"
ON public.decision_evidence;

CREATE POLICY
  "Organization members can access decision evidence"
ON public.decision_evidence
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_evidence.decision_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_evidence.decision_id
  )
);

-- ============================================================================
-- Decision Timeline
-- ============================================================================

DROP POLICY IF EXISTS
  "Authenticated users can access decision timeline"
ON public.decision_timeline;

CREATE POLICY
  "Organization members can access decision timeline"
ON public.decision_timeline
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_timeline.decision_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_timeline.decision_id
  )
);

-- ============================================================================
-- Decision History
-- ============================================================================

DROP POLICY IF EXISTS
  "Authenticated users can access decision history"
ON public.decision_history;

CREATE POLICY
  "Organization members can access decision history"
ON public.decision_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_history.decision_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_history.decision_id
  )
);

-- ============================================================================
-- Decision Approvals
-- ============================================================================

DROP POLICY IF EXISTS
  "Authenticated users can access decision approvals"
ON public.decision_approvals;

CREATE POLICY
  "Organization members can access decision approvals"
ON public.decision_approvals
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_approvals.decision_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_approvals.decision_id
  )
);

-- ============================================================================
-- Decision Tags
-- ============================================================================

DROP POLICY IF EXISTS
  "Authenticated users can access decision tags"
ON public.decision_tags;

CREATE POLICY
  "Organization members can access decision tags"
ON public.decision_tags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_tags.decision_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.decisions AS decision
    WHERE decision.id = decision_tags.decision_id
  )
);
