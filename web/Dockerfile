# syntax=docker/dockerfile:1
# BookNest front end: Nginx serves public/ and proxies /api/ to the API service.
FROM nginx:1.30-alpine

# The entrypoint renders /etc/nginx/templates/*.template with these variables.
ENV API_UPSTREAM=api:3000 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY web/default.conf.template /etc/nginx/templates/
COPY public/ /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --start-interval=1s \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1/healthz"]
