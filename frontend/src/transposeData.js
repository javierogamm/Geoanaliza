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

  // Headers: Nº Expediente | Nombre del tesauro | Tipo | Valor
  const headers = [expedientes.name, 'Nombre del tesauro', 'Tipo', 'Valor'];

  const rows = [];

  points.forEach((point) => {
    if (point.source !== 'expediente') return;

    const expedienteValue = point.expedienteValue;

    // Para cada columna base, crear una fila
    if (baseConfig) {
      // Calle
      rows.push([
        expedienteValue,
        baseConfig.street.name,
        'Texto',
        point.street || ''
      ]);

      // Latitud
      rows.push([
        expedienteValue,
        baseConfig.lat.name,
        'Texto',
        point.lat ? point.lat.toFixed(5) : ''
      ]);

      // Longitud
      rows.push([
        expedienteValue,
        baseConfig.lng.name,
        'Texto',
        point.lng ? point.lng.toFixed(5) : ''
      ]);
    } else {
      // Sin configuración base
      rows.push([expedienteValue, 'Calle', 'Texto', point.street || '']);
      rows.push([expedienteValue, 'Latitud', 'Texto', point.lat ? point.lat.toFixed(5) : '']);
      rows.push([expedienteValue, 'Longitud', 'Texto', point.lng ? point.lng.toFixed(5) : '']);
    }

    // Para cada columna personalizada, crear una fila
    const pointData = customColumnsData.get(point.id);
    if (pointData) {
      customColumns.forEach((column) => {
        const value = pointData.get(column.id);
        const formattedValue = formatCellValueForTable(column, value);

        rows.push([
          expedienteValue,
          column.name,
          'Texto',
          formattedValue
        ]);
      });
    }
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
