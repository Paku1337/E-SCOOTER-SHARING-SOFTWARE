FROM node:18-alpine AS frontend-builder

WORKDIR /app/scooter-fleet-frontend

# Install frontend dependencies and build React app
COPY scooter-fleet-frontend/package*.json ./
COPY scooter-fleet-frontend/package-lock.json ./
COPY scooter-fleet-frontend/postcss.config.js ./
COPY scooter-fleet-frontend/tailwind.config.js ./
COPY scooter-fleet-frontend/public ./public
COPY scooter-fleet-frontend/src ./src
COPY scooter-fleet-frontend/.env.production ./.env.production
RUN npm ci && npm run build

FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy backend dependencies and install production modules
COPY package*.json ./
RUN npm ci --only=production

# Copy backend application files
COPY . .

# Copy built frontend into backend public folder
RUN rm -rf public && mkdir -p public
COPY --from=frontend-builder /app/scooter-fleet-frontend/build ./public

# Expose port (Fly.io overrides this, but good for clarity)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]
