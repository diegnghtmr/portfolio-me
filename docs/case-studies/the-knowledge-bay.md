# The Knowledge Bay

The Knowledge Bay is a Spanish-language learning network for sharing academic resources, asking for help, and forming study groups around interests. The [English](../../src/content/case-studies/the-knowledge-bay/en.md) and [Spanish](../../src/content/case-studies/the-knowledge-bay/es.md) dossiers cover the app after [PR #1](https://github.com/diegnghtmr/the-knowledge-bay/pull/1) (merge `9618aa6`, integration head `23126d7`).

## Repository and contribution

[the-knowledge-bay](https://github.com/diegnghtmr/the-knowledge-bay) contains `client/` (React 19 and JavaScript) and `server/` (Java 21 and Spring Boot 3.4). The packaged server serves the built SPA, including its deep-link fallback, alongside the same-origin REST API. Only the server opens the SQLite file. ([Architecture and deployment](https://github.com/diegnghtmr/the-knowledge-bay#architecture))

The original Universidad del Quindío project ran from March to June 2025. The README credits Diego Flores, Jorge Acosta, and July Cartagena. The 144 original commits use four Git author labels: Diego Alejandro Flores Quintero (51) and `diegnghtmr` (38) are the portfolio owner, `Jorge-ivan-aa` has 38, and `tatianacartagena` has 17. The November 2026 hardening range `3bfe914..23126d7` adds 12 non-merge commits and four integration merges under the owner’s two labels; that count excludes the final GitHub merge commit.

## Decisions

- **Durable writes:** The original app lost accounts, interests, and posts across a restart. The [SQLite contract](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/docs/persistence-contract.md) makes repositories the source of truth, groups query canonical posts, and related writes share a transaction. [Barrier-driven tests](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/ConcurrentDomainTest.java) check concurrent writes without relying on timing.
- **Session identity:** The [bearer filter](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/infrastructure/config/BearerSessionFilter.java) resolves the actor before request handling. The security policy denies access without an explicit rule. Sessions are in memory; a restart keeps records but requires a new sign-in.
- **Read projections:** The [domain facade](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/model/TheKnowledgeBay.java) builds the custom undirected graph over mutual follows from stored profiles. A traversal queue finds shortest paths. Analytics read activity from the repositories. The original custom queue implementation remains in the repository; it is not the live store or the shortest-path queue.
- **Browser behavior:** The [publication form](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/components/content-publication/ContentPublicationForm.jsx) awaits the API and suppresses repeated submissions while it is busy. [Lazy routes](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/App.jsx) moved chat, profile, and moderation code out of the entry chunk (1,394 kB to 454 kB minified, before gzip).

## Demonstration and verification

The four 1440×900 captures are unmodified PNGs from the hardened app running locally with synthetic accounts and posts: the visitor landing, a study group feed, a chat thread, and the moderator analytics panel. Both dossiers share these captures, which Astro serves as responsive AVIF and WebP.

Both GitHub Actions `verify` jobs passed on [merged PR #1](https://github.com/diegnghtmr/the-knowledge-bay/pull/1/checks). The evidence includes 109 server tests, 31 client tests, clean ESLint, a production build, and ten Chromium scenarios against the Spring JAR with the built SPA and a disposable SQLite file. See the [CI workflow](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/.github/workflows/ci.yml) and [packaged browser harness](https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/tests/production-audit.mjs).
