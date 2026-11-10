// Tabla de datos con paginación.
import { esc, vacio } from '../core/dom.js';
import { t } from '../core/i18n.js';

/**
 * columnas: [{ campo, titulo, formato?: (valor, fila) => html }]
 * acciones: (fila) => html con botones
 */
export function htmlTabla(filas, columnas, acciones = null) {
  if (!filas.length) return vacio();
  const cabecera = columnas.map((c) => `<th scope="col">${esc(t(c.titulo))}</th>`).join('') + (acciones ? `<th scope="col" class="col-acciones">${esc(t('general.acciones'))}</th>` : '');
  const cuerpo = filas.map((f) => `<tr>${columnas.map((c) => {
    const valor = f[c.campo];
    const contenido = c.formato ? c.formato(valor, f) : esc(valor ?? '—');
    return `<td data-titulo="${esc(t(c.titulo))}">${contenido}</td>`;
  }).join('')}${acciones ? `<td class="col-acciones">${acciones(f)}</td>` : ''}</tr>`).join('');
  return `<div class="tabla-contenedor"><table class="tabla"><thead><tr>${cabecera}</tr></thead><tbody>${cuerpo}</tbody></table></div>`;
}

export function htmlPaginacion(meta) {
  if (!meta || meta.paginas <= 1) return '';
  return `
    <nav class="paginacion" aria-label="${esc(t('general.paginacion'))}">
      <button class="btn btn-chico" data-pagina="${meta.pagina - 1}" ${meta.pagina <= 1 ? 'disabled' : ''}>‹ ${esc(t('general.anterior'))}</button>
      <span>${esc(t('general.pagina_de', { pagina: meta.pagina, paginas: meta.paginas, total: meta.total }))}</span>
      <button class="btn btn-chico" data-pagina="${meta.pagina + 1}" ${meta.pagina >= meta.paginas ? 'disabled' : ''}>${esc(t('general.siguiente'))} ›</button>
    </nav>`;
}
