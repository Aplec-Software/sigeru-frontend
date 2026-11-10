// Mapa interactivo de contenedores, centros, incidencias y camiones.
import { esc } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { Mapa } from '../models/recursos.js';
import { encabezado } from '../views/layout.js';
import { dibujarMapa, leyendaMapa } from '../views/mapa.js';

export async function paginaMapa(main, parametros) {
  main.innerHTML = encabezado(t('mapa.titulo'), t('mapa.subtitulo')) + `
    <section class="tarjeta">${leyendaMapa()}<div id="mapa" class="mapa" aria-label="${esc(t('mapa.titulo'))}"></div></section>`;
  try {
    const r = await Mapa.obtener();
    await dibujarMapa(main.querySelector('#mapa'), r.datos, [Number(parametros.mapa_latitud || -34.896), Number(parametros.mapa_longitud || -56.15)], Number(parametros.mapa_zoom || 13));
  } catch (e) {
    main.querySelector('#mapa').innerHTML = `<p class="error">${esc(e.message)}</p>`;
  }
}
