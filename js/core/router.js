// Enrutador por hash (#/pagina/parametro). Cada ruta indica qué roles la pueden ver.
const rutas = [];

export function ruta(patron, controlador, roles = null) {
  const nombres = [];
  const regex = new RegExp('^' + patron.replace(/:(\w+)/g, (_, n) => { nombres.push(n); return '([^/]+)'; }) + '$');
  rutas.push({ regex, nombres, controlador, roles });
}

export function rutaActual() {
  const hash = location.hash.slice(1) || '/';
  const [camino, consulta = ''] = hash.split('?');
  return { camino, consulta: Object.fromEntries(new URLSearchParams(consulta)) };
}

export function resolver(rolUsuario) {
  const { camino, consulta } = rutaActual();
  for (const r of rutas) {
    const m = camino.match(r.regex);
    if (!m) continue;
    const params = Object.fromEntries(r.nombres.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
    if (r.roles && !r.roles.includes(rolUsuario)) {
      return { prohibido: true, publica: r.roles === null };
    }
    return { controlador: r.controlador, params, consulta, publica: r.roles === null };
  }
  return null;
}

export function ir(destino) {
  location.hash = destino;
}
