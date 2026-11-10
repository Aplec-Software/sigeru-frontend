// Usuario que inició sesión. Se mantiene solo en memoria: al recargar la
// página se vuelve a pedir a la API (/auth/me), que lo lee de la cookie.
import { get, post } from './api.js';
import { API } from '../config.js';

let usuario = null;

export async function cargarSesion() {
  try {
    const r = await get(`${API.usuarios}/auth/me`);
    usuario = r.datos;
  } catch (e) {
    usuario = null;
  }
  return usuario;
}

export function usuarioActual() {
  return usuario;
}

export function setUsuario(datos) {
  usuario = datos;
}

export function rol() {
  return usuario?.rol ?? null;
}

export async function cerrarSesion() {
  try {
    await post(`${API.usuarios}/auth/logout`);
  } finally {
    usuario = null;
  }
}
