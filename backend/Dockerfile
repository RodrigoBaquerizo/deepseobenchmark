# Usar la imagen oficial de Playwright que ya tiene todas las dependencias de sistema y navegadores
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo las necesarias para build)
RUN npm install

# Copiar el resto del código del backend
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer el puerto que usará Railway (Railway inyecta la variable PORT)
EXPOSE 3001

# Comando para iniciar la aplicación
# Usamos node sobre el archivo transpilado en dist/
CMD ["node", "dist/server.js"]
