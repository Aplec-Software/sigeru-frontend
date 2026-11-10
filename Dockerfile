# Frontend de usuarios: solo archivos estáticos (HTML, CSS y JavaScript) servidos por Nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY img/ /usr/share/nginx/html/img/
COPY lang/ /usr/share/nginx/html/lang/
EXPOSE 80
