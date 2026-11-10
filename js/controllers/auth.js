// Inicio de sesión, registro y perfil.
import { esc, toast } from '../core/dom.js';
import { t, cargarIdioma } from '../core/i18n.js';
import { setUsuario, usuarioActual } from '../core/sesion.js';
import { Usuarios } from '../models/recursos.js';
import { htmlCampos, leerFormulario, validarFormulario, mostrarErroresApi, validarCedula, validarClave } from '../views/formulario.js';
import { encabezado } from '../views/layout.js';

function marcoPublico(contenido) {
  return `<div class="publico"><div class="publico-caja">
    <a href="/" class="publico-marca"><img src="img/logo-sigeru.png" alt="SiGeRU" width="72" height="86"></a>${contenido}
    <p class="publico-pie"><a href="/">${esc(t('auth.volver_inicio'))}</a> · ${esc(t('auth.desarrollado'))}</p></div></div>`;
}

export function paginaLogin(main, alIngresar) {
  const campos = [
    { nombre: 'email', etiqueta: 'campo.email', tipo: 'email', requerido: true, autocompletar: 'username' },
    { nombre: 'password', etiqueta: 'campo.password', tipo: 'password', requerido: true, autocompletar: 'current-password' },
  ];
  main.innerHTML = marcoPublico(`
    <h1>${esc(t('auth.titulo_login'))}</h1>
    <form novalidate class="form-vertical">${htmlCampos(campos)}
      <button class="btn btn-primario btn-bloque" type="submit">${esc(t('auth.ingresar'))}</button></form>
    <p>${esc(t('auth.sin_cuenta'))} <a href="#/registro">${esc(t('auth.registrarse'))}</a></p>`);
  const form = main.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarFormulario(form, campos)) return;
    const { email, password } = leerFormulario(form, campos);
    const boton = form.querySelector('button');
    boton.disabled = true;
    try {
      const r = await Usuarios.login(email, password);
      setUsuario(r.datos.usuario);
      await cargarIdioma(r.datos.usuario.idioma);
      toast(r.mensaje);
      alIngresar(r.datos.usuario);
    } catch (err) {
      if (err.status === 422) mostrarErroresApi(form, err.errores);
      toast(err.message, 'error');
      boton.disabled = false;
    }
  });
}

export function paginaRegistro(main) {
  const campos = [
    { nombre: 'nombre', etiqueta: 'campo.nombre', requerido: true, maxLargo: 60, autocompletar: 'given-name' },
    { nombre: 'apellido', etiqueta: 'campo.apellido', requerido: true, maxLargo: 60, autocompletar: 'family-name' },
    { nombre: 'email', etiqueta: 'campo.email', tipo: 'email', requerido: true, maxLargo: 120, autocompletar: 'email' },
    { nombre: 'telefono', etiqueta: 'campo.telefono', tipo: 'tel', patron: '[0-9 +()-]{8,20}' },
    { nombre: 'rol', etiqueta: 'auth.soy', tipo: 'select', prefijo: 'rol', opciones: ['vecino', 'cuadrilla', 'operario'], requerido: true, porDefecto: 'vecino' },
    { nombre: 'documento', etiqueta: 'campo.documento', ayuda: 'ayuda.cedula_personal', validar: validarCedula },
    { nombre: 'password', etiqueta: 'campo.password', tipo: 'password', requerido: true, validar: validarClave, ayuda: 'ayuda.clave', autocompletar: 'new-password' },
    { nombre: 'password2', etiqueta: 'campo.repetir_password', tipo: 'password', requerido: true, autocompletar: 'new-password' },
  ];
  main.innerHTML = marcoPublico(`
    <h1>${esc(t('auth.titulo_registro'))}</h1>
    <form novalidate class="form-grid">${htmlCampos(campos)}
      <div class="trampa" aria-hidden="true"><label>Sitio web <input name="sitio_web" tabindex="-1" autocomplete="off"></label></div>
      <button class="btn btn-primario btn-bloque campo-completo" type="submit">${esc(t('auth.enviar_solicitud'))}</button></form>
    <p>${esc(t('auth.con_cuenta'))} <a href="#/login">${esc(t('auth.ingresar'))}</a></p>`);
  const form = main.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarFormulario(form, campos)) return;
    const datos = leerFormulario(form, campos);
    if (datos.password !== datos.password2) {
      mostrarErroresApi(form, { password2: t('validacion.claves_distintas') });
      return;
    }
    if (datos.rol !== 'vecino' && !datos.documento) {
      mostrarErroresApi(form, { documento: t('validacion.requerido') });
      return;
    }
    delete datos.password2;
    datos.sitio_web = form.sitio_web.value;
    if (datos.documento) datos.documento = datos.documento.replace(/\D/g, '');
    try {
      const r = await Usuarios.registro(datos);
      main.querySelector('.publico-caja').innerHTML = `<h1>${esc(t('auth.solicitud_enviada'))}</h1><p class="mensaje-ok">${esc(r.mensaje)}</p>
        <a class="btn btn-primario" href="#/login">${esc(t('auth.ingresar'))}</a>`;
    } catch (err) {
      if (err.status === 422) mostrarErroresApi(form, err.errores);
      toast(err.message, 'error');
    }
  });
}

export function paginaPerfil(main) {
  const u = usuarioActual();
  const datosCampos = [
    { nombre: 'nombre', etiqueta: 'campo.nombre', requerido: true, maxLargo: 60 },
    { nombre: 'apellido', etiqueta: 'campo.apellido', requerido: true, maxLargo: 60 },
    { nombre: 'telefono', etiqueta: 'campo.telefono', tipo: 'tel', patron: '[0-9 +()-]{8,20}' },
    { nombre: 'idioma', etiqueta: 'campo.idioma', tipo: 'select', opciones: [['es', 'Español'], ['en', 'English']], requerido: true },
  ];
  const claveCampos = [
    { nombre: 'actual', etiqueta: 'campo.password_actual', tipo: 'password', requerido: true, autocompletar: 'current-password' },
    { nombre: 'nueva', etiqueta: 'campo.password_nueva', tipo: 'password', requerido: true, validar: validarClave, ayuda: 'ayuda.clave', autocompletar: 'new-password' },
  ];
  main.innerHTML = encabezado(t('menu.perfil'), `${u.email} · ${t('rol.' + u.rol)}`) + `
    <div class="columnas-2">
      <section class="tarjeta"><h2>${esc(t('perfil.datos'))}</h2><form id="f-datos" class="form-grid" novalidate>${htmlCampos(datosCampos, u)}
        <div class="acciones-form campo-completo"><button class="btn btn-primario">${esc(t('general.guardar'))}</button></div></form></section>
      <section class="tarjeta"><h2>${esc(t('perfil.clave'))}</h2><form id="f-clave" class="form-grid" novalidate>${htmlCampos(claveCampos)}
        <div class="acciones-form campo-completo"><button class="btn btn-primario">${esc(t('perfil.cambiar_clave'))}</button></div></form></section>
    </div>`;
  const fDatos = main.querySelector('#f-datos');
  fDatos.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarFormulario(fDatos, datosCampos)) return;
    try {
      const r = await Usuarios.perfil(leerFormulario(fDatos, datosCampos));
      setUsuario(r.datos);
      toast(r.mensaje);
      if (r.datos.idioma !== document.documentElement.lang) {
        await cargarIdioma(r.datos.idioma);
        location.reload();
      }
    } catch (err) {
      if (err.status === 422) mostrarErroresApi(fDatos, err.errores);
      toast(err.message, 'error');
    }
  });
  const fClave = main.querySelector('#f-clave');
  fClave.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarFormulario(fClave, claveCampos)) return;
    const { actual, nueva } = leerFormulario(fClave, claveCampos);
    try {
      const r = await Usuarios.clave(actual, nueva);
      fClave.reset();
      toast(r.mensaje);
    } catch (err) {
      if (err.status === 422) mostrarErroresApi(fClave, err.errores);
      toast(err.message, 'error');
    }
  });
}
