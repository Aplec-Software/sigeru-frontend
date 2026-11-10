// Modelos: cada recurso de la API con sus operaciones REST.
import { API } from '../config.js';
import { get, post, put, eliminar, query } from '../core/api.js';

export function recurso(base) {
  return {
    listar: (filtros = {}) => get(base + query(filtros)),
    obtener: (id) => get(`${base}/${id}`),
    crear: (datos) => post(base, datos),
    modificar: (id, datos) => put(`${base}/${id}`, datos),
    borrar: (id) => eliminar(`${base}/${id}`),
  };
}

export const Usuarios = {
  ...recurso(`${API.usuarios}/usuarios`),
  cambiarEstado: (id, estado) => put(`${API.usuarios}/usuarios/${id}/estado`, { estado }),
  login: (email, password) => post(`${API.usuarios}/auth/login`, { email, password }),
  registro: (datos) => post(`${API.usuarios}/auth/registro`, datos),
  perfil: (datos) => put(`${API.usuarios}/perfil`, datos),
  clave: (actual, nueva) => put(`${API.usuarios}/perfil/clave`, { actual, nueva }),
};

export const Notificaciones = {
  listar: (soloNoLeidas = false) => get(`${API.usuarios}/notificaciones${query({ no_leidas: soloNoLeidas ? 1 : '', limite: 15 })}`),
  marcar: (id) => put(`${API.usuarios}/notificaciones/${id}`),
  marcarTodas: () => put(`${API.usuarios}/notificaciones`),
};

export const Parametros = { publicos: () => get(`${API.usuarios}/parametros/publicos`) };

export const Zonas = recurso(`${API.gestion}/zonas`);
export const TiposResiduo = recurso(`${API.gestion}/tipos-residuo`);
export const Contenedores = { ...recurso(`${API.gestion}/contenedores`), porCodigo: (c) => get(`${API.gestion}/contenedores/codigo/${encodeURIComponent(c)}`) };
export const Centros = {
  ...recurso(`${API.gestion}/centros`),
  movimientos: (id, filtros = {}) => get(`${API.gestion}/centros/${id}/movimientos${query(filtros)}`),
  registrarMovimiento: (id, datos) => post(`${API.gestion}/centros/${id}/movimientos`, datos),
};
export const Maquinaria = { ...recurso(`${API.gestion}/maquinaria`), estado: (id, estado) => put(`${API.gestion}/maquinaria/${id}/estado`, { estado }) };
export const Repuestos = { ...recurso(`${API.gestion}/repuestos`), mover: (id, datos) => post(`${API.gestion}/repuestos/${id}/movimientos`, datos) };
export const Incidencias = {
  ...recurso(`${API.gestion}/incidencias`),
  asignar: (id, cuadrilla_id) => put(`${API.gestion}/incidencias/${id}/asignar`, { cuadrilla_id }),
  estado: (id, estado, comentario) => put(`${API.gestion}/incidencias/${id}/estado`, { estado, comentario }),
  qr: (datos) => post(`${API.gestion}/incidencias/qr`, datos),
};
export const Mapa = { obtener: () => get(`${API.gestion}/mapa`) };
export const Estadisticas = {
  resumen: () => get(`${API.gestion}/estadisticas/resumen`),
  topDesbordados: (dias = 30) => get(`${API.gestion}/estadisticas/top-desbordados?dias=${dias}&limite=8`),
  zonas: (dias = 30) => get(`${API.gestion}/estadisticas/zonas-criticas?dias=${dias}`),
  tiempos: (dias = 30) => get(`${API.gestion}/estadisticas/tiempos-resolucion?dias=${dias}`),
  ocupacion: () => get(`${API.gestion}/estadisticas/ocupacion-centros`),
  proyeccion: () => get(`${API.gestion}/estadisticas/proyeccion-llenado?limite=8`),
  volumen: (filtros) => get(`${API.recoleccion}/estadisticas/volumen${query(filtros)}`),
  flota: () => get(`${API.recoleccion}/estadisticas/flota`),
};
export const Informes = { incidencias: (filtros) => get(`${API.gestion}/informes/incidencias${query(filtros)}`) };

export const Camiones = { ...recurso(`${API.recoleccion}/camiones`), estado: (id, estado) => put(`${API.recoleccion}/camiones/${id}/estado`, { estado }) };
export const Mantenimientos = recurso(`${API.recoleccion}/mantenimientos`);
export const Cuadrillas = {
  ...recurso(`${API.recoleccion}/cuadrillas`),
  mia: () => get(`${API.recoleccion}/cuadrillas/mia`),
  integrantes: (id, integrantes) => put(`${API.recoleccion}/cuadrillas/${id}/integrantes`, { integrantes }),
};
export const Rutas = {
  ...recurso(`${API.recoleccion}/rutas`),
  contenedores: (id, ids) => put(`${API.recoleccion}/rutas/${id}/contenedores`, { contenedores: ids }),
  optimizacion: (id) => get(`${API.recoleccion}/rutas/${id}/optimizacion`),
};
export const Asignaciones = {
  ...recurso(`${API.recoleccion}/asignaciones`),
  hoy: () => get(`${API.recoleccion}/asignaciones/hoy`),
  estado: (id, estado) => put(`${API.recoleccion}/asignaciones/${id}/estado`, { estado }),
  recoleccion: (id, datos) => post(`${API.recoleccion}/asignaciones/${id}/recolecciones`, datos),
  recurso: (id, datos) => post(`${API.recoleccion}/asignaciones/${id}/recursos`, datos),
};
