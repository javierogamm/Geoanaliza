/**
 * Módulo de gestión del mapa con capacidad de dibujar áreas
 * Usa Leaflet y Leaflet.draw para crear áreas de búsqueda
 */

let map = null;
let drawnItems = null;
let currentLayer = null;

/**
 * Inicializa el mapa de Leaflet con controles de dibujo
 * @param {string} containerId - ID del contenedor del mapa
 */
export function initMap(containerId) {
  // Crear mapa centrado en España por defecto
  map = L.map(containerId).setView([40.4168, -3.7038], 6);

  // Añadir capa de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  // Grupo para almacenar las capas dibujadas
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // Configurar controles de dibujo
  const drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
        drawError: {
          color: '#f87171',
          message: 'No puedes dibujar polígonos que se intersecten',
        },
        shapeOptions: {
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.2,
          weight: 2,
        },
      },
      rectangle: {
        shapeOptions: {
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.2,
          weight: 2,
        },
      },
      circle: false,
      circlemarker: false,
      marker: false,
      polyline: false,
    },
    edit: {
      featureGroup: drawnItems,
      remove: true,
    },
  });

  map.addControl(drawControl);

  // Eventos de dibujo
  map.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;

    // Si ya hay una capa dibujada, eliminarla
    if (currentLayer) {
      drawnItems.removeLayer(currentLayer);
    }

    drawnItems.addLayer(layer);
    currentLayer = layer;

    // Habilitar botón de búsqueda cuando se dibuja un área
    const searchBtn = document.getElementById('search-by-area-btn');
    const clearBtn = document.getElementById('clear-area-btn');
    if (searchBtn) searchBtn.disabled = false;
    if (clearBtn) clearBtn.disabled = false;

    // Hacer zoom al área dibujada
    map.fitBounds(layer.getBounds(), { padding: [50, 50] });
  });

  map.on(L.Draw.Event.DELETED, () => {
    currentLayer = null;
    const searchBtn = document.getElementById('search-by-area-btn');
    const clearBtn = document.getElementById('clear-area-btn');
    if (searchBtn) searchBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
  });

  return map;
}

/**
 * Obtiene el bounding box del área seleccionada
 * @returns {Object|null} Objeto con { south, north, west, east } o null si no hay área
 */
export function getSelectedBoundingBox() {
  if (!currentLayer) {
    return null;
  }

  const bounds = currentLayer.getBounds();
  return {
    south: bounds.getSouth(),
    north: bounds.getNorth(),
    west: bounds.getWest(),
    east: bounds.getEast(),
  };
}

/**
 * Limpia el área dibujada del mapa
 */
export function clearDrawnArea() {
  if (currentLayer && drawnItems) {
    drawnItems.removeLayer(currentLayer);
    currentLayer = null;

    const searchBtn = document.getElementById('search-by-area-btn');
    const clearBtn = document.getElementById('clear-area-btn');
    if (searchBtn) searchBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
  }
}

/**
 * Centra el mapa en una ubicación específica
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {number} zoom - Nivel de zoom (opcional, default: 13)
 */
export function centerMap(lat, lng, zoom = 13) {
  if (map) {
    map.setView([lat, lng], zoom);
  }
}

/**
 * Ajusta el mapa para mostrar un bounding box completo
 * @param {Object} bbox - Objeto con { south, north, west, east }
 */
export function fitToBounds(bbox) {
  if (map) {
    const bounds = L.latLngBounds(
      [bbox.south, bbox.west],
      [bbox.north, bbox.east]
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

/**
 * Muestra puntos en el mapa como marcadores
 * @param {Array} points - Array de puntos con { lat, lng, name, street }
 */
export function displayPoints(points) {
  if (!map) return;

  // Limpiar marcadores anteriores (excepto el área dibujada)
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Añadir nuevos marcadores
  const markers = [];
  points.forEach((point) => {
    if (point.lat && point.lng) {
      const marker = L.marker([point.lat, point.lng]);

      // Crear popup con información
      const popupContent = `
        <div style="min-width: 180px;">
          ${point.name ? `<strong>${point.name}</strong><br>` : ''}
          ${point.street ? `${point.street}<br>` : ''}
          <small style="color: var(--muted);">
            ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}
          </small>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);
      markers.push(marker);
    }
  });

  // Si hay marcadores, ajustar el zoom para mostrarlos todos
  if (markers.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
  }
}

/**
 * Obtiene la instancia del mapa
 * @returns {L.Map|null}
 */
export function getMapInstance() {
  return map;
}
