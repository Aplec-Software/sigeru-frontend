// Descripción de cada pantalla de ABM: qué columnas se listan y qué campos tiene el formulario.
import { esc, estado, fecha, numero, toast } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { rol } from '../core/sesion.js';
import { validarCedula, validarClave } from '../views/formulario.js';
import { abrirModal, cerrarModal } from '../views/modal.js';
import {
  Usuarios, Zonas, TiposResiduo, Contenedores, Centros, Maquinaria, Repuestos,
  Camiones, Mantenimientos, Cuadrillas, Rutas, Asignaciones,
} from '../models/recursos.js';

// --------------------------------------------- opciones de los desplegables
const cache = {};
async function opciones(clave, cargar) {
  if (!cache[clave]) cache[clave] = cargar().then((r) => r.datos).catch(() => []);
  return cache[clave];
}
export const op = {
  zonas: async () => (await opciones('zonas', () => Zonas.listar({ por_pagina: 100 }))).map((z) => [z.id, z.nombre]),
  tipos: async () => (await opciones('tipos', () => TiposResiduo.listar({ por_pagina: 100 }))).map((x) => [x.id, x.nombre]),
  centros: async () => (await opciones('centros', () => Centros.listar({ por_pagina: 100 }))).map((x) => [x.id, x.nombre]),
  camiones: async () => (await opciones('camiones', () => Camiones.listar({ por_pagina: 100 }))).map((x) => [x.id, `${x.matricula} · ${x.marca} ${x.modelo}`]),
  cuadrillas: async () => (await opciones('cuadrillas', () => Cuadrillas.listar({ por_pagina: 100 }))).map((x) => [x.id, x.nombre]),
  rutas: async () => (await opciones('rutas', () => Rutas.listar({ por_pagina: 100 }))).map((x) => [x.id, x.nombre]),
};
export function limpiarOpciones() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}

const si = (v) => (v ? t('general.si') : t('general.no'));

// ------------------------------------------------------------- contenedores
export const defContenedores = {
  titulo: 'menu.contenedores', singular: 'entidad.contenedor', subtitulo: 'contenedores.subtitulo', modelo: Contenedores,
  textoEliminar: 'general.dar_baja',
  columnas: [
    { campo: 'codigo', titulo: 'campo.codigo', formato: (v) => `<strong>${esc(v)}</strong>` },
    { campo: 'direccion', titulo: 'campo.direccion' },
    { campo: 'zona', titulo: 'campo.zona' },
    { campo: 'tipo_residuo', titulo: 'campo.tipo_residuo', formato: (v, f) => `<span class="punto" style="background:${esc(f.color)}"></span>${esc(v)}` },
    { campo: 'nivel_llenado', titulo: 'campo.nivel', formato: (v) => `<span class="nivel"><span style="width:${v}%"></span></span> ${v}%` },
    { campo: 'estado', titulo: 'campo.estado', formato: estado },
    { campo: 'ultima_recoleccion', titulo: 'campo.ultima_recoleccion', formato: (v) => fecha(v) },
  ],
  filtros: [
    { nombre: 'zona_id', etiqueta: 'campo.zona', opciones: op.zonas },
    { nombre: 'estado', etiqueta: 'campo.estado', opciones: ['funcional', 'desbordado', 'roto', 'fuera_servicio'] },
  ],
  campos: async () => [
    { nombre: 'tipo_residuo_id', etiqueta: 'campo.tipo_residuo', tipo: 'select', opciones: await op.tipos(), requerido: true, numerico: true },
    { nombre: 'zona_id', etiqueta: 'campo.zona', tipo: 'select', opciones: await op.zonas(), requerido: true, numerico: true },
    { nombre: 'direccion', etiqueta: 'campo.direccion', requerido: true, maxLargo: 150, ancho: 'completo' },
    { nombre: 'latitud', etiqueta: 'campo.latitud', tipo: 'number', paso: '0.000001', min: -35.2, max: -34.6, requerido: true },
    { nombre: 'longitud', etiqueta: 'campo.longitud', tipo: 'number', paso: '0.000001', min: -56.6, max: -55.9, requerido: true },
    { nombre: 'capacidad_litros', etiqueta: 'campo.capacidad_litros', tipo: 'select', opciones: [[360, '360 L'], [770, '770 L'], [1100, '1100 L'], [2400, '2400 L'], [3200, '3200 L']], requerido: true, numerico: true },
    { nombre: 'estado', etiqueta: 'campo.estado', tipo: 'select', opciones: ['funcional', 'desbordado', 'roto', 'fuera_servicio'], porDefecto: 'funcional' },
    { nombre: 'nivel_llenado', etiqueta: 'campo.nivel', tipo: 'number', min: 0, max: 100, porDefecto: 0 },
    { nombre: 'fecha_instalacion', etiqueta: 'campo.fecha_instalacion', tipo: 'date' },
  ],
};

// ------------------------------------------------------------------ centros
export const defCentros = {
  titulo: 'menu.centros', singular: 'entidad.centro', modelo: Centros, textoEliminar: 'general.dar_baja',
  columnas: [
    { campo: 'nombre', titulo: 'campo.nombre', formato: (v) => `<strong>${esc(v)}</strong>` },
    { campo: 'tipo', titulo: 'campo.tipo', formato: (v) => esc(t('centro.' + v)) },
    { campo: 'zona', titulo: 'campo.zona' },
    { campo: 'capacidad_ton', titulo: 'campo.capacidad_ton', formato: (v) => numero(v, 1) + ' t' },
    { campo: 'porcentaje', titulo: 'campo.ocupacion', formato: (v) => `<span class="nivel ${v >= 85 ? 'nivel-alto' : ''}"><span style="width:${Math.min(v, 100)}%"></span></span> ${numero(v, 1)}%` },
    { campo: 'tipos', titulo: 'campo.acepta', formato: (v) => (v || []).map((x) => `<span class="chip" style="border-color:${esc(x.color)}">${esc(x.nombre)}</span>`).join(' ') },
  ],
  filtros: [{ nombre: 'tipo', etiqueta: 'campo.tipo', opciones: ['acopio', 'clasificacion', 'vertedero'], prefijo: 'centro' }],
  adaptarValores: (v) => ({ ...v, tipos: (v.tipos || []).map((x) => x.id) }),
  campos: async () => [
    { nombre: 'nombre', etiqueta: 'campo.nombre', requerido: true, maxLargo: 100, ancho: 'completo' },
    { nombre: 'tipo', etiqueta: 'campo.tipo', tipo: 'select', opciones: ['acopio', 'clasificacion', 'vertedero'], prefijo: 'centro', requerido: true },
    { nombre: 'zona_id', etiqueta: 'campo.zona', tipo: 'select', opciones: await op.zonas(), requerido: true, numerico: true },
    { nombre: 'direccion', etiqueta: 'campo.direccion', requerido: true, maxLargo: 150, ancho: 'completo' },
    { nombre: 'latitud', etiqueta: 'campo.latitud', tipo: 'number', paso: '0.000001', requerido: true },
    { nombre: 'longitud', etiqueta: 'campo.longitud', tipo: 'number', paso: '0.000001', requerido: true },
    { nombre: 'capacidad_ton', etiqueta: 'campo.capacidad_ton', tipo: 'number', paso: '0.01', min: 1, requerido: true },
    { nombre: 'telefono', etiqueta: 'campo.telefono', tipo: 'tel', patron: '[0-9 +()-]{8,20}' },
    { nombre: 'tipos', etiqueta: 'campo.acepta', tipo: 'multiple', opciones: await op.tipos(), ancho: 'completo' },
  ],
};

// ---------------------------------------------------------------- maquinaria
export const defMaquinaria = () => ({
  titulo: 'menu.maquinaria', singular: 'entidad.maquina', modelo: Maquinaria, textoEliminar: 'general.dar_baja',
  puedeCrear: rol() === 'administrador', puedeEditar: rol() === 'administrador', puedeEliminar: rol() === 'administrador',
  columnas: [
    { campo: 'codigo', titulo: 'campo.codigo', formato: (v) => `<strong>${esc(v)}</strong>` },
    { campo: 'descripcion', titulo: 'campo.descripcion' },
    { campo: 'tipo', titulo: 'campo.tipo', formato: (v) => esc(t('maquina.' + v)) },
    { campo: 'centro', titulo: 'campo.centro' },
    { campo: 'estado', titulo: 'campo.estado', formato: estado },
    { campo: 'ultimo_mantenimiento', titulo: 'campo.ultimo_mantenimiento', formato: (v) => fecha(v, false) },
  ],
  filtros: [{ nombre: 'estado', etiqueta: 'campo.estado', opciones: ['operativa', 'mantenimiento', 'fuera_servicio'] }],
  accionesExtra: (f) => `<select class="select-chico" data-estado-maquina="${f.id}" aria-label="${esc(t('campo.estado'))}">${['operativa', 'mantenimiento', 'fuera_servicio']
    .map((e) => `<option value="${e}" ${e === f.estado ? 'selected' : ''}>${esc(t('estado.' + e))}</option>`).join('')}</select>`,
  alCambiar: async (select, recargar) => {
    if (!select.dataset.estadoMaquina) return;
    try {
      await Maquinaria.estado(select.dataset.estadoMaquina, select.value);
      toast(t('general.guardado'));
      recargar();
    } catch (err) {
      toast(err.message, 'error');
    }
  },
  campos: async () => [
    { nombre: 'centro_id', etiqueta: 'campo.centro', tipo: 'select', opciones: await op.centros(), requerido: true, numerico: true },
    { nombre: 'codigo', etiqueta: 'campo.codigo', requerido: true, patron: 'MAQ-[0-9]{3,5}', ayuda: 'ayuda.codigo_maquina' },
    { nombre: 'descripcion', etiqueta: 'campo.descripcion', requerido: true, maxLargo: 100, ancho: 'completo' },
    { nombre: 'tipo', etiqueta: 'campo.tipo', tipo: 'select', prefijo: 'maquina', opciones: ['compactadora', 'prensa', 'balanza', 'cargadora', 'trituradora', 'cinta', 'otro'], requerido: true },
    { nombre: 'estado', etiqueta: 'campo.estado', tipo: 'select', opciones: ['operativa', 'mantenimiento', 'fuera_servicio'], porDefecto: 'operativa' },
    { nombre: 'fecha_adquisicion', etiqueta: 'campo.fecha_adquisicion', tipo: 'date' },
  ],
});

// ----------------------------------------------------------------- repuestos
export const defRepuestos = {
  titulo: 'menu.repuestos', singular: 'entidad.repuesto', modelo: Repuestos, textoEliminar: 'general.dar_baja',
  columnas: [
    { campo: 'codigo', titulo: 'campo.codigo', formato: (v) => `<strong>${esc(v)}</strong>` },
    { campo: 'nombre', titulo: 'campo.nombre' },
    { campo: 'categoria', titulo: 'campo.categoria', formato: (v) => esc(t('categoria.' + v)) },
    { campo: 'stock', titulo: 'campo.stock', formato: (v, f) => `<strong class="${f.bajo_minimo ? 'texto-alerta' : ''}">${v}</strong> ${esc(f.unidad)}` },
    { campo: 'stock_minimo', titulo: 'campo.stock_minimo' },
    { campo: 'bajo_minimo', titulo: 'campo.alerta', formato: (v) => (v ? `<span class="badge badge-roto">${esc(t('repuestos.reponer'))}</span>` : '') },
  ],
  filtros: [{ nombre: 'bajo_minimo', etiqueta: 'campo.alerta', opciones: [[1, t('repuestos.bajo_minimo')]] }],
  accionesExtra: (f) => `<button class="btn btn-chico" data-movimiento="${f.id}">${esc(t('repuestos.movimiento'))}</button>`,
  campos: (editando) => [
    { nombre: 'codigo', etiqueta: 'campo.codigo', requerido: true, patron: 'REP-[0-9]{3,5}', ayuda: 'ayuda.codigo_repuesto' },
    { nombre: 'nombre', etiqueta: 'campo.nombre', requerido: true, maxLargo: 100 },
    { nombre: 'categoria', etiqueta: 'campo.categoria', tipo: 'select', prefijo: 'categoria', opciones: ['contenedor', 'pieza_contenedor', 'pieza_camion', 'herramienta', 'insumo'], requerido: true },
    { nombre: 'unidad', etiqueta: 'campo.unidad', requerido: true, maxLargo: 15, porDefecto: 'unidad' },
    ...(editando ? [] : [{ nombre: 'stock', etiqueta: 'campo.stock_inicial', tipo: 'number', min: 0, porDefecto: 0 }]),
    { nombre: 'stock_minimo', etiqueta: 'campo.stock_minimo', tipo: 'number', min: 0, requerido: true },
  ],
  alAccion: (boton, recargar) => {
    if (!boton.dataset.movimiento) return;
    const modal = abrirModal(t('repuestos.movimiento'), `
      <form class="form-grid" novalidate>
        <div class="campo"><label for="mov-tipo">${esc(t('campo.tipo'))}</label>
          <select id="mov-tipo" name="tipo"><option value="entrada">${esc(t('repuestos.entrada'))}</option><option value="salida">${esc(t('repuestos.salida'))}</option></select></div>
        <div class="campo"><label for="mov-cantidad">${esc(t('campo.cantidad'))}</label><input id="mov-cantidad" name="cantidad" type="number" min="1" required></div>
        <div class="campo campo-completo"><label for="mov-motivo">${esc(t('campo.motivo'))}</label><input id="mov-motivo" name="motivo" required minlength="3" maxlength="150"></div>
        <div class="acciones-form campo-completo"><button type="submit" class="btn btn-primario">${esc(t('general.guardar'))}</button></div>
      </form>`);
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.reportValidity()) return;
      try {
        await Repuestos.mover(boton.dataset.movimiento, { tipo: f.tipo.value, cantidad: Number(f.cantidad.value), motivo: f.motivo.value.trim() });
        cerrarModal();
        toast(t('general.guardado'));
        recargar();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  },
};

// ------------------------------------------------------------------ camiones
export const defCamiones = {
  titulo: 'menu.camiones', singular: 'entidad.camion', modelo: Camiones, textoEliminar: 'general.dar_baja',
  columnas: [
    { campo: 'matricula', titulo: 'campo.matricula', formato: (v) => `<strong>${esc(v)}</strong>` },
    { campo: 'marca', titulo: 'campo.marca', formato: (v, f) => esc(`${v} ${f.modelo}`) },
    { campo: 'anio', titulo: 'campo.anio' },
    { campo: 'tipo', titulo: 'campo.tipo', formato: (v) => esc(t('camion.' + v)) },
    { campo: 'capacidad_ton', titulo: 'campo.capacidad_ton', formato: (v) => numero(v, 1) + ' t' },
    { campo: 'kilometraje', titulo: 'campo.kilometraje', formato: (v) => numero(v) + ' km' },
    { campo: 'estado', titulo: 'campo.estado', formato: estado },
  ],
  filtros: [{ nombre: 'estado', etiqueta: 'campo.estado', opciones: ['disponible', 'en_ruta', 'mantenimiento', 'fuera_servicio'] }],
  accionesExtra: (f) => (f.estado === 'en_ruta' ? '' : `<select class="select-chico" data-estado-camion="${f.id}" aria-label="${esc(t('campo.estado'))}">${['disponible', 'mantenimiento', 'fuera_servicio']
    .map((e) => `<option value="${e}" ${e === f.estado ? 'selected' : ''}>${esc(t('estado.' + e))}</option>`).join('')}</select>`),
  alCambiar: async (select, recargar) => {
    if (!select.dataset.estadoCamion) return;
    try {
      await Camiones.estado(select.dataset.estadoCamion, select.value);
      toast(t('general.guardado'));
      recargar();
    } catch (err) {
      toast(err.message, 'error');
    }
  },
  campos: [
    { nombre: 'matricula', etiqueta: 'campo.matricula', requerido: true, patron: '[A-Z]{3} ?[0-9]{4}', ayuda: 'ayuda.matricula' },
    { nombre: 'marca', etiqueta: 'campo.marca', requerido: true, maxLargo: 40 },
    { nombre: 'modelo', etiqueta: 'campo.modelo', requerido: true, maxLargo: 40 },
    { nombre: 'anio', etiqueta: 'campo.anio', tipo: 'number', min: 1990, max: 2027, requerido: true },
    { nombre: 'tipo', etiqueta: 'campo.tipo', tipo: 'select', prefijo: 'camion', opciones: ['compactador', 'carga_lateral', 'caja_abierta', 'grua'], requerido: true },
    { nombre: 'capacidad_ton', etiqueta: 'campo.capacidad_ton', tipo: 'number', paso: '0.1', min: 0.5, max: 40, requerido: true },
    { nombre: 'kilometraje', etiqueta: 'campo.kilometraje', tipo: 'number', min: 0 },
  ],
};

// ------------------------------------------------------------ mantenimientos
export const defMantenimientos = {
  titulo: 'menu.mantenimientos', singular: 'entidad.mantenimiento', modelo: Mantenimientos,
  columnas: [
    { campo: 'fecha_programada', titulo: 'campo.fecha_programada', formato: (v) => fecha(v, false) },
    { campo: 'matricula', titulo: 'campo.camion' },
    { campo: 'tipo', titulo: 'campo.tipo', formato: (v) => esc(t('mantenimiento.' + v)) },
    { campo: 'descripcion', titulo: 'campo.descripcion' },
    { campo: 'costo', titulo: 'campo.costo', formato: (v) => (v === null ? '—' : '$ ' + numero(v, 2)) },
    { campo: 'estado', titulo: 'campo.estado', formato: estado },
  ],
  filtros: [
    { nombre: 'estado', etiqueta: 'campo.estado', opciones: ['programado', 'realizado', 'cancelado'] },
    { nombre: 'camion_id', etiqueta: 'campo.camion', opciones: op.camiones },
  ],
  campos: async () => [
    { nombre: 'camion_id', etiqueta: 'campo.camion', tipo: 'select', opciones: await op.camiones(), requerido: true, numerico: true },
    { nombre: 'tipo', etiqueta: 'campo.tipo', tipo: 'select', prefijo: 'mantenimiento', opciones: ['preventivo', 'correctivo'], requerido: true },
    { nombre: 'descripcion', etiqueta: 'campo.descripcion', requerido: true, maxLargo: 200, ancho: 'completo' },
    { nombre: 'fecha_programada', etiqueta: 'campo.fecha_programada', tipo: 'date', requerido: true },
    { nombre: 'estado', etiqueta: 'campo.estado', tipo: 'select', opciones: ['programado', 'realizado', 'cancelado'], porDefecto: 'programado' },
    { nombre: 'kilometraje', etiqueta: 'campo.kilometraje', tipo: 'number', min: 0 },
    { nombre: 'costo', etiqueta: 'campo.costo', tipo: 'number', paso: '0.01', min: 0 },
  ],
};

// ---------------------------------------------------------------- cuadrillas
export const defCuadrillas = {
  titulo: 'menu.cuadrillas', singular: 'entidad.cuadrilla', modelo: Cuadrillas, textoEliminar: 'general.dar_baja',
  columnas: [
    { campo: 'nombre', titulo: 'campo.nombre', formato: (v) => `<strong>${esc(v)}</strong>` },
    { campo: 'zona', titulo: 'campo.zona' },
    { campo: 'turno', titulo: 'campo.turno', formato: (v) => esc(t('turno.' + v)) },
    { campo: 'integrantes', titulo: 'campo.integrantes', formato: (v) => (v || []).map((i) => esc(`${i.nombre} ${i.apellido}`) + (i.es_responsable ? ' ★' : '')).join(', ') || '—' },
  ],
  accionesExtra: (f) => `<button class="btn btn-chico" data-integrantes="${f.id}">${esc(t('cuadrillas.integrantes'))}</button>`,
  campos: async () => [
    { nombre: 'nombre', etiqueta: 'campo.nombre', requerido: true, maxLargo: 60 },
    { nombre: 'zona_id', etiqueta: 'campo.zona', tipo: 'select', opciones: await op.zonas(), requerido: true, numerico: true },
    { nombre: 'turno', etiqueta: 'campo.turno', tipo: 'select', prefijo: 'turno', opciones: ['matutino', 'vespertino', 'nocturno'], requerido: true },
  ],
  alAccion: async (boton, recargar) => {
    if (!boton.dataset.integrantes) return;
    const id = boton.dataset.integrantes;
    const [cuadrilla, personal] = await Promise.all([Cuadrillas.obtener(id), Usuarios.listar({ rol: 'cuadrilla', estado: 'activo', por_pagina: 100 })]);
    const actuales = Object.fromEntries(cuadrilla.datos.integrantes.map((i) => [i.id, i.es_responsable]));
    const filas = personal.datos.map((u) => `<tr><td><input type="checkbox" name="u" value="${u.id}" ${u.id in actuales ? 'checked' : ''} aria-label="${esc(u.nombre)}"></td>
      <td>${esc(u.nombre)} ${esc(u.apellido)}</td><td>${esc(u.cuadrilla || '—')}</td>
      <td><input type="radio" name="responsable" value="${u.id}" ${actuales[u.id] ? 'checked' : ''} aria-label="${esc(t('cuadrillas.responsable'))}"></td></tr>`).join('');
    const modal = abrirModal(t('cuadrillas.integrantes') + ' · ' + cuadrilla.datos.nombre, `
      <form><table class="tabla"><thead><tr><th></th><th>${esc(t('campo.nombre'))}</th><th>${esc(t('menu.cuadrillas'))}</th><th>${esc(t('cuadrillas.responsable'))}</th></tr></thead><tbody>${filas}</tbody></table>
      <div class="acciones-form"><button class="btn btn-primario" type="submit">${esc(t('general.guardar'))}</button></div></form>`, { ancho: 'modal-ancho' });
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const responsable = e.target.querySelector('[name=responsable]:checked')?.value;
      const integrantes = [...e.target.querySelectorAll('[name=u]:checked')].map((c) => ({ usuario_id: Number(c.value), es_responsable: c.value === responsable }));
      try {
        await Cuadrillas.integrantes(id, integrantes);
        cerrarModal();
        toast(t('general.guardado'));
        recargar();
      } catch (err) {
        toast(err.errores ? Object.values(err.errores).join(' ') : err.message, 'error');
      }
    });
  },
};

// --------------------------------------------------------------------- rutas
export const defRutas = {
  titulo: 'menu.rutas', singular: 'entidad.ruta', modelo: Rutas, textoEliminar: 'general.dar_baja',
  columnas: [
    { campo: 'nombre', titulo: 'campo.nombre', formato: (v) => `<strong>${esc(v)}</strong>` },
    { campo: 'zona', titulo: 'campo.zona' },
    { campo: 'frecuencia', titulo: 'campo.frecuencia', formato: (v) => esc(t('frecuencia.' + v)) },
    { campo: 'contenedores_cantidad', titulo: 'campo.contenedores' },
    { campo: 'descripcion', titulo: 'campo.descripcion' },
  ],
  accionesExtra: (f) => `<button class="btn btn-chico" data-recorrido="${f.id}">${esc(t('rutas.recorrido'))}</button> `
    + `<button class="btn btn-chico btn-primario" data-optimizar="${f.id}">${esc(t('rutas.optimizar'))}</button>`,
  campos: async () => [
    { nombre: 'nombre', etiqueta: 'campo.nombre', requerido: true, maxLargo: 80, ancho: 'completo' },
    { nombre: 'zona_id', etiqueta: 'campo.zona', tipo: 'select', opciones: await op.zonas(), requerido: true, numerico: true },
    { nombre: 'frecuencia', etiqueta: 'campo.frecuencia', tipo: 'select', prefijo: 'frecuencia', opciones: ['diaria', 'lun_mie_vie', 'mar_jue_sab', 'semanal'], requerido: true },
    { nombre: 'descripcion', etiqueta: 'campo.descripcion', tipo: 'textarea', maxLargo: 200, ancho: 'completo' },
  ],
  alAccion: async (boton, recargar) => {
    if (boton.dataset.optimizar) return optimizarRuta(boton.dataset.optimizar, recargar);
    if (!boton.dataset.recorrido) return;
    const id = boton.dataset.recorrido;
    const [ruta, todos] = await Promise.all([Rutas.obtener(id), Contenedores.listar({ por_pagina: 200 })]);
    const enRuta = ruta.datos.contenedores.map((c) => c.id);
    const modal = abrirModal(t('rutas.recorrido') + ' · ' + ruta.datos.nombre, `
      <p class="ayuda">${esc(t('rutas.ayuda_orden'))}</p>
      <form><textarea name="ids" rows="3" class="monoespaciado">${enRuta.join(', ')}</textarea>
      <details><summary>${esc(t('rutas.ver_codigos'))}</summary><p class="ayuda">${todos.datos.map((c) => `${c.id} = ${esc(c.codigo)} (${esc(c.zona)})`).join(' · ')}</p></details>
      <div class="acciones-form"><button class="btn btn-primario" type="submit">${esc(t('general.guardar'))}</button></div></form>`, { ancho: 'modal-ancho' });
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const ids = e.target.ids.value.split(/[\s,;]+/).filter(Boolean).map(Number);
      try {
        await Rutas.contenedores(id, ids);
        cerrarModal();
        toast(t('general.guardado'));
        recargar();
      } catch (err) {
        toast(err.errores ? Object.values(err.errores).join(' ') : err.message, 'error');
      }
    });
  },
};

// Propuesta de orden de una ruta: compara el orden actual con el que acorta los km y adelanta lo urgente
async function optimizarRuta(id, recargar) {
  let r;
  try { r = (await Rutas.optimizacion(id)).datos; } catch (err) { toast(err.message, 'error'); return; }
  const fila = (titulo, e) => `<tr><th>${esc(t(titulo))}</th><td>${numero(e.km, 1)} km</td><td>${numero(e.minutos)} min</td><td>${numero(e.litros, 1)} L</td></tr>`;
  const sinCambios = r.contenedores.every((c) => c.orden_actual === c.orden_propuesto);
  let ahorro;
  if (sinCambios) ahorro = t('rutas.sin_cambios');
  else if (r.ahorro.km > 0) ahorro = t('rutas.ahorro', { km: numero(r.ahorro.km, 1), porcentaje: numero(r.ahorro.porcentaje_km, 1), litros: numero(r.ahorro.litros, 1) });
  else if (r.ahorro.km === 0) ahorro = t('rutas.misma_distancia');
  else ahorro = t('rutas.mas_distancia', { km: numero(-r.ahorro.km, 1) });
  const minutos = r.supuestos.minutos_por_contenedor;
  const supuestos = t('rutas.supuestos', { velocidad: numero(r.supuestos.velocidad_kmh),
    minutos: numero(minutos, Number.isInteger(minutos) ? 0 : 1), litros: numero(r.supuestos.litros_100km) });
  const motivos = (c) => c.motivos.map((m) => esc(t('urgencia.' + m))).join(' · ');
  const modal = abrirModal(t('rutas.optimizar') + ' · ' + r.ruta.nombre, `
    <p class="ayuda">${esc(t('rutas.ayuda_optimizar', { partida: r.partida.nombre ?? '' }))}</p>
    <div class="tabla-contenedor"><table class="tabla"><thead><tr><th></th><th>${esc(t('rutas.distancia'))}</th><th>${esc(t('rutas.tiempo'))}</th><th>${esc(t('rutas.combustible'))}</th></tr></thead>
      <tbody>${fila('rutas.orden_actual', r.actual)}${fila('rutas.orden_propuesto', r.propuesta)}</tbody></table></div>
    <p class="resumen-optimizacion"><strong>${esc(ahorro)}</strong></p>
    <div class="tabla-contenedor"><table class="tabla"><thead><tr><th>#</th><th>${esc(t('campo.contenedor'))}</th><th>${esc(t('rutas.urgencia'))}</th><th>${esc(t('rutas.antes'))}</th></tr></thead>
      <tbody>${r.contenedores.map((c) => `<tr><td>${c.orden_propuesto}</td><td><strong>${esc(c.codigo)}</strong> · ${esc(c.direccion)}</td>
        <td><span class="badge badge-prioridad-${esc(c.prioridad)}">${esc(t('prioridad.' + c.prioridad))} · ${c.urgencia}</span> <small>${motivos(c)}</small></td>
        <td>${c.orden_actual}</td></tr>`).join('')}</tbody></table></div>
    <p class="ayuda">${esc(supuestos)} ${esc(t('rutas.limite_optimizacion'))}</p>
    <div class="acciones-form"><button class="btn" data-cerrar>${esc(t(sinCambios ? 'general.cerrar' : 'general.cancelar'))}</button>
      ${sinCambios ? '' : `<button class="btn btn-primario" data-aplicar>${esc(t('rutas.aplicar'))}</button>`}</div>`, { ancho: 'modal-ancho' });
  modal.querySelector('[data-cerrar]').addEventListener('click', () => cerrarModal());
  modal.querySelector('[data-aplicar]')?.addEventListener('click', async () => {
    try {
      await Rutas.contenedores(id, r.contenedores.map((c) => c.id));
      cerrarModal();
      toast(t('rutas.orden_aplicado'));
      recargar();
    } catch (err) { toast(err.message, 'error'); }
  });
}

// -------------------------------------------------------------- asignaciones
export const defAsignaciones = {
  titulo: 'menu.asignaciones', singular: 'entidad.asignacion', modelo: Asignaciones, subtitulo: 'asignaciones.subtitulo',
  textoEliminar: 'general.eliminar',
  columnas: [
    { campo: 'fecha', titulo: 'campo.fecha', formato: (v) => fecha(v, false) },
    { campo: 'turno', titulo: 'campo.turno', formato: (v) => esc(t('turno.' + v)) },
    { campo: 'ruta', titulo: 'campo.ruta' },
    { campo: 'cuadrilla', titulo: 'campo.cuadrilla' },
    { campo: 'matricula', titulo: 'campo.camion' },
    { campo: 'contenedores_recolectados', titulo: 'campo.avance', formato: (v, f) => `${v} / ${f.contenedores_ruta}` },
    { campo: 'estado', titulo: 'campo.estado', formato: estado },
  ],
  filtros: [
    { nombre: 'estado', etiqueta: 'campo.estado', opciones: ['planificada', 'en_curso', 'completada', 'cancelada'] },
    { nombre: 'cuadrilla_id', etiqueta: 'campo.cuadrilla', opciones: op.cuadrillas },
  ],
  campos: async () => [
    { nombre: 'ruta_id', etiqueta: 'campo.ruta', tipo: 'select', opciones: await op.rutas(), requerido: true, numerico: true },
    { nombre: 'cuadrilla_id', etiqueta: 'campo.cuadrilla', tipo: 'select', opciones: await op.cuadrillas(), requerido: true, numerico: true },
    { nombre: 'camion_id', etiqueta: 'campo.camion', tipo: 'select', opciones: await op.camiones(), requerido: true, numerico: true },
    { nombre: 'fecha', etiqueta: 'campo.fecha', tipo: 'date', requerido: true },
    { nombre: 'turno', etiqueta: 'campo.turno', tipo: 'select', prefijo: 'turno', opciones: ['matutino', 'vespertino', 'nocturno'], requerido: true },
    { nombre: 'observaciones', etiqueta: 'campo.observaciones', tipo: 'textarea', maxLargo: 300, ancho: 'completo' },
  ],
  accionesExtra: (f) => (f.estado === 'planificada' || f.estado === 'en_curso' ? `<button class="btn btn-chico" data-cancelar-asig="${f.id}">${esc(t('general.cancelar'))}</button>` : ''),
  alAccion: async (boton, recargar) => {
    if (!boton.dataset.cancelarAsig) return;
    try {
      await Asignaciones.estado(boton.dataset.cancelarAsig, 'cancelada');
      toast(t('general.guardado'));
      recargar();
    } catch (err) {
      toast(err.message, 'error');
    }
  },
};

// ------------------------------------------------------------------ usuarios
export const defUsuarios = {
  titulo: 'menu.usuarios', singular: 'entidad.usuario', modelo: Usuarios, textoEliminar: 'general.dar_baja',
  columnas: [
    { campo: 'apellido', titulo: 'campo.nombre', formato: (v, f) => `<strong>${esc(f.nombre)} ${esc(v)}</strong><br><small>${esc(f.email)}</small>` },
    { campo: 'rol', titulo: 'campo.rol', formato: (v) => esc(t('rol.' + v)) },
    { campo: 'cuadrilla', titulo: 'campo.asignado', formato: (v, f) => esc(v || f.centro || '—') },
    { campo: 'ultimo_acceso', titulo: 'campo.ultimo_acceso', formato: (v) => fecha(v) },
    { campo: 'estado', titulo: 'campo.estado', formato: estado },
  ],
  filtros: [
    { nombre: 'rol_id', etiqueta: 'campo.rol', opciones: [[1, t('rol.administrador')], [2, t('rol.cuadrilla')], [3, t('rol.operario')], [4, t('rol.vecino')]] },
    { nombre: 'estado', etiqueta: 'campo.estado', opciones: ['pendiente', 'activo', 'inactivo', 'rechazado'] },
  ],
  accionesExtra: (f) => (f.estado === 'pendiente'
    ? `<button class="btn btn-chico btn-exito" data-aprobar="${f.id}">${esc(t('usuarios.aprobar'))}</button><button class="btn btn-chico" data-rechazar="${f.id}">${esc(t('usuarios.rechazar'))}</button>`
    : (f.estado !== 'activo' ? `<button class="btn btn-chico" data-aprobar="${f.id}">${esc(t('usuarios.activar'))}</button>` : '')),
  campos: async (editando) => [
    { nombre: 'nombre', etiqueta: 'campo.nombre', requerido: true, maxLargo: 60 },
    { nombre: 'apellido', etiqueta: 'campo.apellido', requerido: true, maxLargo: 60 },
    { nombre: 'email', etiqueta: 'campo.email', tipo: 'email', requerido: true, maxLargo: 120 },
    { nombre: 'telefono', etiqueta: 'campo.telefono', tipo: 'tel', patron: '[0-9 +()-]{8,20}' },
    { nombre: 'rol_id', etiqueta: 'campo.rol', tipo: 'select', requerido: true, numerico: true, opciones: [[1, t('rol.administrador')], [2, t('rol.cuadrilla')], [3, t('rol.operario')], [4, t('rol.vecino')]] },
    { nombre: 'documento', etiqueta: 'campo.documento', ayuda: 'ayuda.cedula', validar: validarCedula },
    { nombre: 'centro_id', etiqueta: 'campo.centro', tipo: 'select', opciones: await op.centros(), numerico: true, ayuda: 'ayuda.centro_operario' },
    { nombre: 'password', etiqueta: editando ? 'campo.password_nueva' : 'campo.password', tipo: 'password', requerido: !editando, validar: validarClave, ayuda: 'ayuda.clave', autocompletar: 'new-password', omitirVacio: true },
  ],
  prepararDatos: (d) => {
    d.documento = d.documento ? d.documento.replace(/\D/g, '') : null;
    return d;
  },
  alAccion: async (boton, recargar) => {
    const id = boton.dataset.aprobar || boton.dataset.rechazar;
    if (!id) return;
    try {
      await Usuarios.cambiarEstado(id, boton.dataset.aprobar ? 'activo' : 'rechazado');
      toast(t('general.guardado'));
      recargar();
    } catch (err) {
      toast(err.message, 'error');
    }
  },
};

export const auxiliares = { si };
