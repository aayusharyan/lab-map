# Docker Setup

Run Lab Map with integrated data validation and real-time monitoring.

## Features

- **Real-time file watching** - Automatically detects changes in mounted data directory
- **Hash-based validation** - Only validates when file content actually changes (SHA256)
- **Zero downtime** - Keeps serving last valid data when new data has errors
- **Validation metadata & UI warnings** - If invalid data is provided, the system generates a `/data/*.meta.json` file containing the specific errors (`validationErrors`). The React app uses this to display warnings directly in the UI.
- **Schema validation** - Validates against JSON schemas with detailed error messages

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker compose -f docker/docker-compose.yml up -d
```

### Using Docker CLI

```bash
docker run -d -p 8080:80 \
  -v /path/to/your/config:/app/config \
  --name lab-map \
  ghcr.io/aayusharyan/lab-map:latest
```

Access at: http://localhost:8080

## How It Works

```
Your config directory (mounted at /app/config)
    ↓
Watcher detects changes (chokidar)
    ↓
Calculate SHA256 hash
    ↓
Compare with cached hash → Skip if unchanged
    ↓
Validate against schemas (ajv)
    ↓
If valid: Copy to /usr/share/nginx/html/data
If invalid: Keep last valid data + metadata with errors
    ↓
Nginx serves to React app
    ↓
React app shows validation warnings when data is invalid
```

## Directory Structure

```
/app/config/            # Your mounted config directory (source)
  ├── physical.json
  ├── traffic.json
  ├── vlan.json
  └── settings.json

/usr/share/nginx/html/data/  # Validated data served by nginx
  ├── physical.json           # Validated data
  ├── physical.meta.json      # Validation status
  ├── traffic.json
  ├── traffic.meta.json
  └── ...
```

## Validation Metadata Format

**Valid data:**

```json
{
  "hash": "abc123...",
  "timestamp": "2026-03-18T10:30:00Z",
  "valid": true,
  "sourceFile": "physical.json",
  "validationErrors": []
}
```

**Invalid data (keeps last valid):**

```json
{
  "hash": "xyz789...",
  "timestamp": "2026-03-18T10:35:00Z",
  "valid": false,
  "sourceFile": "physical.json",
  "validationErrors": ["error details..."],
  "lastValidHash": "abc123...",
  "lastValidTimestamp": "2026-03-18T10:30:00Z"
}
```

## Troubleshooting

### Data not updating

1. Check watcher logs: `docker logs lab-map`
2. Verify file permissions on mounted volume
3. Ensure files are actually changing (watcher uses hash comparison)

### Validation warnings in UI

The app is using cached data because the source file has errors. Check metadata:

```bash
curl http://localhost:8080/data/physical.meta.json
```

Fix the validation errors listed in the metadata file. The app will continue working with the last valid data until you fix the errors.

## Updating

Pull the latest image and restart:

```bash
docker compose pull
docker compose up -d
```

## Stopping

```bash
docker compose down
```

Or with docker CLI:

```bash
docker stop lab-map
docker rm lab-map
```

## Requirements

- Docker 20.10+
- Docker Compose v2+ (if using compose)
- Node.js >= 24 (already in image)
