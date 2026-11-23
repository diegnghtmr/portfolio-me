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
      alt: Corpus selection rail beside a grayscale MiniLM similarity matrix for twelve selected abstracts
      caption: Select documents from the reference corpus and compare every pair in one matrix.
    - src: ./shots/similarity-trace.png
      alt: Scores for documents d01 and d02 beside a Needleman–Wunsch matrix with the optimal path outlined in red
      caption: Open the Needleman–Wunsch trace to see which alignment produced the score.
    - src: ./shots/ward-dendrogram.png
      alt: Average and Ward dendrograms side by side, with a dashed cut line and three colored groups on the Ward tree
      caption: Cut the Ward tree at k = 3 while keeping the average-linkage tree visible for comparison.
    - src: ./shots/benchmark-curves.png
      alt: Log–log runtime plots for pairwise algorithms and hierarchical clustering above tables of empirical and theoretical slopes
      caption: Compare measured JMH curves with theoretical growth on the reference benchmark run.
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
---

## Problem

When students compare research abstracts, a similarity score does not tell them what the algorithm found. One method may count shared terms, another may align token sequences, and an embedding-based method may give related abstracts a higher score even if they use different words. Putting those scores next to their traces makes the differences easier to inspect.

Grouping the same abstracts raises a second question: where should the cluster boundaries go? The shape of the tree depends on how documents are represented and how clusters are merged. Legajo lets readers change those choices on one reference corpus and see how the grouping changes.

## How it works

The browser sends document IDs and algorithm selections to the backend over HTTP. The backend defines the OpenAPI contract; the frontend generates its TypeScript types from a copy of that contract. The browser renders matrices, traces and charts from the responses rather than calculating scores or clusters itself.

The backend loads a versioned corpus and verifies that its precomputed embedding caches match. The application layer prepares the text or loads vectors, then calls domain algorithms that have no dependency on Spring. With two documents, the UI compares the available methods and can request a specific trace, such as the optimal alignment path for Needleman–Wunsch. With three or more selected documents, it instead shows a pairwise similarity matrix for one method at a time.

Clustering runs over the full reference corpus. A shared Lance–Williams engine builds the merge trees for single, complete, average and Ward linkage. Readers can compare internal metrics and request a cut of one tree into a chosen number of groups. A separate endpoint serves the checked-in JMH results and slopes that the benchmark page plots.
