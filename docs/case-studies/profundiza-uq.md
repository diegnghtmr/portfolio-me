# Profundiza UQ

**Summary.** Profundiza UQ is a web client and a backend for professional-elective enrollment at Universidad del Quindío. [[Frontend README](https://github.com/diegnghtmr/profundiza-uq-frontend#readme), [backend README](https://github.com/diegnghtmr/profundiza-uq-backend#readme)]

**Problem and context.**
- Enrollment needs to classify requests against each group's capacity.
- When students submit at the same time, the server must generate their arrival order.
- The backend names overbooking as its main concurrency risk.
- The client shows student and administrator flows based on the authenticated user's role.

[[Backend tests](https://github.com/diegnghtmr/profundiza-uq-backend#tests), [frontend "Try it"](https://github.com/diegnghtmr/profundiza-uq-frontend#try-it)]

## Facts

- **Surfaces:** a role-based web client, an API, and background workers for notifications and reports. [[Frontend README](https://github.com/diegnghtmr/profundiza-uq-frontend#readme), [backend modules](https://github.com/diegnghtmr/profundiza-uq-backend#modules)]
- **Stack:**
  - Frontend: React, TypeScript, Vite, TanStack Query and Tailwind.
  - Backend: Go, chi, pgx and PostgreSQL.

  [[Frontend README](https://github.com/diegnghtmr/profundiza-uq-frontend#readme), [backend README](https://github.com/diegnghtmr/profundiza-uq-backend#readme)]
- **Repositories:**
  - [profundiza-uq-frontend](https://github.com/diegnghtmr/profundiza-uq-frontend) owns the screens.
  - [profundiza-uq-backend](https://github.com/diegnghtmr/profundiza-uq-backend) owns the enrollment rules and persistence.
  - The frontend calls `/api/v1` by default, and its production container reverse-proxies `/api` to the backend.

  [[Frontend README](https://github.com/diegnghtmr/profundiza-uq-frontend#readme)]
- **Live demo:** TO CONFIRM.

## Demonstration (screens to capture)

1. Log in with an OTP code sent to the institutional email. Locally, the code is available through Mailpit.
2. Browse the offerings and submit a plan.
3. Open My Requests.
4. Review requests in the administrator queue.

[[Frontend "Try it" and structure](https://github.com/diegnghtmr/profundiza-uq-frontend#try-it)]

## Decisions

TO CONFIRM: the sources are linked, but Diego still has to confirm how each decision is framed and what his part in it was.

1. **Read capacity without protection or lock the row**
   - **Choice:** lock the offering-group row with `SELECT … FOR UPDATE` before classifying a request.
   - **Consequence:** concurrent submissions cannot be classified against a stale seat count.
   - **Evidence:** "locks the target offering group row." [[`submit.go`](https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit.go)]
2. **Mix server and client state or keep them apart**
   - **Choice:** TanStack Query holds server state and Zustand holds UI state.
   - **Consequence:** identity comes from `/me`, while the selected semester and the plan draft stay in client state.
   - **Evidence:** "Server state lives in TanStack Query, never Zustand." [[Frontend conventions](https://github.com/diegnghtmr/profundiza-uq-frontend#conventions)]

## Verifiable result

[`TestSubmit_NoOverbookingUnderConcurrency`](https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit_integration_test.go) sends 25 submissions for the same shift to a group with capacity for one. Its stated assertions:

- exactly one request gets the direct seat;
- the remaining requests for that shift go to the waitlist;
- every request gets a unique arrival sequence.

The test needs a PostgreSQL test database. This draft does not claim it has been seen passing. [[Backend tests](https://github.com/diegnghtmr/profundiza-uq-backend#tests)]

## Limitations and role

- **Next steps listed by the backend:** sqlc, OpenTelemetry, importing students from multipart uploads, and richer report columns. [[Backend modules](https://github.com/diegnghtmr/profundiza-uq-backend#modules)]
- **Role and individual authorship:** TO CONFIRM.
