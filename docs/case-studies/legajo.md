# Legajo

**Summary.** Legajo is a web application for exploring text similarity and hierarchical clustering over a corpus. [[Frontend README](https://github.com/diegnghtmr/legajo-frontend#readme), [backend README](https://github.com/diegnghtmr/legajo-backend#readme)]

**Problem and context.** The system brings together six similarity capabilities, four clustering linkages and their internal metrics. Its interface lets a reader select corpus documents, compare them, inspect traces and explore clustering cuts. The calculations run on the backend, not in the browser. [[Frontend README](https://github.com/diegnghtmr/legajo-frontend#readme), [backend README](https://github.com/diegnghtmr/legajo-backend#readme)]

## Facts

- **Surfaces:** a bilingual ES/EN single-page app and a REST API. [[Frontend README](https://github.com/diegnghtmr/legajo-frontend#readme)]
- **Stack:**
  - Frontend: React, TypeScript, Vite and Tailwind CSS.
  - Backend: Java, Spring Boot and Gradle.

  [[Frontend README](https://github.com/diegnghtmr/legajo-frontend#readme), [backend README](https://github.com/diegnghtmr/legajo-backend#readme)]
- **Repositories:**
  - [legajo-frontend](https://github.com/diegnghtmr/legajo-frontend) renders the exploration interface.
  - [legajo-backend](https://github.com/diegnghtmr/legajo-backend) owns the algorithms, the orchestration and the API.
  - The frontend consumes the backend's OpenAPI contract.

  [[Frontend README](https://github.com/diegnghtmr/legajo-frontend#readme)]
- **Demo:** [legajo-frontend.vercel.app](https://legajo-frontend.vercel.app). The README warns that the free-tier backend can take tens of seconds to wake up after inactivity. [[Deployment](https://github.com/diegnghtmr/legajo-frontend#deployment)]

## Demonstration (screens to capture)

The README documents these screens; nobody has walked through them on the live demo yet.

1. Corpus selection.
2. A similarity comparison and its trace.
3. The clustering dendrogram and a cut.
4. The benchmark curves.

[[Frontend README](https://github.com/diegnghtmr/legajo-frontend#readme), [benchmark page](https://github.com/diegnghtmr/legajo-frontend/tree/main/src/features/benchmarks)]

## Decisions

TO CONFIRM: the sources are linked, but Diego still has to confirm how each decision is framed and what his part in it was.

1. **Write the algorithms or take them from a library**
   - **Choice:** hand-written similarity, clustering and evaluation algorithms.
   - **Consequence:** the domain owns those implementations. PDF parsing and model inference can still be delegated.
   - **Evidence:** "no library implements any of them." [[Backend conventions](https://github.com/diegnghtmr/legajo-backend#conventions)]
2. **Generate the API types from the contract or duplicate them**
   - **Choice:** the backend owns the OpenAPI contract, and the frontend generates its types from it.
   - **Consequence:** CI catches drift between the generated types and the contract.
   - **Evidence:** "the frontend regenerates its types from it, and CI fails on drift." [[Backend conventions](https://github.com/diegnghtmr/legajo-backend#conventions), [frontend contract workflow](https://github.com/diegnghtmr/legajo-frontend#contract-workflow)]

## Verifiable result

The repositories document three kinds of checks. No passing run has been observed independently.

- ArchUnit checks.
- Aggregated JaCoCo coverage.
- A frontend full-stack Playwright suite that runs against a real backend with "zero interception".

[[Backend checks](https://github.com/diegnghtmr/legajo-backend#checks-run-in-containers), [frontend full-stack tests](https://github.com/diegnghtmr/legajo-frontend#full-stack-e2e-no-mocks)]

## Limitations and role

- **Cold start:** the free-tier backend can take tens of seconds to respond after inactivity.
- **Role and individual authorship:** TO CONFIRM.
