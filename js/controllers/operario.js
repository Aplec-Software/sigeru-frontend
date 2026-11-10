// Pantalla del operario: estado de su centro y registro de ingresos y egresos.
import { esc, fecha, numero, toast, cargando } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { usuarioActual } from '../core/sesion.js';
import { Centros } from '../models/recursos.js';
import { encabezado } from '../views/layout.js';
import { htmlTabla } from '../views/tabla.js';
import { op } from './definiciones.js';

export async function paginaMiCentro(main) {
  const u = usuarioActual();
  if (!u.centro_id) {
    main.innerHTML = encabezado(t('menu.mi_centro')) + `<p class="vacio">${esc(t('centro.sin_asignar'))}</p>`;
    return;
  }
  main.innerHTML = encabezado(t('menu.mi_centro'), u.centro) + '<div id="centro"></div>';
  const caja = main.querySelector('#centro');
  const camiones = await op.camiones().catch(() => []);

  async function cargar() {
    cargando(caja);
    const [c, movs] = await Promise.all([Centros.obtener(u.centro_id), Centros.movimientos(u.centro_id, { por_pagina: 12 })]);
    const centro = c.datos;
    const libre = centro.capacidad_ton - centro.ocupacion_ton;
    caja.innerHTML = `
      <div class="kpis">
        <div class="kpi ${centro.porcentaje >= 85 ? 'kpi-alerta' : ''}"><span class="kpi-valor">${numero(centro.porcentaje, 1)}%</span><span class="kpi-titulo">${esc(t('campo.ocupacion'))}</span></div>
        <div class="kpi"><span class="kpi-valor">${numero(centro.ocupacion_ton, 1)} t</span><span class="kpi-titulo">${esc(t('centro.almacenado'))}</span></div>
        <div class="kpi"><span class="kpi-valor">${numero(libre, 1)} t</span><span class="kpi-titulo">${esc(t('centro.libre'))}</span></div>
      </div>
      <div class="columnas-2">
        <section class="tarjeta"><h2>${esc(t('centro.registrar'))}</h2>
          <form class="form-grid" novalidate>
            <div class="campo"><label for="m-tipo">${esc(t('centro.movimiento'))}</label><select id="m-tipo" name="tipo_movimiento"><option value="ingreso">${esc(t('centro.ingreso'))}</option><option value="egreso">${esc(t('centro.egreso'))}</option></select></div>
            <div class="campo"><label for="m-residuo">${esc(t('campo.tipo_residuo'))}</label><select id="m-residuo" name="tipo_residuo_id" required>${centro.tipos.map((x) => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('')}</select></div>
            <div class="campo"><label for="m-peso">${esc(t('campo.peso_ton'))}</label><input id="m-peso" name="peso_ton" type="number" step="0.01" min="0.01" max="500" required></div>
            <div class="campo"><label for="m-camion">${esc(t('campo.camion'))}</label><select id="m-camion" name="camion_id"><option value="">—</option>${camiones.map(([v, txt]) => `<option value="${v}">${esc(txt)}</option>`).join('')}</select></div>
            <div class="campo campo-completo"><label for="m-destino">${esc(t('centro.destino'))}</label><input id="m-destino" name="destino" maxlength="100"></div>
            <div class="acciones-form campo-completo"><button class="btn btn-primario">${esc(t('general.guardar'))}</button></div>
          </form></section>
        <section class="tarjeta"><h2>${esc(t('centro.ultimos'))}</h2>${htmlTabla(movs.datos, [
          { campo: 'creado_en', titulo: 'campo.fecha', formato: (v) => fecha(v) },
          { campo: 'tipo_movimiento', titulo: 'centro.movimiento', formato: (v) => esc(t('centro.' + v)) },
          { campo: 'tipo_residuo', titulo: 'campo.tipo_residuo' },
          { campo: 'peso_ton', titulo: 'campo.peso_ton', formato: (v) => numero(v, 2) },
        ])}</section>
      </div>`;
    caja.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.reportValidity()) return;
      try {
        const r = await Centros.registrarMovimiento(u.centro_id, {
          tipo_movimiento: f.tipo_movimiento.value, tipo_residuo_id: Number(f.tipo_residuo_id.value), peso_ton: Number(f.peso_ton.value),
          camion_id: f.camion_id.value ? Number(f.camion_id.value) : null, destino: f.destino.value.trim() || null,
        });
        toast(r.mensaje);
        cargar();
      } catch (err) { toast(err.errores ? Object.values(err.errores).join(' ') : err.message, 'error'); }
    });
  }
  cargar();
}
