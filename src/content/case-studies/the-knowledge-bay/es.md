---
project: the-knowledge-bay
summary: >-
  Red de aprendizaje para compartir recursos, pedir ayuda y estudiar en grupos formados a partir de intereses comunes.
role: Integrante del equipo y responsable de las mejoras de 2026
timeframe: 2025–2026
team: 3
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/visitor-landing.png
      alt: Pantalla de bienvenida verde azulado con una silueta costera, un libro abierto y botones de registro e inicio de sesión
      caption: La portada pública presenta la red de aprendizaje en español.
    - src: ./shots/group-feed.png
      alt: Muro de un grupo de estudio con dos artículos de ejemplo, recuentos de reacciones y comentarios, y una solicitud de ayuda
      caption: Los artículos y las solicitudes del mismo tema aparecen juntos. El grupo consulta las mismas publicaciones que el muro general.
    - src: ./shots/chat-thread.png
      alt: Chat con un resultado de búsqueda a la izquierda y un mensaje de ejemplo encima del campo de escritura
      caption: Un estudiante puede buscar a un compañero e iniciar una conversación privada sin tener un chat previo.
    - src: ./shots/moderator-analytics.png
      alt: Panel de moderación con actividad por tema, participación semanal y una tabla de comunidades estudiantiles
      caption: El panel muestra sobre qué temas escriben los estudiantes y qué intereses comparten. Las cifras provienen de datos sintéticos.
decisions:
  - question: ¿Dónde se guardan los datos cuando hay más de una instancia en ejecución?
    options:
      - label: Conservar la base de datos en un archivo
        reason: La configuración anterior no necesitaba un servicio de base de datos separado, pero cada copia del archivo tendría sus propios datos.
      - label: Compartir una base de datos PostgreSQL
        reason: Las instancias consultan los mismos datos persistentes y Flyway aplica migraciones versionadas del esquema al arrancar.
        chosen: true
    consequence: Las publicaciones, las cuentas y las sesiones se conservan tras un reinicio. Una copia sin la aplicación en ejecución mueve los registros en una sola transacción; los archivos adjuntos se trasladan por separado.
    evidence:
      - label: Persistencia en PostgreSQL y copia única de datos
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/docs/persistence.md
      - label: Implementación de la copia con la aplicación detenida
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/infrastructure/persistence/SqliteImport.java
  - question: ¿Cómo llega el chat en vivo a un estudiante conectado a otra instancia?
    options:
      - label: Notificar solo a las conexiones de la instancia emisora
        reason: Un proceso puede avisar a sus propias conexiones, pero no a quien está conectado a otra instancia.
      - label: Notificar a las instancias mediante LISTEN/NOTIFY de PostgreSQL
        reason: La notificación se emite al confirmar la transacción y solo contiene los identificadores de los participantes y del mensaje. Cada instancia recupera el mensaje mediante la consulta autorizada de la conversación.
        chosen: true
    consequence: El chat se actualiza entre instancias sin recargar la página. Las reservas en la base de datos imponen un límite compartido de conexiones por estudiante y el historial HTTP permite recuperar mensajes si se pierde un evento.
    evidence:
      - label: Persistencia y distribución del chat
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/docs/persistence.md#sessions-and-messages
      - label: Límite de conexiones y respaldo por HTTP
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/docs/api.md#chat
      - label: Pruebas de chat y del límite con dos instancias
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/DurableFeaturesTest.java#L232-L312
  - question: ¿De dónde obtiene la API la identidad de quien hace la petición?
    options:
      - label: Interpretar la identidad en cada controlador
        reason: Repetir la consulta permite que distintos controladores respondan de forma diferente ante una sesión ausente o inválida.
      - label: Usar la identidad que resuelve el filtro bearer
        reason: Se resuelve la sesión una vez por petición protegida y se deniega el acceso si no hay una regla explícita para la ruta.
        chosen: true
    consequence: Los controladores toman de la sesión la identidad de quien actúa. La petición identifica el recurso de destino, no a la persona que realiza la acción.
    evidence:
      - label: Filtro de sesión bearer
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/infrastructure/config/BearerSessionFilter.java
      - label: Reglas de acceso en Spring Security
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/infrastructure/config/SecurityConfig.java
results:
  - label: Pruebas del servidor con PostgreSQL
    detail: Pasaron las 123 pruebas del servidor, incluidas la entrega entre dos instancias y la aplicación del límite compartido de conexiones.
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/DurableFeaturesTest.java
  - label: Pruebas del cliente, lint y compilación de producción
    detail: Pasaron las 33 pruebas del cliente, el análisis de código con ESLint y la compilación de producción.
    url: https://github.com/diegnghtmr/the-knowledge-bay/tree/main/client/tests
  - label: Pruebas con Chromium sobre el paquete final
    detail: Pasaron los 12 escenarios de Chromium contra el JAR de Spring, la SPA compilada y una base PostgreSQL desechable. Cubren el chat en vivo y la conservación de sesiones y adjuntos tras reiniciar.
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/tests/production-audit.mjs
  - label: GitHub Actions
    detail: El trabajo verify pasó en el PR de PostgreSQL (#4) y en el de Docker (#5). El trabajo image también pasó en el PR de Docker.
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/.github/workflows/ci.yml
limitations:
  - Las publicaciones antiguas que solo guardaban el nombre del adjunto siguen siendo legibles, pero no ofrecen un archivo para descargar.
  - Las réplicas en distintos hosts de Docker necesitan almacenamiento persistente compartido para los adjuntos. Un volumen local con nombre no se comparte entre hosts.
architecture:
  system: The Knowledge Bay
  caption: Una imagen incluye la SPA y la API; todas las instancias usan la misma base PostgreSQL y el mismo almacén privado de adjuntos.
  nodes:
    - id: frontend
      kind: container
      label: Aplicación web (SPA)
      name: the-knowledge-bay
      repo: the-knowledge-bay
      tech: React 19 / JavaScript
      does: Muestra grupos, chat y vistas de moderación
      col: 0
      row: 0
    - id: backend
      kind: container
      label: Servicio API
      name: The Knowledge Bay API
      tech: Java 21 / Spring Boot 3.4
      does: Sirve la SPA, la API y el chat en vivo
      col: 1
      row: 0
    - id: postgres
      kind: store
      label: Base de datos
      name: PostgreSQL
      tech: PostgreSQL 17
      does: Datos, sesiones y reservas
      col: 3
      row: 0
    - id: attachments
      kind: store
      label: Archivos
      name: Uploads
      tech: Volume
      does: Bytes de adjuntos
      col: 3
      row: 1
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Llama a la API
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/services/apiClient.js
    - from: frontend
      to: backend
      protocol: SSE
      verb: Abre el chat
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/services/chatApi.js
    - from: backend
      to: postgres
      protocol: JDBC/SQL
      verb: Lee y escribe
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/repository/DomainRepository.java
    - from: backend
      to: postgres
      protocol: LISTEN/NOTIFY
      verb: Escucha avisos
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/api/controller/PostgresChatListener.java#L49-L121
    - from: backend
      to: attachments
      protocol: Files
      verb: Guarda archivos
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/service/AttachmentStorage.java
---

## Problema

Cuando un estudiante se atasca con una tarea, el grupo que puede ayudar no siempre es el que ya conoce. Un enlace o una explicación compartidos por privado también son difíciles de encontrar para el siguiente estudiante. The Knowledge Bay permite publicar recursos, hacer preguntas y encontrar grupos a partir de los intereses del perfil. Los moderadores pueden ver lo que se publica por tema y explorar las conexiones entre estudiantes.

El equipo desarrolló la primera versión entre marzo y junio de 2025. Un reinicio podía borrar cuentas y publicaciones, y de dos envíos aceptados al mismo tiempo podía quedar solo uno en el muro. En noviembre de 2026 se corrigieron esos flujos sin cambiar la paleta costera ni la distribución original de la interfaz.

## Cómo funciona

Docker empaqueta el cliente React y el servidor Spring Boot, que sirve la SPA y `/api` desde el mismo origen. Compose comprueba `/api/interests` y conserva la base de datos y los adjuntos en volúmenes con nombre (`pgdata` y `uploads`). El arranque exige un `MODERATOR_PASSWORD` que no esté en blanco y un directorio de adjuntos existente, con permisos de escritura y fuera del árbol de archivos estáticos.

Flyway aplica migraciones versionadas al arrancar. El comando `--import-sqlite` lee la base SQLite anterior sin alterarla y copia los registros a una base PostgreSQL 17 vacía en una sola transacción. Los archivos adjuntos se copian por separado. Los grupos consultan las publicaciones originales y el grafo de afinidad se reconstruye a partir de los seguimientos mutuos guardados.

Las peticiones protegidas envían un token bearer en la cabecera. PostgreSQL guarda su huella, no el token. Las sesiones sobreviven a los reinicios hasta que caducan o se revocan.

El chat usa eventos autenticados enviados por el servidor. Al confirmar la escritura, PostgreSQL notifica mediante `LISTEN/NOTIFY` solo los identificadores de los participantes y del mensaje. Cada instancia recupera el mensaje mediante la consulta autorizada de la conversación. Las reservas en la base de datos limitan las conexiones por estudiante entre instancias. Al superar el límite, se devuelve HTTP `429` con `Retry-After: 2` antes de abrir la conexión. El historial HTTP sirve de respaldo.

Los adjuntos PDF, PNG y JPEG de hasta 5 MiB se guardan en privado y solo se sirven como descargas autorizadas.
