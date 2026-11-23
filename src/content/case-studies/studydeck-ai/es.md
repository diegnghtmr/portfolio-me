---
project: studydeck-ai
summary: >-
  Aplicación para quienes convierten sus apuntes en tarjetas y usan el repaso espaciado para decidir qué estudiar después.
role: Desarrollo en solitario
timeframe: "2026"
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/study-dashboard.png
      alt: Panel de StudyDeck con las tarjetas que toca repasar hoy, el progreso diario y seis mazos de ejemplo para prácticas de campo.
      caption: El panel muestra qué toca repasar y propone un mazo para empezar. Las cifras son de una cuenta de estudio ficticia.
    - src: ./shots/deck-library.png
      alt: Pantalla de tarjetas y mazos con Night Sky Basics seleccionado y una cuadrícula de tarjetas de astronomía.
      caption: Selecciona un mazo para ver sus tarjetas y filtra la lista por texto o tipo de tarjeta.
    - src: ./shots/review-session.png
      alt: Tarjeta con la respuesta visible sobre las estrellas circumpolares y cuatro botones para valorar el recuerdo, de Again a Easy.
      caption: Tras revelar la respuesta, la persona indica qué tan bien la recordó y el planificador calcula la próxima fecha de repaso.
decisions:
  - question: ¿En qué capa deberían quedar las reglas de repaso y de los mazos?
    options:
      - label: Servicios acoplados al framework
        reason: Usar Spring y las API de persistencia directamente en los casos de uso, con menos interfaces pero mayor dependencia del entorno de ejecución.
      - label: Monolito hexagonal
        reason: Mantener el dominio y la aplicación independientes del framework y conectar HTTP, la persistencia y la IA mediante adaptadores.
        chosen: true
    consequence: >-
      La aplicación se ejecuta como un solo servicio y las reglas de ArchUnit impiden que el dominio dependa de Spring o de los adaptadores de persistencia.
    evidence:
      - label: Arquitectura del backend
        url: https://github.com/diegnghtmr/studydeck-backend/blob/master/README.md#architecture
      - label: Reglas de ArchUnit
        url: https://github.com/diegnghtmr/studydeck-backend/blob/master/app/src/test/java/com/studydeck/architecture/HexagonalArchitectureTest.java
  - question: ¿Cuándo debería generarse el cliente de la API para el navegador?
    options:
      - label: Generarlo en cada compilación
        reason: Generar el cliente a partir de la especificación cada vez, a cambio de necesitar el generador y Java durante la compilación.
      - label: Versionar el cliente generado
        reason: Generar un cliente Axios en TypeScript a partir de una copia de OpenAPI y guardar el código en el repositorio de la aplicación.
        chosen: true
    consequence: >-
      El frontend puede compilarse sin Java ni un paso de generación, pero al cambiar el contrato hay que actualizar la copia y regenerar el cliente.
    evidence:
      - label: Flujo de generación del cliente
        url: https://github.com/diegnghtmr/studydeck-frontend/blob/main/README.md#openapi-client-generation
      - label: Integración continua del frontend
        url: https://github.com/diegnghtmr/studydeck-frontend/blob/main/.github/workflows/ci.yml
  - question: ¿Cuándo debería incorporarse a un mazo una tarjeta generada por IA?
    options:
      - label: Guardarla en cuanto se genere
        reason: Evitar un paso de revisión, pero guardar los borradores antes de que la persona pueda comprobarlos.
      - label: Validar y presentar borradores editables
        reason: Comprobar el JSON generado con el esquema de importación y permitir que la persona seleccione o edite las tarjetas antes de importarlas.
        chosen: true
    consequence: >-
      La generación no escribe en ningún mazo; el navegador solo valida, muestra la vista previa e importa las tarjetas después de la aprobación.
    evidence:
      - label: Servicio de generación
        url: https://github.com/diegnghtmr/studydeck-backend/blob/master/app/src/main/java/com/studydeck/application/service/GenerateFlashcardsService.java
      - label: Flujo de propuesta y aprobación
        url: https://github.com/diegnghtmr/studydeck-frontend/blob/main/src/features/ai/AiGeneratePage.tsx
results:
  - label: Repaso local en el navegador
    detail: Se reveló y valoró una tarjeta con la API en ejecución; la respuesta incluyó su próxima fecha de repaso y se mostró la siguiente tarjeta.
  - label: Indexación local de documentos
    detail: Cinco documentos de ejemplo completaron la indexación y la API devolvió fragmentos de texto de cada uno.
  - label: Pruebas del backend
    detail: Pasaron 451 pruebas seleccionadas de dominio, aplicación y arquitectura, incluidas las reglas de ArchUnit.
  - label: Pruebas del frontend
    detail: Pasaron 515 pruebas de Vitest y dos pruebas básicas de Playwright. También pasaron el análisis estático y la compilación de producción.
limitations:
  - La copia de OpenAPI del cliente no incluye todos los endpoints del backend; el panel consulta las estadísticas directamente con Axios.
  - Tras indexar, el backend devolvió COMPLETED, pero el navegador mostró Registered porque espera los estados en minúsculas.
  - La generación de tarjetas y las respuestas del chat requieren configurar un modelo conversacional; no se probaron con un proveedor activo.
architecture:
  system: StudyDeck AI
  caption: >-
    El cliente web se genera a partir del contrato OpenAPI del backend.
  nodes:
    - id: frontend
      kind: container
      label: Aplicación web
      name: studydeck-frontend
      repo: studydeck-frontend
      tech: React 19 / TypeScript
      does: Ofrece la interfaz de estudio y repaso
      col: 0
      row: 0
    - id: backend
      kind: container
      label: Servicio de API
      name: studydeck-backend
      repo: studydeck-backend
      tech: Java 25 / Spring Boot
      does: Define OpenAPI y las reglas de repaso
      col: 1
      row: 0
    - id: postgres
      kind: store
      label: Almacén de datos
      name: PostgreSQL
      tech: pgvector
      does: Guarda el historial de repaso y los vectores
      col: 2
      row: 0
    - id: chat-model
      kind: external
      label: Dependencia externa
      name: Configured chat model
      does: Responde con el contexto recuperado
      col: 2
      row: 1
    - id: identity
      kind: external
      label: Proveedor de identidad
      name: Configured identity provider
      tech: OpenID Connect / Keycloak
      does: Autentica a estudiantes y gestiona sesiones
      col: 2
      row: 2
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Llama mediante Axios
      evidence: https://github.com/diegnghtmr/studydeck-frontend/blob/main/src/shared/api/client.ts
    - from: backend
      to: postgres
      protocol: SQL
      verb: Lee y escribe datos
      evidence: https://github.com/diegnghtmr/studydeck-backend/blob/master/app/src/main/resources/application.yml
    - from: backend
      to: chat-model
      verb: Envía contexto recuperado
      evidence: https://github.com/diegnghtmr/studydeck-backend/blob/master/app/src/main/java/com/studydeck/infrastructure/adapter/out/ai/SpringAiChatAdapter.java
    - from: frontend
      to: identity
      protocol: OIDC
      verb: Autentica a estudiantes
      evidence: https://github.com/diegnghtmr/studydeck-frontend/blob/main/src/shared/auth/OidcProvider.tsx
    - from: backend
      to: identity
      protocol: HTTP/JSON
      verb: Gestiona sesiones Keycloak
      evidence: https://github.com/diegnghtmr/studydeck-backend/blob/master/app/src/main/java/com/studydeck/infrastructure/adapter/out/idp/KeycloakAdminAdapter.java
---

## Problema

Al estudiar, es común guardar el material de consulta en un lugar y las tarjetas en otro. Prepararse para un examen o una práctica de campo implica sacar preguntas de los apuntes, convertirlas en tarjetas y decidir cuáles conviene volver a repasar. A medida que crecen los mazos, revisarlos siempre en orden deja menos tiempo para los temas que todavía requieren práctica.

StudyDeck reúne esos pasos. Cada persona puede organizar tarjetas por tema, ver cuáles toca repasar y valorar cuánto recordó después de revelar cada respuesta. Si usa un modelo para convertir texto en borradores de tarjetas, puede decidir cuáles quiere incorporar a un mazo.

## Cómo funciona

La aplicación web se comunica con el backend por HTTP. El repositorio del backend define el contrato en `openapi.yaml`; el frontend mantiene una copia y la usa para generar un cliente Axios tipado para mazos, notas, sesiones de repaso, documentos y funciones de IA. El cliente toma la URL base de `VITE_API_URL`.

En el backend, los controladores HTTP llaman a los casos de uso mediante puertos de entrada. Cada nota da lugar a una o varias tarjetas y la sesión recupera aquellas que toca repasar. Al valorar una tarjeta, el servicio calcula su próximo intervalo y guarda el nuevo estado y el registro del repaso en PostgreSQL. La planificación no depende de las funciones asistidas por modelos.

El sistema divide los documentos en fragmentos y guarda sus representaciones vectoriales en pgvector mediante un modelo local. El chat con recuperación de información busca fragmentos relevantes antes de enviar el contexto al modelo conversacional configurado. La generación de tarjetas sigue otra ruta: el backend valida la salida del modelo con el esquema de importación y devuelve borradores para revisión.
