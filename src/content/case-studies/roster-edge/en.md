---
project: roster-edge
summary: >-
  A workspace for sports club staff to manage teams, schedule matches, and review standings and payments.
role: Frontend and backend contributor on a team project
timeframe: 2025–2026
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/teams.png
      alt: Club team directory with name and mascot filters and a new-team confirmation
      caption: The club directory shows Bambú City FC alongside the four fictional teams in the demo fixture.
    - src: ./shots/match-create.png
      alt: Match form with a date, start and end times, venue, event, and home and away teams
      caption: Staff select the date, venue, and two teams in one form. The date is sent as the calendar day selected in the browser.
    - src: ./shots/standings.png
      alt: Season standings with points and wins charts and a PDF export button
      caption: Standings count finalized results. Scheduling a match without a result does not award either team a point.
    - src: ./shots/payment-report.png
      alt: Payment-method report with net revenue, payment count, and a chart in Colombian pesos
      caption: The payment report groups the fictional club’s payments by method and offers a PDF export.
decisions:
  - question: Where should the API get the current club?
    options:
      - label: Club selected by the client
        reason: A client filter can narrow a list, but it cannot establish which club an account may access.
      - label: Club derived from the authenticated roster account
        reason: Resolve the club from the session and deny access unless a server-side rule allows the request.
        chosen: true
    consequence: The server checks access to club records independently of browser navigation. Health and sign-in are explicitly public.
    evidence:
      - label: Server-side authorization policy
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/security/RosterAuthorization.java
      - label: API authorization tests
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/security/ApiAuthorizationTests.java
  - question: What should commit when staff schedule a match?
    options:
      - label: Save the match and follow-up records separately
        reason: Separate writes can leave a saved match without both teams or its in-app notification.
      - label: Commit all scheduling records together
        reason: The match, home and away assignments, and notification belong to the same scheduling operation.
        chosen: true
    consequence: If an assignment or notification write fails during scheduling, the transaction rolls back the match as well.
    evidence:
      - label: Transactional scheduling service
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/service/impl/MatchServiceImpl.java
      - label: PostgreSQL rollback tests
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/match/MatchPersistenceTest.java
  - question: How should the standings tell a draw from an unplayed match?
    options:
      - label: Infer the result from the scores
        reason: A pair of zeros cannot distinguish a scoreless draw from a fixture without a recorded result.
      - label: Record finalization explicitly
        reason: Scores become eligible for the standings only after the club records a result.
        chosen: true
    consequence: An unplayed fixture adds no games or points. A finalized 0–0 still gives both teams a point.
    evidence:
      - label: Migration for the explicit result state
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/resources/db/migration/V003__match_result_state.sql
      - label: Standings and result regression tests
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/report/MatchReportTest.java
results:
  - label: Backend on PostgreSQL 17
    detail: All 30 tests passed, covering club access, scheduling rollback, standings, and migration behavior across restarts.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/backend/src/test
  - label: Frontend tests and production build
    detail: All 39 Vitest tests passed, including session restoration, date round trips, and report rendering. TypeScript and Vite built the production frontend.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/frontend/src/test
  - label: Packaged Chromium smoke
    detail: All 13 checks passed against the built frontend and packaged API, including scheduling in the Bogotá time zone, club reports, and mobile rendering.
    url: https://github.com/diegnghtmr/roster-edge/blob/main/docs/testing/README.md
  - label: GitHub Actions
    detail: The frontend and backend-and-smoke jobs passed on merged PR #3.
    url: https://github.com/diegnghtmr/roster-edge/pull/3
limitations:
  - The browser can schedule fixtures, but there is no result-entry form. Finalizing a result uses the authenticated API.
  - The API tracks active sessions in memory, so restarting it requires users to sign in again.
architecture:
  system: RosterEdge
  caption: The SPA and REST API share a repository, but only the API connects to PostgreSQL.
  nodes:
    - id: frontend
      kind: container
      label: Web app (SPA)
      name: roster-edge
      repo: roster-edge
      tech: React 19 / TypeScript
      does: Schedules fixtures and displays reports
      col: 0
      row: 0
    - id: backend
      kind: container
      label: REST API
      name: RosterEdge API
      tech: Java 21 / Spring Boot 3.5
      does: Enforces club access and records results
      col: 1
      row: 0
    - id: postgres
      kind: store
      label: Data store
      name: PostgreSQL
      tech: PostgreSQL / Flyway
      does: Stores clubs, fixtures, and payments
      col: 2
      row: 0
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Fetches club data
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/frontend/src/api/endPoints/fetchGet.ts
    - from: backend
      to: postgres
      protocol: JDBC/SQL
      verb: Queries club records
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/repository/report/AnalyticsReportQueryRepository.java
---

## Problem

Before posting a match schedule, club staff need to know which teams are taking part, where they will play, and which event the fixture belongs to. A fixture also feeds other parts of the operation: its opponents appear on the schedule, while its eventual result contributes to the season table. An unplayed match must be visible on the schedule without looking like a draw in the standings.

RosterEdge gives staff a place to manage teams, arrange matches, and check standings and payment reports for their club. Staff can export a report as a PDF to share it outside the app. The screens below use a fictional club and sample payments from the local demo.

## How it works

A React single-page app sends JSON requests to a Spring Boot REST API. The browser signs in with a roster account and sends a bearer token on later requests. The server derives club scope from that session instead of relying on a club filter supplied by the browser. TanStack Query manages requests; Recharts displays report data, and React PDF generates exports in the browser.

The scheduling service writes the match, both team assignments, and the in-app notification in one PostgreSQL transaction. The browser’s date-only codec sends a calendar date without converting it through UTC, so selecting a date in Bogotá does not shift the fixture to the previous day. Scheduling and finalizing a result are separate operations. The standings query counts finalized results rather than treating the default scores as an outcome.

Flyway applies versioned schema migrations. One migration adds a sequence-sync function for controlled imports with explicit IDs: a sequence advances if imported records need it, but never moves backward.
