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
    consequence: The server checks access to club records independently of browser navigation and applies the same club scope to report data and PDF downloads. Health and sign-in are explicitly public.
    evidence:
      - label: Server-side authorization policy
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/security/RosterAuthorization.java
      - label: API authorization tests
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/security/ApiAuthorizationTests.java
  - question: Where should report PDFs be generated?
    options:
      - label: Render PDFs in the browser
        reason: The browser can build a file from the report data it already fetched, but it must load a PDF renderer.
      - label: Render PDFs on the Spring Boot server
        reason: The export endpoints reuse the same club-scoped report queries and draw charts as vectors in the PDF.
        chosen: true
    consequence: All 12 reports are available as server-generated PDFs. The browser sends the selected filters and downloads the file without a client-side PDF renderer.
    evidence:
      - label: PDF endpoints and report queries
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/controller/AnalyticsReportPdfController.java
      - label: Vector chart drawing
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/service/report/ReportPdfChart.java
      - label: Browser download
        url: https://github.com/diegnghtmr/roster-edge/blob/main/frontend/src/components/reports/ExportButton.tsx
  - question: How should the standings tell a draw from an unplayed match?
    options:
      - label: Infer the result from the scores
        reason: A pair of zeros cannot distinguish a scoreless draw from a fixture without a recorded result.
      - label: Record finalization explicitly
        reason: Scores become eligible for the standings only after the club records a result.
        chosen: true
    consequence: An unplayed fixture adds no games or points. A 0–0 saved through the result form gives both teams a point.
    evidence:
      - label: Migration for the explicit result state
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/resources/db/migration/V003__match_result_state.sql
      - label: Standings and result regression tests
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/report/MatchReportTest.java
results:
  - label: Backend on PostgreSQL 17
    detail: All 76 tests passed, including scheduling rollback, standings, club scoping for reports and PDF exports, and vector chart rendering.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/backend/src/test
  - label: Frontend tests and production build
    detail: All 49 Vitest tests passed, including result entry and PDF downloads. TypeScript and Vite built the production frontend.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/frontend/src/test
  - label: Packaged Chromium smoke
    detail: 14/14 checks passed against the built frontend and packaged API, including Bogotá match dates, result entry, a standings PDF download, and mobile rendering.
    url: https://github.com/diegnghtmr/roster-edge/blob/main/docs/testing/smoke.cjs
  - label: GitHub Actions
    detail: The frontend and backend-and-smoke jobs passed on merged PRs #6 and #7.
    url: https://github.com/diegnghtmr/roster-edge/pull/7/checks
limitations:
  - Staff can save a result only for an active match with exactly one active home assignment and one active away assignment for different teams.
  - The API tracks active sessions in memory, so restarting it requires users to sign in again.
architecture:
  system: RosterEdge
  caption: The SPA and API share a repository; the API alone queries PostgreSQL and generates PDFs from the same club-scoped data as the JSON reports.
  nodes:
    - id: frontend
      kind: container
      label: Web app (SPA)
      name: roster-edge
      repo: roster-edge
      tech: React 19 / TypeScript
      does: Schedules matches and records scores
      col: 0
      row: 0
    - id: backend
      kind: container
      label: REST API
      name: RosterEdge API
      tech: Java 21 / Spring Boot 3.5
      does: Scopes data by club and generates PDFs
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
      protocol: HTTP / JSON + PDF
      verb: Calls API, downloads PDFs
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/frontend/src/api/services/reports/useReportsData.ts
    - from: backend
      to: postgres
      protocol: JDBC/SQL
      verb: Queries club records
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/repository/report/AnalyticsReportQueryRepository.java
---

## Problem

Before posting a match schedule, club staff need to know which teams are taking part, where they will play, and which event the fixture belongs to. A fixture also feeds other parts of the operation: its opponents appear on the schedule, while its eventual result contributes to the season table. An unplayed match must be visible on the schedule without looking like a draw in the standings.

RosterEdge gives staff a place to manage teams, schedule matches, and record scores for their club. Staff can check standings and payment reports, then download PDFs to share outside the app. The screens below use a fictional club and sample payments from the local demo.

## How it works

A React single-page app sends JSON requests to a Spring Boot REST API and a bearer token after sign-in. The server derives club scope from that session, not from a browser-supplied club filter. React Router loads report routes on demand. TanStack Query fetches report data, and Recharts draws the charts on screen.

Staff open a result form from the match list to enter or correct the home and away scores without reopening the scheduling form. The form accepts whole, non-negative scores and sends them to `PUT /api/matches/{id}/result/`. Saving refreshes the match list and standings. Scheduling is separate: the API writes the match, both team assignments, and the in-app notification in one PostgreSQL transaction. The browser sends the selected calendar day without a UTC conversion, so it stays the same in Bogotá.

Spring Boot generates PDFs for all 12 reports with OpenPDF, drawing charts as vectors. The browser requests the PDF with the current report filters and downloads it. The export uses the same club scope as the JSON report data.

Flyway applies versioned schema migrations. One migration adds a sequence-sync function for controlled imports with explicit IDs: a sequence advances if imported records need it, but never moves backward.
