// Mapa interactivo con Leaflet y OpenStreetMap.
// Si no hay conexión a Internet (o el servidor de mosaicos no responde),
// se dibuja un plano simple en SVG con las mismas capas, para que el mapa
// siga sirviendo en la red interna.
import { MAPA } from '../config.js';
import { esc } from '../core/dom.js';
import { t } from '../core/i18n.js';

let promesaLeaflet = null;

function cargarLeaflet() {
  if (window.L) return Promise.resolve(true);
  if (!promesaLeaflet) {
    promesaLeaflet = new Promise((resolve) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.integrity = MAPA.leafletCssSri;
      css.crossOrigin = 'anonymous';
      css.href = MAPA.leafletCss;
      document.head.appendChild(css);
      const js = document.createElement('script');
      js.integrity = MAPA.leafletJsSri;
      js.crossOrigin = 'anonymous';
      js.src = MAPA.leafletJs;
      js.onload = () => resolve(true);
      js.onerror = () => resolve(false);
      document.head.appendChild(js);
      setTimeout(() => resolve(Boolean(window.L)), 4000);
    });
  }
  return promesaLeaflet;
}

export const COLORES = {
  funcional: '#3E9B4F', desbordado: '#E67E22', roto: '#D9534F', fuera_servicio: '#6B7280',
  abierta: '#D9534F', en_curso: '#F2A541', camion: '#1F5FAD', centro: '#2A7F8F',
};

/**
 * capas: { contenedores: [...], centros: [...], incidencias: [...], camiones: [...] }
 * Cada elemento necesita latitud, longitud y un texto de popup.
 */
export async function dibujarMapa(contenedor, capas, centro = [-34.896, -56.15], zoom = 13, alElegir = null) {
  const puntos = construirPuntos(capas);
  const conLeaflet = await cargarLeaflet();
  if (conLeaflet) {
    contenedor.innerHTML = '';
    const mapa = window.L.map(contenedor).setView(centro, zoom);
    window.L.tileLayer(MAPA.mosaicos, { maxZoom: 19, attribution: MAPA.atribucion }).addTo(mapa);
    const grupos = {};
    for (const p of puntos) {
      const marca = window.L.circleMarker([p.lat, p.lng], { radius: p.radio, color: '#fff', weight: 1.5, fillColor: p.color, fillOpacity: 0.95 })
        .bindPopup(p.popup);
      if (alElegir && p.capa === 'contenedores') marca.on('click', () => alElegir(p.dato));
      (grupos[p.capa] ||= window.L.layerGroup()).addLayer(marca);
    }
    Object.values(grupos).forEach((g) => g.addTo(mapa));
    window.L.control.layers(null, Object.fromEntries(Object.entries(grupos).map(([k, g]) => [t('mapa.capa_' + k), g]))).addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 50);
    return;
  }
  planoSvg(contenedor, puntos, alElegir);
}

function construirPuntos(capas) {
  const puntos = [];
  for (const c of capas.contenedores || []) {
    puntos.push({ capa: 'contenedores', lat: c.latitud, lng: c.longitud, color: COLORES[c.estado] || '#3E9B4F', radio: 6, dato: c,
      popup: `<strong>${esc(c.codigo)}</strong><br>${esc(c.direccion)}<br>${esc(c.tipo_residuo || '')}<br>${esc(t('estado.' + c.estado))} · ${c.nivel_llenado ?? 0}%` });
  }
  for (const c of capas.centros || []) {
    puntos.push({ capa: 'centros', lat: c.latitud, lng: c.longitud, color: COLORES.centro, radio: 10, dato: c,
      popup: `<strong>${esc(c.nombre)}</strong><br>${esc(t('centro.' + c.tipo))}<br>${esc(t('mapa.ocupacion'))}: ${c.porcentaje}%` });
  }
  for (const i of capas.incidencias || []) {
    puntos.push({ capa: 'incidencias', lat: i.latitud + 0.00012, lng: i.longitud + 0.00012, color: COLORES[i.estado], radio: 5, dato: i,
      popup: `<strong>#${i.id} ${esc(t('incidencia.' + i.tipo))}</strong><br>${esc(i.contenedor_codigo)} · ${esc(t('estado.' + i.estado))}<br>${esc(t('prioridad.' + i.prioridad))}` });
  }
  for (const c of capas.camiones || []) {
    puntos.push({ capa: 'camiones', lat: c.latitud, lng: c.longitud, color: COLORES.camion, radio: 8, dato: c,
      popup: `<strong>${esc(c.matricula)}</strong><br>${esc(t('estado.' + c.estado))}` });
  }
  return puntos;
}

// Plano de respaldo sin mosaicos: proyecta latitud/longitud dentro de un rectángulo
function planoSvg(contenedor, puntos, alElegir) {
  if (!puntos.length) {
    contenedor.innerHTML = `<div class="vacio">${esc(t('general.sin_datos'))}</div>`;
    return;
  }
  const lats = puntos.map((p) => p.lat), lngs = puntos.map((p) => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const W = 800, H = 480, m = 30;
  const x = (lng) => m + ((lng - minLng) / (maxLng - minLng || 1)) * (W - 2 * m);
  const y = (lat) => m + ((maxLat - lat) / (maxLat - minLat || 1)) * (H - 2 * m);
  const circulos = puntos.map((p, i) => `<circle cx="${x(p.lng).toFixed(1)}" cy="${y(p.lat).toFixed(1)}" r="${p.radio}" fill="${p.color}" stroke="#fff" stroke-width="1.5" data-i="${i}" tabindex="0"><title>${esc(p.popup.replace(/<[^>]+>/g, ' · '))}</title></circle>`).join('');
  contenedor.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="plano" role="img" aria-label="${esc(t('mapa.titulo'))}">
    <rect width="${W}" height="${H}" fill="var(--fondo-plano)"/>
    <text x="${W - 12}" y="${H - 12}" text-anchor="end" class="g-etiqueta">${esc(t('mapa.sin_conexion'))}</text>${circulos}</svg>
    <div class="plano-info" aria-live="polite"></div>`;
  const info = contenedor.querySelector('.plano-info');
  contenedor.querySelectorAll('circle').forEach((c) => c.addEventListener('click', () => {
    const p = puntos[c.dataset.i];
    info.innerHTML = p.popup;
    if (alElegir && p.capa === 'contenedores') alElegir(p.dato);
  }));
}

export function leyendaMapa() {
  const items = ['funcional', 'desbordado', 'roto'].map((e) => `<li><span class="punto" style="background:${COLORES[e]}"></span>${esc(t('estado.' + e))}</li>`).join('')
    + `<li><span class="punto grande" style="background:${COLORES.centro}"></span>${esc(t('mapa.capa_centros'))}</li>`;
  return `<ul class="leyenda leyenda-mapa">${items}</ul>`;
}
