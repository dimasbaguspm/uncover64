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

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
