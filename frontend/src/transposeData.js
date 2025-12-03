import { getExpedientesData } from './importExcel.js';
import { getCustomColumns } from './columnManager.js';
import { getBaseColumnsConfig } from './baseColumnsModal.js';

const modal = document.getElementById('transpose-modal');
const transposeBtn = document.getElementById('transpose-btn');
const closeBtn = document.getElementById('close-transpose-modal');
const exportBtn = document.getElementById('export-transposed-excel');
const tableContainer = document.getElementById('transposed-table-container');

// Datos transpuestos
let transposedData = null;

export function initTranspose(getCurrentPoints, getCustomColumnsData) {
  // Mostrar/ocultar botón según haya expedientes
  transposeBtn.addEventListener('click', () => {
    const points = getCurrentPoints();
    const customColumnsData = getCustomColumnsData();
    transposeAndShow(points, customColumnsData);
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  exportBtn.addEventListener('click', exportToExcel);
}

export function showTransposeButton() {
  transposeBtn.style.display = 'block';
}

export function hideTransposeButton() {
  transposeBtn.style.display = 'none';
}

function transposeAndShow(points, customColumnsData) {
  if (!points || points.length === 0) {
    alert('No hay datos para transponer');
    return;
  }

  const expedientes = getExpedientesData();
  if (!expedientes) {
    alert('Solo se puede transponer cuando hay expedientes importados');
    return;
  }

  // Generar datos transpuestos
  transposedData = generateTransposedData(points, customColumnsData, expedientes);

  // Renderizar tabla
  renderTransposedTable(transposedData);

  // Abrir modal
  modal.classList.add('active');
}

function generateTransposedData(points, customColumnsData, expedientes) {
  const baseConfig = getBaseColumnsConfig();
  const customColumns = getCustomColumns();

  // Agrupar por expediente
  const groupedByExpediente = new Map();

  points.forEach((point, index) => {
    if (point.source !== 'expediente') return;

    const expedienteValue = point.expedienteValue;
    if (!groupedByExpediente.has(expedienteValue)) {
      groupedByExpediente.set(expedienteValue, []);
    }

    // Crear fila con todos los datos
    const rowData = {
      expediente: expedienteValue,
      nombre: point.name,
      street: point.street,
      lat: point.lat,
      lng: point.lng
    };

    // Añadir valores de columnas personalizadas
    const pointData = customColumnsData.get(point.id);
    if (pointData) {
      customColumns.forEach((column) => {
        rowData[column.id] = pointData.get(column.id);
      });
    }

    groupedByExpediente.get(expedienteValue).push(rowData);
  });

  // Generar headers
  const headers = [expedientes.name, 'Nombre'];

  if (baseConfig) {
    headers.push(baseConfig.street.name, baseConfig.lat.name, baseConfig.lng.name);
  } else {
    headers.push('Calle', 'Latitud', 'Longitud');
  }

  customColumns.forEach((column) => {
    headers.push(column.name);
  });

  // Generar filas
  const rows = [];
  groupedByExpediente.forEach((data, expedienteValue) => {
    // Primera fila del expediente con todos los datos
    data.forEach((rowData, index) => {
      const row = [
        index === 0 ? expedienteValue : '', // Solo mostrar expediente en primera fila
        rowData.nombre,
        rowData.street || '',
        rowData.lat ? rowData.lat.toFixed(5) : '',
        rowData.lng ? rowData.lng.toFixed(5) : ''
      ];

      // Añadir valores de columnas personalizadas
      customColumns.forEach((column) => {
        const value = rowData[column.id];
        row.push(formatCellValueForTable(column, value));
      });

      rows.push(row);
    });
  });

  return { headers, rows };
}

function formatCellValueForTable(column, value) {
  if (!value) return '';

  switch (column.type) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);

    case 'date':
      if (!(value instanceof Date)) return '';
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(value);

    default:
      return String(value);
  }
}

function renderTransposedTable(data) {
  const { headers, rows } = data;

  const table = document.createElement('table');
  table.className = 'results-table';

  // Headers
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Body
  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell, index) => {
      const td = document.createElement('td');
      td.textContent = cell;
      // Destacar columna de expediente
      if (index === 0 && cell) {
        td.style.fontWeight = '600';
        td.style.background = 'rgba(16, 185, 129, 0.08)';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableContainer.innerHTML = '';
  tableContainer.appendChild(table);
}

function closeModal() {
  modal.classList.remove('active');
}

function exportToExcel() {
  if (!transposedData) {
    alert('No hay datos transpuestos para exportar');
    return;
  }

  const { headers, rows } = transposedData;

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Crear datos para la hoja
  const wsData = [headers, ...rows];

  // Crear worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Añadir worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Datos Transpuestos');

  // Generar archivo Excel
  XLSX.writeFile(wb, 'datos_transpuestos.xlsx');
}
