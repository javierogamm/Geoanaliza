import { fetchPoints } from './api.js';
import {
  clearResults,
  renderMeta,
  renderPoints,
  setStatus,
  exportCSV
} from './ui.js';

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city');
const neighbourhoodInput = document.getElementById('neighbourhood');
const limitInput = document.getElementById('limit');
const exportButton = document.getElementById('export-btn');

const parseLimit = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 20;
  if (parsed > 100) return 100;
  return parsed;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearResults();

  const city = cityInput.value.trim();
  const neighbourhood = neighbourhoodInput.value.trim();
  const limit = parseLimit(limitInput.value);

  if (!city) {
    setStatus('Introduce un municipio para buscar.', true);
    return;
  }

  setStatus('Buscando puntos en OpenStreetMap...');

  try {
    const data = await fetchPoints({ city, neighbourhood, limit });
    renderMeta({
      city: data.city,
      neighbourhood: data.neighbourhood,
      totalAvailable: data.totalAvailable,
      returned: data.returned
    });
    renderPoints(data.points);
    setStatus('');
  } catch (error) {
    setStatus(error.message || 'No se pudo obtener puntos', true);
  }
});

exportButton.addEventListener('click', () => {
  try {
    exportCSV();
  } catch (error) {
    setStatus('No se pudo exportar el CSV', true);
  }
});
