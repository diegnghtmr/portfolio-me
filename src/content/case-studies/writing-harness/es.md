---
project: writing-harness
summary: Guías de redacción en español y un verificador de línea de comandos para asistentes de IA que escriben o revisan textos.
role: Único desarrollador
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: El verificador señala errores de puntuación, el enrutador elige un tono y las pruebas confirman la correspondencia entre reglas y guías. Se muestran extractos de la salida.
    source: run
    steps:
      - command: node src/cli.ts evals/fixtures/sucio.txt
        output: |-
          evals/fixtures/sucio.txt:1:29  error  no-raya  [spanish-writing §6.6]
              La raya y el guion largo están prohibidos en todo tono y todo género.
              > La teoría del valor trabajo —formulada por Ricardo y reelaborada por Marx—
          …
          evals/fixtures/sucio.txt:7:21  error  punto-y-coma-espaciado  [spanish-writing §6.7]
              Espaciado incorrecto del punto y coma.
              > La distinción cuesta ; Es el punto difícil. El trabajo concreto da valor de uso.
          …
          4 error(es), 0 advertencia(s)
      - command: node src/cli.ts --enrutar comunidadAfectada
        output: |-
          schiavenato-writing
            Texto que le explica a una comunidad algo que la afecta, con un autor que firma lo que afirma.
            Paso 11 de 13 de la lista de redactar-espanol.
      - command: node --test evals/correspondencia.test.ts
        output: |-
          ℹ tests 15
          ℹ suites 4
          ℹ pass 15
          ℹ fail 0
decisions:
  - question: ¿Qué pasa cuando la base, el tono y una revisión solicitada discrepan?
    options:
      - label: Repetir la base en cada guía de tono
        reason: Cada guía se puede leer sola, pero las copias pueden discrepar sobre una misma regla.
      - label: Definir qué capa tiene prioridad
        reason: La base siempre rige y una revisión solicitada solo sustituye las reglas de tono que le corresponden.
        chosen: true
    consequence: La pasada de humanización sustituye las reglas de ritmo de las oraciones, pero conserva la base, los límites de longitud de párrafo y la persona gramatical del tono.
    evidence:
      - label: Regla de precedencia en el README
        url: https://github.com/diegnghtmr/writing-harness/blob/main/README.md#regla-de-precedencia
      - label: Composición de las reglas
        url: https://github.com/diegnghtmr/writing-harness/blob/main/src/check.ts
  - question: ¿Cómo se elige un tono si la petición no lo nombra?
    options:
      - label: Medir un borrador contra cada tono
        reason: El verificador puede medir el ajuste, pero habría que redactar el texto antes de decidir su tono.
      - label: Elegir según los rasgos de la petición
        reason: Una tabla ordenada permite decidir antes de redactar, a partir de los rasgos que recibe.
        chosen: true
    consequence: Se toma la primera coincidencia y el comando indica el tono, el motivo y su posición en la lista. El último paso cubre las peticiones que no encajan en los anteriores.
    evidence:
      - label: Tabla de enrutamiento y alternativa descartada
        url: https://github.com/diegnghtmr/writing-harness/blob/main/src/enrutamiento.ts
      - label: Selección del tono en la guía de entrada
        url: https://github.com/diegnghtmr/writing-harness/blob/main/skills/redactar-espanol/SKILL.md#2-el-tono-al-redactar
  - question: ¿Cómo se mantienen alineadas las guías y las reglas ejecutables?
    options:
      - label: Confiar en la revisión manual
        reason: Se puede editar la prosa o el código por separado, pero una regla ausente puede pasar inadvertida.
      - label: Comprobar la correspondencia en ambos sentidos
        reason: Cada regla cita su punto de origen y las declaraciones sin regla se registran por separado.
        chosen: true
    consequence: Las pruebas fallan si una regla remite a un punto que ya no existe o si una nueva declaración no tiene regla ni entrada en el registro.
    evidence:
      - label: Pruebas de correspondencia
        url: https://github.com/diegnghtmr/writing-harness/blob/main/evals/correspondencia.test.ts
      - label: Flujo de GitHub Actions
        url: https://github.com/diegnghtmr/writing-harness/blob/main/.github/workflows/gate.yml
results:
  - label: Pruebas del núcleo
    detail: Pasaron 487 pruebas locales con Node 26 en 27 archivos, entre ellas las del verificador, el enrutamiento y la precedencia.
  - label: Registro de cobertura
    detail: Regenerarlo no produjo cambios en Git. De 302 declaraciones, 110 estaban vinculadas a reglas ejecutables y 192 figuraban como casos que exigen juicio.
    url: https://github.com/diegnghtmr/writing-harness/blob/main/evals/gen.ts
limitations:
  - El verificador no determina si una reescritura conservó todos los hechos del original.
  - El corpus original no se incluye y la búsqueda de frases literales cuenta de menos las expresiones partidas entre líneas de subtítulos.
---

## Problema

Un asistente de IA que escribe en español tiene que distinguir las reglas que rigen cualquier borrador de las decisiones sobre cómo debe sonar un texto en particular. Al corregir un texto ajeno conviene preservar su forma. Al redactar una explicación, en cambio, hay que decidir cómo dirigirse al lector y desarrollar el argumento.

El proyecto repetía las reglas de la base en cada guía de tono. Las copias discrepaban sobre la raya: una guía la prohibía, otra la permitía y una tercera la marcaba como señal de escritura con IA. Alinear las instrucciones era solo parte del trabajo. El asistente también necesitaba localizar los incumplimientos en el texto antes de entregarlo.

## Cómo funciona

La guía `redactar-espanol` decide si se corrige un texto existente o se redacta con un tono. `spanish-writing` se aplica en ambos casos. Al redactar, el usuario puede indicar el tono. Si no lo indica, se toma la primera ruta que corresponde a los rasgos de la petición. La última sirve de opción general. El comando de enrutamiento no lee un borrador.

El verificador recibe texto UTF-8 desde archivos o desde la entrada estándar. Carga sus reglas de `src/rules.ts`: la base se aplica siempre y el tono añade sus comprobaciones. Si se pide humanizar, la pasada añade sus propias comprobaciones en lugar de las reglas de ritmo de oración del tono. Cada hallazgo indica línea, columna, regla de origen y corrección sugerida. Un error da un código de salida 1. Las advertencias solo se pueden dejar en la entrega si se explica por qué el contexto las justifica.

Las guías y el verificador funcionan por separado. Las pruebas los vinculan al cotejar las referencias de las reglas con las declaraciones numeradas de las guías y sus archivos de referencia. Un registro recoge las declaraciones sin regla ejecutable, incluidas las que requieren el juicio de quien lee.
