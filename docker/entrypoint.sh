#!/bin/sh
# =============================================================================
# @file entrypoint.sh
# @description Docker container entrypoint for Lab Map
#
# Entrypoint script for Lab Map Docker container.
# Runs data validation/watcher and nginx web server.
# =============================================================================

set -e

echo "=========================================="
echo "Lab Map - Starting Services"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  - Config directory: /app/config"
echo "  - Output directory: /usr/share/nginx/html/data"
echo ""

# Validate initial data files on startup
echo "Validating initial data files..."
node watcher.js --validate

# Start watcher in background
echo ""
echo "Starting file watcher service..."
node watcher.js &
WATCHER_PID=$!

# Start nginx in foreground
echo "Starting nginx web server..."
echo ""
echo "=========================================="
echo "Services running:"
echo "  - Watcher PID: $WATCHER_PID"
echo "  - Web server: http://localhost:80"
echo "=========================================="
echo ""

# Trap signals to ensure graceful shutdown
trap "echo 'Shutting down services...'; kill $WATCHER_PID 2>/dev/null; nginx -s quit; exit 0" SIGTERM SIGINT

# Run nginx in foreground (blocks until stopped)
exec nginx -g "daemon off;"
