---
project: profundiza-uq
summary: >-
  Students at Universidad del Quindío use Profundiza UQ to request professional electives, and program staff use it to review requests by group.
role: Sole developer
timeframe: "2026"
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/login.png
      alt: Sign-in form with a fictional institutional email and a Send code button.
      caption: Students and staff sign in with a one-time code sent by email. The captures use fictional accounts.
    - src: ./shots/offerings-plan.png
      alt: Cloud Computing day group with its schedule, remaining seats, prerequisite link and Submit plan button.
      caption: A student adds Cloud Computing to a plan before the enrollment window closes.
    - src: ./shots/my-requests.png
      alt: Four requests with arrival positions, including two acceptances, a request awaiting review and an opposite-shift waitlist entry.
      caption: My Requests shows the outcome for each group, not just whether the plan was submitted.
    - src: ./shots/review-queue.png
      alt: Machine Learning review queue showing capacity, one direct request and two waitlists separated by shift.
      caption: Staff review one group at a time, with same-shift requests ahead of opposite-shift requests.
decisions:
  - question: How should the API allocate the last direct review slot?
    options:
      - label: Read capacity and insert without a lock
        reason: No explicit row lock to wait for, but two requests can read the same free slot before either inserts.
      - label: Lock the offering group before counting
        reason: PostgreSQL makes submissions for that group wait for the transaction holding the lock.
        chosen: true
    consequence: The next submission sees the slots already reserved for review. The database assigns the arrival sequence when it inserts the request.
    evidence:
      - label: Submission transaction
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit.go
      - label: Capacity-one concurrency test
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit_integration_test.go
  - question: Where should the web client keep identity and the unsent plan?
    options:
      - label: Store both in Zustand
        reason: One store for screens to read, but copying the current user into it adds a second place to update or clear on session changes.
      - label: Cache server data separately from the draft
        reason: TanStack Query owns the identity from /me; Zustand holds the selected semester and the draft group IDs.
        chosen: true
    consequence: Screens read identity from the same query, while changing the draft does not change server data until the student submits.
    evidence:
      - label: Frontend state conventions
        url: https://github.com/diegnghtmr/profundiza-uq-frontend/blob/main/README.md#conventions
      - label: Draft store
        url: https://github.com/diegnghtmr/profundiza-uq-frontend/blob/main/src/shared/stores/uiStore.ts
  - question: When should the backend send enrollment notifications?
    options:
      - label: Send email during the submission request
        reason: No worker to run, but SMTP delay is added to submission time and email delivery cannot be rolled back with the database.
      - label: Save a notification to a transactional outbox
        reason: Commit the notification with the request, then let a worker claim it and send the email outside the transaction.
        chosen: true
    consequence: A slow mail relay does not hold the submission open. Email can arrive later, and the worker retries transient failures up to a limit.
    evidence:
      - label: Request and notification written together
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit.go
      - label: Outbox worker and retry policy
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/notification/worker.go
results:
  - label: Concurrent submissions on PostgreSQL
    detail: Of 25 concurrent same-shift submissions for one slot, exactly one received a direct review slot and 24 went to the same-shift waitlist. All 25 arrival sequences were distinct.
    url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit_integration_test.go
  - label: Backend suite
    detail: 110 top-level tests passed locally, including integration tests on a disposable PostgreSQL database.
  - label: Frontend suite
    detail: 187 Vitest checks passed locally, including tests for sign-in, offerings, student requests and the staff review queue.
limitations:
  - The bulk student import endpoint accepts JSON; it does not accept multipart file uploads.
---

## Problem

Students in Systems Engineering at Universidad del Quindío use an enrollment window to request professional electives. Before they submit a plan, they need to compare groups by schedule, shift, prerequisites and available places. A submission is not an acceptance: students need to know whether their requests are awaiting review or on a waitlist.

Program staff review requests by group. Same-shift requests have priority, and each group has a fixed capacity unless staff adjust it. If students submit at the same time, the system needs to assign arrival positions and avoid promising the same direct review slot twice.

## How it works

The web client sends JSON requests to the Go API under `/api/v1`. Vite forwards `/api` during development; nginx forwards the same path in the production image. Both keep the browser on one origin so it can use a session cookie. Sign-in starts with an emailed one-time code, and `/me` supplies the role used to choose the student or staff navigation. The API also checks roles on staff routes.

Students browse published groups and build a draft in the browser. Submitting the draft sends up to four group selections in one batch. For each new request, the backend checks the enrollment window and the student's semester limit. In PostgreSQL it locks the group before reading occupancy, then classifies the request using capacity and the student's shift. A same-shift request takes a direct slot for review when there is room; an opposite-shift request goes to its own waitlist even when the group has room.

Staff see open requests by priority tier and arrival sequence. They record each decision with a reason, and students see the resulting status in My Requests. The submission transaction writes an audit event and queues a notification alongside the request. A worker sends the email after the transaction commits.
