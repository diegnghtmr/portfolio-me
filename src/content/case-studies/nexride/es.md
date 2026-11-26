---
project: nexride
summary: API de asignación de viajes para flotas eléctricas que clasifica vehículos disponibles y puede sugerir un punto de recogida cercano.
role: Desarrollador único
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: Con una flota ficticia en Bogotá, la API compara la recogida original con un punto del catálogo a unos 100 m y confirma la elección del pasajero. Extractos de las respuestas JSON.
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
  - question: ¿Cómo ordenar los vehículos que cumplen los requisitos?
    options:
      - label: Reglas fijas sin puntuación
        reason: Las reglas descartan vehículos no aptos, pero ayudan poco al comparar varios vehículos aptos con distintas ventajas.
      - label: Entrenar un modelo de clasificación
        reason: Un modelo podría aprender de los viajes anteriores, pero el MVP no contaba con suficientes datos históricos.
      - label: Suma ponderada configurable
        reason: Combina proximidad, energía, seguridad del punto de recogida y continuidad de la flota con pesos explícitos.
        chosen: true
    consequence: La API devuelve la puntuación de cada factor y el total ponderado para cada opción de recogida. Los pesos se leen de variables de entorno y cambiarlos requiere reiniciar el servicio.
    evidence:
      - label: Documento de diseño, decisión 2
        url: https://github.com/diegnghtmr/NexRide/blob/main/docs/Design%20Doc%20DD-02%20-%20NexRide.md#L132-L145
      - label: Cálculo de la puntuación
        url: https://github.com/diegnghtmr/NexRide/blob/main/src/dispatch/domain/services/scoring-engine.ts
  - question: ¿Cómo estimar los tiempos de llegada sin una cuenta de un servicio de mapas?
    options:
      - label: Matriz de distancias externa
        reason: Las estimaciones por ruta requieren credenciales de un proveedor que el entorno de evaluación no tenía.
      - label: Estimación en línea recta detrás de una interfaz
        reason: Calcula la distancia con Haversine, asume una velocidad fija y guarda el resultado en la caché de Redis.
        chosen: true
    consequence: El despacho funciona sin un servicio externo de mapas y otro proveedor puede usar la misma interfaz. La estimación no incorpora la red vial ni el tráfico.
    evidence:
      - label: ADR-001 en la referencia de despacho
        url: https://github.com/diegnghtmr/NexRide/blob/main/docs/dispatch-reference.md#design-decisions
      - label: Proveedor de distancias
        url: https://github.com/diegnghtmr/NexRide/blob/main/src/dispatch/infrastructure/providers/haversine-distance.provider.ts
  - question: ¿Qué debe exponer el módulo de despacho al controlador HTTP?
    options:
      - label: Un servicio que implemente las dos operaciones
        reason: Sigue el diseño original de un solo servicio, pero reúne la evaluación y la confirmación en una misma clase.
      - label: Una fachada que delega en dos casos de uso
        reason: Da al controlador un punto de entrada y separa el cálculo de la transacción que asigna el viaje.
        chosen: true
    consequence: La evaluación y la confirmación se pueden probar por separado. La fachada delega sin contener sus reglas de negocio.
    evidence:
      - label: ADR-014
        url: https://github.com/diegnghtmr/NexRide/blob/main/docs/adr/ADR-014-dispatch-facade-vs-service.md
      - label: Fachada de despacho
        url: https://github.com/diegnghtmr/NexRide/blob/main/src/dispatch/dispatch.facade.ts
results:
  - label: Pruebas unitarias
    detail: Pasaron 260 pruebas en 34 suites con Node 22, incluidas las de puntuación y decisión del punto de recogida.
  - label: Despacho y confirmación en local
    detail: Las dos solicitudes devolvieron HTTP 201. La segunda usó el identificador de la primera y asignó el mismo vehículo con el punto de recogida sugerido.
limitations:
  - Los tiempos de llegada y las distancias a pie se estiman en línea recta. La puntuación de seguridad procede de un catálogo, no de las condiciones de la calle en tiempo real.
  - El backend lee la telemetría de los vehículos desde Redis. La ingesta de telemetría en directo y la autenticación de pasajeros quedan fuera de esta implementación.
  - El ciclo del viaje termina en la asignación. Este alcance no incluye una aplicación para pasajeros ni un panel para operadores de flota.
architecture:
  system: NexRide
  caption: La API estima los tiempos de viaje con distancias en línea recta, sin consultar un servicio de mapas.
  nodes:
    - id: api
      kind: container
      label: Servicio API
      name: NexRide
      repo: NexRide
      tech: NestJS 11 / TypeScript
      does: Ordena opciones de recogida y asigna vehículos
      col: 0
      row: 0
    - id: postgres
      kind: store
      label: Base de datos
      name: PostgreSQL
      tech: PostGIS
      does: Guarda puntos, decisiones, viajes y eventos
      col: 1
      row: 0
    - id: redis
      kind: store
      label: Estado de la flota y caché
      name: Redis
      tech: Redis 7
      does: Guarda estados de la flota y estimaciones
      col: 1
      row: 1
  edges:
    - from: api
      to: postgres
      protocol: SQL
      verb: Lee y escribe
      evidence: https://github.com/diegnghtmr/NexRide/blob/main/src/app.module.ts#L84-L104
    - from: api
      to: redis
      protocol: RESP
      verb: Consulta el estado de flota
      evidence: https://github.com/diegnghtmr/NexRide/blob/main/src/fleet/infrastructure/redis-fleet.adapter.ts#L53-L95
---

## Problema

Cuando se solicita un viaje de noche, la rapidez de la recogida no es lo único que importa. Quien sale de un campus puede preferir caminar hasta un lugar cercano y mejor iluminado en vez de esperar en la dirección que indicó. La elección sigue siendo del pasajero: el servicio debe explicar por qué sugiere otro punto y a qué distancia queda.

Una flota eléctrica tiene otra restricción. El vehículo más cercano puede estar ocupado, tener datos desactualizados o no contar con autonomía para llegar al pasajero y terminar el viaje con una reserva de batería. NexRide cubre la parte del despacho que reúne ambas necesidades, desde la solicitud con origen y destino hasta la asignación del viaje.

## Cómo funciona

Un controlador de NestJS envía cada solicitud a `DispatchFacade`, el punto de entrada al módulo de despacho. La evaluación consulta en paralelo los vehículos cercanos en Redis y los puntos de recogida activos en PostGIS. Después descarta los vehículos no disponibles, no elegibles, con autonomía insuficiente o con telemetría desactualizada, antes de puntuar las combinaciones restantes de vehículo y punto.

El motor pondera la proximidad, la energía, la seguridad de la recogida y la continuidad de la flota. Conserva la ubicación original como opción y, con la configuración predeterminada, solo sugiere un punto del catálogo para el vehículo seleccionado si la puntuación de seguridad mejora al menos un 15 % en términos relativos y el punto está a 120 m o menos. Antes de devolver las opciones, guarda en PostgreSQL la decisión preliminar y las puntuaciones de los candidatos.

La confirmación recibe el identificador de la solicitud y la elección del pasajero. Bloquea la fila de la decisión y crea el viaje en la misma transacción, de modo que una segunda confirmación no puede crear otro viaje para esa solicitud. Después de confirmar la transacción, un bus de eventos interno notifica al módulo de analítica, que guarda los eventos por separado.
