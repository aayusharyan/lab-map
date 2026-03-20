<p align="center">
  <img src=".github/logo.png" alt="Lab Map Logo" width="128" />
</p>

<h1 align="center">Lab Map</h1>

<p align="center">
  An interactive canvas-based visualizer for datacenter and lab infrastructure
</p>

## Features

- Interactive network topology visualization
- Rack view for physical infrastructure layout
- Real-time data updates from JSON configuration
- Zero-downtime data validation with UI error warnings
- Graph and rack-based views

## Quick Start (Docker)

The easiest way to run Lab Map:

```bash
docker run -d -p 8080:80 \
  -v /path/to/your/data:/app/data \
  --name lab-map \
  ghcr.io/aayusharyan/lab-map:latest
```

Access at http://localhost:8080

See [docker/README.md](docker/README.md) for more options and data file format.

## Development Setup

### Prerequisites

- **Node.js >= 24** (LTS version)
- **pnpm >= 9** (enforced via `package-manager-strict=true`)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/aayusharyan/lab-map.git
   cd lab-map
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up your data files:

   ```bash
   # Copy example files to get started
   cp examples/*.json data/

   # Or create your own data files in the data/ directory
   # See examples/ for reference on the expected format
   ```

### Development

Start the development server with hot reload:

```bash
pnpm dev
```

This runs both the Vite dev server and the data file watcher, which automatically validates configuration files in `data/` on changes.

### Build

Build for production:

```bash
pnpm build
```

### Preview Production Build

Preview the production build locally:

```bash
pnpm preview
```

## Configuration

Lab Map uses JSON configuration files in the `data/` directory:

- **`physical.json`** - Physical network topology (nodes, connections)
- **`traffic.json`** - Traffic flow data between nodes
- **`vlan.json`** - VLAN configuration and assignments
- **`rack.json`** - Physical rack layout and device placement
- **`settings.json`** - Application settings and preferences

### Validation & Error Handling

Lab Map features zero-downtime data validation. When you modify configuration files, they are automatically validated against strict JSON schemas. If a file contains errors (e.g., a missing required field or wrong data type), the application won't break. Instead, it gracefully continues serving the last valid version of your data while displaying warning banners in the web UI to help you debug and fix the issue.

### Example Files

The `examples/` directory contains sample configurations to help you get started. These files demonstrate the expected structure and format for each configuration type.

**Quick start:**

```bash
# Copy all examples to your data directory
cp examples/*.json data/

# Or copy specific files
cp examples/physical.json data/
cp examples/rack.json data/
```

**Note:** The `data/` and `public/data/` directories are gitignored to prevent accidentally committing sensitive infrastructure information.

## License

[MIT](LICENSE)
