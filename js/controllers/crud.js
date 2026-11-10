// Controlador genérico para las pantallas de ABM (listado + formulario).
// Cada recurso se describe en definiciones.js: columnas, campos y filtros.
import { esc, toast, cargando } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { encabezado } from '../views/layout.js';
import { htmlTabla, htmlPaginacion } from '../views/tabla.js';
import { htmlCampos, leerFormulario, validarFormulario, mostrarErroresApi } from '../views/formulario.js';
import { abrirModal, cerrarModal, confirmar } from '../views/modal.js';

export async function paginaCrud(main, def, consulta = {}) {
  const estado = { pagina: 1, q: '', filtros: { ...(def.filtrosIniciales || {}), ...consulta } };
  // las opciones de algunos filtros vienen de la API (zonas, camiones...)
  const opcionesFiltros = await Promise.all((def.filtros || []).map((f) => (typeof f.opciones === 'function' ? f.opciones() : f.opciones)));
  const filtrosHtml = (def.filtros || []).map((f, i) => `
    <label class="filtro">${esc(t(f.etiqueta))}
      <select data-filtro="${f.nombre}">
        <option value="">${esc(t('general.todos'))}</option>
        ${opcionesFiltros[i].map((o) => {
          const [v, texto] = Array.isArray(o) ? o : [o, t(`${f.prefijo || 'estado'}.${o}`)];
          return `<option value="${esc(v)}" ${String(estado.filtros[f.nombre] ?? '') === String(v) ? 'selected' : ''}>${esc(texto)}</option>`;
        }).join('')}
      </select>
    </label>`).join('');

  main.innerHTML = encabezado(t(def.titulo), def.subtitulo ? t(def.subtitulo) : '',
    def.puedeCrear === false ? '' : `<button class="btn btn-primario" data-nuevo>+ ${esc(t('general.nuevo'))}</button>`) + `
    <section class="tarjeta">
      <div class="barra-filtros">
        <label class="filtro filtro-busqueda">${esc(t('general.buscar'))}
          <input type="search" data-buscar placeholder="${esc(t('general.buscar_placeholder'))}">
        </label>
        ${filtrosHtml}
      </div>
      <div data-lista></div>
    </section>`;

  const lista = main.querySelector('[data-lista]');

  async function cargar() {
    cargando(lista);
    try {
      const r = await def.modelo.listar({ pagina: estado.pagina, por_pagina: 15, q: estado.q, ...estado.filtros });
      lista.innerHTML = htmlTabla(r.datos, def.columnas, (fila) => acciones(fila)) + htmlPaginacion(r.meta);
    } catch (e) {
      lista.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    }
  }

  function acciones(fila) {
    const extra = def.accionesExtra ? def.accionesExtra(fila) : '';
    const editar = def.puedeEditar === false ? '' : `<button class="btn btn-chico" data-editar="${fila.id}">${esc(t('general.editar'))}</button>`;
    const borrar = def.puedeEliminar === false ? '' : `<button class="btn btn-chico btn-peligro-suave" data-eliminar="${fila.id}">${esc(t(def.textoEliminar || 'general.eliminar'))}</button>`;
    return `<div class="botones-fila">${extra}${editar}${borrar}</div>`;
  }

  async function abrirFormulario(id = null) {
    let valores = {};
    if (id) {
      try {
        valores = (await def.modelo.obtener(id)).datos;
        if (def.adaptarValores) valores = def.adaptarValores(valores);
      } catch (e) {
        toast(e.message, 'error');
        return;
      }
    }
    const campos = typeof def.campos === 'function' ? await def.campos(Boolean(id)) : def.campos;
    const modal = abrirModal(t(id ? 'general.editar' : 'general.nuevo') + ' · ' + t(def.singular), `
      <form class="form-grid" novalidate>
        ${htmlCampos(campos, valores)}
        <div class="acciones-form campo-completo">
          <button type="button" class="btn" data-cerrar>${esc(t('general.cancelar'))}</button>
          <button type="submit" class="btn btn-primario">${esc(t('general.guardar'))}</button>
        </div>
      </form>`, { ancho: 'modal-ancho' });
    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validarFormulario(form, campos)) return;
      let datos = leerFormulario(form, campos);
      if (def.prepararDatos) datos = def.prepararDatos(datos, Boolean(id));
      const boton = form.querySelector('[type=submit]');
      boton.disabled = true;
      try {
        const r = id ? await def.modelo.modificar(id, datos) : await def.modelo.crear(datos);
        cerrarModal();
        toast(r.mensaje || t('general.guardado'));
        cargar();
      } catch (err) {
        if (err.status === 422) mostrarErroresApi(form, err.errores);
        toast(err.message, 'error');
      } finally {
        boton.disabled = false;
      }
    });
  }

  main.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.nuevo !== undefined) abrirFormulario();
    else if (b.dataset.editar) abrirFormulario(b.dataset.editar);
    else if (b.dataset.pagina) { estado.pagina = Number(b.dataset.pagina); cargar(); }
    else if (b.dataset.eliminar) {
      if (!(await confirmar(t('general.confirmar_eliminar')))) return;
      try {
        const r = await def.modelo.borrar(b.dataset.eliminar);
        toast(r.mensaje || t('general.eliminado'));
        cargar();
      } catch (err) {
        toast(err.message, 'error');
      }
    } else if (def.alAccion) {
      def.alAccion(b, cargar);
    }
  });

  // selects dentro de la tabla (por ejemplo, cambiar el estado de una máquina)
  main.addEventListener('change', (e) => {
    if (!e.target.dataset.filtro && def.alCambiar) def.alCambiar(e.target, cargar);
  });

  let espera;
  main.querySelector('[data-buscar]').addEventListener('input', (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => { estado.q = e.target.value.trim(); estado.pagina = 1; cargar(); }, 350);
  });
  main.querySelectorAll('[data-filtro]').forEach((s) => s.addEventListener('change', () => {
    estado.filtros[s.dataset.filtro] = s.value;
    estado.pagina = 1;
    cargar();
  }));

  cargar();
}
