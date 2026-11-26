---
project: nexride
summary: Ride dispatch API for electric fleets that ranks available vehicles and can suggest a nearby pickup point.
role: Sole developer
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: With a fictional Bogotá fleet, the API compares the original pickup with a catalog point about 100 m away, then confirms the rider’s choice. JSON excerpted.
    source: run
    steps:
      - command: |-
          curl -sS -w '\nHTTP %{http_code}\n' \
            http://127.0.0.1:42103/rides/request \
            -H 'Content-Type: application/json' \
            -H 'x-test-rider-id: rider-demo' \
            -H 'x-test-rider-role: rider' \
            -d '{"origin":{"lat":4.65,"lng":-74.05},
                 "destination":{"lat":4.66,"lng":-74.06}}'
        output: |-
          {
            "requestId": "8443aa71-0525-46f9-921a-396ceca72cef",
            "original": {
              "vehicleId": "VH-PERF-001",
              "scores": {
                "proximity": 0.9623788744417051,
                "energy": 1,
                "safety": 0.3,
                "continuity": 0.7358420031262473,
                "total": 0.760882062957761
              }
            },
            "suggested": {
              "walkingDistanceM": 100.07543398006715,
              "reasonText": "Iluminación óptima",
              "scores": { "safety": 0.85, "total": 0.898382062957761 }
            },
            "fallback": false
          }
          HTTP 201
      - command: |-
          curl -sS -w '\nHTTP %{http_code}\n' \
            http://127.0.0.1:42103/rides/confirm \
            -H 'Content-Type: application/json' \
            -H 'x-test-rider-id: rider-demo' \
            -H 'x-test-rider-role: rider' \
            -d '{"requestId":"8443aa71-0525-46f9-921a-396ceca72cef",
                 "choice":"suggested"}'
        output: |-
          {
            "vehicleId": "VH-PERF-001",
            "pickupType": "suggested",
            "status": "assigned"
          }
          HTTP 201
decisions:
  - question: How should dispatch rank vehicles once they pass the eligibility checks?
    options:
      - label: Fixed rules without a score
        reason: Rules can exclude unfit vehicles, but give little guidance when several eligible vehicles have different strengths.
      - label: Train a ranking model
        reason: A model could learn trade-offs from past rides, but the MVP lacked enough historical data.
      - label: Configurable weighted sum
        reason: Combine proximity, energy, pickup safety and fleet continuity with explicit weights.
        chosen: true
    consequence: The API returns the individual scores and their weighted total for each pickup option. The weights are read from environment variables and changing them requires a restart.
    evidence:
      - label: Design doc, decision 2
        url: https://github.com/diegnghtmr/NexRide/blob/main/docs/Design%20Doc%20DD-02%20-%20NexRide.md#L132-L145
      - label: Score calculation
        url: https://github.com/diegnghtmr/NexRide/blob/main/src/dispatch/domain/services/scoring-engine.ts
  - question: How should the MVP estimate arrival times without a maps account?
    options:
      - label: External distance matrix
        reason: Route-aware estimates need credentials for a provider that the evaluation environment did not have.
      - label: Straight-line estimate behind a provider interface
        reason: Calculate distance with Haversine, assume a fixed speed, and cache the result in Redis.
        chosen: true
    consequence: Dispatch runs without an external maps service, and a replacement can use the same interface. The estimate does not account for street layout or traffic.
    evidence:
      - label: ADR-001 in the dispatch reference
        url: https://github.com/diegnghtmr/NexRide/blob/main/docs/dispatch-reference.md#design-decisions
      - label: Distance provider
        url: https://github.com/diegnghtmr/NexRide/blob/main/src/dispatch/infrastructure/providers/haversine-distance.provider.ts
  - question: What should the dispatch module expose to its HTTP controller?
    options:
      - label: One service implementing both operations
        reason: Follow the original design with one service, at the cost of putting evaluation and confirmation in the same class.
      - label: A facade that delegates to two use cases
        reason: Give the controller one entry point and keep scoring separate from the transaction that assigns a trip.
        chosen: true
    consequence: Evaluation and confirmation can be tested independently. The facade delegates to them without owning their business rules.
    evidence:
      - label: ADR-014
        url: https://github.com/diegnghtmr/NexRide/blob/main/docs/adr/ADR-014-dispatch-facade-vs-service.md
      - label: Dispatch facade
        url: https://github.com/diegnghtmr/NexRide/blob/main/src/dispatch/dispatch.facade.ts
results:
  - label: Unit tests
    detail: Passed 260 tests across 34 suites locally on Node 22, including the scoring and pickup decision tests.
  - label: Local dispatch and confirmation
    detail: Both requests returned HTTP 201. The second used the first response’s request ID and assigned the same vehicle with the suggested pickup.
limitations:
  - Arrival times and walking distances are estimated using straight-line distance. The safety score comes from a catalog, not from live street conditions.
  - The backend reads vehicle telemetry from Redis. Live telemetry ingestion and rider authentication are outside this implementation.
  - The trip lifecycle stops at assignment. There is no rider app or fleet operator dashboard in this slice.
architecture:
  system: NexRide
  caption: The API estimates travel times locally with straight-line distances, without calling a maps service.
  nodes:
    - id: api
      kind: container
      label: API service
      name: NexRide
      repo: NexRide
      tech: NestJS 11 / TypeScript
      does: Ranks pickup options and assigns vehicles
      col: 0
      row: 0
    - id: postgres
      kind: store
      label: Database
      name: PostgreSQL
      tech: PostGIS
      does: Stores points, decisions, trips and events
      col: 1
      row: 0
    - id: redis
      kind: store
      label: Fleet state and cache
      name: Redis
      tech: Redis 7
      does: Holds fleet snapshots and cached estimates
      col: 1
      row: 1
  edges:
    - from: api
      to: postgres
      protocol: SQL
      verb: Reads and writes
      evidence: https://github.com/diegnghtmr/NexRide/blob/main/src/app.module.ts#L84-L104
    - from: api
      to: redis
      protocol: RESP
      verb: Reads fleet state
      evidence: https://github.com/diegnghtmr/NexRide/blob/main/src/fleet/infrastructure/redis-fleet.adapter.ts#L53-L95
---

## Problem

When someone requests a late-night ride, the quickest pickup is not the only thing that matters. A rider leaving a campus may prefer to walk to a nearby, better-lit spot rather than wait at the address they entered. That choice should stay with the rider: the service needs to say why it suggests a different pickup and how far away it is.

An electric fleet has a separate constraint. The closest car can be busy, have stale telemetry, or lack the range to reach the rider and finish the trip with a battery reserve. NexRide addresses the part of dispatch that brings those two concerns together, from a request with an origin and destination through to an assigned trip.

## How it works

A NestJS controller passes each ride request to `DispatchFacade`, the entry point to the dispatch module. Evaluation queries Redis for nearby vehicles and PostGIS for active pickup points in parallel. It then excludes vehicles that are unavailable, ineligible, short on range or reporting stale telemetry before scoring the remaining vehicle and pickup combinations.

The scoring engine weights proximity, energy, pickup safety and fleet continuity. It keeps the original location as an option and only suggests a catalog point for the selected vehicle if the relative safety score improves by at least 15% and the point is within 120 m under the default configuration. It stores the preliminary decision and candidate scores in PostgreSQL before returning the options.

Confirmation takes the request ID and the rider’s choice. It locks the decision row and creates the trip in the same transaction, so a second confirmation cannot create another trip for that request. After commit, an in-process event bus notifies the analytics module, which stores events separately from the dispatch transaction.
