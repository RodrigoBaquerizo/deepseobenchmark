# Imagen Node.js ligera — sin Playwright (Playwright sigue como fallback en código pero sin browser binaries)
FROM node:20-slim

WORKDIR /app

# Copiar manifests de dependencias del backend
COPY backend/package*.json ./

# Instalar dependencias (sin descargar binarios de Playwright)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

# Copiar código fuente
COPY backend/ .

# El servidor escucha en la variable PORT que Railway inyecta automáticamente
EXPOSE 3001

# ts-node con --transpile-only salta la verificación de tipos en runtime (más rápido)
CMD ["npx", "ts-node", "--transpile-only", "server.ts"]
