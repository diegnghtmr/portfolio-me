---
project: legajo
summary: >-
  A workbench for students exploring how text similarity and clustering methods behave on research abstracts.
role: Sole developer
timeframe: "2026"
demo:
  url: https://legajo-frontend.vercel.app
  note: The first request can take tens of seconds if the backend is idle.
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/corpus-selection.png
      alt: Corpus checklist beside a grayscale 12 × 12 similarity matrix for documents d01 through d12, with embedding-local selected
      caption: Select twelve abstracts to compare all pairs using local MiniLM embeddings. Darker cells indicate higher similarity.
    - src: ./shots/similarity-trace.png
      alt: Similarity scores for d01 and d02 beside a Needleman–Wunsch trace with optimal-path cells outlined in red
      caption: The trace shows the alignment behind the Needleman–Wunsch score alongside the ranking of all six methods.
    - src: ./shots/ward-dendrogram.png
      alt: Average-linkage and Ward dendrograms side by side, with a dashed k = 3 cut line and three numbered, color-coded clusters on the Ward tree
      caption: The Ward cut divides the 20 documents into three clusters. The average-linkage tree remains uncut for comparison.
    - src: ./shots/benchmark-curves.png
      alt: Log–log runtime plots for classic pairwise algorithms and hierarchical linkages, each above an empirical-versus-theoretical slope table
      caption: The JMH curves show how runtime changes with sequence length on the left and sample size on the right.
decisions:
  - question: Where should the algorithms live?
    options:
      - label: Use a numerical library for the analysis
        reason: Less algorithm code to maintain, but the project would depend on the library for access to intermediate steps and tie-breaking rules.
      - label: Implement the analysis in the domain
        reason: The project can expose its own traces and define how ties are resolved, while leaving PDF parsing and model inference to libraries.
        chosen: true
    consequence: The same backend implementation produces the scores and their traces. The clustering engine uses a fixed merge order when distances tie.
    evidence:
      - label: Backend conventions
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/README.md#conventions
      - label: Shared Lance–Williams merge engine
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/domain/src/main/java/co/edu/uniquindio/legajo/clustering/LanceWilliamsEngine.java
  - question: How should the frontend stay in sync with the API?
    options:
      - label: Maintain separate TypeScript response types by hand
        reason: No generation step, but a contract change has to be reflected in two places manually.
      - label: Generate types from OpenAPI
        reason: The backend owns the YAML contract, and the frontend generates its types from a checked-in copy.
        chosen: true
    consequence: CI regenerates the types and fails if the result differs from the committed file. Updating the frontend copy of the contract is a separate sync step.
    evidence:
      - label: Frontend contract workflow
        url: https://github.com/diegnghtmr/legajo-frontend/blob/main/README.md#contract-workflow
      - label: Frontend CI
        url: https://github.com/diegnghtmr/legajo-frontend/blob/main/.github/workflows/frontend.yml
  - question: Should the demo request embeddings live or serve precomputed vectors?
    options:
      - label: Call the embedding API at request time
        reason: The remote model supplies the vectors on demand, but the request depends on network access and valid credentials.
      - label: Use precomputed vectors by default
        reason: The committed corpus has matching local and remote-model vectors, so the demo runs without API credentials.
        chosen: true
    consequence: Startup checks that the corpus and caches match. Updating the corpus means regenerating the caches before serving it in cached mode.
    evidence:
      - label: Backend environment and corpus workflow
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/README.md#environment-variables
      - label: Embedding adapter configuration
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/bootstrap/src/main/java/co/edu/uniquindio/legajo/DomainConfiguration.java
results:
  - label: Backend tests
    detail: All 1,141 tests passed locally, including architecture rules and OpenAPI conformance.
    url: https://github.com/diegnghtmr/legajo-backend/blob/main/.github/workflows/backend.yml
  - label: Frontend tests
    detail: All 1,332 Vitest tests passed locally, with coverage reporting enabled.
    url: https://github.com/diegnghtmr/legajo-frontend/blob/main/.github/workflows/frontend.yml
  - label: Full-stack verification
    detail: The no-mock Playwright suite passed all 36 checks, including a score cross-check against the API and a Ward cut that partitioned all 20 documents.
    url: https://github.com/diegnghtmr/legajo-frontend/tree/main/e2e-fullstack
limitations:
  - The reference corpus contains 20 abstracts. The demo does not ingest PDFs from the browser; ingestion and validation are separate offline steps.
  - The benchmark page displays versioned JMH exports. It does not measure the visitor’s computer or rerun JMH.
architecture:
  system: Legajo
  caption: >-
    Cached vectors let the demo run without calling the embedding API.
  nodes:
    - id: frontend
      kind: container
      label: Web app
      name: legajo-frontend
      repo: legajo-frontend
      tech: React 19 / TypeScript
      does: Renders matrices, traces, and dendrograms
      col: 0
      row: 0
    - id: backend
      kind: container
      label: API service
      name: legajo-backend
      repo: legajo-backend
      tech: Java 25 / Spring Boot
      does: Calculates similarity scores and clusters
      col: 1
      row: 0
    - id: corpus
      kind: store
      label: Versioned files
      name: Corpus and vector cache
      tech: JSON
      does: Holds abstracts and precomputed vectors
      col: 2
      row: 0
    - id: benchmarks
      kind: store
      label: Versioned files
      name: Benchmark results
      tech: CSV / JMH
      does: Holds measured runtimes and fitted slopes
      col: 2
      row: 1
    - id: embedding-api
      kind: external
      label: External dependency
      name: Configured embedding API
      tech: OpenAI-compatible API
      does: Generates vectors in live mode
      col: 2
      row: 2
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Calls via Axios
      evidence: https://github.com/diegnghtmr/legajo-frontend/blob/main/src/infrastructure/httpClient.ts
    - from: backend
      to: corpus
      protocol: Files
      verb: Loads abstracts and vectors
      evidence: https://github.com/diegnghtmr/legajo-backend/blob/main/bootstrap/src/main/java/co/edu/uniquindio/legajo/DomainConfiguration.java
    - from: backend
      to: benchmarks
      protocol: Files
      verb: Reads benchmark exports
      evidence: https://github.com/diegnghtmr/legajo-backend/blob/main/infrastructure/src/main/java/co/edu/uniquindio/legajo/infrastructure/benchmarks/CsvBenchmarkReportRepository.java
    - from: backend
      to: embedding-api
      protocol: HTTP/JSON
      verb: Requests live vectors
      evidence: https://github.com/diegnghtmr/legajo-backend/blob/main/infrastructure/src/main/java/co/edu/uniquindio/legajo/infrastructure/embedding/LiveApiEmbeddingRepository.java
---

## Problem

When students compare research abstracts, a similarity score does not tell them what the algorithm found. One method may count shared terms, another may align token sequences, and an embedding-based method may give related abstracts a higher score even if they use different words. Putting those scores next to their traces makes the differences easier to inspect.

Grouping the same abstracts raises a second question: where should the cluster boundaries go? The shape of the tree depends on how documents are represented and how clusters are merged. Legajo lets readers change those choices on one reference corpus and see how the grouping changes.

## How it works

The browser sends document IDs and algorithm selections to the backend over HTTP. The backend defines the OpenAPI contract; the frontend generates its TypeScript types from a copy of that contract. The browser renders matrices, traces and charts from the responses rather than calculating scores or clusters itself.

The backend loads a versioned corpus and verifies that its precomputed embedding caches match. The application layer prepares the text or loads vectors, then calls domain algorithms that have no dependency on Spring. With two documents, the UI compares the available methods and can request a specific trace, such as the optimal alignment path for Needleman–Wunsch. With three or more selected documents, it instead shows a pairwise similarity matrix for one method at a time.

Clustering runs over the full reference corpus. A shared Lance–Williams engine builds the merge trees for single, complete, average and Ward linkage. Readers can compare internal metrics and request a cut of one tree into a chosen number of groups. A separate endpoint serves the checked-in JMH results and slopes that the benchmark page plots.
