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
  - question: ¿Dónde deben quedar los aportes de los estudiantes al reiniciar el servidor?
    options:
      - label: Colecciones mutables en el proceso de Java
        reason: Eran sencillas de conectar en la primera versión, pero al reiniciar se perdían cuentas, intereses y publicaciones.
      - label: SQLite como fuente de verdad
        reason: Los identificadores de la base de datos y las transacciones permiten guardar juntos los cambios relacionados sin un servicio de base de datos separado.
        chosen: true
    consequence: Las cuentas, las publicaciones y los mensajes se conservan al reiniciar con el mismo archivo. Los grupos consultan las publicaciones originales en vez de guardar copias.
    evidence:
      - label: Contrato de persistencia en SQLite
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/docs/persistence-contract.md
      - label: Prueba de persistencia tras el reinicio
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/PersistenceContractTest.java
      - label: Prueba de concurrencia con barrera
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/test/java/co/edu/uniquindio/theknowledgebay/ConcurrentDomainTest.java
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
  - question: ¿Para qué sirven las estructuras propias si SQLite se encarga de guardar los cambios?
    options:
      - label: Mantener un grafo mutable separado
        reason: Habría que sincronizarlo cada vez que cambien los perfiles o las relaciones de seguimiento.
      - label: Reconstruir el grafo con las relaciones guardadas
        reason: Se conserva el grafo no dirigido para recorrer las relaciones sin convertirlo en un segundo almacén.
        chosen: true
    consequence: Los seguimientos mutuos forman aristas y una cola permite recorrerlas para hallar el camino más corto. El panel calcula la actividad por tema y la participación a partir de los registros guardados.
    evidence:
      - label: Proyecciones del grafo y del panel
        url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/model/TheKnowledgeBay.java
results:
  - label: Spring Boot y SQLite
    detail: Pasaron las 109 pruebas del servidor, que incluyen un reinicio con el mismo archivo SQLite y escrituras que arrancan juntas mediante una barrera.
    url: https://github.com/diegnghtmr/the-knowledge-bay/tree/main/server/src/test
  - label: Pruebas de React y compilación de producción
    detail: Pasaron las 31 pruebas del cliente y ESLint no reportó errores ni advertencias. La carga diferida de rutas redujo el archivo inicial de Vite de 1394 kB a 454 kB (minificado, antes de gzip).
    url: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/App.jsx
  - label: Chromium contra el paquete final y CI
    detail: Pasaron diez escenarios de Chromium contra el JAR de Spring con la SPA compilada y una base SQLite desechable. Los trabajos de verificación del PR #1 integrado pasaron.
    url: https://github.com/diegnghtmr/the-knowledge-bay/pull/1
limitations:
  - Los tokens de sesión viven en el proceso de Java. Tras un reinicio, los estudiantes y moderadores deben volver a iniciar sesión.
  - El chat usa peticiones HTTP en lugar de WebSockets. Las publicaciones de recursos guardan el nombre del adjunto, pero no permiten descargarlo.
architecture:
  system: The Knowledge Bay
  caption: En el despliegue empaquetado, Spring sirve la SPA compilada y su API desde el mismo origen.
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
      label: API REST
      name: The Knowledge Bay API
      tech: Java 21 / Spring Boot 3.4
      does: Sirve la SPA y atiende peticiones a la API
      col: 1
      row: 0
    - id: sqlite
      kind: store
      label: Base de datos
      name: SQLite
      tech: SQLite
      does: Guarda estudiantes, aportes y mensajes
      col: 2
      row: 0
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Llama a la API del sitio
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/client/src/services/apiClient.js
    - from: backend
      to: sqlite
      protocol: JDBC/SQL
      verb: Lee y escribe registros
      evidence: https://github.com/diegnghtmr/the-knowledge-bay/blob/main/server/src/main/java/co/edu/uniquindio/theknowledgebay/core/repository/DomainRepository.java
---

## Problema

Cuando un estudiante se atasca con una tarea, el grupo que puede ayudar no siempre es el que ya conoce. Un enlace o una explicación compartidos por privado también son difíciles de encontrar para el siguiente estudiante. The Knowledge Bay permite publicar recursos, hacer preguntas y encontrar grupos a partir de los intereses del perfil. Los moderadores pueden ver lo que se publica por tema y explorar las conexiones entre estudiantes.

El equipo desarrolló la primera versión entre marzo y junio de 2025. Un reinicio podía borrar cuentas y publicaciones, y de dos envíos aceptados al mismo tiempo podía quedar solo uno en el muro. En noviembre de 2026 se corrigieron esos flujos sin cambiar la paleta costera ni la distribución original de la interfaz.

## Cómo funciona

La SPA de React y la API de Spring Boot están en un mismo repositorio. En el despliegue empaquetado, Spring sirve el cliente compilado, responde a las rutas internas de la SPA y atiende `/api`. El navegador envía un token bearer en las peticiones protegidas. Spring identifica al estudiante o moderador antes de ejecutar el controlador. React carga las rutas de chat, perfiles y moderación solo al abrirlas, sin incluirlas en el paquete inicial.

Los repositorios de Java escriben en un archivo SQLite. Una sola transacción guarda al estudiante, sus intereses y las asociaciones con los grupos automáticos. La pertenencia a los grupos se deriva de los intereses y los muros consultan los mismos registros. Editar una publicación no exige actualizar una segunda copia. El formulario espera la respuesta de la API y bloquea envíos repetidos mientras se guarda. La base de datos asigna identificadores distintos a publicaciones independientes.

El grafo de afinidad se reconstruye a partir de una lectura de la base de datos. Los seguimientos mutuos forman aristas y una búsqueda en anchura encuentra el camino más corto entre un par de estudiantes. El panel de moderación calcula la actividad por tema y la participación con los registros guardados, sin llevar contadores aparte.
