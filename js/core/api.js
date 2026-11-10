// Comunicación con las APIs REST mediante fetch.
// El token viaja en una cookie HttpOnly que JavaScript no puede leer;
// por eso el frontend no guarda credenciales ni datos en el navegador.
import { idiomaActual } from './i18n.js';

export class ApiError extends Error {
  constructor(status, mensaje, errores = null) {
    super(mensaje);
    this.status = status;
    this.errores = errores;
  }
}

let alExpirarSesion = () => {};
export function cuandoExpireLaSesion(funcion) {
  alExpirarSesion = funcion;
}

export async function pedir(metodo, url, cuerpo = null) {
  const opciones = {
    method: metodo,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Accept-Language': idiomaActual(),
      // encabezado que exige la API para aceptar cambios hechos con la cookie (protección CSRF)
      'X-Requested-With': 'SiGeRU',
    },
  };
  if (cuerpo !== null) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (e) {
    throw new ApiError(0, 'No se pudo conectar con el servidor.');
  }

  const tipo = respuesta.headers.get('Content-Type') || '';
  if (tipo.includes('text/csv')) {
    return { blob: await respuesta.blob() };
  }
  const datos = tipo.includes('application/json') ? await respuesta.json() : {};
  if (!respuesta.ok) {
    if (respuesta.status === 401 && !url.endsWith('/auth/login')) {
      alExpirarSesion();
    }
    throw new ApiError(respuesta.status, datos.mensaje || `Error ${respuesta.status}`, datos.errores || null);
  }
  return datos;
}

export const get = (url) => pedir('GET', url);
export const post = (url, cuerpo = {}) => pedir('POST', url, cuerpo);
export const put = (url, cuerpo = {}) => pedir('PUT', url, cuerpo);
export const eliminar = (url) => pedir('DELETE', url);

// Arma una query string ignorando los valores vacíos
export function query(parametros = {}) {
  const pares = Object.entries(parametros).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  return pares.length ? '?' + new URLSearchParams(pares).toString() : '';
}
