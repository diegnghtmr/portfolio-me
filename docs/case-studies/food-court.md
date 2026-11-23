# Food Court

**Summary.** Food Court is a role-based ordering and restaurant-operations system built from a frontend and four backend services. ([UI README](https://github.com/diegnghtmr/food-court-ui#readme))

**Problem and context.** The interface gives each role its own workflow:

- **clients** browse and order;
- **employees** manage the order queue;
- **owners** manage dishes and staff;
- **admins** have their own screens.

The system also records the status history of every order and exposes efficiency information. ([UI feature map](https://github.com/diegnghtmr/food-court-ui#feature-map), [traceability README](https://github.com/diegnghtmr/traceability-microservice#readme))

## Repositories

| Repository | Responsibility |
|---|---|
| [food-court-ui](https://github.com/diegnghtmr/food-court-ui) | Role-aware frontend: React, TypeScript, TanStack Query and Zustand |
| [user-microservice](https://github.com/diegnghtmr/user-microservice) | Users, roles and JWT authentication |
| [food-court-microservice](https://github.com/diegnghtmr/food-court-microservice) | Restaurant and dish catalog |
| [order-microservice](https://github.com/diegnghtmr/order-microservice) | Order validation and lifecycle |
| [traceability-microservice](https://github.com/diegnghtmr/traceability-microservice) | Order history and efficiency metrics |

All four services are documented as Java and Spring Boot with a hexagonal architecture. User and Food Court store their data in PostgreSQL; Order and Traceability use MongoDB. ([User](https://github.com/diegnghtmr/user-microservice#readme), [Food Court](https://github.com/diegnghtmr/food-court-microservice#readme), [Order](https://github.com/diegnghtmr/order-microservice#readme), [Traceability](https://github.com/diegnghtmr/traceability-microservice#readme))

**How they connect:**

- The UI consumes all four APIs.
- Food Court calls User through OpenFeign.
- Order calls User and Food Court through OpenFeign, and Traceability through its own client.

([UI context](https://github.com/diegnghtmr/food-court-ui#system-context), [Food Court context](https://github.com/diegnghtmr/food-court-microservice#system-context), [Order context](https://github.com/diegnghtmr/order-microservice#system-context))

**Live demo:** TO CONFIRM.

## Demonstration

The UI README already has screenshots for login, client ordering, employee operations, owner management and the admin screens. Use those, next to the order-flow diagram it documents. ([Screenshots and diagrams](https://github.com/diegnghtmr/food-court-ui#ui-screenshots))

## Decisions

TO CONFIRM: the sources are linked, but Diego still has to confirm how each decision is framed and what his part in it was.

1. **Organize the UI by technical layer or by business capability**
   - **Choice:** feature slices by role.
   - **Consequence:** "code used by 1 feature stays local", and code that two or more features use moves to `shared/`.
   - INFERRED: that organizing by layer was the alternative considered.

   ([UI architecture](https://github.com/diegnghtmr/food-court-ui#architecture))
2. **Couple business rules to the infrastructure or use ports and adapters**
   - **Choice:** hexagonal services.
   - **Consequence:** the Order README states that the "domain has no framework dependencies", and reaches external services and persistence through ports.
   - INFERRED: the alternative that was weighed.

   ([Order architecture](https://github.com/diegnghtmr/order-microservice#architecture))

## Verifiable result

- **UI:** the README documents unit-test and coverage commands, and the repository includes tests.
- **Order:** the repository includes an `OrderUseCaseTest`.
- TO CONFIRM: whether the tests pass, and the measured coverage.

([UI scripts](https://github.com/diegnghtmr/food-court-ui#scripts), [Order tests](https://github.com/diegnghtmr/order-microservice/tree/main/src/test))

## Limitations and role

- **Limitations and next steps:** TO CONFIRM.
- **Role:** TO CONFIRM.
