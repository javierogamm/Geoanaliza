# Log de cambios de AppGeoAnaliza

## v1.0.1 - 2024-11-08
- Añadida guía de backend para ejecutar la API en local, incluyendo configuración de endpoints Nominatim/Overpass, proxies y solución de problemas de conectividad.
- Añadido `.gitignore` para evitar el versionado de dependencias y artefactos de build.

## v1.0.2 - 2024-11-09
- Añadido handler serverless `backend/api/index.ts` y configuración `vercel.json` para desplegar backend + frontend en Vercel con reescrituras que mantienen `/api/points` y la entrega estática.
- Documentado el procedimiento de despliegue en Vercel (variables de entorno, runtime y comandos) en `backend/README.md`.
