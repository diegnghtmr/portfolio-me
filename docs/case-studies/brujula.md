# Brújula

**Summary.** Brújula is an academic-planning platform for Universidad del Quindío, built as a modular backend and a browser frontend. ([ADR-001](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md), [frontend README](https://github.com/diegnghtmr/brujula-frontend#readme))

**Problem and context.**

- The architecture decision describes a single-institution scope with curriculum, progress and simulation modules, at a time when the boundaries between them were still being discovered.
- Students declare their own academic data; it is not official institutional data.
- Privacy constraints limit what staff can see.

([ADR-001](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md), [ADR-012](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-012-staff-no-individual-grades-mvp.md))

## Facts

- **[brujula-backend](https://github.com/diegnghtmr/brujula-backend):** a Spring Boot modular monolith, the API contract and the local infrastructure configuration. ([ADR-001](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md), [ADR-006](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-006-openapi-contract-first-axios.md))
- **[brujula-frontend](https://github.com/diegnghtmr/brujula-frontend):** a React, TypeScript and Vite single-page app with catalog, curriculum, progress, import and simulation features. ([README](https://github.com/diegnghtmr/brujula-frontend#readme), [features](https://github.com/diegnghtmr/brujula-frontend/tree/main/src/features))
- **Connection:** the backend owns the OpenAPI contract. The frontend keeps a tracked copy of it and uses an Axios client generated from it. ([ADR-006](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-006-openapi-contract-first-axios.md))
- **Live demo:** TO CONFIRM.

## Demonstration (screens to capture)

The repository has components and real-stack end-to-end specifications for each of these. TO CONFIRM: the screenshots themselves, and whether these flows work today.

1. Program catalog.
2. Curriculum view.
3. Progress declaration.
4. Simulation schedule.

([Frontend features](https://github.com/diegnghtmr/brujula-frontend/tree/main/src/features), [real-stack E2E](https://github.com/diegnghtmr/brujula-frontend/tree/main/e2e/real-stack))

## Decisions

TO CONFIRM: the sources are linked, but Diego still has to confirm how each decision is framed and what his part in it was.

1. **Microservices or a modular monolith**
   - **Choice:** Spring Modulith in a "single Spring Boot process".
   - **Consequence:** avoids the overhead of a distributed system from the start, at the cost of sharing one JVM and one deployment lifecycle.

   ([ADR-001](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md))
2. **How to handle the API contract**
   - **Options weighed:** a hand-written contract, validation only, or a generated server and client.
   - **Choice:** OpenAPI contract-first, with the backend contract as "authoritative".
   - **Consequence:** generation reduces the risk of drift, but the client has to be regenerated and the frontend's copy of the contract kept in sync.

   ([ADR-006](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-006-openapi-contract-first-axios.md))
3. **What staff can see of student grades**
   - **Options weighed:** access to individual grades, or aggregates only.
   - **Choice:** aggregates only in the MVP; staff have "no access to individual student grades".
   - **Consequence:** helping an individual student would need a delegate-access feature later.

   ([ADR-012](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-012-staff-no-individual-grades-mvp.md))

## Verifiable result

The backend workflow defines formatting, test and coverage gates. It states that it runs locally or by hand: no remote runner is configured. TO CONFIRM: whether those gates pass. ([CI configuration](https://github.com/diegnghtmr/brujula-backend/blob/main/.github/workflows/ci.yml))

## Limitations and role

- **Production limitation:** production needs an `/api/v1` proxy rewrite or an equivalent backend context path. Without it, the frontend README warns, API calls return 404. ([Frontend README](https://github.com/diegnghtmr/brujula-frontend#production-deployment--api-proxy-requirement))
- **Role:** TO CONFIRM. The ADR names a "Brújula architecture team" but does not say what Diego contributed individually. ([ADR-001](https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md))
