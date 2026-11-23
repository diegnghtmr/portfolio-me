---
project: profundiza-uq
summary: >-
  Profundiza UQ permite a estudiantes de la Universidad del Quindío solicitar electivas profesionales y a la coordinación revisar las solicitudes por grupo.
role: Único desarrollador
timeframe: "2026"
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/login.png
      alt: Formulario de acceso con un correo institucional ficticio y un botón para enviar el código.
      caption: Estudiantes y personal de coordinación ingresan con un código de un solo uso que reciben por correo. Las capturas usan cuentas ficticias.
    - src: ./shots/offerings-plan.png
      alt: Grupo diurno de Cloud Computing con horario, cupos disponibles, enlace a prerrequisitos y botón para enviar el plan.
      caption: Una estudiante añade Cloud Computing a su plan antes de que cierre el periodo de inscripción.
    - src: ./shots/my-requests.png
      alt: Cuatro solicitudes con orden de llegada, dos aceptadas, una por revisar y otra en lista de espera del turno contrario.
      caption: Mis solicitudes muestra el resultado de cada grupo, no solo si se envió el plan.
    - src: ./shots/review-queue.png
      alt: Cola de revisión de Machine Learning con el cupo total, una solicitud directa y dos listas de espera separadas por turno.
      caption: La coordinación revisa un grupo a la vez y da prioridad a las solicitudes del mismo turno.
decisions:
  - question: ¿Cómo debe asignar la API el último cupo para revisión directa?
    options:
      - label: Consultar el cupo e insertar sin bloqueo
        reason: Las solicitudes no esperan a que se libere un bloqueo explícito, pero dos pueden leer el mismo cupo libre antes de que alguna se registre.
      - label: Bloquear el grupo antes de contar los cupos
        reason: PostgreSQL hace que las solicitudes del grupo esperen a que termine la transacción que tiene el bloqueo.
        chosen: true
    consequence: La siguiente solicitud tiene en cuenta los cupos ya reservados para revisión. La base de datos asigna el número de llegada al registrar la solicitud.
    evidence:
      - label: Transacción de envío
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit.go
      - label: Prueba de concurrencia con un solo cupo
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit_integration_test.go
  - question: ¿Dónde debe guardar el cliente web la identidad y el borrador del plan?
    options:
      - label: Guardar ambos en Zustand
        reason: Las pantallas consultan un solo almacén, pero copiar allí el usuario actual añade otro lugar que actualizar o limpiar cuando cambia la sesión.
      - label: Separar la caché del servidor del borrador
        reason: TanStack Query conserva la identidad devuelta por /me; Zustand guarda el semestre seleccionado y los identificadores de los grupos del borrador.
        chosen: true
    consequence: Las pantallas consultan la identidad en la misma caché y los cambios del borrador no alteran los datos del servidor hasta que se envía el plan.
    evidence:
      - label: Convenciones de estado del cliente
        url: https://github.com/diegnghtmr/profundiza-uq-frontend/blob/main/README.md#conventions
      - label: Almacén del borrador
        url: https://github.com/diegnghtmr/profundiza-uq-frontend/blob/main/src/shared/stores/uiStore.ts
  - question: ¿Cuándo debe enviar el backend las notificaciones de inscripción?
    options:
      - label: Enviar el correo al procesar la solicitud
        reason: No hace falta un proceso en segundo plano, pero la espera del servidor SMTP se suma al tiempo de respuesta y revertir la transacción no deshace el envío.
      - label: Guardar la notificación en una cola transaccional
        reason: La notificación se guarda junto con la solicitud y un proceso en segundo plano se encarga del correo fuera de la transacción.
        chosen: true
    consequence: Un servidor de correo lento no demora la respuesta al enviar el plan. El correo puede llegar más tarde y los fallos transitorios se reintentan hasta un límite.
    evidence:
      - label: Escritura conjunta de solicitud y notificación
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit.go
      - label: Proceso de envío y política de reintentos
        url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/notification/worker.go
results:
  - label: Solicitudes simultáneas en PostgreSQL
    detail: De 25 solicitudes simultáneas del mismo turno para un cupo, una obtuvo revisión directa y las otras 24 quedaron en lista de espera del mismo turno. Los 25 números de llegada fueron distintos.
    url: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit_integration_test.go
  - label: Pruebas del backend
    detail: Pasaron 110 pruebas de Go en local, sin contar las subpruebas, incluidas las de integración con una base de datos PostgreSQL desechable.
  - label: Pruebas del frontend
    detail: Pasaron 187 pruebas de Vitest en local, incluidas las de acceso, oferta de electivas, solicitudes del estudiante y cola de revisión.
limitations:
  - El endpoint de importación masiva de estudiantes acepta JSON, no archivos enviados como multipart.
architecture:
  system: Profundiza UQ
  caption: >-
    La transacción de inscripción deja la notificación en cola y una tarea dentro de la API la envía después de la confirmación.
  nodes:
    - id: frontend
      kind: container
      label: Aplicación web
      name: profundiza-uq-frontend
      repo: profundiza-uq-frontend
      tech: React 19 / TypeScript
      does: Muestra electivas y la cola de revisión
      col: 0
      row: 0
    - id: backend
      kind: container
      label: Servicio de API
      name: profundiza-uq-backend
      repo: profundiza-uq-backend
      tech: Go / chi
      does: Asigna cupos y encola notificaciones
      col: 1
      row: 0
    - id: postgres
      kind: store
      label: Almacén de datos
      name: PostgreSQL
      tech: pgx
      does: Guarda sesiones, solicitudes y notificaciones
      col: 2
      row: 0
    - id: report-files
      kind: store
      label: Almacén de archivos
      name: Report exports
      tech: XLSX
      does: Guarda hojas de cálculo para su descarga
      col: 2
      row: 1
    - id: mail-server
      kind: external
      label: Servidor de correo
      name: Configured SMTP relay
      tech: SMTP
      does: Retransmite códigos y avisos de estado
      col: 2
      row: 2
  edges:
    - from: frontend
      to: backend
      protocol: HTTP/JSON
      verb: Envía peticiones a la API
      evidence: https://github.com/diegnghtmr/profundiza-uq-frontend/blob/main/src/shared/api/client.ts
    - from: backend
      to: postgres
      protocol: SQL
      verb: Guarda solicitud y aviso
      evidence: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/enrollment/adapter/postgres/submit.go
    - from: backend
      to: report-files
      protocol: Files
      verb: Escribe hojas de cálculo
      evidence: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/internal/reporting/adapter/file/generator.go
    - from: backend
      to: mail-server
      protocol: SMTP
      verb: Envía correos
      evidence: https://github.com/diegnghtmr/profundiza-uq-backend/blob/main/cmd/api/main.go
---

## Problema

En Ingeniería de Sistemas de la Universidad del Quindío hay un periodo de inscripción para solicitar electivas profesionales. Antes de enviar el plan, los estudiantes necesitan comparar grupos por horario, turno, prerrequisitos y cupos disponibles. Enviar la solicitud no equivale a obtener un cupo: es necesario saber si la coordinación la va a revisar o si queda en lista de espera.

La coordinación revisa las solicitudes por grupo. Las del mismo turno tienen prioridad y cada grupo tiene un cupo fijo, salvo ajuste de la coordinación. Si varios estudiantes envían su plan al mismo tiempo, el sistema debe asignar un orden de llegada sin reservar dos veces el mismo cupo para revisión directa.

## Cómo funciona

El cliente web envía peticiones JSON a la API de Go bajo `/api/v1`. Vite reenvía `/api` durante el desarrollo y nginx hace lo mismo en la imagen de producción. Así, el navegador usa un solo origen y puede mantener la sesión mediante una cookie. El acceso comienza con un código por correo. La respuesta de `/me` determina qué navegación se muestra, y la API comprueba el rol en las rutas de coordinación.

Los estudiantes consultan la oferta y preparan un borrador. Al enviarlo, pueden solicitar hasta cuatro grupos en un solo lote. Para cada solicitud nueva, el backend comprueba el periodo de inscripción y el límite por estudiante para el semestre. En PostgreSQL bloquea el grupo antes de consultar la ocupación y clasifica la solicitud según los cupos y el turno. Las solicitudes del mismo turno pasan a revisión directa mientras haya cupo; las del turno contrario van a su propia lista de espera, incluso si hay cupo.

La coordinación consulta las solicitudes abiertas por prioridad y orden de llegada. Registra cada decisión con un motivo y el estudiante ve el nuevo estado en Mis solicitudes. Al guardar una solicitud, la misma transacción registra un evento de auditoría y deja una notificación en cola. El envío por correo ocurre en segundo plano después de confirmar la transacción.
