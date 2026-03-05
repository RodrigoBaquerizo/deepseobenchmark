# Usar la imagen oficial de Playwright con todas las dependencias de navegadores
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copiar sólo el package.json del backend primero (para cachear dependencias)
COPY backend/package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código del backend
COPY backend/ .

# Compilar TypeScript
RUN npm run build

# Railway inyecta la variable PORT automáticamente
EXPOSE 3001

CMD ["node", "dist/server.js"]
