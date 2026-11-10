// Informe simple de incidencias abiertas y cerradas, con exportación a CSV.
import { esc, toast, descargar, cargando } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { Informes } from '../models/recursos.js';
import { encabezado } from '../views/layout.js';
import { htmlTabla } from '../views/tabla.js';
import { columnasIncidencia } from './incidencias.js';
import { op } from './definiciones.js';

export async function paginaInformes(main) {
  const hoy = new Date().toISOString().slice(0, 10);
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const zonas = await op.zonas();
  main.innerHTML = encabezado(t('menu.informes'), t('informes.subtitulo')) + `
    <section class="tarjeta"><form class="barra-filtros" id="filtros">
      <label class="filtro">${esc(t('informes.desde'))}<input type="date" name="desde" value="${hace30}"></label>
      <label class="filtro">${esc(t('informes.hasta'))}<input type="date" name="hasta" value="${hoy}"></label>
      <label class="filtro">${esc(t('campo.zona'))}<select name="zona_id"><option value="">${esc(t('general.todas'))}</option>${zonas.map(([v, n]) => `<option value="${v}">${esc(n)}</option>`).join('')}</select></label>
      <label class="filtro">${esc(t('campo.estado'))}<select name="estado"><option value="">${esc(t('general.todos'))}</option>${['abierta', 'en_curso', 'resuelta', 'descartada'].map((e) => `<option value="${e}">${esc(t('estado.' + e))}</option>`).join('')}</select></label>
      <button class="btn btn-primario">${esc(t('informes.generar'))}</button>
      <button type="button" class="btn" id="csv">⬇ CSV</button>
      <button type="button" class="btn" id="imprimir">🖶 ${esc(t('informes.imprimir'))}</button>
    </form><div id="resultado"></div></section>`;
  const form = main.querySelector('#filtros');
  const resultado = main.querySelector('#resultado');
  const filtros = () => Object.fromEntries(new FormData(form));

  async function generar() {
    cargando(resultado);
    try {
      const r = await Informes.incidencias(filtros());
      resultado.innerHTML = `<div class="kpis kpis-chicos">
          <div class="kpi"><span class="kpi-valor">${r.meta.total}</span><span class="kpi-titulo">${esc(t('informes.total'))}</span></div>
          <div class="kpi kpi-alerta"><span class="kpi-valor">${r.meta.abiertas}</span><span class="kpi-titulo">${esc(t('informes.abiertas'))}</span></div>
          <div class="kpi"><span class="kpi-valor">${r.meta.cerradas}</span><span class="kpi-titulo">${esc(t('informes.cerradas'))}</span></div></div>`
        + htmlTabla(r.datos, columnasIncidencia);
    } catch (e) { resultado.innerHTML = `<p class="error">${esc(e.message)}</p>`; }
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); generar(); });
  main.querySelector('#csv').addEventListener('click', async () => {
    try {
      const r = await Informes.incidencias({ ...filtros(), formato: 'csv' });
      descargar(r.blob, `incidencias_${filtros().desde}_${filtros().hasta}.csv`);
    } catch (e) { toast(e.message, 'error'); }
  });
  main.querySelector('#imprimir').addEventListener('click', () => window.print());
  generar();
}
