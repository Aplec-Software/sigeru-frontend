// Gestión de incidencias (administrador): listado, detalle, asignación y cambios de estado.
import { esc, estado, fecha, toast, cargando } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { Incidencias } from '../models/recursos.js';
import { encabezado } from '../views/layout.js';
import { htmlTabla, htmlPaginacion } from '../views/tabla.js';
import { abrirModal, cerrarModal } from '../views/modal.js';
import { op } from './definiciones.js';

const TIPOS = ['desborde', 'rotura', 'quema', 'falta_recoleccion', 'otro'];

export const columnasIncidencia = [
  { campo: 'id', titulo: 'campo.numero', formato: (v) => `<strong>#${v}</strong>` },
  { campo: 'creado_en', titulo: 'campo.fecha', formato: (v) => fecha(v) },
  { campo: 'tipo', titulo: 'campo.tipo', formato: (v) => esc(t('incidencia.' + v)) },
  { campo: 'contenedor_codigo', titulo: 'campo.contenedor', formato: (v, f) => `${esc(v)}<br><small>${esc(f.direccion)}</small>` },
  { campo: 'zona', titulo: 'campo.zona' },
  { campo: 'prioridad', titulo: 'campo.prioridad', formato: (v) => `<span class="badge badge-prioridad-${esc(v)}">${esc(t('prioridad.' + v))}</span>` },
  { campo: 'cantidad_reportes', titulo: 'campo.reportes' },
  { campo: 'estado', titulo: 'campo.estado', formato: estado },
];

export async function paginaIncidencias(main, consulta = {}) {
  const filtros = { estado: consulta.estado ?? '', tipo: '', zona_id: '', prioridad: '', q: '', pagina: 1 };
  const zonas = await op.zonas();
  const sel = (nombre, opciones, prefijo) => `<label class="filtro">${esc(t('campo.' + nombre.replace('_id', '')))}<select data-f="${nombre}"><option value="">${esc(t('general.todos'))}</option>${opciones.map((o) => {
    const [v, txt] = Array.isArray(o) ? o : [o, t(prefijo + '.' + o)];
    return `<option value="${v}" ${String(filtros[nombre]) === String(v) ? 'selected' : ''}>${esc(txt)}</option>`;
  }).join('')}</select></label>`;
  main.innerHTML = encabezado(t('menu.incidencias'), t('incidencias.subtitulo'),
    `<a class="btn btn-primario" href="#/reportar">${esc(t('menu.reportar'))}</a>`) + `
    <section class="tarjeta"><div class="barra-filtros">
      <label class="filtro filtro-busqueda">${esc(t('general.buscar'))}<input type="search" data-f="q" placeholder="${esc(t('incidencias.buscar'))}"></label>
      ${sel('estado', ['abierta', 'en_curso', 'resuelta', 'descartada'], 'estado')}${sel('tipo', TIPOS, 'incidencia')}
      ${sel('zona_id', zonas)}${sel('prioridad', ['alta', 'media', 'baja'], 'prioridad')}
    </div><div data-lista></div></section>`;
  const lista = main.querySelector('[data-lista]');

  async function cargar() {
    cargando(lista);
    try {
      const r = await Incidencias.listar({ ...filtros, por_pagina: 15 });
      lista.innerHTML = htmlTabla(r.datos, columnasIncidencia, (f) => `<button class="btn btn-chico" data-ver="${f.id}">${esc(t('general.ver'))}</button>`) + htmlPaginacion(r.meta);
    } catch (e) {
      lista.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    }
  }

  main.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b?.dataset.ver) verIncidencia(b.dataset.ver, cargar, true);
    if (b?.dataset.pagina) { filtros.pagina = Number(b.dataset.pagina); cargar(); }
  });
  let espera;
  main.querySelectorAll('[data-f]').forEach((el) => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { filtros[el.dataset.f] = el.value.trim(); filtros.pagina = 1; cargar(); }, 300);
  }));
  cargar();
}

// Detalle de una incidencia con su historial; según el rol muestra las acciones posibles
export async function verIncidencia(id, alCambiar, esAdmin) {
  const r = await Incidencias.obtener(id);
  const i = r.datos;
  const cuadrillas = esAdmin ? await op.cuadrillas() : [];
  const historial = i.historial.map((h) => `<li><time>${fecha(h.creado_en)}</time> ${h.estado_anterior && h.estado_anterior !== h.estado_nuevo ? estado(h.estado_anterior) + ' → ' : ''}${estado(h.estado_nuevo)}
    <span>${esc(h.comentario || '')}</span> <small>${esc([h.usuario_nombre, h.usuario_apellido].filter(Boolean).join(' '))}</small></li>`).join('');
  const acciones = [];
  if (esAdmin && ['abierta', 'en_curso'].includes(i.estado)) {
    acciones.push(`<form data-asignar class="fila-form"><label>${esc(t('incidencias.asignar_a'))}
      <select name="cuadrilla" required><option value="">${esc(t('general.seleccionar'))}</option>${cuadrillas.map(([v, txt]) => `<option value="${v}" ${v === i.cuadrilla_id ? 'selected' : ''}>${esc(txt)}</option>`).join('')}</select></label>
      <button class="btn btn-primario">${esc(t('incidencias.asignar'))}</button></form>`);
  }
  if (i.estado === 'en_curso') {
    acciones.push(`<form data-resolver class="fila-form"><label class="crece">${esc(t('incidencias.como_se_resolvio'))}<input name="comentario" required maxlength="300"></label>
      <button class="btn btn-exito">${esc(t('incidencias.marcar_resuelta'))}</button></form>`);
  }
  if (esAdmin && i.estado === 'abierta') acciones.push(`<button class="btn btn-peligro-suave" data-estado="descartada">${esc(t('incidencias.descartar'))}</button>`);
  if (esAdmin && ['resuelta', 'descartada'].includes(i.estado)) acciones.push(`<button class="btn" data-estado="abierta">${esc(t('incidencias.reabrir'))}</button>`);

  const modal = abrirModal(`#${i.id} · ${t('incidencia.' + i.tipo)}`, `
    <dl class="ficha">
      <dt>${esc(t('campo.estado'))}</dt><dd>${estado(i.estado)} <span class="badge badge-prioridad-${esc(i.prioridad)}">${esc(t('prioridad.' + i.prioridad))}</span></dd>
      <dt>${esc(t('campo.contenedor'))}</dt><dd>${esc(i.contenedor_codigo)} · ${esc(i.direccion)} (${esc(i.zona)})</dd>
      <dt>${esc(t('campo.descripcion'))}</dt><dd>${esc(i.descripcion || '—')}</dd>
      <dt>${esc(t('campo.origen'))}</dt><dd>${esc(t('origen.' + i.origen))} · ${esc(t('incidencias.reportes', { n: i.cantidad_reportes }))}</dd>
      <dt>${esc(t('campo.cuadrilla'))}</dt><dd>${esc(i.cuadrilla || '—')}</dd>
      ${i.resolucion ? `<dt>${esc(t('campo.resolucion'))}</dt><dd>${esc(i.resolucion)}</dd>` : ''}
    </dl>
    <h3>${esc(t('incidencias.historial'))}</h3><ol class="historial">${historial}</ol>
    <div class="acciones-incidencia">${acciones.join('')}</div>`, { ancho: 'modal-ancho' });

  const hecho = (res) => { cerrarModal(); toast(res.mensaje || t('general.guardado')); alCambiar?.(); };
  const fallo = (err) => toast(err.errores ? Object.values(err.errores).join(' ') : err.message, 'error');
  modal.querySelector('[data-asignar]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    Incidencias.asignar(i.id, Number(e.target.cuadrilla.value)).then(hecho).catch(fallo);
  });
  modal.querySelector('[data-resolver]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    Incidencias.estado(i.id, 'resuelta', e.target.comentario.value.trim()).then(hecho).catch(fallo);
  });
  modal.querySelectorAll('[data-estado]').forEach((b) => b.addEventListener('click', () => {
    Incidencias.estado(i.id, b.dataset.estado, null).then(hecho).catch(fallo);
  }));
}
