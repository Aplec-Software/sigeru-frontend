// Punto de entrada del frontend: carga idioma y sesión, define las rutas y
// dibuja la pantalla que corresponde a la dirección (#/...) y al rol del usuario.
import { cargarIdioma, t, idiomaActual } from './core/i18n.js';
import { cargarSesion, usuarioActual, cerrarSesion } from './core/sesion.js';
import { cuandoExpireLaSesion } from './core/api.js';
import { ruta, resolver, rutaActual, ir } from './core/router.js';
import { esc } from './core/dom.js';
import { Parametros } from './models/recursos.js';
import { htmlAplicacion, marcarMenuActivo, paginaInicial } from './views/layout.js';
import { paginaLogin, paginaRegistro, paginaPerfil } from './controllers/auth.js';
import { paginaPanel } from './controllers/panel.js';
import { paginaMapa } from './controllers/mapa.js';
import { paginaIncidencias } from './controllers/incidencias.js';
import { paginaCrud } from './controllers/crud.js';
import {
  defContenedores, defCentros, defMaquinaria, defRepuestos, defCamiones, defMantenimientos,
  defCuadrillas, defRutas, defAsignaciones, defUsuarios, limpiarOpciones,
} from './controllers/definiciones.js';
import { paginaTareas, paginaMiRuta } from './controllers/cuadrilla.js';
import { paginaMiCentro } from './controllers/operario.js';
import { paginaReportar, paginaMisReportes, paginaQr } from './controllers/vecino.js';
import { paginaInformes } from './controllers/informes.js';
import { iniciarNotificaciones, detenerNotificaciones } from './controllers/notificaciones.js';

const ADMIN = ['administrador'];
let parametros = {};
let shellDibujado = false;

// --------------------------------------------------------------- rutas
ruta('/login', (main) => paginaLogin(main, () => { shellDibujado = false; ir(paginaInicial(usuarioActual().rol)); }), null);
ruta('/registro', (main) => paginaRegistro(main), null);
ruta('/qr/:codigo', (main, p) => paginaQr(main, p), null);
ruta('/panel', (main) => paginaPanel(main), ADMIN);
ruta('/mapa', (main) => paginaMapa(main, parametros), ['administrador', 'cuadrilla', 'vecino']);
ruta('/incidencias', (main, p, q) => paginaIncidencias(main, q), ADMIN);
ruta('/incidencias/:id', (main) => paginaIncidencias(main, {}), ADMIN);
ruta('/contenedores', (main, p, q) => paginaCrud(main, defContenedores, q), ADMIN);
ruta('/centros', (main, p, q) => paginaCrud(main, defCentros, q), ADMIN);
ruta('/maquinaria', (main, p, q) => paginaCrud(main, defMaquinaria(), q), ['administrador', 'operario']);
ruta('/repuestos', (main, p, q) => paginaCrud(main, defRepuestos, q), ADMIN);
ruta('/camiones', (main, p, q) => paginaCrud(main, defCamiones, q), ADMIN);
ruta('/mantenimientos', (main, p, q) => paginaCrud(main, defMantenimientos, q), ADMIN);
ruta('/cuadrillas', (main, p, q) => paginaCrud(main, defCuadrillas, q), ADMIN);
ruta('/rutas', (main, p, q) => paginaCrud(main, defRutas, q), ADMIN);
ruta('/asignaciones', (main, p, q) => paginaCrud(main, defAsignaciones, q), ADMIN);
ruta('/usuarios', (main, p, q) => paginaCrud(main, defUsuarios, q), ADMIN);
ruta('/informes', (main) => paginaInformes(main), ADMIN);
ruta('/tareas', (main) => paginaTareas(main), ['cuadrilla']);
ruta('/mi-ruta', (main) => paginaMiRuta(main), ['cuadrilla']);
ruta('/mi-centro', (main) => paginaMiCentro(main), ['operario']);
ruta('/reportar', (main) => paginaReportar(main, parametros), ['vecino', 'cuadrilla', 'administrador']);   // RF-31
ruta('/mis-reportes', (main) => paginaMisReportes(main), ['vecino']);
ruta('/perfil', (main) => paginaPerfil(main), ['administrador', 'cuadrilla', 'operario', 'vecino']);

// --------------------------------------------------------- navegación
async function navegar() {
  const usuario = usuarioActual();
  const destino = resolver(usuario?.rol);
  const app = document.getElementById('app');

  if (!destino) {
    ir(usuario ? paginaInicial(usuario.rol) : '/login');
    return;
  }
  if (destino.prohibido) {
    ir(usuario ? paginaInicial(usuario.rol) : '/login');
    return;
  }
  if (destino.publica || !usuario) {
    if (!destino.publica) { ir('/login'); return; }
    if (usuario && ['/login', '/registro'].includes(rutaActual().camino)) { ir(paginaInicial(usuario.rol)); return; }
    shellDibujado = false;
    detenerNotificaciones();
    await destino.controlador(app, destino.params, destino.consulta);
    return;
  }
  if (!shellDibujado) dibujarShell(usuario);
  const main = document.getElementById('contenido');
  marcarMenuActivo(rutaActual().camino);
  document.getElementById('lateral').classList.remove('abierto');
  const nuevo = main.cloneNode(false);   // se reemplaza para quitar los eventos de la página anterior
  main.replaceWith(nuevo);
  try {
    await destino.controlador(nuevo, destino.params, destino.consulta);
  } catch (e) {
    nuevo.innerHTML = `<p class="error">${esc(e.message)}</p>`;
  }
  nuevo.focus({ preventScroll: true });
}

function dibujarShell(usuario) {
  const app = document.getElementById('app');
  app.innerHTML = htmlAplicacion(usuario, parametros.nombre_organizacion);
  shellDibujado = true;
  document.getElementById('btn-salir').addEventListener('click', async () => {
    await cerrarSesion();
    detenerNotificaciones();
    limpiarOpciones();
    shellDibujado = false;
    ir('/login');
  });
  document.getElementById('btn-idioma').addEventListener('click', async () => {
    await cargarIdioma(idiomaActual() === 'es' ? 'en' : 'es');
    shellDibujado = false;
    navegar();
  });
  document.getElementById('btn-menu').addEventListener('click', (e) => {
    const lateral = document.getElementById('lateral');
    lateral.classList.toggle('abierto');
    e.currentTarget.setAttribute('aria-expanded', String(lateral.classList.contains('abierto')));
  });
  iniciarNotificaciones();
}

// ----------------------------------------------------------- arranque
async function iniciar() {
  try {
    parametros = (await Parametros.publicos()).datos;
  } catch {
    parametros = {};
  }
  const usuario = await cargarSesion();
  const idiomaUrl = new URLSearchParams(location.search).get('lang');
  await cargarIdioma(idiomaUrl || usuario?.idioma || parametros.idioma_por_defecto || 'es');
  document.title = `SiGeRU · ${t('app.titulo')}`;
  cuandoExpireLaSesion(() => {
    if (usuarioActual()) {
      shellDibujado = false;
      detenerNotificaciones();
      ir('/login');
    }
  });
  window.addEventListener('hashchange', navegar);
  navegar();
}

iniciar();
