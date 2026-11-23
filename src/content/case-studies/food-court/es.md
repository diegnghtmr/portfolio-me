---
project: food-court
summary: >-
  Una aplicación de pedidos para clientes, personal de cocina y propietarios, desde la consulta del menú hasta la recogida.
role: Desarrollador único
timeframe: 2025–2026
demonstration:
  kind: screenshots
  screenshots:
    - src: ./shots/client-menu.png
      alt: Menú de Casa Guadua con arepas, patacones y empanadas, sus precios y botones para añadir al carrito
      caption: Los clientes consultan los platos por categoría en Casa Guadua, el restaurante ficticio usado para esta ejecución local.
    - src: ./shots/client-cart.png
      alt: Carrito con tres platos, controles de cantidad y total del pedido en pesos colombianos
      caption: El carrito reúne los platos, sus subtotales y la confirmación del pedido en una sola pantalla.
    - src: ./shots/order-queue.png
      alt: Tablero de cocina con un pedido en cada columna, Pendientes, En preparación y Listos
      caption: Desde el tablero, el personal toma un pedido, lo marca como listo y completa la entrega.
    - src: ./shots/order-status.png
      alt: Detalle del pedido marcado como Entregado con los mismos tres artículos y el mismo total que el carrito
      caption: El cliente ve el mismo pedido marcado como entregado después de que se valida el código de recogida.
    - src: ./shots/owner-overview.png
      alt: Panel del propietario con el número de platos, platos activos, empleados y pedidos del día
      caption: El propietario consulta la plantilla y la disponibilidad del menú desde una sola pantalla y accede a las herramientas de gestión.
decisions:
  - question: ¿Cómo organizar la interfaz si cada rol tiene un flujo distinto?
    options:
      - label: Capas técnicas
        reason: Agrupar páginas, hooks y servicios por tipo facilita recorrer cada capa, pero dispersa el código de un mismo flujo.
      - label: Funciones agrupadas por rol
        reason: El código que usa una sola función se queda allí y pasa a un módulo compartido cuando otra función lo necesita.
        chosen: true
    consequence: El carrito del cliente y la cola de cocina tienen su propio estado y sus propias consultas. Los controles reutilizables y la autenticación se mantienen aparte.
    evidence:
      - label: Arquitectura de la interfaz y regla de ubicación del código
        url: https://github.com/diegnghtmr/food-court-ui/blob/main/README.md#architecture
      - label: Rutas por rol
        url: https://github.com/diegnghtmr/food-court-ui/blob/main/src/app/router.tsx
  - question: ¿Dónde deben quedar las reglas de los pedidos?
    options:
      - label: Servicio del framework con dependencias directas
        reason: Llamar directamente a los repositorios y clientes HTTP reduce el código de conexión, pero acopla el flujo a MongoDB y Feign.
      - label: Casos de uso de dominio con puertos
        reason: El caso de uso puede validar las transiciones sin depender de cómo se guardan los pedidos ni de cómo se envían las notificaciones.
        chosen: true
    consequence: El caso de uso utiliza interfaces para guardar pedidos, consultar el catálogo, enviar avisos y registrar transiciones. Los adaptadores aportan las implementaciones para HTTP y MongoDB.
    evidence:
      - label: Arquitectura del servicio de pedidos
        url: https://github.com/diegnghtmr/order-microservice/blob/main/README.md#ports-and-adapters
      - label: Reglas del ciclo del pedido
        url: https://github.com/diegnghtmr/order-microservice/blob/main/src/main/java/com/pragma/powerup/ordermicroservice/domain/usecase/OrderUseCase.java
  - question: ¿Cómo conservar el historial de cambios de estado de un pedido?
    options:
      - label: Guardar el historial en el documento del pedido
        reason: Mantener el estado y el historial juntos evita una llamada de red, pero las consultas del historial y las actualizaciones dependen del mismo almacén.
      - label: Registrar las transiciones en un servicio aparte
        reason: Un servicio de trazabilidad puede consultar el historial y calcular los tiempos de entrega sin depender del estado actual del pedido.
        chosen: true
    consequence: El servicio guarda el cambio de estado antes de la llamada Feign. Si la llamada falla, el adaptador registra el error sin revertir el cambio, así que el historial puede quedar incompleto.
    evidence:
      - label: Adaptador que comunica las transiciones
        url: https://github.com/diegnghtmr/order-microservice/blob/main/src/main/java/com/pragma/powerup/ordermicroservice/infrastructure/output/feign/adapter/TraceabilityFeignAdapter.java
      - label: Cálculo de tiempos a partir de las transiciones guardadas
        url: https://github.com/diegnghtmr/traceability-microservice/blob/main/src/main/java/com/pragma/powerup/traceabilitymicroservice/domain/usecase/TraceUseCase.java
results:
  - label: Ciclo del pedido en local
    detail: En el navegador se hizo un pedido, se asignó a cocina, se marcó como listo y se entregó con el código generado. La API de trazabilidad devolvió las cuatro transiciones de ese pedido.
  - label: Pruebas unitarias de la interfaz
    detail: Pasaron las 76 pruebas, incluidas las del carrito, las solicitudes de pedidos y la ventana del código de recogida.
    url: https://github.com/diegnghtmr/food-court-ui/blob/main/package.json
  - label: Pruebas de los servicios de pedidos y catálogo
    detail: Pasaron las 22 pruebas de pedidos. La prueba de arranque del contexto de Spring del catálogo pasó con el perfil H2 del repositorio.
    url: https://github.com/diegnghtmr/order-microservice/tree/main/src/test
limitations:
  - El registro del restaurante devolvió un error durante la ejecución local. El catálogo busca al propietario en una ruta distinta de la que expone la API de identidad, por lo que la demostración usa un restaurante cargado como dato de prueba.
  - La tabla de platos del propietario mostró las categorías en blanco. El catálogo devuelve sus nombres en un campo que esa vista no lee.
architecture:
  system: Food Court
  caption: >-
    El pedido y su historial se guardan por separado, así que un fallo de trazabilidad no revierte la actualización del pedido.
  nodes:
    - id: frontend
      kind: container
      label: Aplicación web
      name: food-court-ui
      repo: food-court-ui
      tech: React 19 / TypeScript
      does: Atiende a clientes, personal y propietarios
      col: 0
      row: 1
    - id: orders
      kind: container
      label: API de pedidos
      name: order-microservice
      repo: order-microservice
      tech: Spring Boot
      does: Gestiona pedidos y verifica códigos de retiro
      col: 1
      row: 1
    - id: catalog
      kind: container
      label: API de catálogo
      name: food-court-microservice
      repo: food-court-microservice
      tech: Spring Boot
      does: Gestiona restaurantes, platos y disponibilidad
      col: 2
      row: 0
    - id: identity
      kind: container
      label: API de identidad
      name: user-microservice
      repo: user-microservice
      tech: Spring Boot
      does: Gestiona cuentas y emite JWT
      col: 2
      row: 1
    - id: traceability
      kind: container
      label: API de trazabilidad
      name: traceability-microservice
      repo: traceability-microservice
      tech: Spring Boot
      does: Registra estados y calcula tiempos
      col: 2
      row: 2
    - id: catalog-db
      kind: store
      label: Almacén de datos
      name: food_court_db
      tech: PostgreSQL
      does: Guarda restaurantes, platos y categorías
      col: 3
      row: 0
    - id: user-db
      kind: store
      label: Almacén de datos
      name: user_db
      tech: PostgreSQL
      does: Guarda cuentas y roles
      col: 3
      row: 1
    - id: trace-db
      kind: store
      label: Almacén de datos
      name: traceability_db
      tech: MongoDB
      does: Guarda cambios de estado y sus fechas
      col: 3
      row: 2
    - id: orders-db
      kind: store
      label: Almacén de datos
      name: orders_db
      tech: MongoDB
      does: Guarda pedidos y su estado actual
      col: 3
      row: 3
  edges:
    - from: frontend
      to: orders
      protocol: HTTP/JSON
      verb: Crea y consulta pedidos
      evidence: https://github.com/diegnghtmr/food-court-ui/blob/main/src/features/client/services/orderService.ts
    - from: frontend
      to: catalog
      protocol: HTTP/JSON
      verb: Lista platos disponibles
      evidence: https://github.com/diegnghtmr/food-court-ui/blob/main/src/features/client/services/dishService.ts
    - from: frontend
      to: identity
      protocol: HTTP/JSON
      verb: Inicia sesión
      evidence: https://github.com/diegnghtmr/food-court-ui/blob/main/src/features/auth/services/authService.ts
    - from: frontend
      to: traceability
      protocol: HTTP/JSON
      verb: Consulta historial de pedido
      evidence: https://github.com/diegnghtmr/food-court-ui/blob/main/src/features/client/services/orderService.ts
    - from: orders
      to: catalog
      protocol: Feign
      verb: Valida restaurante y platos
      evidence: https://github.com/diegnghtmr/order-microservice/blob/main/src/main/java/com/pragma/powerup/ordermicroservice/infrastructure/output/feign/client/FoodCourtFeignClient.java
    - from: orders
      to: identity
      protocol: Feign
      verb: Consulta clientes
      evidence: https://github.com/diegnghtmr/order-microservice/blob/main/src/main/java/com/pragma/powerup/ordermicroservice/infrastructure/output/feign/client/UserFeignClient.java
    - from: orders
      to: traceability
      protocol: Feign
      verb: Envía cambios de estado
      evidence: https://github.com/diegnghtmr/order-microservice/blob/main/src/main/java/com/pragma/powerup/ordermicroservice/infrastructure/output/feign/client/TraceabilityFeignClient.java
    - from: catalog
      to: identity
      protocol: Feign
      verb: Intenta buscar propietario
      evidence: https://github.com/diegnghtmr/food-court-microservice/blob/main/src/main/java/com/pragma/powerup/foodcourtmicroservice/infrastructure/output/feign/client/UserClient.java
    - from: traceability
      to: identity
      protocol: HTTP/JSON
      verb: Busca nombres del personal
      evidence: https://github.com/diegnghtmr/traceability-microservice/blob/main/src/main/java/com/pragma/powerup/traceabilitymicroservice/infrastructure/output/http/adapter/UserHttpAdapter.java
    - from: catalog
      to: catalog-db
      protocol: SQL
      verb: Lee y escribe el menú
      evidence: https://github.com/diegnghtmr/food-court-microservice/blob/main/docker-compose.yml
    - from: identity
      to: user-db
      protocol: SQL
      verb: Lee y escribe cuentas
      evidence: https://github.com/diegnghtmr/user-microservice/blob/main/docker-compose.yml
    - from: traceability
      to: trace-db
      protocol: MongoDB
      verb: Lee y guarda transiciones
      evidence: https://github.com/diegnghtmr/traceability-microservice/blob/main/docker-compose.yml
    - from: orders
      to: orders-db
      protocol: MongoDB
      verb: Lee y escribe pedidos
      evidence: https://github.com/diegnghtmr/order-microservice/blob/main/docker-compose.yml
---

## Problema

En una plazoleta de comidas, el carrito del cliente, la cola de cocina y el menú del propietario son tres vistas de la misma operación. El cliente necesita saber qué platos hay antes de pedir y cuándo volver a recoger su comida. En cocina hace falta distinguir los pedidos que esperan, los que alguien ha tomado y los que ya pueden entregarse. El propietario debe poder actualizar los platos y dar acceso al personal sin mezclar esas tareas con las de cocina.

Una vez entregado el pedido, su estado actual no dice cuánto tardó en completarse. Food Court guarda los cambios de estado para que el cliente consulte su pedido y el propietario revise cómo avanzaron los pedidos del restaurante.

## Cómo funciona

La interfaz en React se conecta a cuatro API REST mediante URL base configurables. El servicio de usuarios emite JWT con el rol de la cuenta y, para el personal del restaurante, el identificador del local. El enrutador usa el rol para elegir la vista y los servicios lo usan para autorizar las solicitudes. Usuarios y Catálogo guardan las cuentas y el menú en PostgreSQL. Catálogo cuenta con un cliente Feign para consultar al propietario en Usuarios.

Antes de guardar un pedido en MongoDB, Pedidos comprueba en Catálogo que el restaurante existe, que los platos le pertenecen y que están disponibles. También comprueba que el cliente no tenga otro pedido activo. El personal toma un pedido pendiente, lo marca como listo y verifica un código de recogida al entregarlo. Pedidos consulta al cliente en Usuarios por Feign y envía el aviso mediante un adaptador de SMS simulado.

Pedidos comunica los cambios de estado por HTTP mediante OpenFeign. Trazabilidad los guarda en otra base MongoDB. La pantalla de pedidos del cliente usa ese registro para identificar los pedidos y consulta sus detalles en Pedidos. Para los informes del propietario, Trazabilidad calcula los tiempos a partir de los cambios registrados y puede consultar los nombres del personal en Usuarios.
