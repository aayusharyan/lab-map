# =============================================================================
# @file Dockerfile
# @description Multi-stage Docker build for Lab Map application
#
# Multi-stage build with integrated watcher for real-time validation.
# The watcher validates data on startup and monitors /app/config for changes.
# Keeps last valid data when new data is invalid, shows warnings in UI.
#
# Images are built by CI/CD and published to ghcr.io/aayusharyan/lab-map

# -----------------------------------------------------------------------------
# Stage 1: Build React App
# -----------------------------------------------------------------------------
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for layer caching
COPY package.json pnpm-lock.yaml .npmrc ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# -----------------------------------------------------------------------------
# Stage 2: Production with Watcher
# -----------------------------------------------------------------------------
FROM node:24-alpine AS production

LABEL version="0.4.0"
LABEL description="Lab Map with integrated data validation and watcher"

# Install nginx for serving static files
RUN apk add --no-cache nginx

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --prod --frozen-lockfile

# Copy validation infrastructure
COPY scripts ./scripts
COPY schema ./schema

# Copy default config (baked into image — volume mount overrides at runtime)
COPY config ./config

# Create data directories
RUN mkdir -p /app/config /usr/share/nginx/html/data

# Copy built React app to nginx serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Environment variables
ENV NODE_ENV=production

EXPOSE 80

# Health check for both nginx and watcher
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
