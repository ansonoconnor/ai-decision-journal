# AI Decision Journal

> **A system of record for consequential organizational decisions: what was decided, why, by whom, and what happened afterward.**

**Built with:** React • Vite • Node.js • Express • Supabase • PostgreSQL

---

# Overview

AI Decision Journal is an enterprise decision intelligence application for capturing important organizational decisions as governed, durable records.

Business decisions often begin in meetings, email threads, documents, dashboards, and AI conversations. The final decision may be recorded somewhere, but the reasoning that produced it, the evidence available at the time, the people responsible for it, the changes it passed through, and the outcome that followed are often fragmented or lost.

AI Decision Journal treats the **Decision itself as an organizational artifact**.

Each Decision can preserve its business context, supporting evidence, AI recommendation, human governance, accountable owner, lifecycle state, implementation outcome, change history, and lessons learned.

The result is a workspace designed to answer not only:

**What did we decide?**

but also:

- Why did we decide it?
- What evidence informed the decision?
- Who was accountable for it?
- How did the decision change?
- Was the decision properly governed?
- What happened after implementation?
- What should the organization learn from the result?

The underlying premise is that organizations should be able to preserve important decisions with the same durability they apply to documents, transactions, tickets, and other operational records.

---

# Highlights

- Structured enterprise Decision records
- Searchable Decision Library
- Authenticated workspace access
- Supabase Auth session management
- PostgreSQL Row Level Security
- Explicit Decision lifecycle
- Domain-enforced lifecycle transitions
- Decision change detection
- Lifecycle event generation
- Durable Decision history
- AI-assisted recommendations with human governance
- Accountable Decision ownership
- Operational outcome tracking
- Structured lessons learned
- Supabase-backed persistence
- Layered domain and application architecture

---

# Product Walkthrough

The screenshots below use **Northwind Logistics**, a fictional transportation and logistics organization, to demonstrate how an AI-assisted operational decision can move from organizational context through governance, implementation, observation, and learning.

## Enterprise Decision Workspace

![AI Decision Journal enterprise workspace](docs/images/hero.png)

The application combines a searchable Decision Library with a structured workspace for reviewing and managing individual organizational decisions.

Each Decision exists as more than a document or form. It is a persistent business record with identity, ownership, lifecycle state, governance information, operational outcomes, and historical context.

The workspace is available only after authentication. Supabase Auth establishes the current application principal, and PostgreSQL Row Level Security provides the current database access boundary.

---

## Structured Decision Record

![Structured organizational Decision record](docs/images/workspace.png)

A Decision begins with the information necessary to understand the business problem being evaluated.

The workspace captures:

- Decision title
- Accountable owner
- Lifecycle status
- Decision type
- Priority
- Executive summary
- Decision question
- Business context
- Supporting evidence

This establishes a durable organizational record before governance and implementation occur.

---

## Decision Governance

![AI recommendation and human Decision governance](docs/images/governance.png)

AI-generated recommendations are represented separately from human organizational judgment.

The governance workspace can preserve:

- AI recommendation
- Supporting rationale
- Final organizational decision
- Reviewer
- Review date

The application is designed around the principle that AI can inform organizational judgment without obscuring human responsibility for the final decision.

---

## Lifecycle and Decision History

![Decision lifecycle timeline and change history](docs/images/lifecycle.png)

Meaningful changes to a Decision can become part of its durable organizational history.

The application detects changes between the persisted Decision and the edited working Decision. Relevant changes can then be represented as lifecycle events and projected into human-readable timeline and history records.

Examples include:

- Decision title changes
- Ownership changes
- Lifecycle transitions

Lifecycle transitions are validated against explicit domain rules before persistence.

An invalid transition is rejected without persisting the invalid state or generating false timeline and history records.

This allows the system to preserve not merely the current state of a Decision, but meaningful information about **how that state evolved**.

---

## Operational Outcomes

![Decision implementation and operational outcomes](docs/images/outcomes.png)

Governance does not end when a Decision is approved.

The application preserves what happens after organizational judgment becomes operational action.

Outcome tracking includes:

- Implementation status
- Expected outcome
- Actual outcome
- Outcome date

This connects the reasoning behind a Decision to the operational result that followed it.

---

## Organizational Learning

![Decision lessons learned and organizational learning](docs/images/lessons.png)

Completed work can produce structured organizational learning.

Lessons Learned capture:

- Key lesson
- What worked
- What did not work
- Recommended adjustment

This creates a feedback loop between past organizational decisions and future judgment.

---

# The Core Idea

Organizations are generally good at preserving artifacts such as:

- Documents
- Policies
- Standard Operating Procedures
- Project plans
- Technical specifications
- Transactional records

They are often much worse at preserving the reasoning behind consequential decisions.

Months later, teams may know **what** happened while no longer knowing:

- Why a particular option was selected
- What evidence supported the choice
- Who owned the decision
- How the decision evolved
- Whether implementation produced the expected result
- What the organization learned afterward

AI Decision Journal explores a simple architectural premise:

> **Important organizational decisions should be treated as durable organizational assets.**

That means preserving the Decision across its lifecycle rather than recording only its final state.

AI is useful within that model, but it is not the system of record. AI can contribute recommendations and analysis; the durable artifact remains the organizational Decision.

---

# Decision Lifecycle

Decision lifecycle state is modeled explicitly in the domain layer.

```text
Draft
  │
  ▼
In Review
  │
  ▼
Approved
  │
  ▼
Implemented
  │
  ▼
Observed
  │
  ▼
Completed
```

The lifecycle is not simply a list of labels.

Allowed transitions are defined as domain rules:

```text
Draft → In Review

In Review → Draft
In Review → Approved

Approved → Implemented

Implemented → Observed

Observed → Completed
```

Arbitrary lifecycle jumps are rejected.

For example:

```text
Approved ──X──> Completed
```

cannot bypass the required implementation and observation states.

This keeps the persisted Decision, timeline, and history consistent with the lifecycle represented by the domain.

---

# Change Detection and Lifecycle Events

A central architectural capability of the application is distinguishing between the Decision that was previously persisted and the Decision currently being edited.

The save path can be represented conceptually as:

```text
Persisted Decision
        │
        │ compare
        ▼
Working Decision
        │
        ▼
Difference Detection
        │
        ▼
Lifecycle Validation
        │
        ▼
Lifecycle Event Construction
        │
        ▼
Timeline / History Projection
        │
        ▼
Persistence
```

This separates responsibilities that would otherwise become mixed together inside UI components or database operations.

### Difference Detection

The domain determines which meaningful Decision properties changed.

### Lifecycle Validation

Status changes are checked against the allowed Decision lifecycle before persistence.

### Lifecycle Events

Accepted changes can be represented as structured lifecycle events.

### Projection

Lifecycle events are transformed into the timeline and history representations used by the Decision record.

### Persistence

Only after validation and projection is the resulting Decision persisted through the repository boundary.

This is intentionally **not an event-sourced architecture**.

The Decision remains the primary persisted aggregate. Lifecycle events and projections provide structured historical representations of meaningful changes to that aggregate.

---

# Invalid Transition Semantics

Lifecycle enforcement protects the integrity of the Decision record.

If a user attempts an invalid lifecycle transition:

```text
Approved → Completed
```

the application rejects the save.

The resulting behavior is:

```text
Persisted Decision Status
        │
        └── remains Approved

Timeline
        │
        └── unchanged

History
        │
        └── unchanged

Invalid Attempt
        │
        └── not recorded as organizational history
```

The working interface returns to the persisted lifecycle state.

The rejected attempt is not treated as a meaningful organizational event because no valid Decision state change occurred.

---

# Identity, Access, and Decision Integrity

AI Decision Journal separates several concerns that are easy to collapse into a single idea of "security."

```text
Authentication
Who is interacting with the system?
        │
        ▼
Authorization
May this principal perform this action on this resource?
        │
        ▼
Domain Validity
Is the requested Decision transition legitimate?
        │
        ▼
Attribution
Who actually caused the accepted change?
        │
        ▼
Auditability
Can the organization reconstruct what happened?
```

The current implementation establishes the first boundary and part of the surrounding access infrastructure.

Supabase Auth provides email/password authentication and session management. Authenticated browser requests carry the Supabase session context to the data layer, where PostgreSQL Row Level Security restricts Decision Journal data access to the authenticated role.

The current RLS policies intentionally establish an **authenticated access boundary**, not final fine-grained authorization. Authenticated users are not yet differentiated by organization membership, Decision-specific relationship, or action-specific authority.

That finer authorization model, together with authenticated actor attribution, remains future work.

Lifecycle validity is already enforced independently in the domain layer. Authentication therefore does not make an otherwise invalid lifecycle transition valid.

---

# Features

## Decision Library

The Decision Library provides a centralized collection of organizational Decision records.

Current capabilities include:

- Multi-Decision browsing
- Decision search
- Lifecycle status visibility
- Decision selection
- New Decision creation

---

## Authenticated Workspace

The Decision workspace is protected by Supabase authentication.

The application:

- accepts email/password authentication
- restores an existing authenticated session
- observes authentication-state changes
- prevents the Decision workspace from rendering without a session
- clears Decision state when the user signs out
- uses authenticated Supabase requests for persisted Decision data

Database access is independently constrained by PostgreSQL Row Level Security rather than relying on the visibility of the React interface as the security boundary.

---

## Decision Workspace

Each Decision is represented through a structured workspace containing:

- Summary
- Decision Question
- Background & Context
- Evidence
- Governance
- Outcome
- Lessons Learned
- Timeline
- History
- Approvals
- Tags
- Metadata

Workspace navigation provides direct access to each part of the record.

---

## Decision Ownership

Each Decision can identify an accountable owner.

Ownership is part of the Decision itself rather than informal metadata outside the record.

Changes in ownership can also become part of Decision history.

The current ownership field represents organizational responsibility within the Decision record. Fine-grained authorization linking authenticated principals to Decision-specific ownership remains a separate access-control concern.

---

## Decision Governance

The governance model separates AI assistance from human organizational responsibility.

It supports:

- AI Recommendation
- Rationale
- Final Decision
- Reviewer
- Review Date

This makes the distinction between machine-generated analysis and accountable human judgment explicit.

---

## Decision Timeline

The timeline provides a human-readable chronological representation of meaningful Decision changes.

For example:

```text
TITLE CHANGED

Title changed from
'Untitled Decision'
to
'Validate Northwind AI Dispatch Pilot'.
```

and:

```text
STATUS CHANGED

Status changed from
'Draft'
to
'In Review'.
```

---

## Decision History

Decision History preserves structured before-and-after representations of changes.

A lifecycle transition can retain information such as:

```text
Field: status

Previous:
Draft

Current:
In Review

Updated By:
Current User

Date:
2026-08-12
```

Timeline and History serve related but distinct purposes:

- **Timeline** communicates what happened.
- **History** preserves the structured change representation.

`Current User` is currently a placeholder actor representation in the lifecycle service. Replacing that placeholder with authenticated actor provenance is part of the planned attribution work.

---

## Operational Outcomes

Decisions can continue from approval into implementation, observation, and completion.

Outcome records support:

- Implementation Status
- Expected Outcome
- Actual Outcome
- Outcome Date

This helps connect organizational judgment to measurable operational consequences.

---

## Lessons Learned

Decisions can preserve structured post-implementation learning.

Fields include:

- Key Lesson
- What Worked
- What Didn't Work
- Recommended Adjustment

The goal is to make organizational experience reusable rather than allowing it to disappear when a project or initiative ends.

---

# Architecture

AI Decision Journal separates authentication, presentation, application coordination, domain behavior, repository access, persistence mapping, and database enforcement.

The normal Decision read/write path does not require the React client to proxy Decision persistence through Express.

```text
Supabase Auth
        │
        ▼
Authenticated Session / JWT
        │
        ▼
React Presentation
        │
        ▼
DecisionService
        │
        ▼
Domain Logic
        │
        ▼
Repository Boundary
        │
        ▼
DecisionPersistence
        │
        ▼
Supabase Browser Client
        │
        ▼
PostgreSQL / Row Level Security
```

Supabase validates the authenticated session context used by the data request, while PostgreSQL RLS provides the database access boundary.

Node.js and Express are present in the repository for server-side capabilities, but normal Decision loading and persistence currently follow the authenticated browser-to-Supabase path shown above.

This distinction is intentional: a server hop is not itself a security model. Authority must be enforced at a trusted boundary.

---

## Authentication Boundary

`AuthGate` establishes the application's current sign-in boundary.

Conceptually:

```text
Email + Password
        │
        ▼
Supabase Auth
        │
        ▼
Authenticated Session
        │
        ▼
React Auth State
        │
        ▼
Decision Workspace
```

The Supabase browser client automatically uses the authenticated session when making data requests.

At the database:

```text
Unauthenticated / anon
        │
        └── Decision Journal access denied

Authenticated
        │
        └── current authenticated RLS policies apply
```

The current policies deliberately answer:

> Is this request authenticated?

They do not yet answer:

> Is this authenticated principal authorized to perform this particular action on this particular Decision?

That is the next access-control layer.

---

## Presentation Layer

React components are responsible for authentication presentation and for displaying and editing Decision information.

```text
App.jsx
│
├── AuthGate
│
├── DecisionList
│
└── DecisionWorkspace
    │
    ├── DecisionWorkspaceNavigation
    │
    └── DecisionCard
        │
        ├── DecisionHeader
        ├── DecisionSummary
        ├── DecisionQuestion
        ├── DecisionContext
        ├── DecisionEvidence
        ├── DecisionGovernance
        ├── DecisionOutcome
        ├── DecisionLessons
        ├── DecisionTimeline
        ├── DecisionHistory
        ├── DecisionApprovals
        ├── DecisionTags
        └── DecisionMetadata
```

Presentation components do not directly own persistence behavior or lifecycle rules.

The authentication gate controls what the interface renders, while database RLS provides the independent persisted-data boundary.

---

## Application Layer

`DecisionService` coordinates Decision use cases across the domain and persistence boundaries.

Its responsibilities include coordinating operations such as:

- Creating Decisions
- Loading Decisions
- Saving edited Decisions
- Detecting meaningful changes
- Validating lifecycle transitions
- Constructing lifecycle events
- Projecting timeline and history records
- Persisting the resulting Decision

This keeps orchestration outside the presentation layer.

---

## Domain Layer

The shared domain contains business concepts that should not depend on React or Supabase.

Key responsibilities include:

```text
Decision
│
├── Lifecycle Rules
├── Difference Detection
├── Lifecycle Events
└── Lifecycle Projections
```

The lifecycle defines which state transitions are valid.

Difference detection identifies meaningful changes.

Lifecycle events represent accepted changes.

Lifecycle projections translate those events into durable timeline and history representations.

Authentication and database access do not replace these domain rules. An authenticated request can still propose an invalid Decision transition, and the domain can reject it.

---

## Repository Boundary

Repository abstractions isolate the application from a specific storage implementation.

The client currently includes:

```text
DecisionRepository
├── MockDecisionRepository
└── SupabaseDecisionRepository
```

This allows application behavior to remain separated from the persistence provider.

---

## Persistence Layer

Persistence mapping translates between domain Decision structures and database records.

Supabase provides the current persistence infrastructure backed by PostgreSQL.

The persisted model supports the Decision itself along with related organizational records such as:

```text
decisions
decision_evidence
decision_timeline
decision_history
decision_approvals
decision_tags
```

Row Level Security is enabled across these Decision Journal tables.

The current policies remove anonymous Decision data access and permit access through the authenticated role. Organization-, role-, and resource-specific policies are intentionally not represented as complete.

---

# Decision Aggregate

The Decision acts as the central business aggregate.

```text
Decision
│
├── Identity
│   ├── ID
│   ├── Title
│   ├── Status
│   ├── Priority
│   ├── Type
│   └── Owner
│
├── Summary
├── Question
├── Context
├── Evidence
├── Governance
├── Outcome
├── Lessons
├── Timeline
├── History
├── Approvals
├── Tags
└── Metadata
```

The UI edits a working Decision representation.

Application and domain layers determine whether those changes constitute a valid new persisted state.

---

# Design Principles

### Decisions are organizational assets

Important decisions deserve durable representation rather than disappearing into meetings, messages, and temporary conversations.

### State changes should have meaning

A lifecycle should represent real organizational progression rather than arbitrary labels that can be changed without constraint.

### Identity and authority are different concerns

Establishing who a user is does not establish everything that user is allowed to do.

Authentication, authorization, domain validity, attribution, and auditability are modeled as distinct concerns.

### The UI is not the authority boundary

Interface state can improve the user experience, but hiding or displaying a control does not determine whether the underlying operation is permitted.

Persisted-data access must be enforced independently at a trusted boundary.

### History should describe what actually happened

Rejected actions should not contaminate the organizational record with changes that never became valid Decision states.

### Governance should be transparent

AI recommendations, human review, ownership, and final organizational judgment should remain distinguishable.

### AI supports human judgment

AI can contribute analysis and recommendations while responsibility remains visible and accountable.

### Outcomes matter

A Decision should not disappear from organizational attention immediately after approval.

### Experience should become organizational learning

Observed results and lessons should inform future decisions.

---

# What This Project Demonstrates

AI Decision Journal demonstrates an approach to designing AI-enabled systems around real organizational workflows.

The project emphasizes:

- Translating business processes into explicit software models
- Modeling lifecycle state as a domain concern
- Separating editable UI state from persisted organizational state
- Establishing authenticated application identity
- Applying PostgreSQL Row Level Security at the persistence boundary
- Distinguishing authentication from authorization and domain validity
- Enforcing valid workflow progression
- Detecting meaningful changes between persisted and edited records
- Translating domain changes into human-readable organizational history
- Preserving AI recommendations alongside accountable human judgment
- Connecting decisions to implementation outcomes
- Designing repository and persistence boundaries
- Building software around organizational accountability rather than isolated CRUD operations

The objective is not simply to demonstrate React development.

It is to demonstrate how business concepts such as **identity, ownership, governance, lifecycle, history, implementation, and learning** can become explicit parts of a software system.

---

# Engineering Challenges

The project explores several problems common to enterprise application development.

## Moving from Represented Users to Authenticated Principals

The original prototype could represent owners, reviewers, approvers, and a generic `Current User`, but those representations were not connected to authenticated application identity.

Supabase Auth now establishes a real authenticated principal and session before the Decision workspace becomes available.

The database access model was correspondingly moved away from anonymous Decision Journal policies to RLS policies scoped to the authenticated role.

This establishes the identity boundary while leaving fine-grained organizational and resource authorization as a distinct next problem.

---

## Separating Authentication from Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
May you perform this action on this resource?
```

The current implementation establishes authentication and authenticated database access.

It deliberately does not claim that all required role-, organization-, approval-, or Decision-specific authorization rules have been implemented.

Keeping those concerns separate prevents descriptive fields such as Owner or Approver from being mistaken for enforced authority.

---

## Separating Working State from Persisted State

Users need freedom to edit a Decision without every intermediate interface action becoming organizational truth.

The application therefore distinguishes the editable working representation from the persisted Decision.

---

## Enforcing Lifecycle Integrity

Lifecycle status cannot be treated as an unrestricted text field.

Valid transitions are modeled in the domain and checked during the save process.

Authentication does not bypass lifecycle integrity. A known user can still request an invalid state transition.

---

## Generating History Without Polluting It

Not every user interaction deserves a historical record.

The system detects meaningful differences and creates history only when accepted changes become part of the persisted Decision.

---

## Keeping Domain Rules Outside the UI

React components present and collect information, but lifecycle validity should not depend on a particular component implementation.

The lifecycle therefore exists in shared domain code.

Similarly, rendering an authenticated workspace is not treated as sufficient database protection; persisted access is independently constrained through RLS.

---

## Preserving Human Accountability Around AI

AI recommendations are useful only when organizations can distinguish them from the people and processes responsible for actual decisions.

The governance model preserves that distinction explicitly.

Authenticated actor attribution is a planned extension of this principle.

---

## Connecting Decisions to Outcomes

A decision-management system becomes substantially more useful when it can preserve whether the expected result actually occurred.

Outcome and lesson structures extend the record beyond the moment of approval.

---

# Technology Stack

### Frontend

- React
- Vite

### Authentication

- Supabase Auth
- Authenticated session management
- JWT-backed Supabase request context

### Application

- JavaScript application services
- Repository abstractions

### Server-Side Capabilities

- Node.js
- Express

### Persistence

- Supabase
- PostgreSQL
- Row Level Security

### Architecture

- Layered Architecture
- Repository Pattern
- Application Services
- Domain Modeling
- Aggregate Modeling
- Lifecycle Modeling
- Difference Detection
- Persistence Mapping
- Authenticated Data Boundary

---

# Ecosystem Architecture

AI Decision Journal is one component within a broader organizational intelligence portfolio.

```text
Knowledge Assistant
Organizational Knowledge
"What does the organization know?"
        │
        ▼
AI Decision Journal
Organizational Decisions
"What did the organization decide, and why?"
        │
        ▼
SynapseFlow
Trusted Organizational Execution
"Is the consequential action eligible to happen?"
```

The projects explore different but related organizational problems:

**Knowledge Assistant** focuses on what the organization knows.

**AI Decision Journal** focuses on what the organization decides, what justified that judgment, and how the Decision evolves over time.

**SynapseFlow** explores how trusted organizational work moves from judgment into consequential execution.

The systems are designed as distinct architectural responsibilities rather than a single monolithic application.

---

# Project Status

## Implemented

- Persistent multi-Decision workspace
- Searchable Decision Library
- New Decision creation
- Editable Decision records
- Accountable Decision ownership
- Workspace section navigation
- Decision governance
- Operational outcome tracking
- Lessons Learned
- Explicit Decision lifecycle
- Domain-defined lifecycle transitions
- Invalid transition rejection
- Decision difference detection
- Lifecycle event construction
- Timeline generation
- Decision history generation
- Supabase email/password authentication
- Authenticated session restoration
- Authenticated workspace boundary
- PostgreSQL Row Level Security
- Authenticated-only Decision Journal data access
- Version-controlled database access migration
- Supabase persistence
- Repository abstraction
- Persistence mapping
- Layered application architecture

---

# Roadmap

Potential future development includes:

- Organizational membership and resource-level authorization
- Decision-specific ownership and approval authority
- Authenticated actor attribution
- Expanded approval workflows
- Knowledge Assistant evidence integration
- Evidence search and attachment workflows
- Decision analytics
- Cross-decision reporting
- Notification and review workflows
- Cross-product integration

The immediate security direction is intentionally narrow: move from **authenticated** access to explicit **authorized** access without turning Decision Journal into a generalized identity platform.

---

# Running the Project

## Install

### Frontend

```bash
cd client
npm install
```

### Server

```bash
cd server
npm install
```

---

## Start

### Server

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

---

## Build

```bash
npm --prefix client run build
```

---

# Screenshot Assets

The README uses the following documentation assets:

```text
docs/
└── images/
    ├── hero.png
    ├── workspace.png
    ├── governance.png
    ├── lifecycle.png
    ├── outcomes.png
    └── lessons.png
```

The screenshots use a fictional organizational scenario for demonstration purposes.

---

# About This Project

AI Decision Journal is a portfolio implementation exploring enterprise AI, workflow systems, decision governance, organizational memory, and trustworthy application boundaries.

The project began with a simple question:

**What would it mean for an organization to preserve a decision as carefully as it preserves a document or transaction?**

The resulting application treats decisions as governed records that can accumulate context, evidence, ownership, recommendations, human judgment, lifecycle history, operational outcomes, and lessons over time.

The deeper engineering focus is the translation of organizational behavior into explicit software boundaries: what constitutes state, which transitions are valid, what becomes history, what remains a working edit, who is interacting with the system, where access is enforced, who remains accountable, and how past decisions can become useful organizational knowledge.

The current security architecture makes an important distinction: proving identity is necessary, but identity alone does not prove authority. Authentication is implemented; fine-grained authorization and authenticated actor attribution remain deliberate next layers.

---

# License

This repository is provided for portfolio and educational purposes.

Please do not redistribute substantial portions of the project without permission.

---

# Author

**Anson O'Connor**

AI Implementation & Workflow Systems Architect

Austin, Texas

**LinkedIn:** [linkedin.com/in/ansonoconnor](https://www.linkedin.com/in/ansonoconnor)

**Website:** [synapseflowsystems.com](https://www.synapseflowsystems.com)