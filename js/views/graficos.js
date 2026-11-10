// Gráficos simples en SVG, hechos a mano para no depender de librerías externas.
import { esc, numero } from '../core/dom.js';

const PALETA = ['#2A7F8F', '#5BAA4A', '#F2A541', '#D9534F', '#1F5FAD', '#8E6BBF', '#6B7280', '#C77C48'];

/** Barras verticales. datos: [{ etiqueta, valor }] */
export function barras(datos, { alto = 220, color = PALETA[0], sufijo = '' } = {}) {
  if (!datos.length) return '';
  const ancho = Math.max(320, datos.length * 48);
  const max = Math.max(...datos.map((d) => d.valor), 1);
  const base = alto - 36;
  const paso = (ancho - 40) / datos.length;
  const barrasSvg = datos.map((d, i) => {
    const h = (d.valor / max) * (base - 20);
    const x = 30 + i * paso + paso * 0.18;
    const w = paso * 0.64;
    return `<g><rect x="${x}" y="${base - h}" width="${w}" height="${h}" rx="4" fill="${d.color || color}"><title>${esc(d.etiqueta)}: ${numero(d.valor, 1)}${sufijo}</title></rect>
      <text x="${x + w / 2}" y="${base - h - 6}" text-anchor="middle" class="g-valor">${numero(d.valor, d.valor % 1 ? 1 : 0)}</text>
      <text x="${x + w / 2}" y="${base + 16}" text-anchor="middle" class="g-etiqueta">${esc(recortar(d.etiqueta, 10))}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${ancho} ${alto}" class="grafico" role="img"><line x1="24" y1="${base}" x2="${ancho - 6}" y2="${base}" class="g-eje"/>${barrasSvg}</svg>`;
}

/** Barras horizontales, útiles para rankings. */
export function barrasHorizontales(datos, { color = PALETA[3] } = {}) {
  if (!datos.length) return '';
  const fila = 30;
  const alto = datos.length * fila + 10;
  const max = Math.max(...datos.map((d) => d.valor), 1);
  const items = datos.map((d, i) => {
    const w = (d.valor / max) * 300;
    const y = i * fila + 6;
    return `<text x="0" y="${y + 15}" class="g-etiqueta">${esc(recortar(d.etiqueta, 22))}</text>
      <rect x="170" y="${y}" width="${Math.max(w, 2)}" height="20" rx="4" fill="${d.color || color}"><title>${esc(d.etiqueta)}: ${d.valor}</title></rect>
      <text x="${176 + w}" y="${y + 15}" class="g-valor">${numero(d.valor)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 520 ${alto}" class="grafico" role="img">${items}</svg>`;
}

/** Gráfico de dona. datos: [{ etiqueta, valor, color? }] */
export function dona(datos) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  if (!total) return '';
  let angulo = -Math.PI / 2;
  const r = 70;
  const c = 90;
  const sectores = datos.filter((d) => d.valor > 0).map((d, i) => {
    const fraccion = d.valor / total;
    const fin = angulo + fraccion * Math.PI * 2;
    const grande = fraccion > 0.5 ? 1 : 0;
    const x1 = c + r * Math.cos(angulo), y1 = c + r * Math.sin(angulo);
    const x2 = c + r * Math.cos(fin), y2 = c + r * Math.sin(fin);
    const camino = fraccion >= 0.999
      ? `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r} Z`
      : `M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${grande} 1 ${x2} ${y2} Z`;
    angulo = fin;
    return `<path d="${camino}" fill="${d.color || PALETA[i % PALETA.length]}"><title>${esc(d.etiqueta)}: ${d.valor}</title></path>`;
  }).join('');
  const leyenda = datos.map((d, i) => `<li><span class="punto" style="background:${d.color || PALETA[i % PALETA.length]}"></span>${esc(d.etiqueta)} <strong>${numero(d.valor)}</strong></li>`).join('');
  return `<div class="dona"><svg viewBox="0 0 180 180" class="grafico grafico-dona" role="img">${sectores}<circle cx="${c}" cy="${c}" r="42" fill="var(--superficie)"/>
    <text x="${c}" y="${c + 6}" text-anchor="middle" class="g-total">${numero(total)}</text></svg><ul class="leyenda">${leyenda}</ul></div>`;
}

/** Línea simple. datos: [{ etiqueta, valor }] */
export function linea(datos, { color = PALETA[1] } = {}) {
  if (datos.length < 2) return barras(datos);
  const ancho = 900, alto = 220, base = 184;
  const max = Math.max(...datos.map((d) => d.valor), 1);
  const paso = (ancho - 50) / (datos.length - 1);
  const puntos = datos.map((d, i) => [30 + i * paso, base - (d.valor / max) * 160]);
  const ruta = puntos.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const cada = Math.ceil(datos.length / 12);
  const etiquetas = datos.map((d, i) => (i % cada === 0 ? `<text x="${puntos[i][0]}" y="${base + 18}" text-anchor="middle" class="g-etiqueta">${esc(d.etiqueta)}</text>` : '')).join('');
  return `<svg viewBox="0 0 ${ancho} ${alto}" class="grafico" role="img"><line x1="24" y1="${base}" x2="${ancho - 6}" y2="${base}" class="g-eje"/>
    <path d="${ruta} L ${puntos.at(-1)[0]} ${base} L ${puntos[0][0]} ${base} Z" fill="${color}" opacity="0.15"/>
    <path d="${ruta}" fill="none" stroke="${color}" stroke-width="2.5"/>
    ${puntos.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${color}"><title>${esc(datos[i].etiqueta)}: ${numero(datos[i].valor, 1)}</title></circle>`).join('')}${etiquetas}</svg>`;
}

function recortar(texto, largo) {
  texto = String(texto ?? '');
  return texto.length > largo ? texto.slice(0, largo - 1) + '…' : texto;
}
