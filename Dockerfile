# syntax=docker/dockerfile:1

# --- Build stage ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Injected at build time by CI (defaults for local builds).
ARG VITE_APP_VERSION=dev
ARG VITE_FARO_COLLECTOR_URL=
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_FARO_COLLECTOR_URL=$VITE_FARO_COLLECTOR_URL

RUN npm run build

# --- Serve stage ---------------------------------------------------------
FROM nginx:1.27-alpine

# SPA nginx config (no separate file in the repo)
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — any non-asset path serves index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Hashed build assets: cache aggressively
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker: never cache, always revalidate
    location = /sw.js {
        add_header Cache-Control "no-cache";
    }

    location = /registerSW.js {
        add_header Cache-Control "no-cache";
    }

    # Manifest
    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        application/javascript
        application/json
        application/wasm
        image/svg+xml
        image/x-icon;
}
EOF

COPY --from=build /app/dist /usr/share/nginx/html
# Ensure static/public assets (favicon, icons) are present in the image
COPY --from=build /app/public/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
