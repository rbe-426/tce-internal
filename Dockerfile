# Frontend Dockerfile optimisé pour Railway
FROM node:18-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . ./

# Build
RUN npm run build

# Stage 2 - Serveur de production minimal
FROM node:18-alpine

WORKDIR /app

# Installer un serveur HTTP léger
RUN npm install -g serve

# Copier le build depuis la première étape
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Santé check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Démarrage
CMD ["serve", "-s", "dist", "-l", "3000"]CMD ["serve", "-s", "dist", "-l", "3000"]
