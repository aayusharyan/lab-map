<p align="center">
  <img src=".github/logo.png" alt="Lab Map Logo" width="128" />
</p>

<h1 align="center">Lab Map</h1>

<p align="center">
  An interactive canvas-based visualizer for datacenter and lab infrastructure
</p>

## Features

- Interactive network topology visualization
- Real-time data updates from JSON configuration
- Zero-downtime data validation with UI error warnings
- Physical, traffic flow, and VLAN graph views

## Quick Start (Docker)

The easiest way to run Lab Map — ships with default data so visualizations work immediately:

```bash
docker run -d -p 8080:80 --name lab-map ghcr.io/aayusharyan/lab-map:latest
```

Access at http://localhost:8080

To use your own data, mount a local directory:

```bash
docker run -d -p 8080:80 \
  -v /path/to/your/config:/app/config \
  --name lab-map \
  ghcr.io/aayusharyan/lab-map:latest
```

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

3. Start the development server:

### Development

Start the development server with hot reload:

```bash
pnpm dev
```

This runs both the Vite dev server and the data file watcher, which automatically validates configuration files in `config/` on changes.

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

Lab Map uses JSON configuration files in the `config/` directory:

- **`physical.json`** - Physical network topology (nodes, connections)
- **`traffic.json`** - Traffic flow data between nodes
- **`vlan.json`** - VLAN configuration and assignments
- **`settings.json`** - Application settings and preferences

### Validation & Error Handling

Lab Map features zero-downtime data validation. When you modify configuration files, they are automatically validated against strict JSON schemas. If a file contains errors (e.g., a missing required field or wrong data type), the application won't break. Instead, it gracefully continues serving the last valid version of your data while displaying warning banners in the web UI to help you debug and fix the issue.

**Note:** The `public/data/` directory is gitignored — it is generated automatically by the watcher on startup and should not be committed.

## Community

- **Bug reports**: [GitHub Issues](https://github.com/aayusharyan/lab-map/issues)
- **Feature requests**: [GitHub Issues](https://github.com/aayusharyan/lab-map/issues/new/choose)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Security**: [SECURITY.md](SECURITY.md)

## License

[MIT](LICENSE)
