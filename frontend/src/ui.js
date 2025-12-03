import { getCustomColumns, generateCellValue, formatCellValue, formatCellValueForCSV } from './columnManager.js';

const resultsList = document.getElementById('results-list');
const resultsMeta = document.getElementById('results-meta');
const statusMessage = document.getElementById('status-message');
const exportButton = document.getElementById('export-btn');

// Guardamos los últimos puntos obtenidos para poder exportarlos
let currentPoints = [];
// Guardamos los datos generados para las columnas personalizadas
let customColumnsData = new Map(); // Map<pointId, Map<columnId, value>>

export function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#f87171' : '';
}

export function renderMeta({ city, neighbourhood, totalAvailable, returned }) {
  const scope = neighbourhood ? `${neighbourhood} · ${city}` : city;
  resultsMeta.textContent = `${returned} de ${totalAvailable || returned} puntos para ${scope}`;
}

export function renderPoints(points) {
  resultsList.innerHTML = '';
  currentPoints = points || [];

  if (!currentPoints || currentPoints.length === 0) {
    resultsList.innerHTML = '<p class="meta">Sin resultados para esta búsqueda.</p>';
    if (exportButton) exportButton.disabled = true;
    return;
  }

  // Generar datos para columnas personalizadas
  generateCustomColumnsData();

  const table = document.createElement('table');
  table.className = 'results-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Columnas base
  ['Nombre', 'Calle', 'Latitud', 'Longitud'].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });

  // Columnas personalizadas
  const customColumns = getCustomColumns();
  customColumns.forEach((column) => {
    const th = document.createElement('th');
    th.textContent = column.name;
    th.style.background = 'rgba(59, 130, 246, 0.12)'; // Color diferente para destacar
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  currentPoints.forEach((point, index) => {
    const row = document.createElement('tr');

    // Celdas base
    const nameCell = document.createElement('td');
    nameCell.textContent = point.name || 'Punto sin nombre';

    const streetCell = document.createElement('td');
    streetCell.textContent = point.street || 'Dirección no disponible';

    const latCell = document.createElement('td');
    latCell.textContent = point.lat.toFixed(5);

    const lngCell = document.createElement('td');
    lngCell.textContent = point.lng.toFixed(5);

    [nameCell, streetCell, latCell, lngCell].forEach((cell) => row.appendChild(cell));

    // Celdas personalizadas
    customColumns.forEach((column) => {
      const cell = document.createElement('td');
      const value = getCustomColumnValue(point.id, column.id);
      cell.textContent = formatCellValue(column, value);
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  resultsList.appendChild(table);

  if (exportButton) exportButton.disabled = false;
}

// Genera los datos para todas las columnas personalizadas
function generateCustomColumnsData() {
  customColumnsData.clear();
  const customColumns = getCustomColumns();

  currentPoints.forEach((point, index) => {
    const pointData = new Map();

    customColumns.forEach((column) => {
      const value = generateCellValue(column, index, currentPoints.length);
      pointData.set(column.id, value);
    });

    customColumnsData.set(point.id, pointData);
  });
}

// Obtiene el valor de una columna personalizada para un punto
function getCustomColumnValue(pointId, columnId) {
  const pointData = customColumnsData.get(pointId);
  if (!pointData) return '';
  return pointData.get(columnId) || '';
}

export function clearResults() {
  resultsList.innerHTML = '';
  resultsMeta.textContent = '';
  currentPoints = [];
  if (exportButton) exportButton.disabled = true;
}

// 👉 Formateo numérico para CSV en locale es-ES: decimal con coma
function formatNumberForCsv(value) {
  if (typeof value !== 'number') return '';
  // 37.37398 -> "37,37398"
  return value.toFixed(5).replace('.', ',');
}

// Escapa valores para CSV (usamos ; como separador)
function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(';') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function exportCSV() {
  if (!currentPoints || !currentPoints.length) {
    return;
  }

  const customColumns = getCustomColumns();
  const headers = ['Nombre', 'Calle', 'Latitud', 'Longitud'];

  // Añadir headers de columnas personalizadas
  customColumns.forEach((column) => {
    headers.push(column.name);
  });

  const rows = currentPoints.map((point) => {
    const row = [
      point.name || 'Punto sin nombre',
      point.street || 'Dirección no disponible',
      formatNumberForCsv(point.lat),
      formatNumberForCsv(point.lng)
    ];

    // Añadir valores de columnas personalizadas
    customColumns.forEach((column) => {
      const value = getCustomColumnValue(point.id, column.id);
      row.push(formatCellValueForCSV(column, value));
    });

    return row;
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(';')) // separador ;
    .join('\r\n');

  // 👉 Añadimos BOM para que Excel reconozca UTF-8 y no destroce los acentos
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'puntos.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
