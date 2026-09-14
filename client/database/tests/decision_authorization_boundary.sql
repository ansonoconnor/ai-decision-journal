-- ============================================================================
-- AI Decision Journal
-- Decision Authorization Boundary Tests
--
-- Purpose:
-- Verify the organization-scoped Decision authorization boundary established
-- by migrations 006 and 007.
--
-- Proven boundaries:
-- 1. Unauthenticated user                  -> denied
-- 2. Authenticated user without membership -> denied
-- 3. Org A member accessing Org B Decision -> denied
-- 4. Correct organization member           -> allowed
--
-- This test creates temporary organizational state inside a transaction and
-- rolls the entire test fixture back. No test organization, membership, or
-- Decision ownership change persists.
-- ============================================================================

BEGIN;

-- ============================================================================
-- Preconditions
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = 'org-momentum-co'
  ) THEN
    RAISE EXCEPTION
      'Authorization test requires organization org-momentum-co.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_memberships
    WHERE organization_id = 'org-momentum-co'
  ) THEN
    RAISE EXCEPTION
      'Authorization test requires a member of org-momentum-co.';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.decisions
    WHERE organization_id = 'org-momentum-co'
  ) < 2 THEN
    RAISE EXCEPTION
      'Authorization test requires at least two Decisions owned by org-momentum-co.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = 'org-authorization-test'
  ) THEN
    RAISE EXCEPTION
      'Test organization org-authorization-test already exists.';
  END IF;
END
$$;


-- ============================================================================
-- Capture Test Context
-- ============================================================================

SELECT set_config(
  'aidj_test.member_user_id',
  (
    SELECT user_id::text
    FROM public.organization_memberships
    WHERE organization_id = 'org-momentum-co'
    ORDER BY created_at ASC
    LIMIT 1
  ),
  true
);

SELECT set_config(
  'aidj_test.foreign_decision_id',
  (
    SELECT id::text
    FROM public.decisions
    WHERE organization_id = 'org-momentum-co'
    ORDER BY id
    LIMIT 1
  ),
  true
);

SELECT set_config(
  'aidj_test.owned_decision_id',
  (
    SELECT id::text
    FROM public.decisions
    WHERE organization_id = 'org-momentum-co'
      AND id::text <> current_setting('aidj_test.foreign_decision_id')
    ORDER BY id
    LIMIT 1
  ),
  true
);


-- ============================================================================
-- Create Foreign Organizational State
-- ============================================================================
--
-- The authenticated member intentionally receives NO membership in this
-- organization.

INSERT INTO public.organizations (
  id,
  name,
  description
)
VALUES (
  'org-authorization-test',
  'Authorization Boundary Test',
  'Temporary organization used by Decision authorization regression tests.'
);

UPDATE public.decisions
SET organization_id = 'org-authorization-test'
WHERE id::text = current_setting('aidj_test.foreign_decision_id');


-- ============================================================================
-- Boundary 1
-- Unauthenticated user -> denied
-- ============================================================================

RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '',
  true
);

SET LOCAL ROLE anon;

DO $$
DECLARE
  visible_decisions integer;
BEGIN
  BEGIN
    SELECT COUNT(*)
    INTO visible_decisions
    FROM public.decisions;

    IF visible_decisions <> 0 THEN
      RAISE EXCEPTION
        'FAIL unauthenticated_denied: unauthenticated user can see % Decisions.',
        visible_decisions;
    END IF;

  EXCEPTION
    WHEN insufficient_privilege THEN
      -- Permission denial also satisfies this boundary.
      NULL;
  END;
END
$$;

RESET ROLE;


-- ============================================================================
-- Boundary 2
-- Authenticated user without membership -> denied
-- ============================================================================
--
-- A synthetic authenticated subject is sufficient here because authorization
-- depends on auth.uid() matching organization_memberships.user_id.

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  visible_decisions integer;
BEGIN
  BEGIN
    SELECT COUNT(*)
    INTO visible_decisions
    FROM public.decisions;

    IF visible_decisions <> 0 THEN
      RAISE EXCEPTION
        'FAIL authenticated_non_member_denied: non-member can see % Decisions.',
        visible_decisions;
    END IF;

  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END
$$;

RESET ROLE;


-- ============================================================================
-- Establish Real Member Identity
-- ============================================================================

SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('aidj_test.member_user_id'),
  true
);

SET LOCAL ROLE authenticated;


-- ============================================================================
-- Boundary 3
-- Org A member accessing Org B Decision -> denied
-- ============================================================================

DO $$
DECLARE
  visible_foreign_decisions integer;
BEGIN
  SELECT COUNT(*)
  INTO visible_foreign_decisions
  FROM public.decisions
  WHERE id::text = current_setting('aidj_test.foreign_decision_id');

  IF visible_foreign_decisions <> 0 THEN
    RAISE EXCEPTION
      'FAIL cross_organization_denied: member can access foreign Decision.';
  END IF;
END
$$;


-- ============================================================================
-- Boundary 4
-- Correct organization member -> allowed
-- ============================================================================

DO $$
DECLARE
  visible_owned_decisions integer;
BEGIN
  SELECT COUNT(*)
  INTO visible_owned_decisions
  FROM public.decisions
  WHERE id::text = current_setting('aidj_test.owned_decision_id');

  IF visible_owned_decisions <> 1 THEN
    RAISE EXCEPTION
      'FAIL correct_organization_member_allowed: owned Decision is not accessible.';
  END IF;
END
$$;

RESET ROLE;


-- ============================================================================
-- Cleanup
-- ============================================================================
--
-- Roll back the foreign organization and temporary ownership change.
-- The assertions above must all succeed for execution to reach this point.

ROLLBACK;


-- ============================================================================
-- Successful Result
-- ============================================================================

SELECT *
FROM (
  VALUES
    ('unauthenticated_denied', 'PASS'),
    ('authenticated_non_member_denied', 'PASS'),
    ('cross_organization_denied', 'PASS'),
    ('correct_organization_member_allowed', 'PASS')
) AS results(check_name, result);
