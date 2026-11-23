---
project: saber-inverso
summary: >-
  Saber Inverso ayuda a aspirantes a la Universidad del Quindío a estimar puntajes por área del Saber 11 a partir del ponderado de admisión.
role: Único desarrollador
timeframe: "2026"
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/estimator-input.png
      alt: Formulario de Saber Inverso con Medicina, Quindío como población de referencia y un ponderado objetivo de 72,50.
      caption: Un aspirante ficticio a Medicina ingresa un ponderado de 72,50 y usa Quindío como población de referencia.
    - src: ./shots/weighted-result.png
      alt: Resultado para Medicina con un global estimado de 362 sobre 500, un ponderado recalculado de 72,30 y un gráfico de los pesos por área.
      caption: La misma combinación de puntajes da 362 en la escala del examen y 72,30 con los pesos del programa de Medicina.
    - src: ./shots/area-uncertainty.png
      alt: Cinco barras de color con rangos y valores centrales, entre ellos 68–76 para Ciencias Naturales y 65–79 para Inglés, con la explicación del rango desplegada.
      caption: El rango de Inglés es más amplio que el de Ciencias Naturales, aunque ambos tienen 72 como valor central.
    - src: ./shots/ranked-alternatives.png
      alt: Cinco combinaciones ordenadas cerca del objetivo, con las primeras tres desplegadas para mostrar los cinco puntajes por área.
      caption: Distintos puntajes por área pueden acercarse al ponderado de 72,50. Los porcentajes indican verosimilitud respecto a la primera estimación, no probabilidad de admisión.

decisions:
  - question: ¿Cómo distinguir entre combinaciones de puntajes que se ajustan al mismo objetivo?
    options:
      - label: Listar combinaciones que coincidan con el objetivo usando solo los pesos
        reason: Permite comprobar la fórmula de admisión sin un modelo poblacional, pero no distingue una combinación frecuente de una inusual.
      - label: Condicionar un modelo conjunto de puntajes al ponderado objetivo
        reason: Una distribución normal multivariada usa las correlaciones históricas entre áreas y permite calcular tanto una estimación central como su dispersión.
        chosen: true
    consequence: La aplicación ordena combinaciones plausibles y muestra la incertidumbre por área, sin dar a entender que recuperó los puntajes reales del aspirante.
    evidence:
      - label: Cálculo condicional y orden de las combinaciones
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/app/domain/solver.py
      - label: Respuesta de la API y campos de incertidumbre
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/tests/test_api.py
  - question: ¿Cuándo debe preparar la aplicación las estadísticas poblacionales y los pesos por programa?
    options:
      - label: Calcularlos en la API en funcionamiento
        reason: La API podría leer las fuentes directamente, pero dependería de la descarga de resultados y de la lectura de la hoja de cálculo para servir estimaciones.
      - label: Distribuir las estadísticas y los pesos precalculados
        reason: Un proceso por lotes genera archivos JSON que la API carga en memoria al iniciar.
        chosen: true
    consequence: Para servir una estimación no hace falta conectarse al ICFES ni abrir la hoja de cálculo original. Actualizar los datos requiere regenerar los archivos.
    evidence:
      - label: Proceso por lotes para estadísticas y pesos
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/etl/etl.py?plain=1
      - label: Carga de archivos en la API
        url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/app/domain/repositories.py
results:
  - label: Pruebas unitarias del cálculo
    detail: Las 12 pruebas pasaron en local. Cubren la restricción del ponderado, la incertidumbre, la clasificación de combinaciones enteras y la reproducibilidad.
    url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/tests/test_solver.py?plain=1
  - label: Pruebas de integración HTTP
    detail: Las seis pruebas pasaron en local con los datos incluidos. Cubren la comprobación del ponderado para Medicina y el rechazo de programas desconocidos y objetivos fuera del rango.
    url: https://github.com/diegnghtmr/saber-inverso/blob/main/services/api/tests/test_api.py
  - label: Recorrido en el navegador
    detail: El ejemplo local de Medicina mostró 362 sobre 500, un ponderado recalculado de 72,30, cinco rangos por área y cinco combinaciones alternativas.
limitations:
  - El modelo aproxima la distribución conjunta de los puntajes. Al redondear a enteros, el ponderado recalculado puede apartarse del objetivo.
  - Las estadísticas incluidas abarcan seis periodos de examen entre 2014 y 2022.
  - El estimador no cubre programas que no figuran en la tabla de pesos ni aspirantes con exención de la prueba de Inglés.
---

## Problema

Un aspirante a la Universidad del Quindío puede conocer el puntaje ponderado de admisión que quiere explorar sin saber qué implica para su examen Saber 11. El simulador de la universidad convierte cinco puntajes por área en un solo ponderado y los pesos dependen del programa. Ese ponderado no es el puntaje global del ICFES, que usa otra escala y otra fórmula.

Al invertir el cálculo no se obtiene un resultado único. Distintas combinaciones pueden producir el mismo ponderado, por lo que mostrar una sola ocultaría cuánto pueden variar los puntajes. Saber Inverso ordena combinaciones plausibles y muestra un rango por área. Sirve para explorar un objetivo, no para consultar un corte oficial de admisión ni recuperar un resultado individual del examen.

## Cómo funciona

La página en Astro carga un estimador en Preact. En Docker, nginx sirve la página estática y reenvía las solicitudes de `/api` a FastAPI, de modo que el navegador usa un mismo origen. El formulario carga los programas y las poblaciones de referencia y envía el programa, el ponderado objetivo y la población seleccionada.

Un proceso por lotes calcula estadísticas nacionales y de Quindío con datos abiertos de los exámenes del ICFES y lee los pesos por programa de la hoja de cálculo de la universidad. FastAPI carga los dos archivos JSON al iniciar. No descarga registros de exámenes cuando alguien pide una estimación.

El cálculo usa NumPy para condicionar una distribución normal multivariada al ponderado del programa. Toma muestras de combinaciones, redondea los puntajes a enteros, los limita al rango de 0 a 100 y ordena las combinaciones cercanas al objetivo por su distancia de Mahalanobis a la media condicional. Devuelve la primera combinación, las alternativas y la desviación estándar condicional por área. La página usa esa dispersión para dibujar los rangos y separa el ponderado recalculado del puntaje global estimado del ICFES.
