---
project: resume-maker
summary: Flujo de LaTeX para publicar una hoja de vida en inglés y español con enlaces estables durante la búsqueda de empleo.
role: Único desarrollador
timeframe: "2026"
demo:
  url: https://diegnghtmr.github.io/resume-maker/
demonstration:
  kind: terminal
  terminal:
    caption: La compilación local genera la hoja de vida principal y el historial laboral con contenido ficticio. El segundo comando comprueba los enlaces del PDF principal. Se muestran extractos de la compilación.
    source: run
    steps:
      - command: latexmk -outdir=build/cv -auxdir=build/cv cv/main-en.tex cv/work-en.tex
        output: |-
          Output written on build/cv/main-en.pdf (1 page, 65713 bytes).
          Latexmk: All targets (build/cv/main-en.pdf) are up-to-date
          Output written on build/cv/work-en.pdf (1 page, 59422 bytes).
          Latexmk: All targets (build/cv/work-en.pdf) are up-to-date
      - command: pdfinfo -url build/cv/main-en.pdf
        output: |-
          Page  Type          URL
             1  Annotation    https://diegnghtmr.github.io/resume-maker/cv/education-en.pdf
             1  Annotation    https://diegnghtmr.github.io/resume-maker/cv/work-en.pdf
             1  Annotation    https://diegnghtmr.github.io/resume-maker/cv/certifications-en.pdf
decisions:
  - question: ¿Cómo actualizar un PDF detallado sin romper los enlaces de las copias ya enviadas?
    options:
      - label: Subir cada exportación a Google Drive
        reason: Funciona sin un flujo de despliegue, pero una carga nueva crea otro identificador de archivo y obliga a actualizar los enlaces de la hoja de vida principal.
      - label: Publicar en rutas fijas de GitHub Pages
        reason: Una compilación puede reemplazar un PDF en la misma ruta, y la hoja de vida principal toma cada dirección del archivo de enlaces compartido.
        chosen: true
    consequence: Quien tenga una copia anterior de la hoja de vida principal puede usar los mismos enlaces para abrir los PDF detallados vigentes. La cuenta de GitHub, el repositorio y los nombres de archivo forman parte de cada enlace.
    evidence:
      - label: Antes y después de migrar desde Drive
        url: https://github.com/diegnghtmr/resume-maker/blob/main/docs/system-design.md#6-the-stable-link-model-the-heart-of-the-fix
      - label: Definición de las URL publicadas
        url: https://github.com/diegnghtmr/resume-maker/blob/main/shared/links.tex
  - question: ¿Cuánto historial laboral conviene incluir en la hoja de vida principal?
    options:
      - label: Incluir el historial completo en ambos PDF
        reason: Una sola sección sería más fácil de actualizar, pero la hoja de vida principal tendría el mismo nivel de detalle que el documento de experiencia laboral.
      - label: Incluir una sección breve y enlazar la versión completa
        reason: La hoja de vida principal puede seleccionar entradas para una lectura rápida, mientras que el documento aparte incluye otras más.
        chosen: true
    consequence: El lector puede pasar de una sección breve al historial completo. Si un dato aparece en ambas versiones, puede hacer falta actualizarlo en ambos archivos fuente.
    evidence:
      - label: Composición de la hoja de vida principal
        url: https://github.com/diegnghtmr/resume-maker/blob/main/cv/main-en.tex
      - label: Composición del historial laboral detallado
        url: https://github.com/diegnghtmr/resume-maker/blob/main/cv/work-en.tex
  - question: ¿Debe una hoja de vida adaptada a una vacante publicarse por la misma vía que el conjunto oficial?
    options:
      - label: Publicar todo el árbol de compilación
        reason: Todos los PDF compilados quedarían disponibles, incluso las versiones para vacantes concretas que no estaban destinadas al índice público.
      - label: Compilar las variantes por separado y publicar desde una lista explícita
        reason: Las variantes tienen sus propios directorios de salida. El despliegue enumera los documentos que compila y empaqueta solo el directorio de salida del conjunto oficial.
        chosen: true
    consequence: Una hoja de vida adaptada puede conservar el mismo nombre local sin sobrescribir la versión oficial. Publicarla de forma deliberada requiere un nombre de salida distinto y un cambio en el flujo de trabajo.
    evidence:
      - label: Directorios de salida de la compilación local
        url: https://github.com/diegnghtmr/resume-maker/blob/main/scripts/build.sh
      - label: Lista de compilación y artefacto de Pages
        url: https://github.com/diegnghtmr/resume-maker/blob/main/.github/workflows/publish.yml
      - label: Reglas de publicación de variantes
        url: https://github.com/diegnghtmr/resume-maker/blob/main/applications/README.md#publishing-optional-off-by-default--read-the-hazard
results:
  - label: Compilación local con TeX Live
    detail: Los dos documentos en inglés se compilaron a partir de los archivos de composición del repositorio, con contenido ficticio. El PDF principal contenía tres enlaces hacia los PDF detallados publicados.
  - label: Rutas de los PDF publicados
    detail: El índice de Pages respondió con HTTP 200 y mostraba ocho PDF. Cada ruta enlazada respondió con HTTP 200 y application/pdf a una solicitud HEAD.
    url: https://diegnghtmr.github.io/resume-maker/
limitations:
  - El sitio de Pages es público. Excluir los PDF de las postulaciones del despliegue no oculta sus archivos fuente si se registran en el repositorio público.
architecture:
  system: resume-maker
  caption: Solo los PDF oficiales se publican en GitHub Pages; las versiones para postulaciones quedan fuera del despliegue.
  nodes:
    - id: pipeline
      kind: container
      label: Flujo de compilación
      name: resume-maker
      repo: resume-maker
      tech: LaTeX / GitHub Actions
      does: Genera y publica hojas de vida en dos idiomas
      col: 0
      row: 1
    - id: sources
      kind: store
      label: Archivos fuente
      name: LaTeX sources
      does: Contienen plantillas y secciones por idioma
      col: 1
      row: 0
    - id: pdfs
      kind: store
      label: Archivos generados
      name: PDF artifacts
      does: Separan los PDF oficiales de los adaptados
      col: 1
      row: 1
    - id: tex-live
      kind: external
      label: Herramienta local
      name: TeX Live
      tech: latexmk / pdfLaTeX
      does: Compila archivos LaTeX y genera PDF
      col: 2
      row: 2
    - id: pages
      kind: external
      label: Alojamiento estático
      name: GitHub Pages
      does: Sirve los PDF oficiales en URL estables
      col: 2
      row: 3
  edges:
    - from: pipeline
      to: sources
      protocol: Files
      verb: Lee fuentes de LaTeX
      evidence: https://github.com/diegnghtmr/resume-maker/blob/main/latexmkrc
    - from: pipeline
      to: pdfs
      protocol: PDF
      verb: Guarda los PDF generados
      evidence: https://github.com/diegnghtmr/resume-maker/blob/main/scripts/build.sh#L36-L44
    - from: pipeline
      to: tex-live
      protocol: Docker
      verb: Ejecuta latexmk en local
      evidence: https://github.com/diegnghtmr/resume-maker/blob/main/scripts/build.sh#L36-L44
    - from: pipeline
      to: pages
      protocol: Pages artifact
      verb: Publica los PDF oficiales
      evidence: https://github.com/diegnghtmr/resume-maker/blob/main/.github/workflows/publish.yml#L55-L84
---

## Problema

Quien comparte una hoja de vida en dos idiomas tiene varios documentos que mantener. El PDF principal debe ser breve, pero una persona encargada de la selección puede necesitar más detalles sobre la formación, la experiencia laboral o las certificaciones. Esos PDF adicionales pueden cambiar después de enviar la hoja de vida principal. Sus enlaces deben seguir funcionando sin tener que reenviar cada copia.

En el sistema anterior, volver a subir a Google Drive un PDF detallado generaba un identificador de archivo nuevo. Luego había que actualizar el enlace y exportar de nuevo el PDF principal. Las postulaciones planteaban otro problema: una versión adaptada a una vacante debía conservar lo que se había enviado sin reemplazar la hoja de vida general.

## Cómo funciona

Los archivos de `cv/` arman cada documento a partir de fragmentos de LaTeX separados por idioma. Todos usan la misma clase de `shared/`. Los PDF principales combinan secciones breves con enlaces a las versiones detalladas, que incorporan el fragmento completo de una sola sección. Un archivo compartido define las URL públicas, así que los documentos principales solo necesitan usar las macros de enlace correspondientes.

Para compilar en local, el script de shell ejecuta `latexmk` dentro de un contenedor de TeX Live. El archivo `latexmkrc` selecciona pdfLaTeX. La salida refleja el directorio de cada archivo de entrada: los documentos públicos van a `build/cv/` y las versiones adaptadas, a `build/applications/`. El texto adaptado se incorpora directamente en cada variante, de modo que los cambios posteriores en las secciones compartidas no reescriban una postulación archivada.

Con cambios en `main` o etiquetas de versión, GitHub Actions compila una lista explícita de ocho documentos. Los copia a `site/cv/`, incorpora la página de inicio y despliega el conjunto en GitHub Pages. Los nombres de archivo forman parte de las URL públicas. Una compilación nueva puede sustituir el PDF servido sin modificar su enlace.
