---
project: studydeck-ai
summary: >-
  A study app for learners who turn their notes into flashcards and use spaced repetition to decide what to review next.
role: Sole developer
timeframe: "2026"
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/study-dashboard.png
      alt: StudyDeck dashboard showing cards due today, daily progress, and six sample decks for field study.
      caption: The dashboard shows what is due and offers a starting deck. The counts are from a fictional study account.
    - src: ./shots/deck-library.png
      alt: Cards and Decks screen with the Night Sky Basics deck selected and a grid of astronomy flashcards.
      caption: Select a deck to browse its cards, then narrow the list by text or card type.
    - src: ./shots/review-session.png
      alt: Flashcard with a revealed answer about circumpolar stars and four rating buttons from Again to Easy.
      caption: After revealing an answer, the learner rates their recall and the scheduler calculates the next due date.
decisions:
  - question: Where should scheduling and deck rules live?
    options:
      - label: Framework-coupled services
        reason: Use Spring and persistence APIs directly in use cases, with fewer interfaces but a harder dependency on the runtime stack.
      - label: Hexagonal monolith
        reason: Keep domain and application code framework-free; connect HTTP, persistence, and AI through adapters.
        chosen: true
    consequence: >-
      The application runs as one service, with ArchUnit checks that keep Spring and persistence adapters out of the domain.
    evidence:
      - label: Backend architecture
        url: https://github.com/diegnghtmr/studydeck-backend/blob/master/README.md#architecture
      - label: ArchUnit rules
        url: https://github.com/diegnghtmr/studydeck-backend/blob/master/app/src/test/java/com/studydeck/architecture/HexagonalArchitectureTest.java
  - question: When should the browser API client be generated?
    options:
      - label: Generate during builds
        reason: Build callers from the input specification each time, but put the generator and its Java runtime on the build path.
      - label: Commit the generated client
        reason: Generate TypeScript and Axios bindings from an OpenAPI snapshot and check the sources in with the app.
        chosen: true
    consequence: >-
      The frontend can build without Java or a code generation step, but contract changes need an explicit snapshot update and regeneration.
    evidence:
      - label: Client generation workflow
        url: https://github.com/diegnghtmr/studydeck-frontend/blob/main/README.md#openapi-client-generation
      - label: Frontend CI
        url: https://github.com/diegnghtmr/studydeck-frontend/blob/main/.github/workflows/ci.yml
  - question: When should an AI-generated card enter a deck?
    options:
      - label: Save immediately after generation
        reason: Remove a review step, but store drafts before the learner can check them.
      - label: Validate and present editable drafts
        reason: Check the generated JSON against the import schema and let the learner select or edit cards before import.
        chosen: true
    consequence: >-
      Generation does not write to a deck; the browser runs validation, preview, and import only after approval.
    evidence:
      - label: Generation service
        url: https://github.com/diegnghtmr/studydeck-backend/blob/master/app/src/main/java/com/studydeck/application/service/GenerateFlashcardsService.java
      - label: Proposal and approval flow
        url: https://github.com/diegnghtmr/studydeck-frontend/blob/main/src/features/ai/AiGeneratePage.tsx
results:
  - label: Local browser review
    detail: Revealed and rated a card against the running API; the response included its next due date and the next card appeared.
  - label: Local document ingestion
    detail: Five sample documents completed ingestion and each returned indexed text chunks through the API.
  - label: Backend tests
    detail: 451 selected domain, application, and architecture tests passed locally, including the ArchUnit rules.
  - label: Frontend tests
    detail: 515 Vitest tests and two Playwright smoke tests passed locally; lint and the production build also passed.
limitations:
  - The checked-in browser OpenAPI snapshot does not include every backend endpoint; the dashboard statistics call uses Axios directly.
  - The backend returned COMPLETED after indexing, but the browser showed Registered because its status mapping expects lowercase values.
  - Generating cards and composing chat answers require a configured chat model; neither was exercised with a live provider.
---

## Problem

Learners often keep reference material in one place and flashcards in another. Preparing for a test or a field exercise means picking out questions from notes, turning them into cards, and deciding which ones to revisit. As decks grow, reviewing everything in order makes it harder to spend time on material that still needs practice.

StudyDeck brings those steps together. A learner can organize cards by topic, see what is due, and rate their recall after revealing each answer. If they use a model to turn source text into draft cards, they can decide which of those drafts belong in a deck.

## How it works

The browser app calls the backend over HTTP. The backend repository defines the contract in `openapi.yaml`; the frontend keeps a snapshot and uses it to generate a typed Axios client for decks, notes, review sessions, documents, and AI features. The client gets its base URL from `VITE_API_URL`.

Inside the backend, HTTP controllers call use cases through input ports. Notes produce one or more cards; a review session fetches cards as they become due. When the learner rates a card, the review service calculates its next interval and stores the new schedule and a review log in PostgreSQL. The scheduling code is separate from model-assisted features.

The document pipeline splits text into chunks and stores embeddings in pgvector using a local model. Retrieval-augmented chat looks up relevant chunks before passing context to a configured chat model. Card generation uses a separate path: the backend validates the model output against the import schema, then returns drafts for the learner to review.
