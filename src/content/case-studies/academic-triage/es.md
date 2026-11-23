---
project: academic-triage
summary: >-
  En la Universidad del Quindío, el personal recibe solicitudes de estudiantes, las clasifica, prioriza y asigna, y les da seguimiento hasta el cierre.
role: Frontend y backend; 208 de 213 commits en un equipo de 3 personas
timeframe: "2026"
team: 3
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/classified-queue.png
      alt: Listado del personal filtrado por el estado Clasificada, con revisiones de nota, homologaciones y cambios de grupo.
      caption: El filtro por estado muestra solo las solicitudes clasificadas. Cada fila permite abrir el caso.
    - src: ./shots/staff-triage.png
      alt: Revisión de nota clasificada con dos eventos en el historial y una regla aplicable que recomienda prioridad media.
      caption: El registro y la clasificación aparecen en el historial. La regla recomienda prioridad media sin modificar la solicitud.
    - src: ./shots/operational-reports.png
      alt: Reporte de administración con un rango de fechas activo, total de solicitudes, tiempo medio de resolución y gráficas por estado y prioridad.
      caption: El rango de fechas permite revisar el volumen y la distribución de solicitudes en un periodo. Las cifras son del conjunto de datos de demostración local.
decisions:
  - question: ¿Dónde se debe hacer cumplir el flujo de las solicitudes?
    options:
      - label: Validar las transiciones en el navegador
        reason: El navegador puede responder de inmediato, pero sus reglas pueden quedar desfasadas respecto a la API y no cubren a otros clientes.
      - label: Validar las transiciones en el dominio Java
        reason: La API comprueba quién solicita la acción y si la transición está permitida. Angular muestra las acciones pertinentes según el rol y el estado.
        chosen: true
    consequence: Todos los clientes siguen las mismas transiciones. Una solicitud cerrada, cancelada o rechazada no puede volver al flujo.
    evidence:
      - label: Tabla de transiciones del dominio
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/domain/src/main/java/co/edu/uniquindio/triage/domain/service/StateTransitionValidator.java
      - label: Visibilidad de acciones en el frontend
        url: https://github.com/diegnghtmr/academic-triage-frontend/blob/main/src/app/features/requests/utils/request-action-visibility.ts
  - question: ¿Cómo se recomienda una prioridad cuando coinciden varias reglas?
    options:
      - label: Usar la primera regla que coincida
        reason: La evaluación puede terminar antes, pero la recomendación depende del orden en que lleguen las reglas.
      - label: Evaluar todas las coincidencias y tomar la prioridad más alta
        reason: El motor de reglas devuelve la prioridad más alta entre las coincidencias y la lista de reglas aplicables. Si no hay coincidencias, recomienda prioridad baja.
        chosen: true
    consequence: El personal puede revisar qué reglas se aplican antes de elegir una prioridad. Consultar la recomendación no la guarda en la solicitud.
    evidence:
      - label: Motor de prioridad del dominio
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/domain/src/main/java/co/edu/uniquindio/triage/domain/service/PriorityEngine.java
      - label: Caso de uso de recomendación de solo lectura
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/application/src/main/java/co/edu/uniquindio/triage/application/service/request/GetPrioritySuggestionService.java
  - question: ¿Qué debe pasar si dos personas actualizan el mismo caso a la vez?
    options:
      - label: Leer y guardar sin bloquear la fila
        reason: Las actualizaciones no esperan un bloqueo, pero ambas personas pueden actuar sobre el mismo estado inicial antes de que se guarde algún cambio.
      - label: Bloquear el caso mientras dura la transacción
        reason: El adaptador de persistencia adquiere un bloqueo de escritura antes de que el caso de uso lea y modifique la solicitud.
        chosen: true
    consequence: Una persona puede tener que esperar a que termine otra edición. La siguiente actualización comprueba la transición con el estado guardado, no con el anterior.
    evidence:
      - label: Transacción de actualización de solicitudes
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/infrastructure/src/main/java/co/edu/uniquindio/triage/infrastructure/config/RequestMutationTransactionalFacade.java
      - label: Bloqueo de escritura en el repositorio de solicitudes
        url: https://github.com/diegnghtmr/academic-triage-system/blob/main/infrastructure/src/main/java/co/edu/uniquindio/triage/infrastructure/adapter/out/persistence/repository/RequestJpaRepository.java
results:
  - label: Gestión local de una solicitud
    detail: Un estudiante envió una revisión de nota. El personal la clasificó, recibió una recomendación de prioridad media con la regla aplicable y encontró el caso en el listado de solicitudes clasificadas.
  - label: Reporte operativo local
    detail: Un administrador aplicó un rango de fechas y el reporte mostró las distribuciones por estado y prioridad con datos de MariaDB.
  - label: Pruebas unitarias del frontend
    detail: Las 718 pruebas de Vitest pasaron en local, en 39 archivos.
limitations:
  - La API exige If-Match para ciertas actualizaciones administrativas, pero la aplicación web no envía esa cabecera.
  - La lista de validación del formulario siguió mostrando avisos de campos obligatorios después de introducir una descripción válida. La solicitud sí se envió correctamente.
---

## Problema

Un estudiante de la Universidad del Quindío puede necesitar una revisión de nota, un cambio de grupo o autorización para inscribirse fuera de plazo. La mesa de ayuda necesita detalles suficientes para encaminar cada solicitud y decidir cuál atender primero. Un reclamo sobre una nota y un cambio de grupo con fecha límite pueden entrar en el mismo listado, pero quien los atiende necesita saber de qué tipo son, en qué estado están y si ya se asignaron a alguien.

Registrar únicamente el resultado final deja fuera las decisiones intermedias. El personal necesita saber quién clasificó un caso, por qué cambió de estado y qué ocurrió antes de cerrarlo. Quienes administran el servicio necesitan ver la carga de trabajo sin abrir cada caso para saber dónde se acumulan las solicitudes.

## Cómo funciona

El repositorio de Angular es el cliente web del repositorio de Spring Boot. Después del inicio de sesión, envía solicitudes JSON a `/api/v1` con un token de acceso. En desarrollo, el proxy de Angular reenvía las llamadas al backend local; en producción, la configuración apunta directamente a la API desplegada. El frontend elige qué acciones mostrar según el rol y el estado, mientras que el backend comprueba si la persona autenticada puede realizarlas.

La capa de aplicación coordina cada operación mediante puertos. En el dominio Java, una solicitud pasa por los estados registrada, clasificada, en progreso, atendida y cerrada. La cancelación y el rechazo tienen sus propias transiciones permitidas. Los cambios generan entradas en el historial para que otra persona pueda reconstruir lo ocurrido. La capa de infraestructura guarda la solicitud y su historial en MariaDB y bloquea la fila de la solicitud mientras aplica el cambio de estado.

El personal puede pedir una recomendación de prioridad basada en las reglas de negocio activas y ver cuáles coinciden antes de elegir una prioridad. Este paso no requiere el proveedor opcional de IA. Un administrador puede filtrar el reporte operativo por fechas, consultar el total y el tiempo promedio de resolución, y ver la distribución por estado, prioridad y tipo de solicitud.
