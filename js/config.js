// Direcciones de las APIs. Todas pasan por el gateway (mismo dominio), por eso son rutas relativas.
export const API = {
  usuarios: '/api/usuarios',
  gestion: '/api/gestion',
  recoleccion: '/api/recoleccion',
};

// Cada cuánto se consultan las notificaciones nuevas (milisegundos)
export const INTERVALO_NOTIFICACIONES = 45000;

// Librería de mapas (Leaflet) y servidor de mosaicos de OpenStreetMap
export const MAPA = {
  leafletJs: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  leafletCss: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  // integridad (SRI): si el archivo de unpkg cambia, el navegador no lo ejecuta y se usa el plano de respaldo
  leafletJsSri: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
  leafletCssSri: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
  mosaicos: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  atribucion: '&copy; colaboradores de OpenStreetMap',
};
