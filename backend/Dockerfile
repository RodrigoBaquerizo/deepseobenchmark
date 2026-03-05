# Imagen Node.js ligera — fetch + cheerio para SEO crawling
FROM node:20-slim

WORKDIR /app

# Copiar manifests de dependencias del backend
COPY backend/package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY backend/ .

# Railway inyecta PORT dinámicamente (normalmente 8080)
EXPOSE 8080

# ts-node con --transpile-only salta la verificación de tipos en runtime (más rápido)
CMD ["npx", "ts-node", "--transpile-only", "server.ts"]
