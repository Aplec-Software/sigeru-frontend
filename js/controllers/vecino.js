// Pantallas del vecino: reportar un problema, ver sus reportes, y el reporte rápido por QR.
import { esc, fecha, estado, toast, cargando, vacio } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { usuarioActual } from '../core/sesion.js';
import { Incidencias, Contenedores, Mapa } from '../models/recursos.js';
import { encabezado } from '../views/layout.js';
import { dibujarMapa } from '../views/mapa.js';
import { htmlTabla } from '../views/tabla.js';

const TIPOS = ['desborde', 'rotura', 'quema', 'falta_recoleccion', 'otro'];

function botonesTipo() {
  return `<fieldset class="opciones-tipo"><legend>${esc(t('reportar.que_pasa'))}</legend>${TIPOS.map((tp, i) =>
    `<label class="opcion"><input type="radio" name="tipo" value="${tp}" ${i === 0 ? 'checked' : ''}><span>${esc(t('incidencia.' + tp))}</span></label>`).join('')}</fieldset>`;
}

export async function paginaReportar(main, parametros) {
  main.innerHTML = encabezado(t('menu.reportar'), t('reportar.subtitulo')) + `
    <div class="columnas-2">
      <section class="tarjeta"><form novalidate class="form-vertical">
        <div class="campo"><label for="codigo">${esc(t('reportar.codigo'))}</label>
          <input id="codigo" name="codigo" placeholder="CNT-0001" pattern="CNT-[0-9]{4,6}" required>
          <small class="ayuda">${esc(t('reportar.ayuda_codigo'))}</small></div>
        <p class="elegido" aria-live="polite"></p>
        ${botonesTipo()}
        <div class="campo"><label for="desc">${esc(t('campo.descripcion'))}</label><textarea id="desc" name="descripcion" maxlength="500" rows="3"></textarea></div>
        <button class="btn btn-primario btn-bloque">${esc(t('reportar.enviar'))}</button>
      </form></section>
      <section class="tarjeta"><div id="mapa" class="mapa mapa-chico"></div></section>
    </div>`;
  const form = main.querySelector('form');
  const elegido = main.querySelector('.elegido');
  const elegir = (c) => { form.codigo.value = c.codigo; elegido.textContent = `${c.codigo} · ${c.direccion}`; };
  Mapa.obtener().then((r) => dibujarMapa(main.querySelector('#mapa'), { contenedores: r.datos.contenedores },
    [Number(parametros.mapa_latitud || -34.896), Number(parametros.mapa_longitud || -56.15)], 14, elegir));
  form.codigo.addEventListener('change', async () => {
    try { elegir((await Contenedores.porCodigo(form.codigo.value.trim().toUpperCase())).datos); } catch { elegido.textContent = t('reportar.no_existe'); }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.codigo.value = form.codigo.value.trim().toUpperCase();
    if (!form.reportValidity()) return;
    try {
      const r = await Incidencias.crear({ contenedor_codigo: form.codigo.value, tipo: form.tipo.value, descripcion: form.descripcion.value.trim() || null });
      toast(r.mensaje);
      form.reset();
      elegido.textContent = '';
    } catch (err) { toast(err.errores ? Object.values(err.errores).join(' ') : err.message, 'error'); }
  });
}

export async function paginaMisReportes(main) {
  main.innerHTML = encabezado(t('menu.mis_reportes'), t('mis_reportes.subtitulo')) + '<section class="tarjeta" id="lista"></section>';
  const caja = main.querySelector('#lista');
  cargando(caja);
  const r = await Incidencias.listar({ por_pagina: 50 });
  caja.innerHTML = htmlTabla(r.datos, [
    { campo: 'creado_en', titulo: 'campo.fecha', formato: (v) => fecha(v) },
    { campo: 'tipo', titulo: 'campo.tipo', formato: (v) => esc(t('incidencia.' + v)) },
    { campo: 'contenedor_codigo', titulo: 'campo.contenedor', formato: (v, f) => `${esc(v)} · ${esc(f.direccion)}` },
    { campo: 'estado', titulo: 'campo.estado', formato: estado },
    { campo: 'resolucion', titulo: 'campo.resolucion', formato: (v) => esc(v || '—') },
  ]) || vacio(t('mis_reportes.vacio'));
}

/** Página que abre el código QR pegado en el contenedor: reporte en menos de 30 segundos, sin cuenta. */
export async function paginaQr(main, { codigo }) {
  let contenedor;
  try {
    contenedor = (await Contenedores.porCodigo(codigo)).datos;
  } catch {
    main.innerHTML = `<div class="publico"><div class="publico-caja"><h1>${esc(t('qr.no_encontrado'))}</h1></div></div>`;
    return;
  }
  main.innerHTML = `<div class="publico"><div class="publico-caja">
    <img src="img/logo-sigeru.png" alt="SiGeRU" width="64" height="76">
    <h1>${esc(t('qr.titulo'))}</h1>
    <p class="destacado">${esc(contenedor.codigo)} · ${esc(contenedor.direccion)}<br><small>${esc(contenedor.tipo_residuo)} · ${estado(contenedor.estado)}</small></p>
    <form novalidate class="form-vertical">${botonesTipo()}
      <div class="campo"><label for="qr-desc">${esc(t('qr.comentario'))}</label><input id="qr-desc" name="descripcion" maxlength="200"></div>
      <div class="trampa" aria-hidden="true"><label>Sitio web <input name="sitio_web" tabindex="-1" autocomplete="off"></label></div>
      <button class="btn btn-primario btn-bloque">${esc(t('reportar.enviar'))}</button></form>
    <p class="ayuda">${esc(usuarioActual() ? t('qr.con_sesion') : t('qr.anonimo'))}</p></div></div>`;
  main.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const r = await Incidencias.qr({ contenedor_codigo: contenedor.codigo, tipo: f.tipo.value, descripcion: f.descripcion.value.trim() || null, sitio_web: f.sitio_web.value });
      main.querySelector('.publico-caja').innerHTML = `<h1>${esc(t('qr.gracias'))}</h1><p class="mensaje-ok">${esc(r.mensaje)}</p><a class="btn" href="/">${esc(t('auth.volver_inicio'))}</a>`;
    } catch (err) { toast(err.message, 'error'); }
  });
}
