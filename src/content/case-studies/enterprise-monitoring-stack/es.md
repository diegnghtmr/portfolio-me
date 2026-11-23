---
project: enterprise-monitoring-stack
summary: Un laboratorio para estudiantes de infraestructura que necesitan consolidar servicios, conservar sus datos y monitorearlos desde un solo servidor.
role: Autor del repositorio y de la documentación técnica
timeframe: "2025"
team: 3
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/apache-requests.png
      alt: Panel de Apache en Netdata con indicadores de conexiones, solicitudes, tráfico e hilos de trabajo sobre una gráfica de solicitudes con picos repetidos.
      caption: La tasa de solicitudes a Apache sube durante las ráfagas de tráfico sintético. Los indicadores muestran conexiones, tráfico y uso de los hilos de trabajo.
    - src: ./shots/nginx-connections.png
      alt: Panel de Nginx en Netdata con conexiones activas de clientes y series separadas para las conexiones que escriben y las inactivas.
      caption: Nginx desglosa las conexiones activas por estado, de modo que las inactivas se pueden ver junto a las que están enviando respuestas.
    - src: ./shots/mysql-queries.png
      alt: Estadísticas de consultas de MySQL en Netdata con la tasa total y el desglose por operación SQL durante una carga local.
      caption: MySQL muestra la tasa total de consultas y la actividad de SELECT generada por las lecturas en la base de datos del laboratorio.
decisions:
  - question: ¿Cómo reunir en un servidor tres servicios que estaban alojados por separado?
    options:
      - label: Mantener un servidor físico por servicio
        reason: Cada servicio conserva su propio servidor, pero cada máquina requiere mantenimiento por separado.
      - label: Ejecutar un contenedor por servicio en un solo servidor
        reason: Cada servicio conserva su propia imagen y entorno de ejecución, y comparte el servidor con los demás.
        chosen: true
    consequence: Apache, Nginx y MySQL se pueden reiniciar por separado, pero un fallo del servidor compartido puede afectar a todos.
    evidence:
      - label: Objetivo de consolidación
        url: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/README.md#resumen-ejecutivo
      - label: Definiciones de los servicios
        url: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml
  - question: ¿Dónde debe guardar sus datos cada servicio?
    options:
      - label: Guardar el contenido y la base de datos en la capa de escritura del contenedor
        reason: No hacen falta montajes separados, pero al eliminar el contenedor se pierden los datos de esa capa.
      - label: Montar un volumen lógico independiente sobre almacenamiento en espejo para cada servicio
        reason: RAID 1 replica los datos en los discos y LVM proporciona un dispositivo lógico independiente del ciclo de vida del contenedor.
        chosen: true
    consequence: Reemplazar el contenedor no reemplaza los datos montados. El espejo de discos no sustituye a una copia de seguridad ni permite conmutar a otro servidor.
    evidence:
      - label: Creación de los arreglos RAID 1
        url: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/README.md#22-creación-de-arreglos-raid-1
      - label: Montaje de volúmenes lógicos
        url: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/README.md#29-montaje-y-configuración-permanente
  - question: ¿Cómo relacionar la actividad de los servicios con la carga del servidor compartido?
    options:
      - label: Comprobar los servicios por separado
        reason: Las comprobaciones HTTP y SQL indican si un servicio responde, pero no muestran cómo cambia su actividad en relación con la carga del servidor.
      - label: Recopilar métricas del servidor y de los contenedores en Netdata
        reason: Un solo panel reúne la carga del servidor y la actividad de cada contenedor.
        chosen: true
    consequence: Se puede pasar de las métricas del servidor a las de los contenedores, pero el agente documentado necesita acceso fuera de su propio contenedor.
    evidence:
      - label: Permisos y montajes del agente
        url: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/README.md#51-despliegue-de-netdata-contenerizado
      - label: Monitoreo por contenedor
        url: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/README.md#54-monitorización-de-contenedores-docker
results:
  - label: Comprobaciones locales de web y base de datos
    detail: Apache y Nginx devolvieron HTTP 200 durante la carga sintética. MySQL ejecutó consultas de lectura sobre datos ficticios.
  - label: Panel local de Netdata
    detail: Las vistas de Apache, Nginx y MySQL mostraron gráficas de los recolectores activos, sin errores de JavaScript de página en Chromium.
  - label: Comprobación de reinicio de la base de datos
    detail: Un registro insertado en la base de datos local de MySQL seguía disponible después de reiniciar el contenedor con su volumen con nombre.
limitations:
  - El archivo Compose del repositorio apunta a directorios de compilación que no existen. Los Dockerfiles de Apache y MySQL también hacen referencia a una página HTML y un archivo SQL de inicialización que no se incluyen.
  - En la ejecución local se usaron volúmenes de Docker y recolectores por servicio. No se reprodujeron la capa RAID/LVM, el comportamiento ante fallos de disco ni el monitoreo documentado mediante montajes del servidor y el socket de Docker.
architecture:
  system: Enterprise Monitoring Stack
  caption: Cada servidor web y MySQL tienen su propio volumen lógico; Netdata lee métricas del servidor compartido.
  nodes:
    - id: deployment
      kind: container
      label: Configuración del despliegue
      name: enterprise-monitoring-stack
      repo: enterprise-monitoring-stack
      tech: Docker Compose
      does: Define los servicios y sus montajes
      col: 0
      row: 1
    - id: apache
      kind: container
      label: Servidor web
      name: Apache
      tech: httpd 2.4
      does: Sirve contenido de su directorio web
      col: 1
      row: 0
    - id: nginx
      kind: container
      label: Servidor web
      name: Nginx
      tech: 'nginx:stable'
      does: Sirve contenido de otro directorio web
      col: 1
      row: 1
    - id: mysql
      kind: store
      label: Base de datos
      name: MySQL
      tech: MySQL 8.0
      does: Guarda la base de datos del laboratorio
      col: 1
      row: 2
    - id: netdata
      kind: container
      label: Agente de monitoreo
      name: Netdata
      does: Muestra métricas del servidor y los contenedores
      col: 1
      row: 3
    - id: service-volumes
      kind: store
      label: Volúmenes persistentes
      name: Service volumes
      tech: RAID 1 / LVM / ext4
      does: Guardan contenido web y datos de MySQL
      col: 2
      row: 1
    - id: netdata-volumes
      kind: store
      label: Volúmenes persistentes
      name: Netdata volumes
      tech: Docker volumes
      does: Guardan el estado y la caché de Netdata
      col: 2
      row: 3
    - id: host
      kind: external
      label: Servidor de ejecución
      name: Docker host
      tech: Linux / Docker
      does: Expone métricas del servidor y sus contenedores
      col: 2
      row: 4
  edges:
    - from: deployment
      to: apache
      protocol: Compose
      verb: Define el servicio
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L4-L12
    - from: deployment
      to: nginx
      protocol: Compose
      verb: Define el servicio
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L14-L22
    - from: deployment
      to: mysql
      protocol: Compose
      verb: Define el servicio
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L24-L35
    - from: deployment
      to: netdata
      protocol: Compose
      verb: Define el agente
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L37-L42
    - from: apache
      to: service-volumes
      protocol: Bind mount
      verb: Lee el contenido web
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L10-L11
    - from: nginx
      to: service-volumes
      protocol: Bind mount
      verb: Lee el contenido web
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L20-L21
    - from: mysql
      to: service-volumes
      protocol: Bind mount
      verb: Guarda archivos de datos
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L33-L34
    - from: netdata
      to: netdata-volumes
      protocol: Volume mount
      verb: Escribe estado y caché
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L55-L56
    - from: netdata
      to: host
      protocol: procfs / sysfs / Docker API
      verb: Recopila métricas
      evidence: https://github.com/diegnghtmr/enterprise-monitoring-stack/blob/main/docs/docker-compose.yml#L48-L54
---

## Problema

En un laboratorio de infraestructura de la Universidad del Quindío, tres servicios alojados en servidores físicos distintos se reunieron en una sola máquina. La consolidación planteó dos preguntas: qué datos deben sobrevivir al reemplazo de un servicio y cómo saber cuál está activo cuando todos comparten recursos.

El equipo necesitaba conservar los dos directorios web y los archivos de la base de datos por fuera de los contenedores que los usan. Una página web o una conexión SQL podían confirmar que cada servicio respondía, pero no mostrar lo que ocurría entre comprobaciones. Por eso el laboratorio combinó el despliegue con almacenamiento persistente y un panel para observar la máquina compartida y sus contenedores.

## Cómo funciona

El repositorio contiene la referencia de despliegue y la guía del laboratorio; no hay un repositorio aparte para una aplicación. Apache y Nginx sirven contenido desde directorios web independientes, mientras que MySQL tiene su propio directorio de datos. Compose describe un contenedor por servicio y un cuarto para Netdata. Los servidores web no se conectan a MySQL como parte de una aplicación.

En la configuración documentada de VirtualBox, nueve discos virtuales de datos forman tres arreglos RAID 1. Cada arreglo respalda un grupo de volúmenes de LVM y un volumen lógico. Los volúmenes se formatean en ext4, se montan bajo `/srv` y se enlazan al contenedor correspondiente. Así, el contenido web y la base de datos quedan fuera de la capa de escritura de los contenedores. La guía comprueba la persistencia mediante reinicios o reemplazos de contenedores.

El agente de Netdata documentado recopila métricas del servidor y de los contenedores. Para las capturas locales se compilaron los tres Dockerfiles del repositorio con archivos de prueba añadidos en local. Se usaron volúmenes con nombre en lugar de los montajes de la máquina virtual. Netdata leyó el estado de Apache, los contadores de conexiones de Nginx y las variables de estado de MySQL por la red de Compose, sin montar archivos del servidor ni el socket de Docker. Las gráficas muestran la carga local, no un fallo de disco ni su recuperación.
