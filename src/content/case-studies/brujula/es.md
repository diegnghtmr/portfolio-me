---
project: brujula
summary: Planeación académica para estudiantes de la Universidad del Quindío, desde consultar prerrequisitos hasta simular un horario semanal.
role: Desarrollo del frontend y trabajo en el backend de currículo y avance académico
timeframe: '2026'
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/catalog.png
      alt: Catálogo con Ingeniería de Sistemas y Computación y Licenciatura en Lenguas Modernas, ambos programas activos.
      caption: El punto de partida es el catálogo de programas. El aviso aclara que la herramienta no reemplaza los registros de la universidad.
    - src: ./shots/curriculum.png
      alt: Malla de la jornada diurna organizada por semestres, con Programación I abierta para mostrar el prerrequisito de Lógica de Programación.
      caption: La malla muestra el orden recomendado y permite abrir una materia para consultar sus requisitos.
    - src: ./shots/progress-declaration.png
      alt: Lista de materias del primer semestre con un formulario que muestra una nota aprobatoria ficticia de 4.4 para el período 2026-1.
      caption: El estudiante declara cada intento con el resultado, la nota y el período académico.
    - src: ./shots/simulation-schedule.png
      alt: Horario semanal con cuatro materias diferenciadas por color y un resumen de 13 de 23 créditos y 16 horas semanales.
      caption: La simulación de segundo semestre combina horarios de la oferta incluida en el proyecto con un historial académico ficticio.
decisions:
  - question: ¿Conviene desplegar el backend como microservicios o como un solo proceso?
    options:
      - label: Microservicios
        reason: Cada servicio podría desplegarse y escalar por separado, pero el equipo todavía definía los límites de los módulos y no necesitaba escalarlos de forma independiente.
      - label: Monolito modular
        reason: Spring Modulith permite separar los módulos sin introducir llamadas de red entre servicios.
        chosen: true
    consequence: Los módulos se comunican dentro de un solo proceso y comparten la JVM y el ciclo de despliegue.
    evidence:
      - label: ADR-001 — Monolito modular en lugar de microservicios
        url: https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-001-modular-monolith-vs-microservices.md
  - question: ¿Cómo deben compartir el contrato de la API el backend y el frontend?
    options:
      - label: Integración mantenida a mano
        reason: Cada lado implementa lo acordado por separado, por lo que el formato de las solicitudes y las respuestas puede dejar de coincidir.
      - label: Solo validación del contrato y generación de modelos
        reason: La validación comprueba el esquema, pero las rutas y llamadas escritas a mano aún pueden apartarse de él.
      - label: OpenAPI con generación del servidor y el cliente
        reason: El contrato del backend define las interfaces y los modelos de Spring; una copia versionada genera el cliente Axios del frontend.
        chosen: true
    consequence: Ambos proyectos compilan con tipos generados. Si cambia el contrato, aún hay que sincronizar la copia del frontend y regenerar el cliente.
    evidence:
      - label: ADR-006 — El contrato OpenAPI como punto de partida
        url: https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-006-openapi-contract-first-axios.md
      - label: Copia de OpenAPI en el frontend
        url: https://github.com/diegnghtmr/brujula-frontend/blob/main/openapi/brujula-api.v1.yaml
  - question: ¿El personal debe poder consultar las notas que declara cada estudiante?
    options:
      - label: Acceso a notas individuales
        reason: Facilitaría la atención de casos concretos, pero daría al personal acceso a datos sensibles.
      - label: Solo datos agregados
        reason: Las notas y los intentos quedan reservados al estudiante; los informes del personal se limitan a datos agregados.
        chosen: true
    consequence: El personal no puede inspeccionar un historial individual para resolver un problema. Para hacerlo haría falta un mecanismo que permita al estudiante conceder acceso.
    evidence:
      - label: ADR-012 — Sin acceso del personal a notas individuales
        url: https://github.com/diegnghtmr/brujula-backend/blob/main/docs/architecture/adr/ADR-012-staff-no-individual-grades-mvp.md
results:
  - label: Verificación local en el navegador y la API
    detail: Se inició sesión con Keycloak, se consultaron el catálogo y la malla, se guardó una nota ficticia y se verificaron ocho sesiones de cuatro materias sin cruces de horario.
  - label: Verificaciones del backend
    detail: Pasaron 304 pruebas seleccionadas en Gradle, entre ellas las de límites entre módulos, avance académico, prerrequisitos y cruces de horario.
    url: https://github.com/diegnghtmr/brujula-backend/blob/main/src/test/java/co/edu/uniquindio/brujula/ModularityTest.java
  - label: Verificaciones del frontend
    detail: Pasaron las 511 pruebas de Vitest, las reglas de lint y la comprobación de tipos en local.
limitations:
  - En un despliegue estático de producción, un proxy debe quitar el prefijo /api/v1 o el backend debe servir la API bajo esa ruta.
  - El endpoint de ofertas acepta el identificador de una materia, pero no filtra por él.
---

## Problema

Para planear el siguiente semestre, un estudiante necesita saber qué recomienda su plan de estudios, qué materias puede tomar según las que ya aprobó y qué grupos disponibles encajan en un mismo horario. La malla por sí sola no responde a las dos últimas preguntas. Una materia puede estar en el semestre recomendado, pero exigir otra que el estudiante aún no ha aprobado o tener grupos que se cruzan con otras clases.

Brújula reúne esas comprobaciones para estudiantes de la Universidad del Quindío. Cada estudiante registra su propio historial académico y lo usa para probar un horario antes de la matrícula. El plan resultante es de uso personal: no certifica notas ni inscribe al estudiante en las materias.

## Cómo funciona

La aplicación web envía solicitudes HTTP con un cliente Axios generado. Los dos repositorios se compilan a partir del mismo contrato OpenAPI: el backend mantiene la especificación y genera las interfaces y los modelos de Spring; el frontend genera su cliente a partir de una copia versionada. Tras el inicio de sesión con Keycloak, Spring conserva el token de identidad en el servidor y entrega al navegador una cookie de sesión. En local, Vite elimina el prefijo `/api/v1` al reenviar las solicitudes a Spring.

En el backend, el catálogo y el currículo aportan los planes, la distribución recomendada por semestre y los prerrequisitos. El estudiante se suscribe a un plan con una jornada de referencia y registra sus intentos por período. El módulo de avance usa esos intentos para identificar las materias aprobadas y calcular créditos y promedios estimados. El simulador cruza el avance con la oferta del período elegido. Comprueba los prerrequisitos, los límites de créditos y los cruces de horario, y devuelve el horario semanal y el total de créditos de los grupos elegidos.
