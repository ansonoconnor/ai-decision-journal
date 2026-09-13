-- ============================================================================
-- AI Decision Journal
-- Migration 006
-- Introduce Organizational Decision Membership
--
-- Purpose:
-- Establish the minimum organizational model required to move from
-- authenticated access toward resource-level authorization.
--
-- This migration models organizations, authenticated user membership, and the
-- organization that owns each Decision. It does not replace the authenticated
-- access policies introduced by Migration 005. Organization-scoped RLS belongs
-- to the next migration.
-- ============================================================================

-- ============================================================================
-- Organizations
-- ============================================================================

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
    CHECK (char_length(btrim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations
ENABLE ROW LEVEL SECURITY;

-- No client policy is added here. Organizational access will be introduced
-- together with membership-aware RLS in the next authorization migration.

-- ============================================================================
-- Organization Memberships
-- ============================================================================

CREATE TABLE public.organization_memberships (
  organization_id uuid NOT NULL
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

-- Membership rows remain inaccessible through the browser until the next
-- migration defines the policies that use auth.uid().

-- ============================================================================
-- Decision Organization Ownership
-- ============================================================================

ALTER TABLE public.decisions
ADD COLUMN organization_id uuid
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
-- Preserve that existing demo environment by placing current Decisions and
-- current authenticated users into one bootstrap organization.
--
-- Existing users receive admin membership because authenticated users
-- previously had unrestricted read/write access. This records the current
-- behavior without yet enforcing it as the final authorization policy.

DO $$
DECLARE
  bootstrap_organization_id uuid;
BEGIN
  INSERT INTO public.organizations (name)
  VALUES ('Decision Journal Demo Organization')
  RETURNING id INTO bootstrap_organization_id;

  UPDATE public.decisions
  SET organization_id = bootstrap_organization_id
  WHERE organization_id IS NULL;

  INSERT INTO public.organization_memberships (
    organization_id,
    user_id,
    role
  )
  SELECT
    bootstrap_organization_id,
    users.id,
    'admin'
  FROM auth.users AS users
  ON CONFLICT (organization_id, user_id) DO NOTHING;
END
$$;

-- organization_id is intentionally nullable during this transitional commit
-- so the current Decision creation path continues to work. The next migration
-- will make organization context explicit during creation, backfill any rows
-- created in the interim, enforce NOT NULL, and replace broad authenticated
-- access with organization-scoped RLS.
