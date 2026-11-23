# StudyDeck AI

**Summary.** StudyDeck AI is a browser frontend and a backend for working with study decks, documents, card reviews and AI-assisted features. ([Frontend source](https://github.com/diegnghtmr/studydeck-frontend/tree/main/src/features), [backend source](https://github.com/diegnghtmr/studydeck-backend/tree/main/app/src/main/java/com/studydeck/application/service))

**Problem and context.** The project brings several study activities into one platform:

- organizing decks;
- reviewing cards;
- working with documents and AI features.

The backend has separate services for flashcard generation, retrieval-augmented chat and review sessions, and the frontend has a page for each. ([Frontend features](https://github.com/diegnghtmr/studydeck-frontend/tree/main/src/features), [backend services](https://github.com/diegnghtmr/studydeck-backend/tree/main/app/src/main/java/com/studydeck/application/service))

## Facts

- **Repositories:**
  - [studydeck-frontend](https://github.com/diegnghtmr/studydeck-frontend): a browser interface built with React 19, TypeScript and Tailwind CSS.
  - [studydeck-backend](https://github.com/diegnghtmr/studydeck-backend): a Java and Spring Boot API with PostgreSQL and pgvector.

  ([Frontend README](https://github.com/diegnghtmr/studydeck-frontend#readme), [backend README](https://github.com/diegnghtmr/studydeck-backend#readme))
- **Connection:** the backend names its OpenAPI file as the contract. The frontend generates a TypeScript Axios client from it, and its README documents `VITE_API_URL=http://localhost:8080`. ([Frontend README](https://github.com/diegnghtmr/studydeck-frontend#openapi-client-generation), [backend README](https://github.com/diegnghtmr/studydeck-backend#api-contract))
- **Live demo:** TO CONFIRM.

## Demonstration (screens to capture)

The frontend's feature pages suggest these screens. TO CONFIRM: the screenshots themselves, and whether the flows work end to end.

1. Dashboard and deck list.
2. A review session.
3. Document library.
4. AI card generation or RAG chat.

([Frontend features](https://github.com/diegnghtmr/studydeck-frontend/tree/main/src/features))

## Decisions

TO CONFIRM: the sources are linked, but Diego still has to confirm how each decision is framed and what his part in it was.

1. **Couple the domain to the framework or use ports and adapters**
   - **Choice:** hexagonal architecture.
   - **Consequence:** "Domain and application layers have zero Spring/Jakarta dependencies", and ArchUnit enforces that boundary.
   - INFERRED: the alternative that was weighed and the maintainability benefit.

   ([Backend README](https://github.com/diegnghtmr/studydeck-backend#architecture))
2. **Maintain the API client by hand or generate it**
   - **Choice:** a TypeScript Axios client generated from OpenAPI, with the generated sources committed.
   - **Consequence:** builds and CI need no codegen step, but every contract change requires regenerating the client.
   - INFERRED: that a hand-maintained client was the alternative considered.

   ([Frontend README](https://github.com/diegnghtmr/studydeck-frontend#openapi-client-generation))

## Verifiable result

These checks exist. That they pass is not established here.

- **Backend:** a `./gradlew check` quality gate that runs the tests, ArchUnit and a JaCoCo coverage threshold.
- **Frontend:** unit tests and Playwright tests.

([Backend README](https://github.com/diegnghtmr/studydeck-backend#run-quality-gate), [frontend E2E README](https://github.com/diegnghtmr/studydeck-frontend#e2e-tests))

## Limitations and role

- **End-to-end tests in CI:** the frontend README says they are skipped when no backend is running.
- **Contract changes:** the client has to be regenerated after each one.
- **Role:** TO CONFIRM.

([Frontend README](https://github.com/diegnghtmr/studydeck-frontend#e2e-tests))
