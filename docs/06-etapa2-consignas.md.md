# 06 — Contexto de Implementación: Driver App (WeShuttle)

Este documento centraliza todas las especificaciones operativas, técnicas y de negocio para guiar el desarrollo de la **Driver App** dentro de la plataforma **WeShuttle** durante la **Etapa 2 (Implementación Individual)**. Está diseñado para proporcionar contexto completo a agentes de IA (como GitHub Copilot) mediante comandos de inicialización o análisis estructural.

---

## 1. Arquitectura y Stack Tecnológico

La aplicación se construye de forma completamente aislada como un producto independiente, asumiendo que las interacciones con otros servicios se resolverán mediante estrategias de mockeo o stubs en esta fase.

* **Framework:** Next.js (Componentes y páginas reutilizables).
* **Base de Datos:** PostgreSQL (Instancia propia por aplicación, aislamiento total de datos).
* **ORM:** Prisma.
* **Estilos:** Tailwind CSS.
* **Autenticación:** Clerk (Servicio centralizado compartido).
* **Despliegue:** Vercel (Instancia de producción) +   Neon

---

## 2. Flujo de Trabajo y Ramas (Git)

El ciclo de desarrollo en el repositorio se estructurará bajo el siguiente flujo de ramificación antes de la entrega final:
1. **`develop`:** Rama activa de desarrollo y consolidación de funcionalidades locales.
2. **`release`:** Fase de estabilización, pruebas finales de integración simulada y preparación de datos precargados.
3. **`main`:** Código definitivo evaluado, el cual debe reflejar de manera transparente el historial de commits individuales.

---



## 5. Gestión de Roles y Autenticación (Clerk JWT)

La protección de rutas y endpoints debe basarse estrictamente en la validación del JWT de Clerk.

### Roles Habilitados en esta App
* **`driver`**: Acceso al Marketplace de pools disponibles, panel operativo del viaje actual en curso, y configuración de datos de su vehículo.
* **`admin`**: Gestión completa de datos maestros del dominio, auditoría y acceso a reportes analíticos.

### Claims Relevantes
El backend debe parsear y validar de forma obligatoria los siguientes valores del token de sesión:
* `sub`: Corresponde al `clerk_user_id` transversal en la persistencia local.
* `role`: Filtro restrictivo de acceso en el middleware de Next.js (`driver` o `admin`).

---

## 6. Requisitos Funcionales Críticos para el Agente de IA

Cuando se diseñe el plan de implementación de los módulos con el asistente de desarrollo, se deben garantizar los siguientes criterios obligatorios expuestos por la cátedra:

* **Panel de Administración Obligatorio:** Interfaz para el rol `admin` destinada a gestionar entidades maestras y visualizar, por lo menos, un reporte o listado analítico relevante del negocio.
* **Búsqueda y Paginación por URL:** Implementar de forma nativa la paginación y filtrado de datos (por ejemplo, en el historial de pools de un conductor o en el marketplace) mapeando los parámetros directamente en los Query Params de la URL.
* **Validación en el Servidor:** Todo formulario expuesto al usuario debe contar con un esquema estricto de validación del lado del servidor (ej. validando capacidades de vehículos o formatos de patentes).
* **Manejo Integral de Errores:** Control de excepciones globales y renderizado explícito de páginas de error personalizadas y 404.
* **Consumo de al menos una API Externa :** integracion un servicio externo
que aporte valor al dominio de la app. Debe hacerse un request real y
procesarse la respuesta (no embeds). Las APIs de las otras webapps del
mismo proyecto cuentan como externas a los fines de este requisito.

---

## 7. Directrices de Entrega y Datos de Prueba

Para asegurar una correcta evaluación del proyecto en el deploy de producción de Vercel, la aplicación debe cumplir con los siguientes estándares rigurosos de datos y presentación:

### Variables de Entorno
* **Local:** Configurar todas las credenciales sensibles en `.env.local` (incluido en `.gitignore`).
* **Repositorio:** Proveer obligatoriamente un archivo `.env.example` limpio, detallando las llaves necesarias sin sus valores reales.
* **Producción:** Cargar las variables dentro de la pestaña *Settings → Environment Variables* del panel de Vercel.

### Credenciales de Usuarios de Prueba (Clerk)
Todos los usuarios pre-creados e inyectados para testing deben ajustarse estrictamente al siguiente patrón de nomenclatura:

* **Formato de Email:** `<rol>+clerk_test@iaw.com`
* **Contraseña Universal:** `iawuser#`

*Ejemplos concretos para este dominio:*
* `driver+clerk_test@iaw.com`
* `admin+clerk_test@iaw.com`

### Densidad de Datos Precargados (Seeding)
La aplicación **no puede estar vacía ni presentar datos insuficientes** al momento de la corrección. Debe correrse un script de seed o migración inicial que pueble la base de datos con un volumen de información realista que permita evaluar flujos de uso completos:
* Un catálogo sólido de conductores (`drivers`) en diferentes estados de verificación.
* Flotas de vehículos configurados con sus límites de hasta 15 pasajeros.
* Múltiples registros históricos e intermedios de pools de viajes simulando estados variados (`AVAILABLE`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`) para nutrir los gráficos y reportes del administrador.

### Requisitos del README principal
El archivo `README.md` en la raíz del branch `main` debe ser conciso, estructurándose obligatoriamente en el siguiente orden:
1. **Link al deploy de producción** (URL directa y activa en Vercel).
2. **Listado de usuarios de prueba** disponibles (siguiendo el patrón corporativo detallado anteriormente).
3. **Instrucciones de uso** esenciales para evaluar y navegar la aplicación.
4. **Breve descripción del sistema** (un máximo estricto de 3 o 4 párrafos).
5. **Notas aclaratorias para la corrección** (justificaciones de diseño, decisiones técnicas particulares o limitaciones asumidas).