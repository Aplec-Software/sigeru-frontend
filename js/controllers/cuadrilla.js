// Pantallas de la cuadrilla: tareas asignadas y recorrido del día.
import { esc, estado, fecha, numero, toast, cargando, vacio } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { Incidencias, Asignaciones, Repuestos } from '../models/recursos.js';
import { encabezado } from '../views/layout.js';
import { abrirModal, cerrarModal } from '../views/modal.js';
import { verIncidencia } from './incidencias.js';

export async function paginaTareas(main) {
  main.innerHTML = encabezado(t('menu.tareas'), t('tareas.subtitulo')) + '<div id="tareas"></div>';
  const caja = main.querySelector('#tareas');
  const cargar = async () => {
    cargando(caja);
    const r = await Incidencias.listar({ activas: 1, por_pagina: 50 });
    caja.innerHTML = r.datos.length ? `<div class="tarjetas">${r.datos.map((i) => `
      <article class="tarjeta tarea prioridad-${esc(i.prioridad)}">
        <header><strong>#${i.id} ${esc(t('incidencia.' + i.tipo))}</strong>${estado(i.estado)}</header>
        <p>${esc(i.contenedor_codigo)} · ${esc(i.direccion)}</p>
        <p class="ayuda">${esc(i.zona)} · ${fecha(i.creado_en)} · ${esc(t('prioridad.' + i.prioridad))}</p>
        <button class="btn btn-primario btn-chico" data-ver="${i.id}">${esc(t('tareas.atender'))}</button>
      </article>`).join('')}</div>` : vacio(t('tareas.sin_tareas'));
  };
  caja.addEventListener('click', (e) => {
    const id = e.target.closest('[data-ver]')?.dataset.ver;
    if (id) verIncidencia(id, cargar, false);
  });
  cargar();
}

export async function paginaMiRuta(main) {
  main.innerHTML = encabezado(t('menu.mi_ruta'), t('mi_ruta.subtitulo')) + '<div id="ruta"></div>';
  const caja = main.querySelector('#ruta');

  async function cargar() {
    cargando(caja);
    const hoy = await Asignaciones.hoy();
    if (!hoy.datos.length) {
      caja.innerHTML = vacio(t('mi_ruta.sin_recorrido'));
      return;
    }
    const a = (await Asignaciones.obtener(hoy.datos[0].id)).datos;
    const hechos = a.recorrido.filter((c) => c.recolectado).length;
    const boton = a.estado === 'planificada' ? `<button class="btn btn-primario" data-accion="en_curso">${esc(t('mi_ruta.iniciar'))}</button>`
      : a.estado === 'en_curso' ? `<button class="btn btn-exito" data-accion="completada">${esc(t('mi_ruta.finalizar'))}</button> <button class="btn" data-recurso>${esc(t('mi_ruta.usar_recurso'))}</button>` : '';
    caja.innerHTML = `
      <section class="tarjeta">
        <div class="resumen-ruta"><div><h2>${esc(a.ruta)}</h2><p>${esc(t('turno.' + a.turno))} · ${esc(t('campo.camion'))} ${esc(a.matricula)} · ${estado(a.estado)}</p></div>
        <div class="avance"><span>${hechos} / ${a.recorrido.length}</span><span class="nivel"><span style="width:${a.recorrido.length ? (hechos * 100) / a.recorrido.length : 0}%"></span></span></div></div>
        <div class="acciones">${boton}</div>
        ${a.recorrido_dinamico ? `<p class="ayuda">${esc(t('mi_ruta.orden_dinamico'))}</p>` : ''}
      </section>
      <ol class="recorrido">${a.recorrido.map((c) => `<li class="${c.recolectado ? 'hecho' : ''}">
        <span class="orden">${c.orden}</span><div class="crece"><strong>${esc(c.codigo)}</strong> ${estado(c.estado)}${!c.recolectado && c.prioridad !== 'baja' ? ` <span class="badge badge-prioridad-${esc(c.prioridad)}">${esc(t('mi_ruta.urgencia_' + c.prioridad))}</span>` : ''}<br><small>${esc(c.direccion)} · ${c.nivel_llenado}%</small></div>
        ${c.recolectado ? `<span class="badge badge-resuelta">${esc(t('mi_ruta.vaciado'))}</span>` : (a.estado === 'en_curso' ? `<button class="btn btn-chico btn-primario" data-vaciar="${c.id}" data-nivel="${c.nivel_llenado}">${esc(t('mi_ruta.registrar'))}</button>` : '')}
      </li>`).join('')}</ol>`;

    caja.querySelector('[data-accion]')?.addEventListener('click', async (e) => {
      try {
        await Asignaciones.estado(a.id, e.target.dataset.accion);
        toast(t('general.guardado'));
        cargar();
      } catch (err) { toast(err.message, 'error'); }
    });
    caja.querySelector('[data-recurso]')?.addEventListener('click', () => usarRecurso(a.id));
    caja.querySelectorAll('[data-vaciar]').forEach((b) => b.addEventListener('click', () => registrar(a.id, Number(b.dataset.vaciar), Number(b.dataset.nivel))));
  }

  function registrar(asignacion, contenedor, nivel) {
    const modal = abrirModal(t('mi_ruta.registrar'), `
      <form class="form-grid" novalidate>
        <div class="campo"><label for="r-nivel">${esc(t('mi_ruta.nivel_encontrado'))}</label><input id="r-nivel" name="nivel" type="number" min="0" max="100" value="${Math.max(nivel, 50)}" required></div>
        <div class="campo"><label for="r-peso">${esc(t('mi_ruta.peso'))}</label><input id="r-peso" name="peso" type="number" min="0" max="2000" step="0.1" required></div>
        <div class="campo campo-completo"><label for="r-obs">${esc(t('campo.observaciones'))}</label><input id="r-obs" name="obs" maxlength="200"></div>
        <div class="acciones-form campo-completo"><button class="btn btn-primario">${esc(t('general.guardar'))}</button></div>
      </form>`);
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.reportValidity()) return;
      const datos = { contenedor_id: contenedor, nivel_previo: Number(f.nivel.value), peso_kg: Number(f.peso.value), observacion: f.obs.value.trim() || null };
      // si el navegador lo permite, se envía la ubicación para actualizar la posición del camión
      const enviar = async () => {
        try {
          await Asignaciones.recoleccion(asignacion, datos);
          cerrarModal();
          toast(t('general.guardado'));
          cargar();
        } catch (err) { toast(err.message, 'error'); }
      };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((p) => { datos.latitud = p.coords.latitude; datos.longitud = p.coords.longitude; enviar(); }, enviar, { timeout: 3000 });
      } else {
        enviar();
      }
    });
  }

  async function usarRecurso(asignacion) {
    const repuestos = (await Repuestos.listar({ por_pagina: 100 })).datos;
    const modal = abrirModal(t('mi_ruta.usar_recurso'), `
      <form class="form-grid" novalidate>
        <div class="campo campo-completo"><label for="u-rep">${esc(t('campo.repuesto'))}</label><select id="u-rep" name="rep" required>${repuestos.map((r) => `<option value="${r.id}">${esc(r.nombre)} (${r.stock} ${esc(r.unidad)})</option>`).join('')}</select></div>
        <div class="campo"><label for="u-cant">${esc(t('campo.cantidad'))}</label><input id="u-cant" name="cant" type="number" min="1" required></div>
        <div class="campo"><label for="u-mot">${esc(t('campo.motivo'))}</label><input id="u-mot" name="mot" required minlength="3" maxlength="150"></div>
        <div class="acciones-form campo-completo"><button class="btn btn-primario">${esc(t('general.guardar'))}</button></div>
      </form>`);
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.reportValidity()) return;
      try {
        const r = await Asignaciones.recurso(asignacion, { repuesto_id: Number(f.rep.value), cantidad: Number(f.cant.value), motivo: f.mot.value.trim() });
        cerrarModal();
        toast(t('mi_ruta.stock_restante', { stock: numero(r.datos.stock) }));
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  cargar();
}
