---
project: the-knowledge-bay
summary: >-
  A learning network for students to share resources, ask for help, and study together in groups formed around shared interests.
role: Team contributor and 2026 hardening lead
timeframe: 2025–2026
team: 3
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/visitor-landing.png
      alt: Teal shoreline landing page with an open-book logo and buttons to join or sign in
      caption: The public landing introduces the learning network in Spanish.
    - src: ./shots/group-feed.png
      alt: Study group feed with two sample articles, like and comment counts, and a help request below
      caption: Articles and requests tagged with the group’s topic appear together. The group reads the same posts as the global feed.
    - src: ./shots/chat-thread.png
      alt: Chat with a search result in the left pane and one sample message above the composer
      caption: A student can find a peer and start a private conversation without an existing thread.
    - src: ./shots/moderator-analytics.png
      alt: Moderator dashboard with activity by topic, weekly participation, and a table of student communities
      caption: Moderators can see which topics students post about and which interests they share. The figures come from synthetic data.
decisions:
  - question: What should own students’ work after a restart?
    options:
      - label: Mutable collections in the Java process
        reason: Fast to wire into the first version, but accounts, interests, and posts disappeared when the process restarted.
      - label: SQLite as the source of truth
        reason: Database-assigned IDs and repository transactions let related changes commit together without a separate database service.
        chosen: true
    consequence: Accounts, content, and messages survive restarting the server on the same file. Group feeds read canonical posts rather than storing a second copy.
    evidence:
      - label: SQLite persistence contract
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/docs/persistence-contract.md
      - label: Restart persistence test
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/PersistenceContractTest.java
      - label: Barrier-driven concurrency test
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/ConcurrentDomainTest.java
  - question: Where should the API get the identity of the caller?
    options:
      - label: Interpret identity separately in each controller
        reason: Repeating the lookup lets controllers disagree about how to handle a missing or invalid session.
      - label: Use the principal resolved by the bearer filter
        reason: Resolve the session once per protected request and deny access unless the route has an explicit rule.
        chosen: true
    consequence: Controllers take the actor from the session. Requests supply targets, not the identity acting on them.
    evidence:
      - label: Bearer session filter
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/infrastructure/config/BearerSessionFilter.java
      - label: Spring Security route rules
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/infrastructure/config/SecurityConfig.java
  - question: What should the custom data structures do once SQLite owns writes?
    options:
      - label: Keep a separate mutable graph as application state
        reason: The graph would need to stay in sync with every change to follows and profiles.
      - label: Rebuild the graph from stored relationships
        reason: Keep the custom undirected graph for traversal without making it a second store.
        chosen: true
    consequence: Mutual follows become graph edges, and a queue traverses them to find a shortest path. Topic and participation views are computed from stored activity.
    evidence:
      - label: Graph and analytics projections
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/model/TheKnowledgeBay.java
results:
  - label: Spring Boot and SQLite
    detail: All 109 server tests passed, including a restart against the same SQLite file and writes released together by a concurrency barrier.
    url: https://github.com/diegnghtmr/the-knowledge-bay/tree/main/server/src/test
  - label: React checks and production build
    detail: All 31 client tests passed, and ESLint reported no errors or warnings. Lazy routes reduced the Vite entry chunk from 1,394 kB to 454 kB (minified, before gzip).
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/App.jsx
  - label: Packaged Chromium and CI
    detail: Ten Chromium scenarios passed against the Spring JAR with the built SPA and a disposable SQLite file. The verify jobs passed on merged PR #1.
    url: https://github.com/diegnghtmr/the-knowledge-bay/pull/1
limitations:
  - Session tokens live in the Java process, so students and moderators sign in again after a restart.
  - Chat uses HTTP requests rather than WebSockets. Resource posts store attachment names, not downloadable files.
architecture:
  system: The Knowledge Bay
  caption: In the packaged deployment Spring serves the built SPA and its API on the same origin.
  nodes:
    - id: frontend
      kind: container
      label: Web app (SPA)
      name: the-knowledge-bay
      repo: the-knowledge-bay
      tech: React 19 / JavaScript
      does: Shows groups, chat, and moderator views
      col: 0
      row: 0
    - id: backend
      kind: container
      label: REST API
      name: The Knowledge Bay API
      tech: Java 21 / Spring Boot 3.4
      does: Serves the SPA and handles API requests
      col: 1
      row: 0
    - id: sqlite
      kind: store
      label: Data store
      name: SQLite
      tech: SQLite
      does: Stores students, posts, and messages
      col: 2
      row: 0
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Calls the same-origin API
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/services/apiClient.js
    - from: backend
      to: sqlite
      protocol: JDBC/SQL
      verb: Reads and writes records
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/repository/DomainRepository.java
---

## Problem

When students get stuck on an assignment, the group that can help is not always the one they already know. A link or explanation shared privately is also hard for the next student to find. The Knowledge Bay lets students publish resources, ask questions, and find groups through the interests they list. Moderators can see what gets posted by topic and explore connections between students.

The team built the original app from March to June 2025. In that version, a restart could erase accounts and posts, and two publications accepted together could leave only one visible in the feed. The November 2026 hardening focused on making those workflows reliable while keeping the original shoreline palette and layout.

## How it works

The React SPA and Spring Boot API live in one repository. In the packaged deployment, Spring serves the built client and its route fallback as well as `/api`. The browser sends a bearer token with protected requests. Spring resolves the token to a student or moderator before a handler runs. React loads chat, profile, and moderation routes on demand instead of including them all in the entry bundle.

The Java repositories write to one SQLite file. Creating a student with interests is one transaction, including the automatic study group associations. Groups derive membership from interests and query the same records as the global feed, so editing a post does not require updating a second copy. The publish form waits for the API and disables repeat submissions while a request is in flight; the database still gives separate posts distinct IDs.

The affinity graph is rebuilt from a database snapshot. Mutual follows create edges, and a breadth-first search finds the shortest path between two students. The moderation dashboard reads topic activity and participation from stored records rather than keeping an independent counter.
