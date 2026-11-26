---
project: roster-edge
summary: >-
  Una aplicación para que el personal de clubes deportivos gestione equipos, programe partidos y consulte clasificaciones y pagos.
role: Desarrollo de frontend y backend en equipo
timeframe: 2025–2026
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/teams.png
      alt: Directorio de equipos del club con filtros por nombre y mascota y una confirmación de creación
      caption: El directorio muestra a Bambú City FC junto a los cuatro equipos ficticios de los datos de prueba.
    - src: ./shots/match-create.png
      alt: Formulario de partido con fecha, horas de inicio y fin, estadio, evento y equipos local y visitante
      caption: El personal elige la fecha, el estadio y los dos equipos en un solo formulario. Se envía el mismo día que se eligió en el navegador.
    - src: ./shots/standings.png
      alt: Tabla de posiciones de la temporada con gráficos de puntos y victorias y un botón para exportar a PDF
      caption: La clasificación solo cuenta resultados registrados. Programar un partido sin resultado no da puntos a ninguno de los equipos.
    - src: ./shots/payment-report.png
      alt: Informe de métodos de pago con ingresos netos, número de pagos y un gráfico en pesos colombianos
      caption: El informe agrupa los pagos del club ficticio por método y permite exportarlos a PDF.
decisions:
  - question: ¿Cómo debe identificar la API el club de la cuenta?
    options:
      - label: Club seleccionado por el cliente
        reason: Un filtro permite acotar una lista, pero no demuestra a qué club puede acceder la cuenta.
      - label: Club asociado a la cuenta autenticada
        reason: La API obtiene el club de la sesión y deniega el acceso salvo que una regla del servidor permita la solicitud.
        chosen: true
    consequence: El servidor comprueba el acceso a los datos del club con independencia de la navegación del usuario. La comprobación de disponibilidad y el inicio de sesión son explícitamente públicos.
    evidence:
      - label: Política de autorización del servidor
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/security/RosterAuthorization.java
      - label: Pruebas de autorización de la API
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/security/ApiAuthorizationTests.java
  - question: ¿Qué debe guardarse al programar un partido?
    options:
      - label: Guardar el partido y los demás registros por separado
        reason: Las escrituras separadas pueden dejar un partido sin uno de los equipos o sin su notificación en la aplicación.
      - label: Guardar todos los registros de la programación juntos
        reason: El partido, las asignaciones de local y visitante y la notificación pertenecen a la misma operación.
        chosen: true
    consequence: Si no se puede guardar una asignación o la notificación al programar el partido, la transacción tampoco guarda el partido.
    evidence:
      - label: Servicio transaccional de programación
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/service/impl/MatchServiceImpl.java
      - label: Pruebas de reversión en PostgreSQL
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/match/MatchPersistenceTest.java
  - question: ¿Cómo distingue la tabla un empate de un partido sin jugar?
    options:
      - label: Deducir el resultado del marcador
        reason: Dos ceros no distinguen un empate sin goles de un partido sin resultado registrado.
      - label: Registrar explícitamente el resultado como definitivo
        reason: El marcador solo cuenta para la clasificación cuando el club registra un resultado.
        chosen: true
    consequence: Un partido sin jugar no suma partidos disputados ni puntos. Un 0–0 registrado sí da un punto a cada equipo.
    evidence:
      - label: Migración para el estado del resultado
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/resources/db/migration/V003__match_result_state.sql
      - label: Pruebas de resultados y clasificación
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/report/MatchReportTest.java
results:
  - label: Backend en PostgreSQL 17
    detail: Pasaron las 30 pruebas, incluidas las de acceso por club, reversión al programar un partido, clasificación y migraciones tras un reinicio.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/backend/src/test
  - label: Pruebas y compilación de producción de la interfaz
    detail: Pasaron las 39 pruebas de Vitest, incluidas las de restauración de sesión, conservación de fechas y presentación de informes. TypeScript y Vite compilaron la interfaz de producción.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/frontend/src/test
  - label: Prueba en Chromium de la aplicación empaquetada
    detail: Pasaron las 13 comprobaciones con la interfaz compilada y la API empaquetada, incluidas la programación en la zona horaria de Bogotá, los informes por club y la vista móvil.
    url: https://github.com/diegnghtmr/roster-edge/blob/main/docs/testing/README.md
  - label: GitHub Actions
    detail: Las tareas frontend y backend-and-smoke pasaron en el PR #3, integrado en main.
    url: https://github.com/diegnghtmr/roster-edge/pull/3
limitations:
  - La interfaz permite programar partidos, pero no tiene un formulario para registrar el resultado. Para hacerlo se usa la API autenticada.
  - La API mantiene las sesiones activas en memoria, por lo que hay que volver a iniciar sesión después de reiniciarla.
architecture:
  system: RosterEdge
  caption: La SPA y la API REST comparten un repositorio, pero solo la API se conecta a PostgreSQL.
  nodes:
    - id: frontend
      kind: container
      label: Aplicación web (SPA)
      name: roster-edge
      repo: roster-edge
      tech: React 19 / TypeScript
      does: Programa partidos y muestra informes
      col: 0
      row: 0
    - id: backend
      kind: container
      label: API REST
      name: RosterEdge API
      tech: Java 21 / Spring Boot 3.5
      does: Autoriza por club y registra resultados
      col: 1
      row: 0
    - id: postgres
      kind: store
      label: Almacén de datos
      name: PostgreSQL
      tech: PostgreSQL / Flyway
      does: Guarda clubes, partidos y pagos
      col: 2
      row: 0
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Consulta los datos del club
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/frontend/src/api/endPoints/fetchGet.ts
    - from: backend
      to: postgres
      protocol: JDBC/SQL
      verb: Consulta registros del club
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/repository/report/AnalyticsReportQueryRepository.java
---

## Problema

Antes de publicar el calendario, el personal del club debe saber qué equipos participan, dónde jugarán y a qué evento pertenece cada partido. Un partido también aporta datos a otras tareas del club: los equipos aparecen en el calendario y el resultado, una vez registrado, cuenta para la clasificación de la temporada. Un partido sin jugar debe aparecer en el calendario sin figurar como empate en la tabla.

RosterEdge reúne la gestión de equipos, la programación de partidos y los informes de posiciones y pagos del club. El personal puede descargar los informes en PDF para compartirlos fuera de la aplicación. Las capturas muestran un club ficticio y pagos de ejemplo de la demostración local.

## Cómo funciona

Una aplicación React de una sola página envía solicitudes JSON a una API REST de Spring Boot. El navegador inicia sesión con la cuenta del club y envía un token en las solicitudes posteriores. El servidor obtiene el club de la sesión, sin depender del filtro enviado por el navegador. TanStack Query gestiona las solicitudes, Recharts muestra los datos de los informes y React PDF genera los documentos en el navegador.

El servicio de programación guarda el partido, las dos asignaciones de equipo y la notificación en una única transacción de PostgreSQL. La interfaz codifica la fecha como día de calendario sin convertirla a UTC, de modo que elegir un día en Bogotá no desplaza el partido al día anterior. Programar un partido y registrar su resultado son operaciones distintas. La clasificación solo cuenta los resultados registrados, sin interpretar el marcador inicial como un empate.

Flyway aplica migraciones versionadas. Una de ellas añade una función para sincronizar las secuencias después de una importación controlada con identificadores explícitos. Si los datos importados lo requieren, la secuencia avanza, pero nunca retrocede.
