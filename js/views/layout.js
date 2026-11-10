// Estructura general de la aplicación: menú lateral según el rol,
// barra superior con idioma, notificaciones y usuario.
import { esc } from '../core/dom.js';
import { t, idiomaActual } from '../core/i18n.js';

export const MENU = {
  administrador: [
    ['panel', 'menu.panel', '▦'], ['mapa', 'menu.mapa', '◎'], ['incidencias', 'menu.incidencias', '⚑'],
    ['contenedores', 'menu.contenedores', '▣'], ['centros', 'menu.centros', '⌂'], ['maquinaria', 'menu.maquinaria', '⚙'],
    ['repuestos', 'menu.repuestos', '▤'], ['camiones', 'menu.camiones', '⛟'], ['mantenimientos', 'menu.mantenimientos', '✚'],
    ['cuadrillas', 'menu.cuadrillas', '☰'], ['rutas', 'menu.rutas', '↝'], ['asignaciones', 'menu.asignaciones', '▷'],
    ['usuarios', 'menu.usuarios', '☺'], ['informes', 'menu.informes', '▥'],
  ],
  cuadrilla: [['tareas', 'menu.tareas', '⚑'], ['mi-ruta', 'menu.mi_ruta', '↝'], ['reportar', 'menu.reportar', '✎'], ['mapa', 'menu.mapa', '◎']],
  operario: [['mi-centro', 'menu.mi_centro', '⌂'], ['maquinaria', 'menu.maquinaria', '⚙']],
  vecino: [['reportar', 'menu.reportar', '✎'], ['mis-reportes', 'menu.mis_reportes', '⚑'], ['mapa', 'menu.mapa', '◎']],
};

export function paginaInicial(rol) {
  return '/' + (MENU[rol]?.[0]?.[0] ?? 'login');
}

export function htmlAplicacion(usuario, organizacion) {
  const items = (MENU[usuario.rol] || []).concat([['perfil', 'menu.perfil', '◉']]);
  const nav = items.map(([ruta, clave, icono]) =>
    `<li><a href="#/${ruta}" data-ruta="${ruta}"><span class="icono" aria-hidden="true">${icono}</span>${esc(t(clave))}</a></li>`).join('');
  return `
    <a class="saltar" href="#contenido">${esc(t('general.saltar'))}</a>
    <header class="barra">
      <button class="btn-icono solo-movil" id="btn-menu" aria-label="${esc(t('general.menu'))}" aria-expanded="false">☰</button>
      <a class="marca" href="#${paginaInicial(usuario.rol)}"><img src="img/logo-sigeru-icono.png" alt="" width="34" height="34"><span>SiGeRU</span></a>
      <span class="organizacion">${esc(organizacion || '')}</span>
      <div class="barra-acciones">
        <button class="btn-idioma" id="btn-idioma" aria-label="${esc(t('general.cambiar_idioma'))}">${idiomaActual() === 'es' ? 'EN' : 'ES'}</button>
        <div class="notificaciones">
          <button class="btn-icono" id="btn-notificaciones" aria-haspopup="true" aria-expanded="false" aria-label="${esc(t('notificaciones.titulo'))}">
            🔔<span class="contador" id="contador-notificaciones" hidden>0</span>
          </button>
          <div class="panel-notificaciones" id="panel-notificaciones" hidden></div>
        </div>
        <div class="usuario-barra">
          <span class="usuario-nombre">${esc(usuario.nombre)} ${esc(usuario.apellido)}</span>
          <span class="usuario-rol">${esc(t('rol.' + usuario.rol))}</span>
        </div>
        <button class="btn btn-chico" id="btn-salir">${esc(t('general.salir'))}</button>
      </div>
    </header>
    <div class="cuerpo">
      <nav class="lateral" id="lateral" aria-label="${esc(t('general.menu'))}"><ul>${nav}</ul></nav>
      <main id="contenido" tabindex="-1"></main>
    </div>`;
}

export function marcarMenuActivo(ruta) {
  document.querySelectorAll('.lateral a').forEach((a) => {
    const activo = ruta.startsWith('/' + a.dataset.ruta);
    a.classList.toggle('activo', activo);
    if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

export function encabezado(titulo, subtitulo = '', accionesHtml = '') {
  return `<div class="encabezado"><div><h1>${esc(titulo)}</h1>${subtitulo ? `<p class="subtitulo">${esc(subtitulo)}</p>` : ''}</div><div class="acciones">${accionesHtml}</div></div>`;
}
