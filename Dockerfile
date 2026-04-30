# ──────────────────────────────────────────────
# Stage 1: builder — genera el build de producción de React
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Las variables VITE_* se inyectan en build-time (Criterio 4)
# No en runtime — Vite las embebe estáticamente en el bundle.
ARG VITE_API_BASE_URL
ARG VITE_BACKEND_PUBLIC_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ARG VITE_AUTH0_CONNECTION
ARG VITE_AUTH_SYNC_URL
ARG VITE_AUTH_SESSION_URL
ARG VITE_AUTH0_REDIRECT_URI
ARG VITE_CHAT_SERVICE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Crear .env en tiempo de build con los ARGs
RUN echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" > .env && \
    echo "VITE_BACKEND_PUBLIC_URL=$VITE_BACKEND_PUBLIC_URL" >> .env && \
    echo "VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN" >> .env && \
    echo "VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID" >> .env && \
    echo "VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE" >> .env && \
    echo "VITE_AUTH0_CONNECTION=$VITE_AUTH0_CONNECTION" >> .env && \
    echo "VITE_AUTH_SYNC_URL=$VITE_AUTH_SYNC_URL" >> .env && \
    echo "VITE_AUTH_SESSION_URL=$VITE_AUTH_SESSION_URL" >> .env && \
    echo "VITE_AUTH0_REDIRECT_URI=$VITE_AUTH0_REDIRECT_URI" >> .env && \
    echo "VITE_CHAT_SERVICE_URL=$VITE_CHAT_SERVICE_URL" >> .env && \
    echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" >> .env && \
    echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env

RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: runner — imagen nginx:alpine sirve la carpeta dist
# ──────────────────────────────────────────────
FROM nginx:alpine AS runner

# Configuración de Nginx: SPA fallback a index.html (Criterio 3)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el bundle generado por el stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# El contenedor responde en el puerto 80 (Criterio 2)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
