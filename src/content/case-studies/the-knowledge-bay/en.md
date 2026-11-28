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
  - question: Where should application records live when more than one instance is running?
    options:
      - label: Keep the file-based database
        reason: The previous setup ran without a separate database service, but each copy of the file would have its own state.
      - label: Share one PostgreSQL database
        reason: App instances use the same durable records, and Flyway applies versioned schema migrations on startup.
        chosen: true
    consequence: Posts, accounts, and sessions survive restarts. An offline copy moves existing database records in one transaction; attachment files move separately.
    evidence:
      - label: PostgreSQL persistence and one-time copy
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/docs/persistence.md
      - label: Offline copy implementation
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/infrastructure/persistence/SqliteImport.java
  - question: How does a live chat reach a student connected to another instance?
    options:
      - label: Notify only streams on the sending instance
        reason: A process can reach its own streams, not a peer connected elsewhere.
      - label: Notify instances through PostgreSQL LISTEN/NOTIFY
        reason: A committed notification carries only the participant and message IDs. Each instance reloads the message through the authorized conversation.
        chosen: true
    consequence: Chat updates without refreshing across instances. Database leases share one stream cap per student, and HTTP history covers missed events.
    evidence:
      - label: Chat persistence and fan-out
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/docs/persistence.md#sessions-and-messages
      - label: Stream limits and HTTP fallback
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/docs/api.md#chat
      - label: Two-instance chat and capacity tests
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/DurableFeaturesTest.java#L232-L312
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
results:
  - label: Server tests against PostgreSQL
    detail: All 123 server tests passed, including delivery between two instances and enforcement of the shared stream cap.
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/DurableFeaturesTest.java
  - label: Client tests, lint, and production build
    detail: All 33 client tests passed. Lint and the production build also passed.
    url: https://github.com/diegnghtmr/the-knowledge-bay/tree/main/client/tests
  - label: Packaged Chromium audit
    detail: All 12 Chromium scenarios passed against the Spring JAR, the built SPA, and disposable PostgreSQL. They cover live messaging and session and attachment persistence across restart.
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/tests/production-audit.mjs
  - label: GitHub Actions
    detail: The verify job passed for the PostgreSQL PR (#4) and the Docker PR (#5). The image build job also passed for PR #5.
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/.github/workflows/ci.yml
limitations:
  - Older posts that saved only an attachment name remain readable but have no file to download.
  - Replicas on different Docker hosts need shared persistent storage for attachments. A default local named volume is not shared across hosts.
architecture:
  system: The Knowledge Bay
  caption: One image packages the SPA and API; every instance uses the same PostgreSQL database and private attachment store.
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
      label: API service
      name: The Knowledge Bay API
      tech: Java 21 / Spring Boot 3.4
      does: Serves the SPA, API, and chat streams
      col: 1
      row: 0
    - id: postgres
      kind: store
      label: Data store
      name: PostgreSQL
      tech: PostgreSQL 17
      does: Records, sessions, stream leases
      col: 3
      row: 0
    - id: attachments
      kind: store
      label: File store
      name: Uploads
      tech: Volume
      does: Attachment bytes
      col: 3
      row: 1
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Calls API
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/services/apiClient.js
    - from: frontend
      to: backend
      protocol: SSE
      verb: Opens chat stream
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/services/chatApi.js
    - from: backend
      to: postgres
      protocol: JDBC/SQL
      verb: Reads and writes
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/repository/DomainRepository.java
    - from: backend
      to: postgres
      protocol: LISTEN/NOTIFY
      verb: Listens for IDs
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/api/controller/PostgresChatListener.java#L49-L121
    - from: backend
      to: attachments
      protocol: Files
      verb: Stores files
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/service/AttachmentStorage.java
---

## Problem

When students get stuck on an assignment, the group that can help is not always the one they already know. A link or explanation shared privately is also hard for the next student to find. The Knowledge Bay lets students publish resources, ask questions, and find groups through the interests they list. Moderators can see what gets posted by topic and explore connections between students.

The team built the original app from March to June 2025. In that version, a restart could erase accounts and posts, and two publications accepted together could leave only one visible in the feed. The November 2026 hardening focused on making those workflows reliable while keeping the original shoreline palette and layout.

## How it works

The Docker image packages the React client and Spring Boot server. Spring serves the SPA and `/api` on the same origin. Compose checks readiness at `/api/interests` and keeps database and attachment data in named volumes (`pgdata` and `uploads`). The server refuses to start without a nonblank `MODERATOR_PASSWORD` or if the attachment directory is missing, unwritable, or inside the static file tree.

Flyway applies versioned migrations at startup. The offline `--import-sqlite` command reads the old SQLite database without altering it and copies records to an empty PostgreSQL 17 database in one transaction. Attachment files are copied separately. Group feeds still read canonical posts, and the affinity graph is rebuilt from stored mutual follows.

Protected requests carry a bearer token in the header. PostgreSQL stores its hash, not the token itself. Sessions survive server restarts until expiry or revocation.

Chat uses authenticated server-sent events. On commit, PostgreSQL delivers a `LISTEN/NOTIFY` signal containing only the participant and message IDs. Each instance reloads the message through the authorized conversation before sending it to connected participants. Database leases enforce a shared cap per student across instances. An excess request gets HTTP `429` with `Retry-After: 2` before the stream opens. HTTP history remains the fallback.

PDF, PNG, and JPEG attachments up to 5 MiB are stored privately. Authorized readers download them as files, not inline.
