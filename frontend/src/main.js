import { fetchPoints } from './api.js';
import {
  clearResults,
  renderMeta,
  renderPoints,
  setStatus,
  exportCSV
} from './ui.js';
import { initColumnModal, enableAddColumnButton, disableAddColumnButton } from './columnModal.js';

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city');
const neighbourhoodInput = document.getElementById('neighbourhood');
const limitInput = document.getElementById('limit');
const exportButton = document.getElementById('export-btn');

// Variable para guardar los últimos puntos y poder re-renderizar
let lastPointsData = null;

const parseLimit = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 20;
  if (parsed > 100) return 100;
  return parsed;
};

// Inicializar el modal de columnas personalizadas
initColumnModal(() => {
  // Callback: cuando se añade una columna, re-renderizar la tabla
  if (lastPointsData) {
    renderPoints(lastPointsData.points);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearResults();
  disableAddColumnButton();

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
    lastPointsData = data; // Guardamos los datos para re-renderizar
    renderMeta({
      city: data.city,
      neighbourhood: data.neighbourhood,
      totalAvailable: data.totalAvailable,
      returned: data.returned
    });
    renderPoints(data.points);
    enableAddColumnButton(); // Habilitar botón de añadir columna
    setStatus('');
  } catch (error) {
    setStatus(error.message || 'No se pudo obtener puntos', true);
    disableAddColumnButton();
  }
});

exportButton.addEventListener('click', () => {
  try {
    exportCSV();
  } catch (error) {
    setStatus('No se pudo exportar el CSV', true);
  }
});
