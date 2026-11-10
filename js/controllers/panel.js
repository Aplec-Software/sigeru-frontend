// Panel de control del administrador: indicadores y gráficos.
import { esc, numero, cargando } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { Estadisticas } from '../models/recursos.js';
import { encabezado } from '../views/layout.js';
import { barras, barrasHorizontales, dona, linea } from '../views/graficos.js';
import { COLORES } from '../views/mapa.js';

export async function paginaPanel(main) {
  main.innerHTML = encabezado(t('menu.panel'), t('panel.subtitulo'),
    `<label class="filtro">${esc(t('panel.periodo'))} <select id="periodo"><option value="7">7 ${esc(t('general.dias'))}</option><option value="30" selected>30 ${esc(t('general.dias'))}</option><option value="90">90 ${esc(t('general.dias'))}</option></select></label>`)
    + '<div id="panel"></div>';
  const contenedor = main.querySelector('#panel');
  const dibujar = async (dias) => {
    cargando(contenedor);
    try {
      const hasta = new Date().toISOString().slice(0, 10);
      const desde = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
      const [resumen, top, zonas, tiempos, ocupacion, proyeccion, volumen] = await Promise.all([
        Estadisticas.resumen(), Estadisticas.topDesbordados(dias), Estadisticas.zonas(dias), Estadisticas.tiempos(dias),
        Estadisticas.ocupacion(), Estadisticas.proyeccion(), Estadisticas.volumen({ desde, hasta, agrupar: 'dia' }),
      ]);
      const r = resumen.datos;
      const inc = r.incidencias;
      const kpi = (titulo, valor, clase = '') => `<div class="kpi ${clase}"><span class="kpi-valor">${valor}</span><span class="kpi-titulo">${esc(t(titulo))}</span></div>`;
      contenedor.innerHTML = `
        <div class="kpis">
          ${kpi('panel.incidencias_abiertas', numero(inc.abierta || 0), (inc.abierta || 0) > 0 ? 'kpi-alerta' : '')}
          ${kpi('panel.incidencias_en_curso', numero(inc.en_curso || 0))}
          ${kpi('panel.contenedores_desbordados', numero(r.contenedores.desbordado || 0), (r.contenedores.desbordado || 0) > 0 ? 'kpi-alerta' : '')}
          ${kpi('panel.camiones_disponibles', numero(r.camiones.disponible || 0))}
          ${kpi('panel.centros_en_alerta', numero(r.centros_en_alerta), r.centros_en_alerta ? 'kpi-alerta' : '')}
          ${kpi('panel.kilos_periodo', numero(volumen.meta.total_kilos / 1000, 1) + ' t')}
        </div>
        <div class="grilla-graficos">
          <section class="tarjeta"><h2>${esc(t('panel.top_desbordados'))}</h2>${barrasHorizontales(top.datos.map((d) => ({ etiqueta: `${d.codigo} · ${d.direccion}`, valor: d.cantidad })), { color: COLORES.desbordado }) || `<p class="vacio">${esc(t('general.sin_datos'))}</p>`}</section>
          <section class="tarjeta"><h2>${esc(t('panel.estado_contenedores'))}</h2>${dona(Object.entries(r.contenedores).map(([e, v]) => ({ etiqueta: t('estado.' + e), valor: v, color: COLORES[e] })))}</section>
          <section class="tarjeta ancho-2"><h2>${esc(t('panel.volumen_diario'))}</h2>${linea(volumen.datos.map((d) => ({ etiqueta: d.grupo.slice(5), valor: d.kilos / 1000 })))}
            <p class="ayuda">${esc(t('panel.volumen_nota'))}</p></section>
          <section class="tarjeta"><h2>${esc(t('panel.zonas_criticas'))}</h2>${barras(zonas.datos.slice(0, 8).map((z) => ({ etiqueta: z.zona, valor: z.indice })), { color: COLORES.abierta })}
            <p class="ayuda">${esc(t('panel.indice_nota'))}</p></section>
          <section class="tarjeta"><h2>${esc(t('panel.tiempos_resolucion'))}</h2>${barras(tiempos.datos.map((x) => ({ etiqueta: t('incidencia.' + x.tipo), valor: x.horas_promedio })), { sufijo: ' h' })}
            <p class="ayuda">${esc(t('panel.horas_nota'))}</p></section>
          <section class="tarjeta"><h2>${esc(t('panel.ocupacion_centros'))}</h2>${barrasHorizontales(ocupacion.datos.map((c) => ({ etiqueta: c.nombre, valor: c.porcentaje, color: c.porcentaje >= 85 ? COLORES.roto : COLORES.centro })))}</section>
          <section class="tarjeta"><h2>${esc(t('panel.proyeccion'))}</h2>
            <table class="tabla tabla-compacta"><thead><tr><th>${esc(t('campo.codigo'))}</th><th>${esc(t('campo.zona'))}</th><th>${esc(t('panel.dias_lleno'))}</th></tr></thead>
            <tbody>${proyeccion.datos.map((p) => `<tr><td>${esc(p.codigo)}</td><td>${esc(p.zona)}</td><td><strong>${numero(p.dias_hasta_lleno, 1)}</strong></td></tr>`).join('')}</tbody></table></section>
        </div>`;
    } catch (e) {
      contenedor.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    }
  };
  main.querySelector('#periodo').addEventListener('change', (e) => dibujar(Number(e.target.value)));
  dibujar(30);
}
