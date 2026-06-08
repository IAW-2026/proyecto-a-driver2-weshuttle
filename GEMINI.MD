PLAN DE IMPLEMENTACION
Aquí tienes el Plan de Implementación Definitivo estructurado con el máximo nivel de detalle posible, incluyendo las llaves que enviaste y el ajuste estricto hacia el consumo de API Externa real (inter-servicio). He guardado y reemplazado este plan en nuestra memoria.

Fase 1: Setup Inicial y Esqueleto
1.1  Inicialización de Next.js (App Router): Crear la base del proyecto dentro de la carpeta actual usando TypeScript, Tailwind CSS y reestructurar carpetas (src/app, src/components, src/lib, src/types). Configurar los tokens de diseño (ej. Midnight Blue #0A192F como primario y la tipografía Inter).
 1.2 Configuración de Variables de Entorno (.env.local y .env.example):
Crear .env.local que incluya las claves compartidas de Clerk (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY y CLERK_SECRET_KEY que pasaste) y la DATABASE_URL local.
Crear un .env.example (sin valores reales) como especifica la consigna.
1.3  Preparación de Repositorio: Asegurar que estamos operando en la rama develop (como dicta el flujo de trabajo) y dejar preparadas las bases para que el deploy inicial en Vercel pase sin errores de build.
Fase 2: Capa de Datos y Autenticación
 2.1 Modelado Prisma (schema.prisma): Mapear estrictamente las entidades definidas en 04-modelo-de-datos.md:
drivers (con id, clerk_user_id, status, verification_status).
vehicles (validando capacidad hasta 15 pasajeros y asociando al driver).
pools (registrando departure_time, status, driver_id, current_passengers, hitos operativos).
Snapshot Operativo: Estructura para retener el estado temporal de los pasajeros (PAID) de un pool activo.
 2.2 Autenticación e Interceptores (Clerk):
Implementar middleware.ts para proteger las rutas.
Leer y validar el claim role (driver o admin) para derivar permisos.
Extraer el claim sub de la sesión como identificador transversal entre apps (clerk_user_id).
Fase 3: Rutas de API REST (Endpoints Expuestos)
 3.1 Exposición de Contratos (Driver como fuente de verdad): Implementar en src/app/api/pools/search/route.ts la lógica de consulta para que la Rider App pueda buscar pools.
3.2  Estandarización de Errores: Asegurar que todas las APIs propias de la Driver App retornen errores con el formato corporativo (ej. { "error": "404 Not Found", "message": "..." }).
Fase 4: Flujo Core del Conductor e Interfaz
4.1  Marketplace y Paginación UI (Obligatorio en URL): Construir /driver/marketplace. Implementar filtros y paginado procesados vía SSR (Server-Side Rendering) leyendo los searchParams (?page=2&status=AVAILABLE), sin depender del estado del cliente.
 4.2 Panel de Viaje Activo: Interfaz para el ciclo de vida del traslado de un pool en /driver/pools/[id]/active. Debe gestionar botones para actualizar estados e hitos operativos en tiempo real.
4.3 Consumo de API externa en modo aislado: rutas internas de mock (ej. /api/mocks/rider/passengers) y uso de RIDER_API_URL para hacer el fetch real a esos endpoints propios.4.4 Formularios, Server Actions y Zod: Aplicar Server Actions para mutaciones (ej. asignar vehículo a conductor) validando todos los inputs en el servidor con la librería Zod.
 4.5 Manejo Integral de Errores UX: Crear páginas personalizadas error.tsx y not-found.tsx en Next.js.
Fase 5: Panel de Administración y Reportes (Obligatorio)
 5.1 Dashboard Maestro (/admin/dashboard): CRUD protegido para gestionar y visualizar conductores y vehículos. Poder modificar el verification_status de un chofer.
5.2 Reportes y Analíticas: Vista que obtenga una métrica base agregada usando Prisma; por ejemplo, la tasa de finalización de viajes (Pools COMPLETED vs CANCELED) para nutrir gráficos y justificar la vista admin.
Fase 6: Datos de Prueba y Testing
6.1  Seeding Robusto (prisma/seed.ts): Un script que limpie e inyecte un dataset extenso. Creará conductores de base, asignará vehículos y generará historial de pools (iniciados, terminados, fallidos).
6.2 Cuentas Patrón para Corrección: El script insertará los usuarios base en nuestra DB para que empaten con los de Clerk:
driver+clerk_test@iaw.com (pass: iawuser#)
admin+clerk_test@iaw.com (pass: iawuser#)
6.3 Documentación (README.md): Escribir la versión final exigida (1. Link a Vercel, 2. Credenciales, 3. Instrucciones, 4. Resumen, 5. Notas de corrección).
