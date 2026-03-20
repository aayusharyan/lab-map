# Contributing to Lab Map

## Prerequisites

- **Node.js >= 24** (LTS required)
- **pnpm >= 9** (required package manager)

> **Note**: This project enforces version requirements. Installation will fail if you don't meet the prerequisites.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your data files from examples:

   ```bash
   # Copy all example files to get started
   cp examples/*.json data/

   # The app reads from data/ and public/data/
   # Both directories are gitignored to prevent committing sensitive infrastructure data
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Working with Data Files

### Directory Structure

```
examples/          ← Example configurations (committed to git)
  ├── physical.json
  ├── traffic.json
  ├── vlan.json
  ├── rack.json
  └── settings.json

data/              ← Your local data (gitignored)
  └── *.json

public/data/       ← Runtime data (gitignored)
  └── *.json
```

### Example Files

The `examples/` directory contains sample network topology configurations:

- **`physical.json`** - Demonstrates physical network topology with nodes and connections
- **`traffic.json`** - Shows traffic flow patterns between nodes
- **`vlan.json`** - Example VLAN configurations and assignments
- **`rack.json`** - Sample physical rack layout with device positions
- **`settings.json`** - Application settings template

**Use examples for:**

- Understanding the expected JSON schema and structure
- Quick reference when creating your own configurations
- Testing new features with known-good data
- Learning which fields are required vs optional

**Note:** The `examples/` directory is excluded from Docker images (via `.dockerignore`) to reduce image size.

### Validation

During development, the watcher automatically validates data files:

```bash
# Development mode (runs vite + watcher)
pnpm dev

# Or run watcher standalone
pnpm watch
```

See `schema/` directory for JSON schemas that define the expected structure.

### How Validation Works (Zero Downtime)

When you modify a JSON data file, the watcher validates its content against the required schemas.

- **If valid**: The new data is instantly served to the application.
- **If invalid**: The application continues to use the _last valid_ version of your data to prevent crashes. The watcher generates a `.meta.json` file (e.g., `physical.meta.json`) containing the validation errors (`valid: false`, `validationErrors: [...]`). The React app fetches this metadata and displays warning banners in the UI, indicating exactly what failed in your file.

## Important Notes

- **pnpm only** - npm and yarn are blocked by `package-manager-strict=true`
- Do not commit `package-lock.json` or `yarn.lock` files
- The lockfile (`pnpm-lock.yaml`) must stay in sync - CI will fail otherwise

## Project Scripts

| Command         | Purpose                                                             |
| --------------- | ------------------------------------------------------------------- |
| `pnpm dev`      | Start Vite dev server + watcher (auto-validates data on changes)    |
| `pnpm build`    | Type-check with TypeScript, then build production bundle to `dist/` |
| `pnpm preview`  | Preview production build locally                                    |
| `pnpm watch`    | Standalone watcher (auto-validate data/ on changes)                 |
| `pnpm lint`     | Check code for linting issues                                       |
| `pnpm lint:fix` | Auto-fix linting issues where possible                              |

## Dependencies Overview

### Why Each Dependency Exists

**Runtime Dependencies** (required for app to function):

- **ajv** - Validates JSON topology files against schemas. Without it, invalid data could crash the app.
- **chokidar** - Watches data files for changes during development. Without it, you must manually revalidate after every edit.
- **konva** - Renders rack diagrams on HTML5 canvas. Without it, rack view won't work.
- **react** - Core UI framework. App won't run without it.
- **react-dom** - Renders React to browser DOM. App won't display without it.
- **react-konva** - React wrapper for Konva (may be used internally by Konva for React integration).
- **vis-network** - Renders interactive network graphs for physical/traffic/VLAN views. Without it, graph views won't work.

**Development Dependencies** (build tools, linters, type checkers):

- **@eslint/js** - Base ESLint JavaScript config
- **@types/react** - TypeScript types for React (enables type checking)
- **@types/react-dom** - TypeScript types for React DOM
- **@vitejs/plugin-react** - Enables React JSX + Fast Refresh in Vite
- **eslint** - Lints code for quality issues
- **eslint-import-resolver-typescript** - Resolves TypeScript imports (including `@/` aliases) for ESLint
- **eslint-plugin-import** - Enforces import order and organization
- **eslint-plugin-react** - React-specific linting rules
- **eslint-plugin-react-hooks** - Enforces React Hooks rules (prevents bugs like missing useEffect deps)
- **eslint-plugin-react-refresh** - Ensures Fast Refresh compatibility
- **typescript** - Compiles TypeScript and provides type checking
- **typescript-eslint** - TypeScript-specific ESLint rules
- **vite** - Dev server and build tool

See [CLAUDE.md](CLAUDE.md#dependencies) for detailed usage information (where each package is used in the codebase).

## Creating Node Icons

When adding new device icons to `public/node-icons/`, follow these design guidelines:

### Directory Structure

```
public/node-icons/
└── device-name/
    ├── dark.svg
    └── light.svg
```

### Design Requirements

1. **Flat colors only** - no gradients or complex fills
2. **Consistent stroke widths**:
   - `0.7` for fine details (ports, small elements)
   - `0.8` for panels and internal sections
   - `1.2-1.5` for main chassis outline
3. **Rounded corners**: use `rx="1"` for small elements, `rx="2"` or `rx="3"` for larger panels
4. **Simple shapes**: prefer rectangles, circles, and lines over complex paths
5. **Clean comments**: label major SVG sections (chassis, panels, ports, LEDs)

### Color Categories

| Category     | Examples           | Dark Stroke        | Light Stroke |
| ------------ | ------------------ | ------------------ | ------------ |
| Compute      | Servers, towers    | Blue (`#38bdf8`)   | `#0277bd`    |
| Storage      | NAS devices        | Green (`#4ade80`)  | `#2e7d32`    |
| Network      | Routers, firewalls | Red (`#e74c3c`)    | `#c62828`    |
| Switch       | Network switches   | Cyan (`#26c6da`)   | `#00838f`    |
| Wireless     | Access points      | Purple (`#9b59b6`) | `#7b1fa2`    |
| Workstations | Desktops, mini PCs | Gray (`#555`)      | `#888`       |

### LED Colors

- **Power LED**: `#38bdf8` (dark) / `#0277bd` (light)
- **Activity LED**: `#27ae60` (dark) / `#1b7a40` (light)
- **Warning LED**: `#f1c40f` (dark) / `#b45309` (light)

See [CLAUDE.md](CLAUDE.md#node-icon-design-guidelines) for complete color specifications including background colors.
