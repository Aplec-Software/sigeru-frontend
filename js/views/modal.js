// Ventana modal reutilizable (formularios y confirmaciones).
import { esc } from '../core/dom.js';
import { t } from '../core/i18n.js';

export function abrirModal(titulo, contenidoHtml, { ancho = '' } = {}) {
  cerrarModal();
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal ${ancho}" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <header class="modal-cabecera">
        <h2 id="modal-titulo">${esc(titulo)}</h2>
        <button type="button" class="btn-icono" data-cerrar aria-label="${esc(t('general.cerrar'))}">✕</button>
      </header>
      <div class="modal-cuerpo">${contenidoHtml}</div>
    </div>`;
  fondo.addEventListener('click', (e) => {
    if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrarModal();
  });
  document.addEventListener('keydown', cerrarConEscape);
  document.body.appendChild(fondo);
  fondo.querySelector('input, select, textarea, button')?.focus();
  return fondo.querySelector('.modal');
}

function cerrarConEscape(e) {
  if (e.key === 'Escape') cerrarModal();
}

export function cerrarModal() {
  document.querySelector('.modal-fondo')?.remove();
  document.removeEventListener('keydown', cerrarConEscape);
}

export function confirmar(mensaje) {
  return new Promise((resolve) => {
    const modal = abrirModal(t('general.confirmar'), `
      <p>${esc(mensaje)}</p>
      <div class="acciones-form">
        <button type="button" class="btn" data-no>${esc(t('general.cancelar'))}</button>
        <button type="button" class="btn btn-peligro" data-si>${esc(t('general.aceptar'))}</button>
      </div>`);
    modal.querySelector('[data-si]').onclick = () => { cerrarModal(); resolve(true); };
    modal.querySelector('[data-no]').onclick = () => { cerrarModal(); resolve(false); };
  });
}
