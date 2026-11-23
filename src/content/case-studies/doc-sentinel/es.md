---
project: doc-sentinel
summary: CLI local para detectar inyecciones de instrucciones y limpiar rastros antes de compartir documentos con un asistente de IA.
role: Desarrollador único
timeframe: "2026"
demonstration:
  kind: terminal
  terminal:
    caption: El análisis señala un carácter invisible en unas notas de campo ficticias. La limpieza escribe una copia y el segundo análisis no encuentra hallazgos en ella. Se muestran extractos de la salida.
    source: run
    steps:
      - command: .venv/bin/doc-sentinel detect portfolio-fixture/field-notes.txt --fail-on medium
        output: |-
          doc-sentinel detect: verdict=findings
          findings: medium=1
      - command: .venv/bin/doc-sentinel clean portfolio-fixture/field-notes.txt --output-dir portfolio-fixture/cleaned --report portfolio-fixture/clean-final.json
        output: |-
          doc-sentinel clean: verdict=cleaned
          findings: none
      - command: .venv/bin/doc-sentinel detect portfolio-fixture/cleaned/field-notes.cleaned.txt --fail-on medium
        output: |-
          doc-sentinel detect: verdict=clean
          findings: none
decisions:
  - question: ¿Qué puede cambiar la limpieza?
    options:
      - label: Reescribir el texto visible
        reason: La reescritura puede alterar patrones en la elección de palabras, pero cambia la redacción del autor.
      - label: Limitar los cambios a rastros deterministas
        reason: Se pueden inspeccionar rastros conocidos en caracteres y metadatos sin reescribir el texto.
        chosen: true
    consequence: La herramienta vuelve a inspeccionar una copia separada y deja intacto el original. No elimina marcas estadísticas de texto ni marcas inscritas en píxeles.
    evidence:
      - label: Principios de diseño
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/PLAN.md#1-objetivo-y-principios
      - label: Adaptador de limpieza
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/adapters/watermarks_remover.py
  - question: ¿Quién decide el veredicto de detección?
    options:
      - label: Pedirle al asistente que interprete la salida de cada herramienta
        reason: El asistente puede considerar el contexto, pero recibiría extractos no confiables y su criterio podría variar entre ejecuciones.
      - label: Aplicar reglas fijas a los hallazgos normalizados
        reason: Los mismos hallazgos y estados de las herramientas producen el mismo veredicto para un umbral dado.
        chosen: true
    consequence: Si falta una comprobación obligatoria, el resultado no puede ser limpio. El asistente puede leer el veredicto y los conteos sin recibir extractos del documento.
    evidence:
      - label: Reglas de agregación y gravedad
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/aggregate.py
      - label: Resumen para agentes
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/agent_summary.py
  - question: ¿Cómo se incorporan los cambios de las herramientas externas?
    options:
      - label: Fijar etiquetas de versiones publicadas
        reason: Las versiones ofrecen puntos de referencia con nombre, pero varias herramientas ya tenían cambios posteriores a su última etiqueta.
      - label: Fijar commits exactos y probar cada actualización
        reason: El commit fija la revisión y el corpus permite comprobar la candidata antes de cambiar el registro de versiones.
        chosen: true
    consequence: Una actualización puede revertir una revisión que falla sin deshacer otra que ya pasó las pruebas. El flujo programado informa de cambios en los repositorios de origen sin mover las referencias fijadas.
    evidence:
      - label: Política de versiones fijadas
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/PLAN.md#51-qué-se-pina
      - label: Actualización y reversión
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/src/doc_sentinel/update.py
      - label: Simulación programada
        url: https://github.com/diegnghtmr/doc-sentinel/blob/main/.github/workflows/update-dry-run.yml
results:
  - label: Análisis antes y después de limpiar texto plano
    detail: El original dio un hallazgo de gravedad media (código 1 con el umbral medio). La copia no dio hallazgos (código 0), y el SHA-256 del original no cambió.
  - label: Revisiones descargadas
    detail: El comando de versión confirmó que los siete submódulos descargados coincidían con los commits fijados.
limitations:
  - Las reglas de instrucciones incorporadas cubren inglés y español. Pueden omitir paráfrasis y señalar texto visible que solo discute las inyecciones.
  - En XLSX, PPTX, EPUB y ODT solo se comprueba el texto extraído, no el contenido oculto en la estructura del archivo.
  - Al sanear un PDF se reconstruye como DOCX. La disposición puede variar y las páginas escaneadas quedan como imágenes, sin una capa de texto de OCR.
---

## Problema

Un documento que parece normal en pantalla puede exponer otro texto a un modelo. La capa de texto de un PDF puede no coincidir con la página que se ve. Un DOCX puede incluir comentarios o cambios registrados que la persona que lo entrega nunca llega a ver. Para decidir si conviene compartir un archivo con un asistente, importa lo que el asistente podría leer, no solo lo que aparece en la página.

Limpiar un documento es otra tarea. Quien prepara el archivo puede querer quitar metadatos generados por herramientas o normalizar caracteres invisibles sin alterar la redacción ni sustituir el original.

## Cómo funciona

La CLI selecciona los adaptadores según el tipo de archivo. Los analizadores de documentos buscan texto oculto y diferencias entre la página renderizada y su capa de texto. El sistema extrae por separado los nombres de archivo, los metadatos, los comentarios, los enlaces y el texto alternativo. Las comprobaciones de estos canales también reciben el texto que revelan los analizadores de documentos.

Los detectores entregan hallazgos en un formato común. El agregador fusiona los equivalentes y aplica el umbral de gravedad solicitado para determinar el código de salida. Durante la detección, los procesos hijos se ejecutan sin red por defecto. Si no se puede establecer el aislamiento, esos pasos fallan en vez de ejecutarse con red. El informe completo puede incluir extractos; el resumen para agentes devuelve conteos y un veredicto sin citar el documento.

`clean` es una operación separada. Inspecciona el original, limpia una copia y vuelve a comprobar el resultado antes de escribirlo. Las herramientas externas son submódulos de Git con revisiones fijadas en un solo archivo. El comando de actualización comprueba un candidato a la vez con el corpus de pruebas antes de aceptar la nueva revisión.
