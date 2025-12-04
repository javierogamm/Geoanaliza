# Backend de AppGeoAnaliza

Guía rápida para ejecutar la API y evitar errores al consultar los datos georreferenciados desde local.

## Requisitos previos
- Node.js 18 o superior.
- Acceso a internet hacia los endpoints de OpenStreetMap:
  - Nominatim: `https://nominatim.openstreetmap.org` (o la URL que configures).
  - Overpass API: `https://overpass-api.de/api/interpreter` (o la URL que configures).
- Respetar el `User-Agent` requerido para Nominatim y Overpass: `AppGeoAnaliza/1.0 (contact: josem.juangracia@gmail.com)`.

## Configuración y arranque en local
1. Instala dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Consulta el endpoint principal desde el frontend o con curl/postman:
   ```bash
   curl "http://localhost:3000/api/points?city=Zaragoza&limit=5"
   ```

El servidor expondrá `/api/points` y `/health`. La ruta `/` sirve el frontend desde `../frontend`.

## Variables de entorno útiles
Si tu red bloquea los endpoints públicos, define mirrors o instancias internas:

- `NOMINATIM_BASE_URL`: URL base de Nominatim. Ejemplo para un mirror local: `http://localhost:8080`.
- `OVERPASS_BASE_URL`: URL base de Overpass API. Ejemplo: `https://overpass.kumi.systems/api/interpreter`.

También puedes configurar proxies estándar de Node.js (por ejemplo `HTTPS_PROXY` o `HTTP_PROXY`) si tu red lo requiere.

## Consideraciones de uso y limitaciones
- El backend aplica una cadencia mínima de 1 petición por segundo a Nominatim y Overpass en modo normal; en tests se desactiva el retardo.
- Si Nominatim no encuentra la ciudad, la API devuelve `400` indicando que `city` es obligatorio o `500` con el detalle de error.
- Si Overpass responde con error o la red falla, la API devuelve `500` con el motivo devuelto por Overpass cuando está disponible.
- Asegúrate de que las peticiones nunca se hagan directamente desde el frontend: siempre deben pasar por este backend.

## Solución de problemas comunes
- **Errores de conexión en local**: verifica que tu máquina pueda resolver y alcanzar los dominios anteriores o configura `NOMINATIM_BASE_URL` y `OVERPASS_BASE_URL` hacia servicios accesibles.
- **Respuestas 429 o tiempo de espera**: respeta los límites de uso y reduce la frecuencia de consultas. Puedes reiniciar tras esperar unos minutos.
- **Datos sin calle**: la API filtra resultados sin dirección legible, por lo que un área con pocos datos puede devolver menos puntos que el límite solicitado.

## Testing
Ejecuta las pruebas del backend con:
```bash
npm test
```

## Despliegue en Vercel (API + frontend)

1. **Configura el proyecto apuntando al directorio `backend/`** en Vercel (Project Settings → General → Root Directory = `backend`).
2. **Variables de entorno obligatorias** (Project Settings → Environment Variables):
   - `NOMINATIM_BASE_URL` (opcional, por defecto `https://nominatim.openstreetmap.org`).
   - `OVERPASS_BASE_URL` (opcional, por defecto `https://overpass-api.de/api/interpreter`).
   - Define `HTTPS_PROXY`/`HTTP_PROXY` si tu red corporativa lo requiere.
3. **Runtime**: selecciona Node.js 18.
4. **Instalación y build**:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: *déjalo vacío* (Vercel servirá la función serverless, no un build estático).
5. **Entrypoint serverless**:
   - Vercel usará `api/index.ts` (incluido en `backend/api`) como handler. El archivo exporta el `app` de Express sin abrir un puerto, compatible con serverless.
   - El archivo `vercel.json` ya define `rewrites` para que todas las rutas, tanto `/api/points` como `/`, se resuelvan a esa función y el frontend estático quede incluido en el bundle.
6. **Comportamiento en producción**:
   - Las llamadas del frontend a `/api/points` funcionan sin CORS adicional porque se sirven desde el mismo origen Vercel.
   - El frontend queda servido desde la misma función, usando `frontend/` incluido en el bundle serverless.
7. **Prueba tras el deploy**:
   - Visita `https://<tu-proyecto>.vercel.app/` y realiza una búsqueda.
   - Alternativamente, prueba la API: `curl "https://<tu-proyecto>.vercel.app/api/points?city=Zaragoza&limit=3"`.
