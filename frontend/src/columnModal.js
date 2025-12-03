import { addCustomColumn } from './columnManager.js';

const modal = document.getElementById('column-modal');
const openBtn = document.getElementById('add-column-btn');
const closeBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-modal');
const form = document.getElementById('column-form');
const typeSelect = document.getElementById('column-type');

// Secciones de configuración
const configSections = {
  selector: document.getElementById('config-selector'),
  number: document.getElementById('config-number'),
  currency: document.getElementById('config-currency'),
  date: document.getElementById('config-date')
};

// Callback que se ejecuta cuando se añade una columna
let onColumnAddedCallback = null;

export function initColumnModal(onColumnAdded) {
  onColumnAddedCallback = onColumnAdded;

  // Abrir modal
  openBtn.addEventListener('click', openModal);

  // Cerrar modal
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Cambio de tipo de columna
  typeSelect.addEventListener('change', handleTypeChange);

  // Añadir opción al selector
  document.getElementById('add-option-btn').addEventListener('click', addSelectorOption);

  // Submit del formulario
  form.addEventListener('submit', handleFormSubmit);

  // Inicializar fechas por defecto
  const today = new Date().toISOString().split('T')[0];
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  document.getElementById('date-min').value = oneYearAgo;
  document.getElementById('date-max').value = today;
}

function openModal() {
  modal.classList.add('active');
  resetForm();
}

function closeModal() {
  modal.classList.remove('active');
  resetForm();
}

function resetForm() {
  form.reset();
  hideAllConfigSections();
  document.getElementById('selector-options').innerHTML = '';
}

function hideAllConfigSections() {
  Object.values(configSections).forEach(section => {
    section.style.display = 'none';
  });
}

function handleTypeChange(e) {
  hideAllConfigSections();
  const type = e.target.value;

  if (type && configSections[type]) {
    configSections[type].style.display = 'block';

    // Si es selector, añadimos 2 opciones por defecto
    if (type === 'selector') {
      const container = document.getElementById('selector-options');
      if (container.children.length === 0) {
        addSelectorOption();
        addSelectorOption();
      }
    }
  }
}

function addSelectorOption() {
  const container = document.getElementById('selector-options');
  const optionIndex = container.children.length;

  const optionDiv = document.createElement('div');
  optionDiv.className = 'selector-option';
  optionDiv.innerHTML = `
    <input type="text" placeholder="Nombre de la opción" required />
    <input type="number" min="0" max="100" step="1" placeholder="%" required />
    <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(optionDiv);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const columnName = document.getElementById('column-name').value.trim();
  const columnType = document.getElementById('column-type').value;

  if (!columnName || !columnType) {
    alert('Por favor, completa todos los campos obligatorios');
    return;
  }

  const config = extractConfig(columnType);

  if (!config) {
    return;
  }

  // Añadir la columna
  addCustomColumn({
    name: columnName,
    type: columnType,
    config: config
  });

  closeModal();

  // Ejecutar callback
  if (onColumnAddedCallback) {
    onColumnAddedCallback();
  }
}

function extractConfig(type) {
  switch (type) {
    case 'selector':
      return extractSelectorConfig();

    case 'number':
      return extractNumberConfig();

    case 'currency':
      return extractCurrencyConfig();

    case 'date':
      return extractDateConfig();

    default:
      return null;
  }
}

function extractSelectorConfig() {
  const optionsContainer = document.getElementById('selector-options');
  const optionDivs = optionsContainer.querySelectorAll('.selector-option');

  if (optionDivs.length === 0) {
    alert('Debes añadir al menos una opción');
    return null;
  }

  const options = [];
  let totalPercentage = 0;

  optionDivs.forEach((div) => {
    const labelInput = div.querySelector('input[type="text"]');
    const percentageInput = div.querySelector('input[type="number"]');

    const label = labelInput.value.trim();
    const percentage = parseFloat(percentageInput.value);

    if (!label || isNaN(percentage)) {
      return;
    }

    options.push({ label, percentage });
    totalPercentage += percentage;
  });

  if (options.length === 0) {
    alert('Debes añadir al menos una opción válida');
    return null;
  }

  if (Math.abs(totalPercentage - 100) > 0.01) {
    alert(`La suma de porcentajes debe ser 100% (actual: ${totalPercentage}%)`);
    return null;
  }

  return { options };
}

function extractNumberConfig() {
  const min = document.getElementById('number-min').value;
  const max = document.getElementById('number-max').value;

  if (min === '' || max === '') {
    alert('Debes especificar un valor mínimo y máximo');
    return null;
  }

  const minValue = parseFloat(min);
  const maxValue = parseFloat(max);

  if (minValue >= maxValue) {
    alert('El valor mínimo debe ser menor que el máximo');
    return null;
  }

  return { min: minValue, max: maxValue };
}

function extractCurrencyConfig() {
  const min = document.getElementById('currency-min').value;
  const max = document.getElementById('currency-max').value;

  if (min === '' || max === '') {
    alert('Debes especificar un valor mínimo y máximo');
    return null;
  }

  const minValue = parseFloat(min);
  const maxValue = parseFloat(max);

  if (minValue >= maxValue) {
    alert('El valor mínimo debe ser menor que el máximo');
    return null;
  }

  return { min: minValue, max: maxValue };
}

function extractDateConfig() {
  const min = document.getElementById('date-min').value;
  const max = document.getElementById('date-max').value;

  if (!min || !max) {
    alert('Debes especificar una fecha mínima y máxima');
    return null;
  }

  const minDate = new Date(min);
  const maxDate = new Date(max);

  if (minDate >= maxDate) {
    alert('La fecha mínima debe ser anterior a la fecha máxima');
    return null;
  }

  return { min, max };
}

export function enableAddColumnButton() {
  openBtn.disabled = false;
}

export function disableAddColumnButton() {
  openBtn.disabled = true;
}
