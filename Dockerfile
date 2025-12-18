# Frontend Dockerfile optimisé pour Railway
FROM node:18-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend ./

RUN npm run build

# Stage 2 - Serveur de production minimal
FROM node:18-alpine

WORKDIR /app

# Installer un serveur HTTP léger
RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
