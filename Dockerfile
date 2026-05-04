# Etapa 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias y package.json
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Argumentos de build para inyectar variables de entorno de Vite
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

# Asignar los argumentos a variables de entorno para que Vite los detecte en el build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BACKEND_PUBLIC_URL=$VITE_BACKEND_PUBLIC_URL
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
ENV VITE_AUTH0_CONNECTION=$VITE_AUTH0_CONNECTION
ENV VITE_AUTH_SYNC_URL=$VITE_AUTH_SYNC_URL
ENV VITE_AUTH_SESSION_URL=$VITE_AUTH_SESSION_URL
ENV VITE_AUTH0_REDIRECT_URI=$VITE_AUTH0_REDIRECT_URI
ENV VITE_CHAT_SERVICE_URL=$VITE_CHAT_SERVICE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Generar la compilación estática de producción
RUN npm run build

# Etapa 2: Runner
FROM nginx:alpine AS runner

# Copiar configuración customizada de Nginx para enrutamiento SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos compilados desde la etapa de builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80 (puerto interno del contenedor)
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
