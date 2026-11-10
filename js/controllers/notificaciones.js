// Sistema de notificaciones y alertas: consulta periódica a la API y aviso en pantalla.
import { esc, fecha, toast } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { INTERVALO_NOTIFICACIONES } from '../config.js';
import { Notificaciones } from '../models/recursos.js';

let temporizador = null;
let ultimoId = 0;

export function iniciarNotificaciones() {
  const boton = document.getElementById('btn-notificaciones');
  const panel = document.getElementById('panel-notificaciones');
  boton.addEventListener('click', async () => {
    const abrir = panel.hidden;
    panel.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
    if (abrir) await mostrarLista(panel);
  });
  panel.addEventListener('click', async (e) => {
    const item = e.target.closest('[data-notificacion]');
    if (e.target.closest('[data-todas]')) {
      await Notificaciones.marcarTodas();
      actualizarContador(0);
      await mostrarLista(panel);
    } else if (item) {
      await Notificaciones.marcar(item.dataset.notificacion);
      panel.hidden = true;
      if (item.dataset.enlace) location.hash = item.dataset.enlace;
      consultar(false);
    }
  });
  consultar(false);
  temporizador = setInterval(() => consultar(true), INTERVALO_NOTIFICACIONES);
}

export function detenerNotificaciones() {
  clearInterval(temporizador);
  ultimoId = 0;
}

async function consultar(avisar) {
  try {
    const r = await Notificaciones.listar(true);
    actualizarContador(r.meta.no_leidas);
    const nueva = r.datos[0];
    if (avisar && nueva && nueva.id > ultimoId) toast(`${nueva.titulo}: ${nueva.mensaje}`, 'info');
    if (nueva) ultimoId = Math.max(ultimoId, nueva.id);
  } catch {
    // si falla la consulta (sin conexión) se reintenta en el siguiente ciclo
  }
}

function actualizarContador(n) {
  const c = document.getElementById('contador-notificaciones');
  if (!c) return;
  c.hidden = n === 0;
  c.textContent = n > 9 ? '9+' : String(n);
}

async function mostrarLista(panel) {
  const r = await Notificaciones.listar(false);
  panel.innerHTML = `<div class="panel-cabecera"><strong>${esc(t('notificaciones.titulo'))}</strong>
      <button class="btn-enlace" data-todas>${esc(t('notificaciones.marcar_todas'))}</button></div>
    <ul>${r.datos.map((n) => `<li data-notificacion="${n.id}" data-enlace="${esc(n.enlace || '')}" class="${n.leida ? '' : 'no-leida'}" tabindex="0">
      <strong>${esc(n.titulo)}</strong><span>${esc(n.mensaje)}</span><time>${fecha(n.creado_en)}</time></li>`).join('') || `<li class="vacio">${esc(t('notificaciones.vacio'))}</li>`}</ul>`;
}
