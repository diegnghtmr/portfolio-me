---
project: food-court
summary: >-
  An ordering app for food court customers, kitchen staff, and owners, from browsing a menu to picking up an order.
role: Sole developer
timeframe: 2025–2026
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/client-menu.png
      alt: Casa Guadua’s menu showing arepas, patacones, and empanadas with prices and add-to-cart buttons
      caption: Customers browse dishes grouped by category at Casa Guadua, the fictional restaurant used for this local run.
    - src: ./shots/client-cart.png
      alt: Shopping cart with three dishes, quantity controls, and the order total in Colombian pesos
      caption: The cart keeps the dish list, subtotals, and confirmation in one view.
    - src: ./shots/order-queue.png
      alt: Kitchen board with one order each in Pending, In preparation, and Ready
      caption: Staff take an order, mark it ready, and complete pickup from the kitchen board.
    - src: ./shots/order-status.png
      alt: Customer order detail marked Delivered with the same three items and total as the cart
      caption: The customer sees the same order marked as delivered after the pickup code is accepted.
    - src: ./shots/owner-overview.png
      alt: Restaurant owner dashboard with counts for dishes, active dishes, staff, and today’s orders
      caption: The owner can check staffing and menu availability from one screen and open the relevant management tools.
decisions:
  - question: How should the frontend be organized when each role has a different workflow?
    options:
      - label: Technical layers
        reason: Grouping pages, hooks, and services by type makes each layer easy to browse, but scatters the code for a single workflow.
      - label: Features grouped by role
        reason: Keep code used by one feature with that feature and move it to shared code once a second feature needs it.
        chosen: true
    consequence: The customer cart and employee queue own their own state and queries, while reusable controls and authentication live outside those features.
    evidence:
      - label: Frontend architecture and placement rule
        url: https://github.com/diegnghtmr/food-court-ui/blob/main/README.md#architecture
      - label: Role-specific routes
        url: https://github.com/diegnghtmr/food-court-ui/blob/main/src/app/router.tsx
  - question: Where should order rules live?
    options:
      - label: Framework service with direct dependencies
        reason: Calling database repositories and HTTP clients directly makes the wiring shorter, but couples the workflow to MongoDB and Feign.
      - label: Domain use cases behind ports
        reason: The use case can enforce valid transitions regardless of how orders are stored or notifications are sent.
        chosen: true
    consequence: The order use case works through interfaces for persistence, catalog access, notifications, and trace reporting. Adapters provide the HTTP and MongoDB implementations.
    evidence:
      - label: Order service architecture
        url: https://github.com/diegnghtmr/order-microservice/blob/main/README.md#ports-and-adapters
      - label: Order lifecycle rules
        url: https://github.com/diegnghtmr/order-microservice/blob/main/src/main/java/com/pragma/powerup/ordermicroservice/domain/usecase/OrderUseCase.java
  - question: How should the system retain a record of order transitions?
    options:
      - label: Keep history on the order document
        reason: Keeping state and history together avoids a network request, but history queries and order updates depend on the same store.
      - label: Record transitions in a separate service
        reason: A service dedicated to tracing can serve order histories and calculate completion times independently of the current order state.
        chosen: true
    consequence: Order updates are saved before the Feign call. The trace adapter logs a failed call without rolling back the order update, so history can be incomplete when Traceability is unavailable.
    evidence:
      - label: Trace reporting adapter
        url: https://github.com/diegnghtmr/order-microservice/blob/main/src/main/java/com/pragma/powerup/ordermicroservice/infrastructure/output/feign/adapter/TraceabilityFeignAdapter.java
      - label: Duration calculation from stored transitions
        url: https://github.com/diegnghtmr/traceability-microservice/blob/main/src/main/java/com/pragma/powerup/traceabilitymicroservice/domain/usecase/TraceUseCase.java
results:
  - label: Local order lifecycle
    detail: Placed an order in the browser, assigned it to kitchen staff, marked it ready, and completed pickup with the generated code. The Traceability API returned all four transitions for that order.
  - label: Frontend unit tests
    detail: All 76 tests passed, including the cart, order requests, and pickup-code dialog.
    url: https://github.com/diegnghtmr/food-court-ui/blob/main/package.json
  - label: Order and catalog service tests
    detail: The Order suite passed 22 tests. The Catalog service passed its Spring context test with the repository’s H2 profile.
    url: https://github.com/diegnghtmr/order-microservice/tree/main/src/test
limitations:
  - Restaurant registration returned an error during the local run. The catalog’s owner lookup uses a different route from the identity API, so the demonstration uses a seeded restaurant.
  - The owner’s dish table showed blank categories. The catalog returns category names under a field that the owner view does not read.
---

## Problem

At a food court, the customer’s cart, the kitchen’s queue, and the owner’s menu are different views of the same operation. A customer needs to know what is available before ordering and when to come back for pickup. Kitchen staff need to see which orders are waiting, which ones they have taken, and which are ready to hand over. The owner needs to update dishes and give staff access without mixing those tasks into the kitchen’s view.

Once an order is handed over, its current status alone cannot tell the owner how long fulfillment took. Food Court keeps the transitions behind that status so a customer can follow an order and an owner can review how orders moved through the restaurant.

## How it works

The React frontend talks to four REST APIs through configured base URLs. The User service issues JWTs with the account’s role and, for restaurant staff, the restaurant ID. The router uses the role to pick the layout; the services use it to authorize requests. User and Catalog persist accounts and menu data in PostgreSQL. Catalog has a Feign client for owner lookup in User.

The Order service checks the restaurant, dish ownership, and availability through Catalog before saving an order to MongoDB. It also checks that the customer has no active order. Staff claim a pending order, mark it ready, and verify a pickup code at handoff. Order uses a Feign client to look up the customer in User and send their pickup message through a mock SMS adapter.

Order sends transitions over HTTP via OpenFeign to Traceability, which stores them in a separate MongoDB database. The customer’s orders page uses those records to find order IDs and fetch their details from Order. For owner reports, Traceability calculates elapsed time from stored transitions and can resolve employee names through User.
