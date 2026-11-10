// Idioma parametrizable: los textos se cargan desde lang/es.json y lang/en.json.
let idioma = 'es';
let textos = {};

export async function cargarIdioma(codigo) {
  idioma = ['es', 'en'].includes(codigo) ? codigo : 'es';
  const respuesta = await fetch(`lang/${idioma}.json`);
  textos = await respuesta.json();
  document.documentElement.lang = idioma;
  traducirEstaticos();
}

export function idiomaActual() {
  return idioma;
}

// t('menu.panel') -> "Panel"; admite reemplazos: t('x', { n: 3 }) con "{n}" en el texto
export function t(clave, reemplazos = {}) {
  let texto = textos[clave] ?? clave;
  for (const [nombre, valor] of Object.entries(reemplazos)) {
    texto = texto.replaceAll(`{${nombre}}`, valor);
  }
  return texto;
}

// Traduce los elementos del HTML que tienen data-i18n="clave"
export function traducirEstaticos(raiz = document) {
  raiz.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  raiz.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
