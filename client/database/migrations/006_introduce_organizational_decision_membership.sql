-- ============================================================================
-- AI Decision Journal
-- Migration 006
-- Introduce Organizational Decision Membership
--
-- Purpose:
-- Connect authenticated Decision Journal users and Decisions to the existing
-- organizational identity model.
--
-- The database already represents organizations through public.organizations,
-- whose canonical identifiers are text values. Decision Journal reuses that
-- existing organizational boundary rather than introducing a parallel
-- organization model.
--
-- This migration:
-- - Creates authenticated-user organization memberships
-- - Adds organizational ownership to Decisions
-- - Assigns existing Decisions to the existing Momentum Co. organization
-- - Preserves the broad authenticated access policies from Migration 005
--
-- Organization-scoped authorization is introduced by Migration 007.
-- ============================================================================

-- ============================================================================
-- Existing Organization Context
-- ============================================================================
--
-- Decision Journal joins the existing organizational model through the
-- canonical Momentum Co. organization identifier.

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
END
$$;

-- ============================================================================
-- Organization Memberships
-- ============================================================================

CREATE TABLE public.organization_memberships (
  organization_id text NOT NULL
    REFERENCES public.organizations(id)
    ON DELETE CASCADE,
  user_id uuid NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'
    CONSTRAINT organization_memberships_role_check
    CHECK (role IN ('member', 'manager', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX organization_memberships_user_id_idx
ON public.organization_memberships(user_id);

ALTER TABLE public.organization_memberships
ENABLE ROW LEVEL SECURITY;

-- Membership rows intentionally remain inaccessible through the browser until
-- Migration 007 introduces authenticated self-membership visibility.

-- ============================================================================
-- Decision Organization Ownership
-- ============================================================================

ALTER TABLE public.decisions
ADD COLUMN organization_id text
REFERENCES public.organizations(id)
ON DELETE RESTRICT;

CREATE INDEX decisions_organization_id_idx
ON public.decisions(organization_id);

COMMENT ON COLUMN public.decisions.organization_id IS
'Organization that owns and governs access to the Decision.';

-- ============================================================================
-- Existing Data Bootstrap
-- ============================================================================
--
-- Migration 005 allowed every authenticated user to access every Decision.
-- Preserve the current demo environment by connecting existing Decisions and
-- authenticated users to the existing Momentum Co. organization.
--
-- Existing users receive admin membership because authenticated users
-- previously had unrestricted read/write access. Migration 007 will constrain
-- access by membership while leaving role-specific mutation authority for a
-- later milestone.

UPDATE public.decisions
SET organization_id = 'org-momentum-co'
WHERE organization_id IS NULL;

INSERT INTO public.organization_memberships (
  organization_id,
  user_id,
  role
)
SELECT
  'org-momentum-co',
  users.id,
  'admin'
FROM auth.users AS users
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- organization_id intentionally remains nullable during this transitional
-- migration. Migration 007 will backfill any Decisions created during the
-- transition, enforce NOT NULL, and replace broad authenticated RLS with
-- organization-scoped access.
