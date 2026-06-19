# WeShuttle — Driver App (Etapa 2)

## 1. Link al Deploy de Producción
🚀 **URL del proyecto en vivo:** [https://proyecto-a-driver2-weshuttle.vercel.app/](https://proyecto-a-driver2-weshuttle.vercel.app/)

---

## 2. Credenciales de Usuarios de Prueba (Clerk)
Para evaluar los flujos de uso completos y la segmentación de pantallas por roles, se pueden utilizar las siguientes cuentas integradas en el entorno de autenticación:

* **Rol Conductor (Driver):**
  * **Email:** `driver1clerk_test@iaw.com`
  * **Contraseña:** `iawuser#`
* **Rol Administrador (Admin):**
  * **Email:** `admin1clerk_test@iaw.com`
  * **Contraseña:** `iawuser#`

---

## 3. Instrucciones de Uso Esenciales

### Para el Rol Administrador (`admin`):
1. Inicie sesión con la credencial de administrador.
2. Diríjase a **Gestión de Administración** (`/admin/dashboard`) para auditar el panel maestro de la plataforma.
3. Podrá visualizar métricas globales de negocio (tasa de finalización, total de pools) y gestionar el estado de verificación de los choferes (`PENDING`, `APPROVED`, `REJECTED`).
4. Acceda al **Historial de Viajes** (`/admin/history`) desde la pantalla de inicio para auditar de forma global todas las comisiones finalizadas, indicando qué conductor y qué vehículo se utilizaron en cada traslado.

### Para el Rol Conductor (`driver`):
1. Inicie sesión con la credencial de conductor.
2. Registre una combi reglamentaria en la sección de vehículos (`/driver/vehicles`), validando que la capacidad respete el límite de hasta 15 pasajeros.
3. Asegúrese de que su cuenta esté en estado `APPROVED` desde el panel de administración para operar en el sistema.
4. Explore el **Marketplace de Viajes** (`/driver/marketplace`) para visualizar pools disponibles (`AVAILABLE`) o realizar un seguimiento de sus rutas asignadas (`ASSIGNED`, `IN_PROGRESS`).
5. Ingrese al panel de control de un viaje activo para navegar la hoja de ruta interactiva.
6. Consulte el **Historial de Viajes** (`/driver/history`) desde su pantalla de inicio para verificar sus pools propios completados, la unidad utilizada y el manifiesto detallado de pasajeros transportados.

---

## 4. Breve Descripción del Sistema

**WeShuttle** es una plataforma tecnológica diseñada para optimizar el traslado de personal corporativo hacia los nodos industriales estratégicos de Bahía Blanca (tales como el Polo Petroquímico, el Puerto de Ingeniero White y el Parque Industrial). El sistema resuelve problemáticas críticas de transporte flexible y reduce significativamente los costos individuales de viaje mediante un modelo colaborativo de **Pools Programados** en combis con capacidad máxima de hasta 15 pasajeros.

La **Driver App** constituye el núcleo operativo de la plataforma, encargándose de toda la logística de transporte desde la perspectiva del chofer y la auditoría del administrador. Permite la publicación de viajes en un marketplace transparente, la gestión granular y resiliente del recorrido del chofer minuto a minuto, el control de la flota de vehículos aptos y la analítica de negocio centralizada.

---

## 5. Notas Aclaratorias para la Corrección

* **Estrategia de Resiliencia (Snapshot Local):** Siguiendo las pautas de arquitectura, la aplicación no consume datos dinámicos de reservas de otras apps durante el recorrido. Al transicionar a `LOCKED`/`IN_PROGRESS`, se consolida de manera persistente una copia local del manifiesto definitivo de pasajeros con reservas pagas (`operational_manifest_snapshot_passengers`), garantizando que el chofer pueda completar el itinerario aun ante fallas críticas de red o caídas de servicios externos.
* **Integración Robusta de Mocks Offline (Bypass de Red local):** Para evitar bloqueos del Middleware de Clerk, conflictos de puertos locales en desarrollo o problemas de resolución DNS (IPv6/IPv4 loopback), las funciones del módulo de integración (`externalApis.ts`) están optimizadas para interceptar el modo simulado/mock. Resuelven de manera local consultando la base de datos o retornando JSONs estáticos instantáneos, garantizando un flujo rápido e independiente de la red.
* **Máquina de Estados de Botón Único (UX de Conducción):** En lugar de forzar al chofer a interactuar con listas desplegables complejas mientras maneja, se diseñó un botón contextual único en la pantalla de viaje activo. El botón procesa el itinerario de forma lineal guiándose por el orden estricto de recogida (`pickup_order`), alternando de forma segura entre los hitos operativos exactos exigidos por el contrato del sistema ("En camino", "Llegué al punto de retiro", "Pasajero a bordo").
* **Validación Robusta y Paginación:** Todos los formularios críticos cuentan con esquemas estrictos de validación en el servidor mediante Zod (ej. patentes argentinas y capacidades). Adicionalmente, el marketplace y los reportes están completamente paginados mapeando los parámetros directamente sobre los Query Params de la URL para preservar el estado del navegador.
