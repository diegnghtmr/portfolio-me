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
    consequence: El servidor comprueba el acceso a los registros del club con independencia de la navegación del usuario. Los informes y las descargas en PDF respetan el mismo alcance por club. La comprobación de disponibilidad y el inicio de sesión son públicos.
    evidence:
      - label: Política de autorización del servidor
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/security/RosterAuthorization.java
      - label: Pruebas de autorización de la API
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/security/ApiAuthorizationTests.java
  - question: ¿Dónde deben generarse los PDF de los informes?
    options:
      - label: Generar los PDF en el navegador
        reason: El navegador puede crear el archivo con los datos que ya consultó, pero tiene que cargar una biblioteca para generar PDF.
      - label: Generar los PDF en el servidor Spring Boot
        reason: Las rutas de exportación reutilizan las consultas de informes con el mismo alcance por club y dibujan gráficos vectoriales en el PDF.
        chosen: true
    consequence: Los 12 informes están disponibles como PDF generados en el servidor. El navegador envía los filtros seleccionados y descarga el archivo sin generar el PDF localmente.
    evidence:
      - label: Rutas de exportación y consultas de informes
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/controller/AnalyticsReportPdfController.java
      - label: Dibujo de gráficos vectoriales
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/service/report/ReportPdfChart.java
      - label: Descarga desde el navegador
        url: https://github.com/diegnghtmr/roster-edge/blob/main/frontend/src/components/reports/ExportButton.tsx
  - question: ¿Cómo distingue la tabla un empate de un partido sin jugar?
    options:
      - label: Deducir el resultado del marcador
        reason: Dos ceros no distinguen un empate sin goles de un partido sin resultado registrado.
      - label: Registrar explícitamente el resultado como definitivo
        reason: El marcador solo cuenta para la clasificación cuando el club registra un resultado.
        chosen: true
    consequence: Un partido sin jugar no suma partidos disputados ni puntos. Un 0–0 guardado mediante el formulario de resultados da un punto a cada equipo.
    evidence:
      - label: Migración para el estado del resultado
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/resources/db/migration/V003__match_result_state.sql
      - label: Pruebas de resultados y clasificación
        url: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/test/java/co/edu/uniquindio/rosteredge/backend/report/MatchReportTest.java
results:
  - label: Backend en PostgreSQL 17
    detail: Pasaron las 76 pruebas, incluidas las de reversión al programar un partido, clasificación, alcance por club en informes y exportaciones en PDF, y dibujo de gráficos vectoriales.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/backend/src/test
  - label: Pruebas y compilación de producción de la interfaz
    detail: Pasaron las 49 pruebas de Vitest, incluidas las de registro de resultados y descarga de PDF. TypeScript y Vite compilaron la interfaz de producción.
    url: https://github.com/diegnghtmr/roster-edge/tree/main/frontend/src/test
  - label: Prueba en Chromium de la aplicación empaquetada
    detail: Pasaron 14 de 14 comprobaciones con la interfaz compilada y la API empaquetada, incluidas las fechas de partidos en Bogotá, el registro de resultados, la descarga de la clasificación en PDF y la vista móvil.
    url: https://github.com/diegnghtmr/roster-edge/blob/main/docs/testing/smoke.cjs
  - label: GitHub Actions
    detail: Las tareas frontend y backend-and-smoke pasaron en los PR #6 y #7, integrados en main.
    url: https://github.com/diegnghtmr/roster-edge/pull/7/checks
limitations:
  - Solo se puede guardar el resultado de un partido activo con exactamente una asignación activa de local y otra de visitante, para equipos distintos.
  - La API mantiene las sesiones activas en memoria, por lo que hay que volver a iniciar sesión después de reiniciarla.
architecture:
  system: RosterEdge
  caption: La SPA y la API comparten un repositorio; solo la API consulta PostgreSQL y genera los PDF con los mismos datos del club que los informes en JSON.
  nodes:
    - id: frontend
      kind: container
      label: Aplicación web (SPA)
      name: roster-edge
      repo: roster-edge
      tech: React 19 / TypeScript
      does: Programa partidos y registra marcadores
      col: 0
      row: 0
    - id: backend
      kind: container
      label: API REST
      name: RosterEdge API
      tech: Java 21 / Spring Boot 3.5
      does: Limita datos por club y genera PDF
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
      protocol: HTTP / JSON + PDF
      verb: Usa la API y descarga PDF
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/frontend/src/api/services/reports/useReportsData.ts
    - from: backend
      to: postgres
      protocol: JDBC/SQL
      verb: Consulta registros del club
      evidence: https://github.com/diegnghtmr/roster-edge/blob/main/backend/src/main/java/co/edu/uniquindio/rosteredge/backend/repository/report/AnalyticsReportQueryRepository.java
---

## Problema

Antes de publicar el calendario, el personal del club debe saber qué equipos participan, dónde jugarán y a qué evento pertenece cada partido. Un partido también aporta datos a otras tareas del club: los equipos aparecen en el calendario y el resultado, una vez registrado, cuenta para la clasificación de la temporada. Un partido sin jugar debe aparecer en el calendario sin figurar como empate en la tabla.

RosterEdge permite al personal gestionar equipos, programar partidos y registrar marcadores de su club. El personal puede consultar la clasificación y los informes de pagos, y descargar los PDF para compartirlos fuera de la aplicación. Las capturas muestran un club ficticio y pagos de ejemplo de la demostración local.

## Cómo funciona

Una aplicación React de una sola página envía solicitudes JSON a una API REST de Spring Boot y, tras iniciar sesión, incluye un token de acceso. El servidor identifica el club a partir de la sesión, no de un filtro enviado por el navegador. React Router carga las rutas de informes bajo demanda. TanStack Query consulta los datos y Recharts dibuja los gráficos en pantalla.

Desde la lista de partidos, el personal abre un formulario para registrar o corregir los goles del local y del visitante, sin volver a abrir el formulario de programación. El formulario acepta marcadores enteros no negativos y los envía a `PUT /api/matches/{id}/result/`. Al guardar, se actualizan la lista de partidos y la clasificación. La programación es una operación aparte: la API guarda el partido, las dos asignaciones de equipo y la notificación en una única transacción de PostgreSQL. El navegador envía el día elegido sin convertirlo a UTC, por lo que la fecha no cambia en Bogotá.

Spring Boot usa OpenPDF para generar los PDF de los 12 informes con gráficos vectoriales. El navegador solicita el PDF con los filtros del informe y descarga el archivo. La exportación se limita al mismo club que los datos del informe en JSON.

Flyway aplica migraciones versionadas. Una de ellas añade una función para sincronizar las secuencias después de una importación controlada con identificadores explícitos. Si los datos importados lo requieren, la secuencia avanza, pero nunca retrocede.
