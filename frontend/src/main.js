import { fetchPoints, fetchPointsByBbox } from './api.js';
import {
  clearResults,
  renderMeta,
  renderPoints,
  setStatus,
  exportCSV,
  getCurrentPoints,
  getCustomColumnsDataMap
} from './ui.js';
import { initColumnModal } from './columnModal.js';
import { initBaseColumnsModal, openBaseColumnsModal, hasBaseColumnsConfig } from './baseColumnsModal.js';
import { initImportExcel, getExpedientesData, hasExpedientes } from './importExcel.js';
import { initImportCsv } from './importCsv.js';
import { initTranspose, showTransposeButton, hideTransposeButton } from './transposeData.js';
import { addCustomColumn } from './columnManager.js';
import {
  initMap,
  getSelectedBoundingBox,
  clearDrawnArea,
  displayPoints as displayPointsOnMap,
  fitToBounds
} from './map.js';

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city');
const neighbourhoodInput = document.getElementById('neighbourhood');
const limitInput = document.getElementById('limit');
const exportButton = document.getElementById('export-btn');
const searchByAreaBtn = document.getElementById('search-by-area-btn');
const clearAreaBtn = document.getElementById('clear-area-btn');

// Variable para guardar los últimos puntos y poder re-renderizar
let lastPointsData = null;
// Variable para guardar puntos ficticios generados
let mockPoints = [];
// Variable para guardar el tipo de búsqueda pendiente después de configurar tesauros
let pendingSearch = null;

const parseLimit = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 20;
  if (parsed > 100) return 100;
  return parsed;
};

// Función para verificar si hay datos cargados
function hasData() {
  return (lastPointsData && lastPointsData.points && lastPointsData.points.length > 0) || mockPoints.length > 0;
}

// Función para generar puntos ficticios
function generateMockPoints(numRows) {
  mockPoints = [];
  for (let i = 0; i < numRows; i++) {
    mockPoints.push({
      id: `mock_${i}`,
      name: `Punto ${i + 1}`,
      street: `Calle ficticia ${i + 1}`,
      lat: 0,
      lng: 0,
      source: 'mock'
    });
  }
}

// Función para generar puntos desde expedientes importados
function generatePointsFromExpedientes(expedientes) {
  const { values } = expedientes;

  // Si ya tenemos puntos reales cargados, mantenerlos y solo añadir la columna de expedientes
  if (lastPointsData && lastPointsData.points && lastPointsData.points.length > 0) {
    return lastPointsData.points;
  }

  // En caso contrario, generar filas ficticias para mostrar los expedientes
  mockPoints = [];
  for (let i = 0; i < values.length; i++) {
    mockPoints.push({
      id: `expediente_${i}`,
      name: `Expediente ${i + 1}`,
      street: '',
      lat: 0,
      lng: 0,
      source: 'expediente',
      expedienteValue: values[i]
    });
  }

  return mockPoints;
}

// Inicializar el modal de columnas personalizadas
initColumnModal((numRows) => {
  // Callback: cuando se añade una columna
  if (numRows) {
    // Si se especifica número de filas, generar puntos ficticios
    generateMockPoints(numRows);
    renderPoints(mockPoints);
  } else if (lastPointsData) {
    // Si hay datos reales, re-renderizar con los datos
    renderPoints(lastPointsData.points);
  } else if (mockPoints.length > 0) {
    // Si hay puntos ficticios, re-renderizar con ellos
    renderPoints(mockPoints);
  } else {
    // Si no hay nada, renderizar tabla vacía
    renderPoints([]);
  }
}, hasData);

// Inicializar el modal de tesauros base
initBaseColumnsModal((config) => {
  // Una vez configurado, proceder con la búsqueda pendiente
  if (pendingSearch) {
    if (pendingSearch.type === 'city') {
      performSearch();
    } else if (pendingSearch.type === 'bbox') {
      performSearchByBbox(pendingSearch.bbox);
    }
    pendingSearch = null;
  }
});

// Inicializar el módulo de importación de Excel
initImportExcel((expedientes) => {
  // Cuando se importan expedientes, generar puntos y renderizar
  const pointsToRender = generatePointsFromExpedientes(expedientes);
  renderPoints(pointsToRender);
  // Mostrar botón de transponer
  showTransposeButton();
});

// Inicializar el módulo de importación de CSV
initImportCsv((columnData) => {
  // Cuando se importa una columna CSV, añadirla como columna personalizada
  addCustomColumn({
    name: columnData.name,
    reference: columnData.reference,
    type: 'csv',
    config: {
      values: columnData.values
    }
  });

  // Re-renderizar la tabla con la nueva columna
  if (lastPointsData && lastPointsData.points && lastPointsData.points.length > 0) {
    renderPoints(lastPointsData.points);
  } else if (mockPoints.length > 0) {
    renderPoints(mockPoints);
  } else {
    renderPoints([]);
  }
});

// Inicializar el módulo de transposición
initTranspose(getCurrentPoints, getCustomColumnsDataMap);

// Inicializar el mapa
initMap('map-container');

// Event listener para buscar por área dibujada en el mapa
searchByAreaBtn.addEventListener('click', async () => {
  const bbox = getSelectedBoundingBox();
  if (!bbox) {
    setStatus('Debes dibujar un área en el mapa primero.', true);
    return;
  }

  // Si no hay configuración de tesauros base, mostrar modal
  if (!hasBaseColumnsConfig()) {
    pendingSearch = { type: 'bbox', bbox };
    openBaseColumnsModal();
  } else {
    // Si ya hay configuración, proceder con la búsqueda por bbox
    await performSearchByBbox(bbox);
  }
});

// Event listener para limpiar el área dibujada
clearAreaBtn.addEventListener('click', () => {
  clearDrawnArea();
  setStatus('Área limpiada.');
  setTimeout(() => setStatus(''), 2000);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    setStatus('Introduce un municipio para buscar.', true);
    return;
  }

  // Si no hay configuración de tesauros base, mostrar modal
  if (!hasBaseColumnsConfig()) {
    pendingSearch = { type: 'city' };
    openBaseColumnsModal();
  } else {
    // Si ya hay configuración, proceder con la búsqueda
    performSearch();
  }
});

async function performSearch() {
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
    lastPointsData = data; // Guardamos los datos para re-renderizar
    mockPoints = []; // Limpiar puntos ficticios cuando se cargan datos reales
    renderMeta({
      city: data.city,
      neighbourhood: data.neighbourhood,
      totalAvailable: data.totalAvailable,
      returned: data.returned
    });
    renderPoints(data.points);

    // Mostrar puntos en el mapa
    if (data.points && data.points.length > 0) {
      displayPointsOnMap(data.points);
    }

    setStatus('');
  } catch (error) {
    setStatus(error.message || 'No se pudo obtener puntos', true);
  }
}

async function performSearchByBbox(bbox) {
  clearResults();

  const limit = parseLimit(limitInput.value);

  setStatus('Buscando puntos en el área seleccionada...');

  try {
    const data = await fetchPointsByBbox({ bbox, limit });
    lastPointsData = data; // Guardamos los datos para re-renderizar
    mockPoints = []; // Limpiar puntos ficticios cuando se cargan datos reales

    renderMeta({
      city: data.customArea ? 'Área personalizada' : data.city,
      neighbourhood: data.neighbourhood,
      totalAvailable: data.totalAvailable,
      returned: data.returned
    });
    renderPoints(data.points);

    // Mostrar puntos en el mapa
    if (data.points && data.points.length > 0) {
      displayPointsOnMap(data.points);
    }

    setStatus('');
  } catch (error) {
    setStatus(error.message || 'No se pudo obtener puntos', true);
  }
}

exportButton.addEventListener('click', () => {
  try {
    exportCSV();
  } catch (error) {
    setStatus('No se pudo exportar el CSV', true);
  }
});
