// Utilidades para construir la interfaz sin librerías.
import { t, idiomaActual } from './i18n.js';

// Escapa texto antes de insertarlo como HTML (previene XSS)
export function esc(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function $(selector, raiz = document) {
  return raiz.querySelector(selector);
}

export function $$(selector, raiz = document) {
  return [...raiz.querySelectorAll(selector)];
}

export function fecha(valor, conHora = true) {
  if (!valor) return '—';
  const d = new Date(valor.replace(' ', 'T'));
  const opciones = conHora
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' };
  return d.toLocaleString(idiomaActual() === 'en' ? 'en-GB' : 'es-UY', opciones);
}

export function numero(valor, decimales = 0) {
  return Number(valor ?? 0).toLocaleString(idiomaActual() === 'en' ? 'en-US' : 'es-UY', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

// Etiqueta de color para estados (badge)
export function estado(valor) {
  if (valor === null || valor === undefined) return '';
  return `<span class="badge badge-${esc(valor)}">${esc(t('estado.' + valor))}</span>`;
}

export function toast(mensaje, tipo = 'ok') {
  const caja = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  el.textContent = mensaje;
  caja.appendChild(el);
  setTimeout(() => el.classList.add('saliendo'), 3800);
  setTimeout(() => el.remove(), 4300);
}

export function cargando(contenedor) {
  contenedor.innerHTML = `<div class="cargando" aria-live="polite"><span class="spinner"></span>${esc(t('general.cargando'))}</div>`;
}

export function vacio(mensaje) {
  return `<div class="vacio"><p>${esc(mensaje || t('general.sin_datos'))}</p></div>`;
}

// Descarga un archivo (por ejemplo el CSV de un informe)
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
