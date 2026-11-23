---
project: brujula
summary: Academic planning for Universidad del Quindío students, from checking prerequisites to simulating a weekly schedule.
role: Frontend development and backend work on curriculum and progress
timeframe: '2026'
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/curriculum.png
      alt: Daytime curriculum by semester, with Programación I expanded to show that Lógica de Programación must be passed first.
      caption: Opening a course in the curriculum shows its credits and prerequisites.
    - src: ./shots/progress-declaration.png
      alt: First-semester course list with a declaration form set to Passed, a fictional grade of 4.4 and academic period 2026-1.
      caption: The declaration form records the outcome, final grade and academic period for a course attempt.
    - src: ./shots/progress-summary.png
      alt: Progress summary for a fictional student showing five courses passed, 12 of 163 credits earned and an estimated average of 4.32.
      caption: The five self-reported passes count toward an estimated 7.4% of the plan.
    - src: ./shots/simulation-schedule.png
      alt: Weekly timetable with four color-coded courses, an offering browser and a summary showing 13 of 23 credits and 16 hours per week.
      caption: The daytime simulation for 2026-2 combines the project's seeded offerings with a fictional student's course history.
decisions:
  - question: Should the backend deploy as microservices or as one process?
    options:
      - label: Microservices
        reason: Services could deploy and scale independently, but the team was still defining the module boundaries and did not need separate scaling.
      - label: Modular monolith
        reason: Spring Modulith provides boundaries between modules without adding network calls between services.
        chosen: true
    consequence: Module interactions stay in one process, while all modules share the same JVM and release lifecycle.
    evidence:
      - label: ADR-001 — Modular monolith over microservices
        url: https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md
  - question: How should the backend and frontend share their API contract?
    options:
      - label: Hand-maintained integration
        reason: Both sides implement the agreed API separately, so request and response shapes can drift.
      - label: Contract validation and generated models only
        reason: Validation checks the schema, but hand-written routes and client calls can still diverge from it.
      - label: OpenAPI with server and client generation
        reason: The backend spec defines the Spring interfaces and models; a tracked copy generates the frontend Axios client.
        chosen: true
    consequence: Both builds compile against generated types. A contract change still requires syncing the frontend copy and regenerating the client.
    evidence:
      - label: ADR-006 — OpenAPI contract first
        url: https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-006-openapi-contract-first-axios.md
      - label: Frontend OpenAPI copy
        url: https://github.com/diegnghtmr/brujula-frontend/blob/main/openapi/brujula-api.v1.yaml
  - question: Should staff be able to see an individual student's self-reported grades?
    options:
      - label: Individual grade access
        reason: Staff could inspect a specific student's record when offering help, but they would gain access to sensitive data.
      - label: Aggregate data only
        reason: Keep individual grades and course attempts private to the student; limit staff reporting to aggregate data.
        chosen: true
    consequence: Staff cannot inspect an individual record to troubleshoot it. That would require a separate way for the student to grant access.
    evidence:
      - label: ADR-012 — No staff access to individual grades
        url: https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-012-staff-no-individual-grades-mvp.md
results:
  - label: Local browser and API check
    detail: Signed in through Keycloak, browsed the catalog and curriculum, saved a fictional grade, and verified eight sessions for four courses without schedule clashes.
  - label: Backend checks
    detail: 304 selected Gradle tests passed, including module boundaries, progress, prerequisites and schedule clashes.
    url: https://github.com/diegnghtmr/brujula-backend/blob/main/src/test/java/co/edu/uniquindio/brujula/ModularityTest.java
  - label: Frontend checks
    detail: All 511 Vitest tests passed locally, as did lint and type checking.
limitations:
  - A static production deployment needs a proxy to strip the /api/v1 prefix, or the backend must be mounted under that path.
  - The offerings endpoint accepts a course ID parameter but does not filter by it.
architecture:
  system: Brújula
  caption: >-
    The backend keeps identity tokens server-side and gives the browser a session cookie.
  nodes:
    - id: frontend
      kind: container
      label: Web app
      name: brujula-frontend
      repo: brujula-frontend
      tech: React 19 / TypeScript
      does: Shows curricula, progress, and schedules
      col: 0
      row: 0
    - id: backend
      kind: container
      label: API service
      name: brujula-backend
      repo: brujula-backend
      tech: Spring Boot / Spring Modulith
      does: Checks prerequisites, credits, and overlaps
      col: 1
      row: 0
    - id: planner-db
      kind: store
      label: Data store
      name: planner_db
      tech: PostgreSQL
      does: Stores study plans, progress, and sessions
      col: 2
      row: 0
    - id: keycloak
      kind: external
      label: Identity provider
      name: Keycloak
      tech: OpenID Connect
      does: Authenticates users and verifies email
      col: 2
      row: 1
    - id: mailpit
      kind: external
      label: Local mail server
      name: Mailpit
      tech: SMTP
      does: Captures email in local development
      col: 3
      row: 1
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Calls via Axios
      evidence: https://github.com/diegnghtmr/brujula-frontend/blob/main/src/api/client.ts
    - from: backend
      to: planner-db
      protocol: SQL
      verb: Reads and writes plans
      evidence: https://github.com/diegnghtmr/brujula-backend/blob/main/ops/local/compose.full.yaml
    - from: backend
      to: keycloak
      protocol: OIDC
      verb: Exchanges sign-in codes
      evidence: https://github.com/diegnghtmr/brujula-backend/blob/main/src/main/resources/application.yaml
    - from: frontend
      to: keycloak
      protocol: HTTP
      verb: Redirects on sign-out
      evidence: https://github.com/diegnghtmr/brujula-frontend/blob/main/src/features/auth/components/logout-button.tsx
    - from: keycloak
      to: mailpit
      protocol: SMTP
      verb: Sends verification email
      evidence: https://github.com/diegnghtmr/brujula-backend/blob/main/ops/local/keycloak/realm-export.json
---

## Problem

A student planning the next term needs to answer three different questions: what the study plan recommends, what their previous courses qualify them to take, and which of the available sections actually fit together. The curriculum cannot answer the last two questions by itself. A subject can appear in the recommended semester but still require a course the student has not passed, or its available sections can overlap with other classes.

Brújula brings those checks into one place for students at Universidad del Quindío. Students enter their own academic history and use it to try a schedule before enrollment. The resulting plan is for personal use; it neither certifies grades nor registers the student for classes.

## How it works

The browser app sends HTTP requests through a generated Axios client. Both repositories build against the same OpenAPI contract: the backend owns the specification and generates Spring interfaces and models, while the frontend generates its client from a tracked copy. After Keycloak sign-in, Spring keeps the identity token server-side and gives the browser a session cookie. In the local stack, Vite sends `/api/v1` requests to Spring and strips the prefix.

Inside the backend, the catalog and curriculum modules supply plans, recommended semesters and prerequisites. A student subscribes to a plan with a reference shift, then declares course attempts by period. The progress module reads those attempts to determine which courses count as passed and calculate credits and estimated averages. The simulator combines that progress with offerings for the chosen period. It checks prerequisites, credit limits and time overlaps, then returns the weekly schedule and credit totals for the selected sections.
