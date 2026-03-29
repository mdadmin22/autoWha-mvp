FROM node:20-alpine AS base

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* se incrusta en el bundle durante el build, no en runtime.
# Debe llegar como ARG (build-time), no como ENV del contenedor.
# Valor por defecto: localhost:8000 (válido para desarrollo local con Docker).
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]
