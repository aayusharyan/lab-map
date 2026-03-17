# Multi-stage build serving static files via nginx.
#
# Build:   docker build -f docker/Dockerfile -t lab-map .
# Run:     docker run -p 8080:80 lab-map
# Custom:  docker run -p 8080:80 -v /path/to/data:/usr/share/nginx/html/data:ro lab-map

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
# Compiles TypeScript and bundles the React application.
FROM node:22-alpine AS builder

# Enable corepack and activate pnpm for consistent dependency management
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests first for Docker layer caching (source changes won't invalidate this layer)
COPY package.json pnpm-lock.yaml ./

# --frozen-lockfile: Fail if lockfile is out of sync (CI-safe)
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
# Serves static files via nginx Alpine (~40MB vs ~1GB with Node.js).
FROM nginx:alpine AS production

LABEL version="0.1.0"

# SPA routing configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Default data files (override via: -v /your/data:/usr/share/nginx/html/data:ro)
COPY --from=builder /app/data /usr/share/nginx/html/data

EXPOSE 80

# Health check for orchestration platforms (Swarm, Kubernetes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
