# Log de cambios

## Versión 1.0.0 - 2025-02-03
- Añadida configuración de `vercel.json` en la raíz para reescribir todas las rutas hacia el frontend estático y proxy de `/api` al backend hospedado en Render, evitando errores 404 en el despliegue de Vercel.

## Versión 1.1.0 - 2025-12-04
- Conserva los puntos geográficos al importar códigos de expediente, evitando que se reemplacen los resultados ya obtenidos.
- Mantiene los valores generados en columnas personalizadas al volver a renderizar la tabla, reduciendo sobrescrituras involuntarias.

## Versión 1.1.1 - 2025-12-04
- Corrige la transposición de datos para que utilice los expedientes importados junto a los puntos mostrados, generando filas para los campos base y personalizados seleccionados.

## Versión 1.2.0 - 2025-02-04
- Añadida función serverless en Vercel que reutiliza la aplicación Express del backend para servir `/api` directamente desde la plataforma.
- Actualizado `vercel.json` para usar runtime Node.js 20 y eliminar la dependencia del proxy hacia Render.
- Creado `package.json` raíz con workspaces para que Vercel instale las dependencias del backend durante el despliegue.
- Ajustada la resolución de la ruta al frontend en el backend para que funcione en el entorno serverless de Vercel.

## Versión 1.2.1 - 2025-02-05
- Añadidos logs detallados en la ruta `/api/points` y en la consulta a Overpass para diagnosticar por qué no se devuelven puntos.

## Versión 1.2.2 - 2025-02-05
- Declarada la versión 2 de la configuración de Vercel para validar correctamente el runtime Node.js 20 en las funciones serverless.
- Actualizada la versión del paquete raíz a `1.2.2` para reflejar la consolidación del despliegue en Vercel.
