# AI Decision Journal

> **A system of record for consequential organizational decisions: what was decided, why, by whom, and what happened afterward.**

**Built with:** React | Vite | Node.js | Express | Supabase | PostgreSQL

## Overview

AI Decision Journal is an enterprise decision intelligence application for capturing consequential organizational decisions as governed, durable records.

Business decisions often begin in meetings, email threads, documents, dashboards, and AI conversations. The final choice may be recorded, while its supporting evidence, accountable people, lifecycle changes, and eventual outcome remain fragmented or disappear.

AI Decision Journal treats the **Decision itself as an organizational artifact**. Each record can preserve:

- business context and the question being decided
- supporting evidence
- AI recommendations and human judgment
- accountable ownership and governance
- lifecycle state and change history
- implementation outcomes and lessons learned

The goal is to help an organization reconstruct not only **what it decided**, but why the decision was justified, who caused accepted changes, and what happened afterward.

## Highlights

- Structured, searchable Decision records
- Supabase email/password authentication and session management
- Organization membership and Decision ownership boundaries
- Organization-scoped PostgreSQL Row Level Security
- Database-native authorization regression tests
- Explicit, domain-enforced Decision lifecycle
- Difference detection and lifecycle event generation
- Authenticated actor provenance for new history records
- Append-only Decision history while the parent Decision exists
- AI recommendation and human governance separation
- Operational outcome and lessons-learned tracking
- Repository, application, domain, and persistence boundaries

## Product Walkthrough

The screenshots use **Northwind Logistics**, a fictional transportation and logistics organization, to demonstrate how an AI-assisted operational decision can move from context through governance, implementation, observation, and learning.

### Enterprise Decision Workspace

![AI Decision Journal enterprise workspace](docs/images/hero.png)

The application combines a searchable Decision Library with a structured workspace for reviewing and managing individual Decisions. The workspace renders only after authentication, while database access is independently enforced through organization-aware RLS.

### Structured Decision Record

![Structured organizational Decision record](docs/images/workspace.png)

A Decision captures the information necessary to understand the business problem:

- title, type, priority, and accountable owner
- lifecycle status
- executive summary and Decision question
- business context and supporting evidence

### Decision Governance

![AI recommendation and human Decision governance](docs/images/governance.png)

AI recommendations are represented separately from human organizational judgment. The governance workspace can preserve the recommendation, rationale, final Decision, reviewer, and review date.

AI may inform judgment, but it is not the authority or the system of record. Responsibility for the organizational Decision remains visible.

### Lifecycle and Decision History

![Decision lifecycle timeline and change history](docs/images/lifecycle.png)

The application compares the persisted Decision with the edited working copy. Meaningful accepted changes become lifecycle events and are projected into timeline and history records.

New history entries retain both:

- `updated_by`: a readable actor label
- `actor_user_id`: the canonical authenticated Supabase user ID

The database requires `actor_user_id` to match `auth.uid()` when a browser client inserts history. Existing legacy history remains valid without invented retrospective attribution.

History is append-only while its parent Decision exists. Browser clients can read authorized history and add correctly attributed entries, but cannot directly update or delete existing entries. Authorized deletion of the parent Decision removes its history through the database foreign-key cascade.

### Operational Outcomes

![Decision implementation and operational outcomes](docs/images/outcomes.png)

Outcome records connect organizational judgment to the operational result that followed it:

- implementation status
- expected outcome
- actual outcome
- outcome date

### Organizational Learning

![Decision lessons learned and organizational learning](docs/images/lessons.png)

Completed work can preserve a key lesson, what worked, what did not work, and a recommended adjustment. This creates a feedback loop between prior decisions and future judgment.

## Decision Lifecycle

Lifecycle state is modeled explicitly in the domain layer.

```text
Draft -> In Review -> Approved -> Implemented -> Observed -> Completed
          |
          `---> Draft
```

Allowed transitions are:

```text
Draft       -> In Review
In Review   -> Draft
In Review   -> Approved
Approved    -> Implemented
Implemented -> Observed
Observed    -> Completed
```

Arbitrary jumps are rejected. For example, `Approved -> Completed` cannot bypass implementation and observation.

The save path is:

```text
Persisted Decision
        v compare
Working Decision
        v
Difference Detection
        v
Lifecycle Validation
        v
Lifecycle Event Construction
        v
Timeline and History Projection
        v
Persistence
```

An invalid transition does not become organizational history. The persisted Decision, timeline, and history remain unchanged.

This is intentionally **not an event-sourced architecture**. The Decision remains the primary persisted aggregate; lifecycle events provide structured representations of meaningful changes to that aggregate.

## Identity, Authorization, and Provenance

AI Decision Journal treats several related concerns as distinct:

```text
Authentication  -> Who is interacting with the system?
Authorization   -> May this principal access this resource?
Domain validity -> Is the requested lifecycle transition legitimate?
Attribution     -> Who caused the accepted change?
Auditability    -> Can the organization reconstruct what happened?
```

### Authentication

Supabase Auth provides email/password authentication, session restoration, and authenticated request context. The React authentication gate controls workspace rendering, but it is not the data-security boundary.

### Organization-scoped authorization

Authenticated users are linked to organizations through `organization_memberships`. Each Decision has an owning `organization_id`.

PostgreSQL RLS enforces the resource boundary:

```text
authenticated principal
        v
organization membership
        v
organization-owned Decision
        v
Decision and authorized child records
```

- Users can read only their own membership rows.
- Users can read organizations to which they belong.
- Decision access requires membership in the owning organization.
- Evidence, timeline, history, approvals, and tags derive access through their parent Decision.
- New Decisions require explicit organization ownership.

This prevents an authenticated principal from gaining universal Decision access merely by holding the `authenticated` database role.

### Authenticated actor attribution

When an accepted Decision change generates history, the application resolves the current user with Supabase Auth rather than trusting a caller-supplied actor.

```text
authenticated principal
        v
server-confirmed Supabase user
        v
lifecycle event
        v
history projection
        v
actor_user_id
        v
PostgreSQL RLS validation
```

The readable actor label supports the interface; `actor_user_id` is the authoritative identity reference. RLS requires new history rows to attribute that ID to the current `auth.uid()`.

### Authorization regression coverage

Database-native tests exercise the RLS boundary directly:

- unauthenticated user -> denied
- authenticated user without membership -> denied
- Organization A member accessing an Organization B Decision -> denied
- member of the owning organization -> allowed

The tests run inside a transaction and roll back all temporary fixture state.

## Architecture

The primary Decision path is browser-to-Supabase. Express remains available for server-side capabilities but is not an unnecessary proxy for normal Decision persistence.

```text
Supabase Auth
      v
React Presentation
      v
DecisionService
      v
Domain Logic
      v
Repository Boundary
      v
DecisionPersistence and Mapper
      v
Supabase Browser Client
      v
PostgreSQL and RLS
```

### Presentation layer

React components display and edit Decision information. They do not define lifecycle validity or database authority.

### Application layer

`DecisionService` coordinates creation, loading, difference detection, lifecycle validation, event construction, projection, actor resolution, and persistence.

### Domain layer

Shared domain code defines lifecycle rules, detects meaningful changes, constructs lifecycle events, and projects accepted events into timeline and history records. It does not depend on React or Supabase.

### Repository boundary

`DecisionRepository` defines the persistence contract. `MockDecisionRepository` and `SupabaseDecisionRepository` provide interchangeable implementations for the application layer.

### Persistence layer

`DecisionPersistence` and `DecisionPersistenceMapper` translate the aggregate into PostgreSQL records:

```text
organizations
organization_memberships
decisions
decision_evidence
decision_timeline
decision_history
decision_approvals
decision_tags
```

RLS is enabled on the exposed organizational and Decision Journal tables. Policy predicates enforce membership and parent-resource relationships rather than relying only on the authenticated role.

## Decision Aggregate

The Decision is the central business aggregate:

```text
Decision
|-- Identity and organization ownership
|-- Summary, question, and context
|-- Evidence
|-- Governance
|-- Outcome and lessons
|-- Timeline and history
|-- Approvals and tags
`-- Metadata
```

The UI edits a working representation. The application and domain layers determine whether it can become a valid persisted state.

## Design Principles

### Decisions are organizational assets

Important decisions deserve durable representation rather than disappearing into meetings, messages, and temporary conversations.

### Identity does not imply universal authority

Authentication establishes who a principal is. Organization membership and resource relationships determine which Decisions that principal may access.

### The UI is not the authority boundary

Interface state can improve the user experience, but PostgreSQL RLS independently protects persisted data.

### History should describe what actually happened

Only accepted changes become history. New entries retain canonical actor provenance, and existing history cannot be directly rewritten by browser clients.

### AI supports human judgment

AI can contribute analysis and recommendations while accountable organizational ownership and governance remain explicit.

### Outcomes matter

A Decision should remain visible through implementation, observation, and organizational learning.

## What This Project Demonstrates

- Translating organizational processes into explicit software models
- Separating authentication, authorization, domain validity, attribution, and auditability
- Enforcing organization-scoped access with PostgreSQL RLS
- Testing authorization boundaries at the database layer
- Resolving authenticated identity through Supabase Auth
- Carrying actor provenance across application, domain, and persistence layers
- Protecting append-only history from direct mutation
- Modeling lifecycle progression as a domain concern
- Separating editable UI state from persisted organizational state
- Preserving AI recommendations alongside accountable human judgment
- Connecting Decisions to implementation outcomes and lessons

The project is not intended merely as a React demonstration. It shows how identity, authority, provenance, governance, lifecycle, and organizational learning can become explicit software boundaries.

## Current Capabilities

- Persistent, searchable multi-Decision workspace
- New Decision creation with organization ownership
- Editable structured Decision records
- Supabase authentication and session restoration
- Organization memberships and organization-owned Decisions
- Organization-scoped Decision and child-record RLS
- Database-native authorization boundary tests
- Domain-defined lifecycle transitions and invalid-transition rejection
- Difference detection and lifecycle event construction
- Timeline and Decision history generation
- Authenticated actor UUID and readable-label attribution
- Append-only browser access to Decision history
- Governance, outcomes, approvals, tags, and lessons learned
- Supabase persistence through repository and mapper boundaries

## Known Limitations

These are explicit boundaries of the current reference implementation, not implied roadmap commitments:

- Membership currently authorizes Decision operations without role-specific mutation rules.
- The accountable owner field represents business responsibility; it is not yet an authenticated owner-specific permission.
- Decision creation requires a single visible organization membership; multi-membership organization selection is not implemented.
- Aggregate persistence spans multiple table operations without a single database transaction, so a later child-write failure can leave earlier writes persisted.
- Broader approvals, notifications, analytics, connectors, and cross-product integration require concrete use-case justification before development.

## Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite |
| Authentication | Supabase Auth |
| Application | JavaScript application services, repository abstractions |
| Server-side capabilities | Node.js, Express |
| Persistence | Supabase, PostgreSQL, Row Level Security |
| Architecture | Layered architecture, domain modeling, aggregate modeling, persistence mapping |

## Ecosystem Architecture

AI Decision Journal is one component in a broader organizational intelligence portfolio:

```text
Knowledge Assistant
Authorized organizational evidence
        v
AI Decision Journal
Authoritative organizational Decision
        v
SynapseFlow
Execution eligibility and governance
```

- **Knowledge Assistant** asks: What does the organization know?
- **AI Decision Journal** asks: What did the organization decide, why, and how did it change?
- **SynapseFlow** asks: Is the consequential action eligible to happen?

The relationship is architectural vocabulary, not an implemented integration or automatic development queue.

## Running the Project

### Install

```bash
npm --prefix client install
npm --prefix server install
```

### Start

Run the frontend and server in separate terminals:

```bash
npm --prefix client run dev
```

```bash
npm --prefix server run dev
```

### Build

```bash
npm --prefix client run build
```

## Database Migrations and Tests

Version-controlled SQL is stored under `client/database`:

```text
client/database/
|-- migrations/
|   |-- 004_align_decision_schema.sql
|   |-- 005_establish_authenticated_decision_access.sql
|   |-- 006_introduce_organizational_decision_membership.sql
|   |-- 007_enforce_organization_scoped_decision_access.sql
|   `-- 008_attribute_decision_changes_to_authenticated_actors.sql
`-- tests/
    `-- decision_authorization_boundary.sql
```

The authorization regression script is designed to execute against the migrated PostgreSQL schema and roll back its fixtures when complete.

## Screenshot Assets

```text
docs/images/
|-- hero.png
|-- workspace.png
|-- governance.png
|-- lifecycle.png
|-- outcomes.png
`-- lessons.png
```

All screenshots use a fictional organizational scenario.

## About

AI Decision Journal is a portfolio implementation exploring enterprise AI, workflow systems, decision governance, organizational memory, and trustworthy application boundaries.

It began with a simple question:

> **What would it mean for an organization to preserve a decision as carefully as it preserves a document or transaction?**

The deeper engineering focus is translating organizational behavior into explicit software boundaries: what constitutes state, which transitions are valid, who may access a record, who caused an accepted change, what becomes durable history, and how results become reusable organizational knowledge.

## License

This repository is provided for portfolio and educational purposes. Please do not redistribute substantial portions of the project without permission.

## Author

**Anson O'Connor**

AI Implementation & Workflow Systems Architect

Austin, Texas

**LinkedIn:** [linkedin.com/in/ansonoconnor](https://www.linkedin.com/in/ansonoconnor)

**Website:** [synapseflowsystems.com](https://www.synapseflowsystems.com)