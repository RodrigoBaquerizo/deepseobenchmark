# Usar la imagen oficial de Playwright con todas las dependencias de navegadores
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copiar archivos de dependencias del backend
COPY backend/package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para ts-node)
RUN npm install

# Copiar el código fuente del backend
COPY backend/ .

# Railway inyecta la variable PORT automáticamente
EXPOSE 3001

# Ejecutar con ts-node directamente (igual que en desarrollo local)
CMD ["npx", "ts-node", "server.ts"]
