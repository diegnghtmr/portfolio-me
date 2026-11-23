---
project: vale
summary: >-
  Vale permite a estudiantes comparar grupos, armar un horario semanal sin cruces y exportarlo a su calendario personal.
role: Desarrollo individual
timeframe: "2025"
demo:
  url: https://vale-sage.vercel.app/
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/weekly-schedule.png
      alt: Calendario semanal con 12 sesiones de siete cursos, diferenciadas por color, y botones para exportar a iCal o CSV.
      caption: Siete cursos de un horario ficticio de informática, listo para exportar.
    - src: ./shots/event-details.png
      alt: Detalle de una sesión de Estructuras de Datos el lunes de 08:00 a 10:00, con el aula B-204, cuatro créditos y una nota de laboratorio.
      caption: Al seleccionar una sesión se ven el grupo, el aula y las notas sin salir del calendario.
    - src: ./shots/import-courses.png
      alt: Panel de importación con la muestra incluida de 2025 S2 seleccionada, una zona para cargar archivos JSON o CSV y dos grupos de la misma asignatura.
      caption: La muestra se carga en la lista de cursos. Una búsqueda por nombre muestra los dos grupos de Estructura de Datos.
decisions:
  - question: ¿Dónde se guardan los registros de los cursos?
    options:
      - label: Consultar una API HTTP
        reason: Un servidor permitiría compartir los registros entre dispositivos, pero requeriría un despliegue y una forma de asociarlos a cada estudiante.
      - label: Usar un adaptador de almacenamiento del navegador detrás de la interfaz de la API
        reason: Las lecturas y escrituras pasan por una misma interfaz sin requerir un servidor ni iniciar sesión.
        chosen: true
    consequence: Los registros importados se conservan al recargar en el mismo navegador, pero la aplicación no los sincroniza entre dispositivos.
    evidence:
      - label: Interfaz de la API y almacenamiento en el navegador
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/services/api.ts
  - question: ¿Qué pasa si el grupo se cruza con el horario?
    options:
      - label: Advertir, pero agregar el grupo
        reason: Se podrían comparar opciones superpuestas en la cuadrícula, pero esa misma selección también se podría exportar.
      - label: Comprobar el horario antes de agregar el grupo
        reason: Se comparan las franjas del mismo día y se avisa del primer cruce antes de modificar la selección.
        chosen: true
    consequence: El grupo que se cruza sigue disponible en la lista y no entra en el calendario. Se permiten sesiones consecutivas.
    evidence:
      - label: Validación de cruces y selección para el calendario
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/App.tsx
      - label: Comparación de franjas horarias
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/utils/schedule.ts
  - question: ¿El avance se registra por grupo o por asignatura?
    options:
      - label: Usar el identificador del grupo
        reason: Cada grupo puede tener su propio estado, pero al cambiar de grupo habría que volver a registrar la asignatura como completada.
      - label: Usar una clave derivada del nombre de la asignatura
        reason: La clave normaliza el uso de mayúsculas y tildes, sin tomar en cuenta el grupo ni el semestre.
        chosen: true
    consequence: Al marcar Cálculo I como completada, el estado se aplica a ambos grupos de la muestra y el panel cuenta una sola asignatura. Las asignaturas distintas que tienen el mismo nombre normalizado también comparten estado.
    evidence:
      - label: Normalización de la clave de asignatura
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/utils/subjectId.ts
      - label: Estado de avance compartido por los grupos
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/hooks/useCourses.ts
      - label: Conteo de asignaturas y créditos
        url: https://github.com/diegnghtmr/vale/blob/f90ef546f748c3341873938e89d08ecb5183ceca/src/components/Dashboard.tsx
results:
  - label: Pruebas con Jest
    detail: Pasaron las 22 pruebas locales de cruces, identificadores de asignaturas y cálculo de créditos.
  - label: Cruces y exportación del calendario
    detail: El navegador rechazó un grupo de Redes de Computadores que se cruzaba con el horario. Ambas descargas conservaron las 12 sesiones seleccionadas antes del intento.
  - label: Avance compartido entre grupos
    detail: Al marcar un grupo de Cálculo I como completado, ambos desaparecieron de la lista de grupos disponibles. El panel mostró cuatro de 11 asignaturas completadas en el conjunto de datos ficticio.
limitations:
  - La exportación del calendario abarca una sola semana y no genera eventos recurrentes para el semestre.
architecture:
  system: Vale
  caption: El navegador valida los archivos importados y genera las descargas del calendario sin un servidor de aplicación.
  nodes:
    - id: web
      kind: container
      label: Aplicación web
      name: vale
      repo: vale
      tech: React / TypeScript / FullCalendar
      does: Construye y exporta horarios semanales
      col: 0
      row: 0
    - id: browser-storage
      kind: store
      label: Almacenamiento del navegador
      name: localStorage
      does: Conserva cursos y preferencias tras recargar
      col: 1
      row: 0
    - id: bundled-periods
      kind: store
      label: Datos incluidos
      name: JSON
      does: Contiene periodos académicos incluidos
      col: 1
      row: 1
  edges:
    - from: web
      to: browser-storage
      protocol: Web Storage API
      verb: Lee y guarda cursos
      evidence: https://github.com/diegnghtmr/vale/blob/main/src/services/api.ts
    - from: web
      to: bundled-periods
      protocol: JSON
      verb: Carga periodos incluidos
      evidence: https://github.com/diegnghtmr/vale/blob/main/src/utils/loadAcademicPeriods.ts
---

## Problema

Al preparar el semestre, los estudiantes necesitan comparar grupos de una misma asignatura antes de elegir un horario. Un grupo puede tener clases en varios días, y un cambio para resolver un cruce del lunes puede provocar otro el miércoles. El listado de cursos permite consultar aulas, créditos y horas de clase, pero no muestra cómo encajan esas sesiones en la semana.

Vale separa los grupos disponibles de los que el estudiante quiere incluir en el calendario. Así puede comparar opciones antes de elegir un grupo y exportar el horario al calendario que ya utiliza. También puede registrar las asignaturas completadas sin contar dos veces los grupos alternativos.

## Cómo funciona

La aplicación de React se ejecuta en el navegador. El estudiante puede registrar un grupo, importar un archivo JSON o CSV, o seleccionar un periodo académico incluido. La aplicación valida el archivo antes de reemplazar la lista de cursos. Al cargar un periodo, convierte los nombres en español de los días y las jornadas al formato de los grupos ingresados a mano. Una API simulada lee y guarda los registros de cursos en `localStorage` en lugar de usar HTTP.

La lista se puede filtrar por nombre, semestre, jornada y créditos. Al agregar un grupo al horario, la aplicación compara cada sesión con las ya seleccionadas. Busca cruces entre sesiones del mismo día y, si encuentra uno, muestra los nombres de ambos cursos y sus franjas horarias. FullCalendar muestra las sesiones elegidas en una cuadrícula semanal. Al seleccionar una sesión se ven el aula y los créditos, y los botones de exportación generan archivos iCalendar y CSV en el navegador.

Cada grupo tiene su propio identificador, pero el avance se registra con una clave derivada del nombre de la asignatura. Al importar otra lista, la aplicación usa esa clave para recuperar el estado de las asignaturas que coinciden. El panel agrupa los registros por la misma clave antes de contar asignaturas y créditos.
