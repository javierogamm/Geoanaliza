import { Router } from 'express';
import { fetchCityBoundingBox, fetchNeighbourhoodBoundingBox } from '../services/nominatim';
import { queryOverpassForNodes } from '../services/overpass';
import { BoundingBox } from '../types';

const router = Router();

const parseLimit = (rawLimit: unknown): number => {
  const value = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : Number(rawLimit);
  if (Number.isNaN(value) || value <= 0) {
    return 20;
  }
  return Math.min(value, 100);
};

router.get('/', async (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  const neighbourhood =
    typeof req.query.neighbourhood === 'string' ? req.query.neighbourhood.trim() : '';
  const limit = parseLimit(req.query.limit);

  console.info(
    '[points] petición recibida',
    JSON.stringify({ city, neighbourhood, limit, hasCustomBbox: Boolean(req.query.bbox) })
  );

  // Soporte para bounding box personalizado
  const customBbox = req.query.bbox;
  let usesCustomBbox = false;
  let searchBoundingBox: BoundingBox | null = null;

  // Si se proporciona un bbox personalizado, usarlo directamente
  if (customBbox && typeof customBbox === 'string') {
    try {
      const parsed = JSON.parse(customBbox);
      if (
        typeof parsed.south === 'number' &&
        typeof parsed.north === 'number' &&
        typeof parsed.west === 'number' &&
        typeof parsed.east === 'number'
      ) {
        searchBoundingBox = {
          south: parsed.south,
          north: parsed.north,
          west: parsed.west,
          east: parsed.east,
        };
        usesCustomBbox = true;
      } else {
        return res.status(400).json({ error: 'El bbox debe contener south, north, west, east' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'El parámetro bbox debe ser un JSON válido' });
    }
  }

  // Si no se proporciona bbox personalizado, city es obligatorio
  if (!usesCustomBbox && !city) {
    return res.status(400).json({ error: 'Debes proporcionar city o bbox' });
  }

  try {
    let cityName: string | null = null;
    let resolvedNeighbourhood: string | null = null;

    // Si no hay bbox personalizado, buscar por ciudad/barrio
    if (!usesCustomBbox) {
      const cityInfo = await fetchCityBoundingBox(city);
      searchBoundingBox = cityInfo.boundingBox;
      cityName = cityInfo.city;
      console.info('[points] ciudad resuelta en Nominatim', cityName, searchBoundingBox);

      if (neighbourhood) {
        const areaBox = await fetchNeighbourhoodBoundingBox(cityInfo.city, neighbourhood);
        if (areaBox) {
          searchBoundingBox = areaBox;
          resolvedNeighbourhood = neighbourhood;
          console.info('[points] barrio resuelto en Nominatim', resolvedNeighbourhood, areaBox);
        }
      }
    }

    if (!searchBoundingBox) {
      return res.status(400).json({ error: 'No se pudo determinar el área de búsqueda' });
    }

    const { totalAvailable, points } = await queryOverpassForNodes(searchBoundingBox, limit);

    return res.json({
      city: cityName,
      neighbourhood: resolvedNeighbourhood,
      customArea: usesCustomBbox,
      totalAvailable,
      returned: points.length,
      points
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo completar la búsqueda de puntos';
    console.error(
      '[points] error al obtener puntos',
      JSON.stringify({ city, neighbourhood, limit, hasCustomBbox: usesCustomBbox }),
      error
    );
    return res.status(500).json({ error: message });
  }
});

export default router;
