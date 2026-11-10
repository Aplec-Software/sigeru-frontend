// Formularios generados a partir de una lista de campos.
// La validación se hace dos veces: acá en el navegador (para avisar rápido) y
// en la API (que es la que realmente decide). Los errores de la API se
// muestran debajo de cada campo.
import { esc } from '../core/dom.js';
import { t } from '../core/i18n.js';

export function htmlCampos(campos, valores = {}) {
  return campos.map((c) => {
    const v = valores[c.nombre] ?? c.porDefecto ?? '';
    const req = c.requerido ? 'required' : '';
    const id = `campo-${c.nombre}`;
    const atributos = [
      req,
      c.min !== undefined ? `min="${c.min}"` : '',
      c.max !== undefined ? `max="${c.max}"` : '',
      c.paso ? `step="${c.paso}"` : '',
      c.maxLargo ? `maxlength="${c.maxLargo}"` : '',
      c.patron ? `pattern="${esc(c.patron)}"` : '',
      c.soloLectura ? 'readonly' : '',
    ].join(' ');
    let control;
    if (c.tipo === 'select') {
      const opciones = (c.opciones || []).map((o) => {
        const [valor, texto] = Array.isArray(o) ? o : [o, t(`${c.prefijo || 'estado'}.${o}`)];
        return `<option value="${esc(valor)}" ${String(valor) === String(v) ? 'selected' : ''}>${esc(texto)}</option>`;
      }).join('');
      control = `<select id="${id}" name="${c.nombre}" ${atributos}><option value="">${esc(t('general.seleccionar'))}</option>${opciones}</select>`;
    } else if (c.tipo === 'multiple') {
      const elegidos = (Array.isArray(v) ? v : []).map(String);
      control = `<div class="chequeos" id="${id}">${(c.opciones || []).map(([valor, texto]) =>
        `<label><input type="checkbox" name="${c.nombre}" value="${esc(valor)}" ${elegidos.includes(String(valor)) ? 'checked' : ''}> ${esc(texto)}</label>`).join('')}</div>`;
    } else if (c.tipo === 'textarea') {
      control = `<textarea id="${id}" name="${c.nombre}" rows="3" ${atributos}>${esc(v)}</textarea>`;
    } else {
      control = `<input id="${id}" name="${c.nombre}" type="${c.tipo || 'text'}" value="${esc(v)}" ${atributos} ${c.autocompletar ? `autocomplete="${c.autocompletar}"` : ''}>`;
    }
    return `
      <div class="campo ${c.ancho === 'completo' ? 'campo-completo' : ''}">
        <label for="${id}">${esc(t(c.etiqueta))}${c.requerido ? ' <span class="obligatorio" aria-hidden="true">*</span>' : ''}</label>
        ${control}
        ${c.ayuda ? `<small class="ayuda">${esc(t(c.ayuda))}</small>` : ''}
        <small class="error-campo" id="${id}-error" aria-live="polite"></small>
      </div>`;
  }).join('');
}

// Lee los valores del formulario convirtiendo números y listas
export function leerFormulario(form, campos) {
  const datos = {};
  for (const c of campos) {
    if (c.soloLectura) continue;
    if (c.tipo === 'multiple') {
      datos[c.nombre] = [...form.querySelectorAll(`[name="${c.nombre}"]:checked`)].map((x) => Number(x.value));
      continue;
    }
    const el = form.elements[c.nombre];
    if (!el) continue;
    let valor = el.value.trim();
    if (valor === '') {
      if (!c.omitirVacio) datos[c.nombre] = null;
      continue;
    }
    if (c.tipo === 'number' || c.numerico) valor = Number(valor);
    datos[c.nombre] = valor;
  }
  return datos;
}

// Validación del lado del cliente: reglas HTML5 + reglas propias de cada campo
export function validarFormulario(form, campos) {
  limpiarErrores(form);
  let ok = true;
  for (const c of campos) {
    const el = form.elements[c.nombre];
    if (!el || el instanceof RadioNodeList) continue;
    let mensaje = '';
    if (!el.checkValidity()) {
      mensaje = el.validity.valueMissing ? t('validacion.requerido') : t('validacion.formato');
    } else if (c.validar && el.value.trim() !== '') {
      mensaje = c.validar(el.value.trim()) || '';
    }
    if (mensaje) {
      mostrarError(form, c.nombre, mensaje);
      ok = false;
    }
  }
  if (!ok) form.querySelector('[aria-invalid="true"]')?.focus();
  return ok;
}

export function mostrarErroresApi(form, errores) {
  limpiarErrores(form);
  for (const [campo, mensaje] of Object.entries(errores || {})) {
    mostrarError(form, campo, mensaje);
  }
}

function mostrarError(form, campo, mensaje) {
  const caja = form.querySelector(`#campo-${campo}-error`);
  const el = form.elements[campo];
  if (caja) caja.textContent = mensaje;
  if (el && el.setAttribute) el.setAttribute('aria-invalid', 'true');
}

function limpiarErrores(form) {
  form.querySelectorAll('.error-campo').forEach((e) => (e.textContent = ''));
  form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
}

// ---------------------------------------------------------------- validadores

// Cédula uruguaya: el último dígito es de control
export function validarCedula(valor) {
  const ci = valor.replace(/\D/g, '').padStart(8, '0');
  if (!/^\d{8}$/.test(ci)) return t('validacion.cedula');
  const pesos = [2, 9, 8, 7, 6, 3, 4];
  const suma = pesos.reduce((s, p, i) => s + p * Number(ci[i]), 0);
  return (10 - (suma % 10)) % 10 === Number(ci[7]) ? '' : t('validacion.cedula');
}

export function validarClave(valor) {
  const segura = valor.length >= 10 && /[A-Z]/.test(valor) && /[a-z]/.test(valor) && /\d/.test(valor) && /[^A-Za-z0-9]/.test(valor);
  return segura ? '' : t('validacion.clave');
}
