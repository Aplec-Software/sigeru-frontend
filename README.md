# SiGeRU - Frontend de usuarios

Aplicación web para vecinos, cuadrillas, operarios de centros y administradores. Hecha solo con HTML, CSS y
JavaScript (módulos ES, sin frameworks), con patrón MVC del lado del cliente. Consume las tres APIs a través del gateway.

## Qué ve cada rol

| Rol | Pantallas principales |
|---|---|
| Vecino | Reportar una incidencia, mis reportes, mapa |
| Cuadrilla | Tareas (incidencias asignadas), mi ruta del día (ordenada por cercanía y urgencia) con registro de recolecciones y recursos usados, reporte de problemas, mapa |
| Operario | Mi centro (ingresos, egresos y ocupación), maquinaria del centro |
| Administrador | Panel con estadísticas, mapa, incidencias y ABM de contenedores, centros, maquinaria, repuestos, camiones, mantenimientos, cuadrillas, rutas (con la propuesta de orden), asignaciones y usuarios; informes |

Todos tienen además su perfil (datos, idioma y contraseña) y las notificaciones.

Además hay una página pública para el código QR de cada contenedor (`#/qr/CNT-0001`), desde la que cualquiera
puede reportar un problema sin registrarse.

## Estructura

```
index.html
css/estilos.css
js/
  config.js        direcciones de las APIs y del mapa
  core/            cliente de la API, idioma, sesión, router por hash
  models/          recursos de cada API
  views/           tabla, formulario, modal, gráficos SVG, mapa (Leaflet con plano SVG si no hay Internet)
  controllers/     una pantalla por archivo; crud.js arma los ABM a partir de definiciones.js
lang/es.json, lang/en.json
```

## Idiomas

Todos los textos están en `lang/es.json` y `lang/en.json`; el usuario elige el idioma y queda guardado en su perfil.

## Docker

Se sirve con Nginx (`Dockerfile` + `nginx.conf`) detrás del gateway, en la ruta `/app/`.
