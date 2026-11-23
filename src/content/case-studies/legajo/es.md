---
project: legajo
summary: >-
  Un entorno para estudiantes que exploran métodos de similitud de texto y agrupamiento con resúmenes de investigación.
role: Desarrollador único
timeframe: "2026"
demo:
  url: https://legajo-frontend.vercel.app
  note: Si el servidor está inactivo, la primera solicitud puede tardar varias decenas de segundos.
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/corpus-selection.png
      alt: Lista de selección del corpus junto a una matriz de similitud MiniLM en escala de grises para doce resúmenes seleccionados
      caption: Selecciona documentos del corpus de referencia y compara todos los pares en una sola matriz.
    - src: ./shots/similarity-trace.png
      alt: Puntajes de los documentos d01 y d02 junto a una matriz de Needleman–Wunsch con el camino óptimo marcado en rojo
      caption: Abre la traza de Needleman–Wunsch para ver qué alineación produjo el puntaje.
    - src: ./shots/ward-dendrogram.png
      alt: Dendrogramas de enlace promedio y de Ward lado a lado, con una línea de corte discontinua y tres grupos de distinto color en el árbol de Ward
      caption: Corta el árbol de Ward en k = 3 sin perder de vista el árbol de enlace promedio.
    - src: ./shots/benchmark-curves.png
      alt: Gráficos log–log de tiempos de ejecución para algoritmos por pares y agrupamiento jerárquico, con tablas de pendientes empíricas y teóricas
      caption: Compara las curvas medidas por JMH con el crecimiento teórico en la ejecución de referencia.
decisions:
  - question: ¿Dónde deben implementarse los algoritmos?
    options:
      - label: Usar una biblioteca numérica para el análisis
        reason: Habría menos código de algoritmos que mantener, pero el acceso a los pasos intermedios y el desempate dependerían de la biblioteca.
      - label: Implementar el análisis en el dominio
        reason: El proyecto controla las trazas y las reglas de desempate, y delega en bibliotecas la lectura de PDF y la inferencia de los modelos.
        chosen: true
    consequence: La misma implementación del servidor produce los puntajes y sus trazas. Si dos distancias coinciden, el motor de agrupamiento sigue un orden fijo de fusión.
    evidence:
      - label: Convenciones del servidor
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/README.md#conventions
      - label: Motor de fusión compartido de Lance–Williams
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/domain/src/main/java/co/edu/uniquindio/legajo/clustering/LanceWilliamsEngine.java
  - question: ¿Cómo se mantiene la interfaz sincronizada con la API?
    options:
      - label: Mantener a mano los tipos de respuesta en TypeScript
        reason: No hay que generar código, pero cada cambio en el contrato se refleja a mano en dos lugares.
      - label: Generar los tipos a partir de OpenAPI
        reason: El servidor define el contrato YAML y la interfaz genera sus tipos a partir de una copia versionada.
        chosen: true
    consequence: La integración continua regenera los tipos y falla si el resultado difiere del archivo versionado. Actualizar la copia del contrato en la interfaz es un paso aparte.
    evidence:
      - label: Flujo del contrato en la interfaz
        url: https://github.com/diegnghtmr/legajo-frontend/blob/main/README.md#contract-workflow
      - label: Integración continua de la interfaz
        url: https://github.com/diegnghtmr/legajo-frontend/blob/main/.github/workflows/frontend.yml
  - question: ¿La demo debe solicitar embeddings en cada consulta o servir vectores precalculados?
    options:
      - label: Consultar la API de embeddings bajo demanda
        reason: El modelo remoto proporciona los vectores en cada solicitud, pero se necesita conexión de red y credenciales válidas.
      - label: Usar vectores precalculados por defecto
        reason: El corpus versionado ya tiene los vectores correspondientes de los modelos local y remoto, así que la demo funciona sin credenciales de la API.
        chosen: true
    consequence: Al iniciar, el servidor comprueba que el corpus y las cachés coincidan. Si cambia el corpus, hay que regenerar las cachés para servirlo en ese modo.
    evidence:
      - label: Configuración del servidor y flujo del corpus
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/README.md#environment-variables
      - label: Configuración de los adaptadores de embeddings
        url: https://github.com/diegnghtmr/legajo-backend/blob/main/bootstrap/src/main/java/co/edu/uniquindio/legajo/DomainConfiguration.java
results:
  - label: Pruebas del servidor
    detail: Las 1.141 pruebas pasaron en local, incluidas las reglas de arquitectura y la conformidad con OpenAPI.
    url: https://github.com/diegnghtmr/legajo-backend/blob/main/.github/workflows/backend.yml
  - label: Pruebas de la interfaz
    detail: Las 1.332 pruebas de Vitest pasaron en local con el informe de cobertura activado.
    url: https://github.com/diegnghtmr/legajo-frontend/blob/main/.github/workflows/frontend.yml
  - label: Verificación de extremo a extremo
    detail: Pasaron las 36 verificaciones de Playwright sin simular la API. Entre ellas, el cotejo de un puntaje con la respuesta del servidor y un corte de Ward que repartió los 20 documentos.
    url: https://github.com/diegnghtmr/legajo-frontend/tree/main/e2e-fullstack
limitations:
  - El corpus de referencia contiene 20 resúmenes. La demo no importa PDF desde el navegador: la ingesta y la validación son pasos separados, fuera de la aplicación web.
  - La página de rendimiento muestra resultados versionados de JMH. No mide el equipo del visitante ni vuelve a ejecutar JMH.
---

## Problema

Cuando un estudiante compara resúmenes de investigación, un puntaje de similitud no basta para saber qué encontró el algoritmo. Un método puede contar términos compartidos, otro puede alinear secuencias de palabras y otro, basado en embeddings, puede dar un puntaje más alto a resúmenes relacionados aunque usen palabras distintas. Mostrar los puntajes junto a sus trazas ayuda a examinar esas diferencias.

Al agrupar esos mismos resúmenes, surge otra pregunta: ¿dónde conviene separar los grupos? La forma del árbol depende de cómo se representan los documentos y cómo se fusionan los grupos. Legajo permite cambiar esas decisiones sobre un mismo corpus de referencia y ver cómo cambia el agrupamiento.

## Cómo funciona

El navegador envía por HTTP los identificadores de los documentos y los algoritmos elegidos. El servidor define el contrato OpenAPI y la interfaz genera sus tipos de TypeScript a partir de una copia del contrato. El navegador usa las respuestas para mostrar matrices, trazas y gráficos, pero no calcula los puntajes ni los grupos.

El servidor carga un corpus versionado y verifica que las cachés de embeddings precalculados correspondan a esa versión. La capa de aplicación prepara el texto o carga los vectores y llama a los algoritmos del dominio, que no dependen de Spring. Con dos documentos, la interfaz compara los métodos disponibles y permite pedir una traza concreta, como el camino de alineación óptimo de Needleman–Wunsch. Con tres o más documentos seleccionados, muestra una matriz de similitud por pares para un método a la vez.

El agrupamiento se calcula sobre el corpus de referencia completo. Un motor compartido de Lance–Williams construye los árboles de fusión para los enlaces simple, completo, promedio y de Ward. Se pueden comparar las métricas internas y pedir un corte de un árbol en un número elegido de grupos. Otro endpoint sirve los resultados y las pendientes de JMH que la página de rendimiento muestra en sus gráficos.
