---
project: savia
summary: Savia es una aplicación de finanzas personales en desarrollo para gestionar cuentas, gastos y presupuestos en un solo espacio.
role: Desarrollador único
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: Compilación local del backend, verificación de OpenAPI y pruebas HTTP de cuentas y movimientos. Las pruebas usan sustitutos, no una base de datos en ejecución.
    source: run
    steps:
      - command: npx -y pnpm@11.28.13 build
        output: |-
          $ tsc -p tsconfig.build.json
          Exit 0: npx -y pnpm@11.28.13 build
      - command: npx -y pnpm@11.28.13 openapi:verify
        output: |-
          $ node scripts/verify-openapi.mjs
          OpenAPI authority verified.
      - command: ./node_modules/.bin/vitest run test/accounts.e2e-spec.ts test/transactions.e2e-spec.ts
        output: |-
          ✓ test/accounts.e2e-spec.ts (52 tests)
          ✓ test/transactions.e2e-spec.ts (62 tests)
          Test Files  2 passed (2)
          Tests  114 passed (114)
decisions:
  - question: ¿Desde dónde se debe enviar a la API la solicitud de configuración inicial?
    options:
      - label: Llamar a la API desde el navegador
        reason: Se evita el paso por el servidor web, pero el código del navegador tendría que manejar el token de acceso y conocer la dirección de la API.
      - label: Llamar a la API desde una acción de servidor de Next.js
        reason: El servidor puede leer la sesión de Supabase y adjuntar el token de acceso sin exponerlo al código JavaScript del navegador.
        chosen: true
    consequence: El formulario recibe un resultado tipado, no la respuesta HTTP original. La API sigue verificando el token antes de aceptar la solicitud.
    evidence:
      - label: Cliente de configuración del lado del servidor
        url: https://github.com/diegnghtmr/savia-web/blob/main/src/lib/onboarding-gateway.ts
      - label: Adaptador de cookies de sesión
        url: https://github.com/diegnghtmr/savia-web/blob/main/src/lib/session.ts
  - question: ¿Cómo se debe crear el primer espacio personal?
    options:
      - label: Guardar el perfil, el espacio y la membresía por separado
        reason: Cada escritura es independiente, pero una interrupción podría dejar un espacio sin propietario o un perfil sin espacio.
      - label: Crear los tres registros en una transacción de PostgreSQL
        reason: El servicio comprueba qué existe para la persona que inició sesión y crea juntos el perfil, el espacio personal y la membresía de propietario.
        chosen: true
    consequence: La API devuelve 201 al crear el espacio y 200 con los identificadores originales si se repite la misma configuración. Una configuración distinta para el mismo usuario devuelve 409.
    evidence:
      - label: Transacción y manejo de reintentos
        url: https://github.com/diegnghtmr/savia-backend/blob/main/src/identity/bootstrap.service.ts
      - label: Escrituras en PostgreSQL
        url: https://github.com/diegnghtmr/savia-backend/blob/main/src/identity/postgres-bootstrap.adapter.ts
      - label: Códigos de respuesta de la configuración inicial
        url: https://github.com/diegnghtmr/savia-backend/blob/main/src/identity/onboarding.controller.ts
results:
  - label: Compilación del backend
    detail: La compilación de TypeScript pasó en el contenedor con Node 24.18.0.
  - label: Contrato del backend
    detail: El verificador local confirmó que el documento OpenAPI incluido en el repositorio coincide con el manifiesto de implementación.
  - label: Rutas de cuentas y movimientos
    detail: Pasaron las 52 pruebas de cuentas y las 62 de movimientos. Se enviaron solicitudes directamente a Fastify con sustitutos para la autenticación y el almacenamiento.
limitations:
  - No se ejecutó un flujo financiero autenticado contra una base de datos PostgreSQL en funcionamiento. El verificador de OpenAPI no comprueba la fuente original de planificación.
  - En la suite completa pasaron 3101 pruebas, fallaron 3 y se omitió 1. Dos pruebas de OCR necesitan Tesseract, que no está instalado en la imagen ligera. Una prueba de recurrencia mensual usa el reloj del sistema, pero espera una fecha fija.
  - La app móvil no carga datos financieros ni permite registrar movimientos. El servidor MCP local inicia el protocolo y responde a ping, pero no expone herramientas ni se conecta con la API.
architecture:
  system: Savia
  caption: La configuración inicial llama a la API desde el servidor web; la aplicación móvil y MCP funcionan por separado.
  nodes:
    - id: web
      kind: container
      label: Aplicación web
      name: savia-web
      repo: savia-web
      tech: Next.js / TypeScript
      does: Gestiona el acceso y el alta del espacio
      col: 0
      row: 0
    - id: mobile
      kind: container
      label: Aplicación móvil
      name: savia-mobile
      repo: savia-mobile
      tech: Expo / React Native
      does: Muestra una interfaz móvil independiente
      col: 0
      row: 1
    - id: mcp
      kind: container
      label: Servidor MCP
      name: savia-mcp
      repo: savia-mcp
      tech: Node.js / TypeScript
      does: Responde a inicio y ping por E/S estándar
      col: 0
      row: 2
    - id: backend
      kind: container
      label: API y proceso en segundo plano
      name: savia-backend
      repo: savia-backend
      tech: NestJS / Fastify
      does: Gestiona espacios y registros financieros
      col: 1
      row: 0
    - id: postgres
      kind: store
      label: Almacén de datos
      name: PostgreSQL
      tech: PostgreSQL / pgmq
      does: Guarda registros financieros y colas de tareas
      col: 2
      row: 0
    - id: files
      kind: store
      label: Almacenamiento de objetos
      name: Supabase Storage
      does: Guarda recibos, informes y exportaciones
      col: 2
      row: 1
    - id: auth
      kind: external
      label: Servicio de autenticación
      name: Supabase Auth
      does: Registra usuarios y emite tokens de acceso
      col: 1
      row: 3
    - id: jwt-keys
      kind: external
      label: Servidor de claves configurable
      name: JWKS
      does: Publica claves para verificar tokens
      col: 3
      row: 2
  edges:
    - from: web
      to: backend
      protocol: HTTP/JSON
      verb: Envía el alta del espacio
      evidence: https://github.com/diegnghtmr/savia-web/blob/main/src/lib/onboarding-gateway.ts
    - from: web
      to: auth
      protocol: HTTP/JSON
      verb: Registra e inicia sesión
      evidence: https://github.com/diegnghtmr/savia-web/blob/main/src/lib/auth-gateway.ts
    - from: backend
      to: postgres
      protocol: SQL
      verb: Lee y guarda registros
      evidence: https://github.com/diegnghtmr/savia-backend/blob/main/src/platform/postgres-pool.ts
    - from: backend
      to: files
      protocol: HTTP
      verb: Sube y descarga archivos
      evidence: https://github.com/diegnghtmr/savia-backend/blob/main/src/platform/supabase-storage.adapter.ts
    - from: backend
      to: jwt-keys
      protocol: HTTPS/JWKS
      verb: Consulta claves de firma
      evidence: https://github.com/diegnghtmr/savia-backend/blob/main/src/platform/jose-jwt-verifier.ts
---

## Problema

Quienes llevan sus finanzas personales necesitan saber a qué cuenta pertenece un movimiento, en qué moneda se hizo y cómo afecta el dinero disponible para el resto del mes. Una transferencia entre cuentas no equivale a un ingreso ni a un gasto. Savia se está desarrollando a partir de esas diferencias, con cuentas, movimientos y presupuestos organizados dentro de un espacio de trabajo.

Configurar ese espacio es una tarea aparte. La persona elige una moneda base y preferencias como el formato de fechas y números. Si se repite la primera solicitud porque no llegó la respuesta, el sistema debe devolver el espacio que ya creó, en lugar de crear otro.

## Cómo funciona

El sitio en Next.js muestra un inicio público y formularios de registro e inicio de sesión. Su servidor usa Supabase Auth para gestionar la sesión y escribe las cookies de sesión con el atributo HTTP-only. La página para configurar el espacio exige una sesión. Recoge el perfil, el nombre del espacio y las preferencias de visualización y los envía a una acción de servidor de Next.js. La acción llama a `POST /v1/onboarding` en la API de Fastify con el token de acceso de la sesión.

La API obtiene la identidad del usuario a partir del token. El servicio de configuración usa una sola transacción de PostgreSQL para consultar si el espacio ya existe y, en el primer uso, guardar el perfil, el espacio personal y la membresía de propietario. Si se repite la misma solicitud, devuelve los identificadores originales. La API también contiene código para cuentas, movimientos y presupuestos. Calcula la próxima fecha de las [reglas de recurrencia mensual](https://github.com/diegnghtmr/savia-backend/blob/main/test/recurring/recurring-command.spec.ts#L39). El inicio público no consulta esos datos financieros.

El repositorio de Expo contiene una interfaz móvil independiente. El de MCP ejecuta un proceso local separado que usa JSON-RPC por entrada y salida estándar, sin llamar a la API.
