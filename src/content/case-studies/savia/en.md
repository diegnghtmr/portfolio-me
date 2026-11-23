---
project: savia
summary: Savia is a personal finance app in development for people who want to manage accounts, spending, and budgets in one workspace.
role: Sole developer
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: Local backend build, OpenAPI verification, and targeted account and transaction HTTP tests. The tests use test doubles, not a live database.
    source: run
    steps:
      - command: npx -y pnpm@11.28.13 build
        output: |-
          $ tsc -p tsconfig.build.json
          Exit 0: npx -y pnpm@11.28.13 build
      - command: npx -y pnpm@11.28.13 openapi:verify
        output: |-
          $ node scripts/verify-openapi.mjs
          OpenAPI authority verified.
      - command: ./node_modules/.bin/vitest run test/accounts.e2e-spec.ts test/transactions.e2e-spec.ts
        output: |-
          ✓ test/accounts.e2e-spec.ts (52 tests)
          ✓ test/transactions.e2e-spec.ts (62 tests)
          Test Files  2 passed (2)
          Tests  114 passed (114)
decisions:
  - question: Where should the onboarding request to the API originate?
    options:
      - label: Call the API from the browser
        reason: Removes the web server hop, but browser code would need to handle the access token and know where the API is hosted.
      - label: Call the API from a Next.js Server Action
        reason: The server can read the Supabase session and attach the access token without exposing it to browser JavaScript.
        chosen: true
    consequence: The form receives a typed outcome rather than the raw HTTP response. The API still verifies the token before accepting the request.
    evidence:
      - label: Server-side onboarding gateway
        url: https://github.com/diegnghtmr/savia-web/blob/main/src/lib/onboarding-gateway.ts
      - label: Session cookie adapter
        url: https://github.com/diegnghtmr/savia-web/blob/main/src/lib/session.ts
  - question: How should the first personal workspace be created?
    options:
      - label: Save the profile, workspace, and membership separately
        reason: Each write can stand alone, but an interrupted setup could leave a workspace without an owner or a profile without its workspace.
      - label: Create all three in one PostgreSQL transaction
        reason: The service checks what already exists for the signed-in user, then creates the profile, personal workspace, and owner membership together.
        chosen: true
    consequence: The API returns 201 on creation and 200 with the original identifiers if the same setup is retried. A different setup for the same user returns 409.
    evidence:
      - label: Transaction and replay logic
        url: https://github.com/diegnghtmr/savia-backend/blob/main/src/identity/bootstrap.service.ts
      - label: PostgreSQL writes
        url: https://github.com/diegnghtmr/savia-backend/blob/main/src/identity/postgres-bootstrap.adapter.ts
      - label: Onboarding response codes
        url: https://github.com/diegnghtmr/savia-backend/blob/main/src/identity/onboarding.controller.ts
results:
  - label: Backend build
    detail: The TypeScript build passed in the Node 24.18.0 container.
  - label: Backend contract
    detail: The local verifier confirmed that the committed OpenAPI document matches the implementation manifest.
  - label: Account and transaction routes
    detail: All 52 account tests and all 62 transaction tests passed using Fastify request injection with test doubles for authentication and persistence.
limitations:
  - No authenticated finance workflow was run against a live PostgreSQL database. The OpenAPI verifier does not check the upstream planning source.
  - The full suite had 3,101 passes, 3 failures, and 1 skip. Two OCR tests need Tesseract, which is absent from the slim image. One monthly recurrence test uses the real clock but expects a fixed date.
  - The mobile app does not load financial data or record transactions. The local MCP server handles protocol startup and ping, but exposes no tools and does not connect to the API.
---

## Problem

People who track their own finances need to know which account a transaction belongs to, what currency it uses, and how it affects the money available for the rest of the month. A transfer between accounts is not the same as new income or spending. Savia is being built around those distinctions, with accounts, a ledger, and budgets scoped to a workspace.

Setting up that workspace is a separate task. The user chooses a base currency and preferences such as date and number formats. If the first submission is retried after a lost response, it should return the workspace already created rather than create another one.

## How it works

The Next.js site serves a public home and forms for registration and sign-in. Its server code uses Supabase Auth for the session and writes session cookies as HTTP-only. The workspace setup page requires a session. It collects the user's profile, workspace name, and display preferences, then submits them to a Next.js Server Action. The action sends `POST /v1/onboarding` to the Fastify API with the access token from the session.

The API derives the user's identity from the token. Its onboarding service uses one PostgreSQL transaction to read any existing setup and, on first use, save the profile, personal workspace, and owner membership. A matching retry returns the original identifiers. The API also contains work for accounts, ledger entries, and budgets. It computes the next date for [monthly recurring rules](https://github.com/diegnghtmr/savia-backend/blob/main/test/recurring/recurring-command.spec.ts#L39). The public web home does not read those financial records.

The Expo repository contains a standalone mobile shell. The MCP repository is a separate local process that speaks JSON-RPC over standard input and output, without calling the backend.
