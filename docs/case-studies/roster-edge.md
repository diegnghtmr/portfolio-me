# RosterEdge

RosterEdge gives sports club staff one place to manage teams, schedule matches, and check season standings and payments. The [English](../../src/content/case-studies/roster-edge/en.md) and [Spanish](../../src/content/case-studies/roster-edge/es.md) dossiers are based on the code in [merged PR #3](https://github.com/diegnghtmr/roster-edge/pull/3) (`03ad591`, integration head `84cdb4f`).

## Repository and contribution

[roster-edge](https://github.com/diegnghtmr/roster-edge) contains the React/TypeScript SPA in `frontend/` and the Java 21 / Spring Boot REST API in `backend/`. The SPA calls the API over HTTP/JSON; only the API uses PostgreSQL via JDBC. ([Architecture and local setup](https://github.com/diegnghtmr/roster-edge#architecture))

This was a team project. Baseline Git history includes `ecodant`, `Spalax-dev`, and multiple author labels. Diego contributed on both sides of the application: [API and frontend integration](https://github.com/diegnghtmr/roster-edge/commit/0bb52d1), [PostgreSQL migration](https://github.com/diegnghtmr/roster-edge/commit/7c96859), and [match scheduling](https://github.com/diegnghtmr/roster-edge/commit/95616e2). The work spans the 2025 implementation and the 2026 hardening. Raw shortlog labels are not a distinct-person count.

## Decisions

- **Club access:** A client filter is not proof of club membership. The [API authorization policy](https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/security/RosterAuthorization.java) denies access by default and derives club scope from the roster session.
- **Scheduling:** The [match service](https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/service/impl/MatchServiceImpl.java) creates the match, its two team assignments, and its in-app notification in one database transaction.
- **Standings:** The [result-state migration](https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/resources/db/migration/V003__match_result_state.sql) lets reports distinguish an unplayed fixture from a finalized scoreless draw. The scheduling UI does not record results; that action uses the authenticated API.
- **Migrations and dates:** [Flyway sequence sync](https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/resources/db/migration/V004__sync_identity_sequences.sql) can advance a sequence after a controlled explicit-ID import without rewinding it. The frontend’s [date-only codec](https://github.com/diegnghtmr/roster-edge/blob/main/frontend/src/shared/utils/dateOnly.ts) handles calendar dates without a UTC conversion.

## Demonstration and verification

The dossiers show the team directory, match form, standings, and payment report from the built app running locally against the [synthetic demo fixture](https://github.com/diegnghtmr/roster-edge/blob/main/docs/testing/README.md). No figures from the demo are production outcomes. Astro generates responsive AVIF and WebP from the shared PNG sources.

PR #3 passed 30 backend tests on PostgreSQL 17, 39 Vitest tests, and 13 packaged Chromium smoke checks in GitHub Actions. The workflow builds the TypeScript frontend and runs the packaged Spring Boot API against PostgreSQL. ([CI workflow](https://github.com/diegnghtmr/roster-edge/blob/main/.github/workflows/ci.yml), [PR checks](https://github.com/diegnghtmr/roster-edge/pull/3/checks))
