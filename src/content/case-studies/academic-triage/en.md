---
project: academic-triage
summary: >-
  Students submit academic requests at Universidad del Quindío, and service desk staff classify, prioritize, assign, and track them through closure.
role: Frontend and backend; 208 of 213 commits in a team of 3
timeframe: "2026"
team: 3
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/classified-queue.png
      alt: Staff request list filtered to Classified, with grade reviews, credit transfers, and group changes.
      caption: A status filter narrows the queue to classified requests; each row opens the individual case.
    - src: ./shots/staff-triage.png
      alt: Classified grade review with a two-event history and a matching rule that recommends medium priority.
      caption: The intake and classification appear in the history. The rule recommends medium priority without changing the request.
    - src: ./shots/operational-reports.png
      alt: Administrator report with an active date range, total requests, average resolution time, and bar charts by status and priority.
      caption: A date range lets administrators see the workload and request mix for a selected period. These figures are from the local demo dataset.
decisions:
  - question: Where should the request workflow be enforced?
    options:
      - label: Enforce transitions in the browser
        reason: The browser can give immediate feedback, but its rules can drift from the API and do not cover other clients.
      - label: Enforce transitions in the Java domain
        reason: The API validates the actor and the requested transition. Angular uses role and state to show the relevant actions.
        chosen: true
    consequence: All clients follow the same transitions. A closed, cancelled, or rejected request cannot re-enter the workflow.
    evidence:
      - label: Domain transition table
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/domain/src/main/java/co/edu/uniquindio/triage/domain/service/StateTransitionValidator.java
      - label: Frontend action visibility
        url: https://github.com/diegnghtmr/academic-triage-frontend/blob/main/src/app/features/requests/utils/request-action-visibility.ts
  - question: How should the system recommend priority when several rules match?
    options:
      - label: Use the first matching rule
        reason: Evaluation can stop early, but the recommendation depends on the order in which the rules arrive.
      - label: Evaluate all matches and take the highest priority
        reason: The domain engine returns the highest matching priority and the list of matches. With no matches, it recommends low priority.
        chosen: true
    consequence: Staff can inspect the matching rules before choosing a priority. Reading the recommendation does not save it to the request.
    evidence:
      - label: Domain priority engine
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/domain/src/main/java/co/edu/uniquindio/triage/domain/service/PriorityEngine.java
      - label: Read-only recommendation use case
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/application/src/main/java/co/edu/uniquindio/triage/application/service/request/GetPrioritySuggestionService.java
  - question: What should happen if two people update the same case at once?
    options:
      - label: Read and save without a row lock
        reason: Updates do not wait for a lock, but both operators can act on the same starting state before either saves.
      - label: Lock the case for the duration of the transaction
        reason: The persistence adapter acquires a write lock before the use case reads and changes the request.
        chosen: true
    consequence: An operator may wait for another edit to finish. The next update then evaluates the transition against the committed state rather than the stale state.
    evidence:
      - label: Request mutation transaction
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/infrastructure/src/main/java/co/edu/uniquindio/triage/infrastructure/config/RequestMutationTransactionalFacade.java
      - label: Request repository write lock
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/infrastructure/src/main/java/co/edu/uniquindio/triage/infrastructure/adapter/out/persistence/repository/RequestJpaRepository.java
results:
  - label: Local request triage
    detail: A student submitted a grade review. Staff classified it, received a medium-priority recommendation with the matching rule, and found the case in the classified queue.
  - label: Local operational report
    detail: An administrator applied a date range and the dashboard rendered the status and priority breakdowns from MariaDB.
  - label: Frontend unit suite
    detail: All 718 Vitest checks passed locally across 39 files.
limitations:
  - Administrative updates that require If-Match are enforced by the API, but the SPA does not send that header.
  - The intake checklist still showed required-field warnings after a valid description was entered. The request itself submitted successfully.
---

## Problem

A student at Universidad del Quindío may need a grade reviewed, a different course group, or approval for late enrollment. The service desk needs enough detail to route each request and decide what to handle first. A grade dispute and a deadline-sensitive group change can start in the same queue, but the staff member handling them needs to know their type, status, and whether someone already took responsibility.

Recording the final outcome alone leaves out the decisions in between. Staff need to see who classified a case, why it changed state, and what happened before it was closed. Administrators need a view of the workload across cases rather than opening each record to see where requests are accumulating.

## How it works

The Angular repository is the web client for the Spring Boot repository. It sends JSON requests to `/api/v1` with a bearer token after sign-in. The Angular dev proxy forwards those calls to the local backend; the production configuration points directly to the deployed API. The frontend chooses which actions to display based on role and request state, while the backend checks whether the signed-in user may perform the action.

The application layer coordinates each request operation through ports. In the Java domain, a request moves from registered to classified, in progress, attended, and closed; cancellation and rejection have their own allowed transitions. Changes become history entries so another staff member can reconstruct what happened. The infrastructure layer stores the request and its history in MariaDB and locks the request row while applying a state change.

Staff can ask for a priority recommendation based on active business rules and see the matches before choosing a priority. That path does not need the optional AI provider. Administrators can filter the operational report by date, review totals and average resolution time, and see distributions by request state, priority, and type.
