---
project: brujula
summary: Academic planning for Universidad del Quindío students, from checking prerequisites to simulating a weekly schedule.
role: Frontend development and backend work on curriculum and progress
timeframe: '2026'
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/catalog.png
      alt: Catalog listing Systems and Computing Engineering and Modern Languages, both active.
      caption: Students start with the program catalog. The notice explains that the planner does not replace university records.
    - src: ./shots/curriculum.png
      alt: Daytime curriculum organized by semester, with Programming I expanded to show its Programming Logic prerequisite.
      caption: The curriculum shows the recommended sequence and lets students open a course to inspect its requirements.
    - src: ./shots/progress-declaration.png
      alt: First-semester course list with an open form showing a fictional passing grade of 4.4 for period 2026-1.
      caption: Students declare course attempts by recording the outcome, grade and academic period.
    - src: ./shots/simulation-schedule.png
      alt: Weekly timetable with four color-coded courses and a summary showing 13 of 23 credits and 16 hours per week.
      caption: A simulated second semester combines the repository's seeded course offerings with a fictional student history.
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
---

## Problem

A student planning the next term needs to answer three different questions: what the study plan recommends, what their previous courses qualify them to take, and which of the available sections actually fit together. The curriculum cannot answer the last two questions by itself. A subject can appear in the recommended semester but still require a course the student has not passed, or its available sections can overlap with other classes.

Brújula brings those checks into one place for students at Universidad del Quindío. Students enter their own academic history and use it to try a schedule before enrollment. The resulting plan is for personal use; it neither certifies grades nor registers the student for classes.

## How it works

The browser app sends HTTP requests through a generated Axios client. Both repositories build against the same OpenAPI contract: the backend owns the specification and generates Spring interfaces and models, while the frontend generates its client from a tracked copy. After Keycloak sign-in, Spring keeps the identity token server-side and gives the browser a session cookie. In the local stack, Vite sends `/api/v1` requests to Spring and strips the prefix.

Inside the backend, the catalog and curriculum modules supply plans, recommended semesters and prerequisites. A student subscribes to a plan with a reference shift, then declares course attempts by period. The progress module reads those attempts to determine which courses count as passed and calculate credits and estimated averages. The simulator combines that progress with offerings for the chosen period. It checks prerequisites, credit limits and time overlaps, then returns the weekly schedule and credit totals for the selected sections.
