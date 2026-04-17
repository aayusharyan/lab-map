#!/usr/bin/env node
/**
 * @file watcher.js
 * @description File watcher service for Lab Map data validation
 *
 * This module provides a file watcher service that monitors the config/ directory
 * for changes to topology configuration files (physical.json, traffic.json,
 * vlan.json, settings.json). When changes are detected, it validates
 * the data against JSON schemas and copies validated data to public/data/ for
 * consumption by the React application.
 *
 * Key Features:
 * - Hash-based change detection (validates only when file content changes)
 * - Graceful error handling (keeps last valid data when new data is invalid)
 * - Validation metadata written to *.meta.json files for debugging
 * - Zero downtime: application continues working with last valid data during fixes
 * - Cross-reference validation (checks edge references, flow references)
 *
 * Usage:
 *   node watcher.js              # Start watching mode (runs indefinitely)
 *   node watcher.js --validate   # Validate once and exit (for CI/CD)
 *
 * Dependencies:
 * - ajv: JSON Schema validator
 * - chokidar: Cross-platform file system watcher
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import chokidar from "chokidar";
import { fileURLToPath } from "url";
import Ajv from "ajv";

/* ============================================================================
 * PATH RESOLUTION
 * ESM modules don't have __dirname, so we derive it from import.meta.url
 * ============================================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================================
 * CLI ARGUMENT PARSING
 * Supports --validate flag for one-time validation (useful in CI pipelines)
 * ============================================================================ */

const args = process.argv.slice(2);
const VALIDATE_ONLY = args.includes("--validate");

/* ============================================================================
 * DIRECTORY PATHS
 * ROOT:           Project root directory
 * DATA_DIR:       User-editable config files (committed to git)
 * PUBLIC_DATA_DIR: Runtime data consumed by the app (gitignored)
 * SCHEMA_DIR:     JSON Schema definitions for validation
 * ============================================================================ */

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, "config");
const PUBLIC_DATA_DIR = path.join(ROOT, "public", "data");
const SCHEMA_DIR = path.join(ROOT, "schema");
const NODE_TYPE_SOURCE = path.join(ROOT, "src", "utils", "nodeType", "nodeType.ts");
const EDGE_TYPE_SOURCE = path.join(ROOT, "src", "utils", "edgeType", "edgeType.ts");

/* ============================================================================
 * FILE CONFIGURATION
 * Defines source, destination, metadata, and schema paths for each data file.
 * The 'validate' flag indicates whether schema validation should be performed.
 * ============================================================================ */

const FILES = {
  /**
   * Physical network topology: nodes, edges, coordinates, device types
   */
  physical: {
    source: path.join(DATA_DIR, "physical.json"),
    dest: path.join(PUBLIC_DATA_DIR, "physical.json"),
    meta: path.join(PUBLIC_DATA_DIR, "physical.meta.json"),
    schema: path.join(SCHEMA_DIR, "physical.schema.json"),
    validate: true,
  },
  /**
   * Traffic flow data: bandwidth, protocols, flow paths between nodes
   */
  traffic: {
    source: path.join(DATA_DIR, "traffic.json"),
    dest: path.join(PUBLIC_DATA_DIR, "traffic.json"),
    meta: path.join(PUBLIC_DATA_DIR, "traffic.meta.json"),
    schema: path.join(SCHEMA_DIR, "traffic.schema.json"),
    validate: true,
  },
  /**
   * VLAN configuration: VLAN IDs, names, and node assignments
   */
  vlan: {
    source: path.join(DATA_DIR, "vlan.json"),
    dest: path.join(PUBLIC_DATA_DIR, "vlan.json"),
    meta: path.join(PUBLIC_DATA_DIR, "vlan.meta.json"),
    schema: path.join(SCHEMA_DIR, "vlan.schema.json"),
    validate: true,
  },
  /**
   * Default application settings: theme, font size, UI preferences
   * Note: No schema validation (users can add custom settings)
   */
  settings: {
    source: path.join(DATA_DIR, "settings.json"),
    dest: path.join(PUBLIC_DATA_DIR, "settings.json"),
    meta: path.join(PUBLIC_DATA_DIR, "settings.meta.json"),
    validate: false,
  },
};

/* ============================================================================
 * IN-MEMORY CACHE
 * Stores hash, timestamp, and validation results for each file.
 * Used for:
 * - Change detection (compare hashes to avoid re-validating unchanged files)
 * - Fallback data (keep last valid data when new data is invalid)
 * ============================================================================ */

const cache = {};

/* ============================================================================
 * ANSI COLOR CODES
 * Terminal color codes for prettier console output.
 * ============================================================================ */

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

/**
 * Wrap text in bold ANSI escape codes
 * @param {string} s - Text to make bold
 * @returns {string} Bold text with reset code
 */
function bold(s) { return `${C.bold}${s}${C.reset}`; }

/**
 * Wrap text in green ANSI escape codes (success messages)
 * @param {string} s - Text to color green
 * @returns {string} Green text with reset code
 */
function green(s) { return `${C.green}${s}${C.reset}`; }

/**
 * Wrap text in red ANSI escape codes (error messages)
 * @param {string} s - Text to color red
 * @returns {string} Red text with reset code
 */
function red(s) { return `${C.red}${s}${C.reset}`; }

/**
 * Wrap text in yellow ANSI escape codes (warning messages)
 * @param {string} s - Text to color yellow
 * @returns {string} Yellow text with reset code
 */
function yellow(s) { return `${C.yellow}${s}${C.reset}`; }

/**
 * Wrap text in cyan ANSI escape codes (file names, paths)
 * @param {string} s - Text to color cyan
 * @returns {string} Cyan text with reset code
 */
function cyan(s) { return `${C.cyan}${s}${C.reset}`; }

/**
 * Wrap text in dim ANSI escape codes (secondary information)
 * @param {string} s - Text to dim
 * @returns {string} Dimmed text with reset code
 */
function dim(s) { return `${C.dim}${s}${C.reset}`; }

/* ============================================================================
 * AJV INITIALIZATION
 * JSON Schema validator configured with:
 * - allErrors: true  - Report all errors, not just the first one
 * - verbose: true    - Include additional error information
 * ============================================================================ */

const ajv = new Ajv({ allErrors: true, verbose: true });

/* ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================ */

/**
 * Calculate SHA256 hash of a file's content.
 * Used for change detection to avoid re-validating unchanged files.
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {string|null} Hex-encoded SHA256 hash, or null if file cannot be read
 */
function calculateHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return crypto.createHash("sha256").update(content, "utf8").digest("hex");
  } catch (err) {
    return null;
  }
}

/**
 * Format an AJV validation error into a human-readable string.
 * Includes additional context like unknown keys, allowed values, etc.
 *
 * @param {object} err - AJV error object
 * @returns {string} Human-readable error message
 */
function formatError(err) {
  const loc = err.instancePath || "(root)";
  const msg = err.message || "";
  let extra = "";

  /* Add contextual information based on error type */
  if (err.params) {
    if (err.params.additionalProperty) {
      extra = ` — unknown key: ${err.params.additionalProperty}`;
    } else if (err.params.allowedValues) {
      extra = ` — allowed: ${err.params.allowedValues.join(", ")}`;
    } else if (err.params.missingProperty) {
      extra = ` — missing: ${err.params.missingProperty}`;
    } else if (err.params.pattern) {
      extra = ` — pattern: ${err.params.pattern}`;
    }
  }

  return `${loc}: ${msg}${extra}`;
}

/**
 * Extract top-level object keys from an exported const object in a TS/JS source file.
 *
 * This lets the watcher reuse canonical runtime registries (NODE_TYPES/EDGE_STYLES)
 * without duplicating type lists in multiple places.
 *
 * @param {string} filePath - Source file path
 * @param {string} exportConstName - Exported const name containing an object literal
 * @returns {string[]} Top-level object keys
 */
function extractTopLevelObjectKeys(filePath, exportConstName) {
  let source = "";
  try {
    source = fs.readFileSync(filePath, "utf8");
  } catch {
    return [];
  }

  const exportDecl = `export const ${exportConstName}`;
  const exportIndex = source.indexOf(exportDecl);
  if (exportIndex === -1) return [];

  const firstBrace = source.indexOf("{", exportIndex);
  if (firstBrace === -1) return [];

  const lines = source.slice(firstBrace).split("\n");
  const keys = [];
  let depth = 0;
  let started = false;

  for (const line of lines) {
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;

    if (!started) {
      depth += opens - closes;
      if (depth > 0) started = true;
      continue;
    }

    if (depth === 1) {
      const keyMatch = line.match(/^\s*(?:(['"])([^'"]+)\1|([A-Za-z_][A-Za-z0-9_-]*))\s*:/);
      if (keyMatch) {
        keys.push(keyMatch[2] || keyMatch[3]);
      }
    }

    depth += opens - closes;
    if (depth <= 0) break;
  }

  return keys;
}

const KNOWN_NODE_TYPES = new Set(extractTopLevelObjectKeys(NODE_TYPE_SOURCE, "NODE_TYPES_MAP"));
const KNOWN_EDGE_TYPES = new Set(extractTopLevelObjectKeys(EDGE_TYPE_SOURCE, "EDGE_TYPES_MAP"));

/* ============================================================================
 * CROSS-REFERENCE VALIDATION
 * These functions check referential integrity beyond JSON Schema validation.
 * ============================================================================ */

/**
 * Check for dangling edge references in topology data.
 * Edges reference nodes by ID; this ensures all referenced nodes exist.
 *
 * @param {object} data - Topology data with nodes[] and edges[]
 * @returns {string[]} Array of error messages for dangling references
 */
function checkDanglingEdgeRefs(data) {
  const errors = [];
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return errors;

  /* Build a Set of valid node IDs for O(1) lookup */
  const nodeIds = new Set(data.nodes.map(n => n.id));

  /* Check each edge's from/to references */
  data.edges.forEach((edge, i) => {
    if (edge.from && !nodeIds.has(edge.from)) {
      errors.push(`edges[${i}].from = ${edge.from} — no matching node id`);
    }
    if (edge.to && !nodeIds.has(edge.to)) {
      errors.push(`edges[${i}].to = ${edge.to} — no matching node id`);
    }
  });
  return errors;
}

/**
 * Check flow references in traffic data.
 * Nodes and edges can reference flows by ID; this ensures all referenced flows exist.
 *
 * @param {object} data - Traffic data with flows[], nodes[], and edges[]
 * @returns {string[]} Array of error messages for undeclared flow references
 */
function checkFlowRefs(data) {
  const errors = [];
  if (!Array.isArray(data.flows)) return errors;

  /* Build a Set of declared flow IDs */
  const declaredFlows = new Set(data.flows.map(f => f.id));

  /* Check node flow references */
  (data.nodes || []).forEach((node, i) => {
    (node.flows || []).forEach(fid => {
      if (!declaredFlows.has(fid)) {
        errors.push(`nodes[${i}] (${node.id}): flow ${fid} not declared in flows[]`);
      }
    });
  });

  /* Check edge flow references */
  (data.edges || []).forEach((edge, i) => {
    (edge.flows || []).forEach(fid => {
      if (!declaredFlows.has(fid)) {
        errors.push(`edges[${i}] (${edge.id}): flow ${fid} not declared in flows[]`);
      }
    });
  });

  return errors;
}

/**
 * Check node/edge type IDs against canonical runtime registries.
 *
 * This catches drift where schema enums and renderer registries diverge.
 *
 * @param {object} data - Topology data with nodes[] and edges[]
 * @returns {string[]} Array of error messages for unknown node/edge type IDs
 */
function checkKnownTopologyTypes(data) {
  const errors = [];

  if (Array.isArray(data.nodes) && KNOWN_NODE_TYPES.size > 0) {
    data.nodes.forEach((node, i) => {
      if (!node || typeof node.type !== "string") return;
      if (!KNOWN_NODE_TYPES.has(node.type)) {
        errors.push(`nodes[${i}] (${node.id || "unknown"}): unknown node type "${node.type}"`);
      }
    });
  }

  if (Array.isArray(data.edges) && KNOWN_EDGE_TYPES.size > 0) {
    data.edges.forEach((edge, i) => {
      if (!edge || typeof edge.type !== "string") return;
      if (!KNOWN_EDGE_TYPES.has(edge.type)) {
        errors.push(`edges[${i}] (${edge.id || "unknown"}): unknown edge type "${edge.type}"`);
      }
    });
  }

  return errors;
}

/* ============================================================================
 * VALIDATION FUNCTIONS
 * ============================================================================ */

/**
 * Validate data against a JSON schema and perform cross-reference checks.
 *
 * @param {string} name - File identifier (e.g., 'physical', 'traffic')
 * @param {object} data - Parsed JSON data to validate
 * @param {string} schemaPath - Absolute path to the JSON schema file
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
function validateData(name, data, schemaPath) {
  const errors = [];

  /* Load and parse the JSON schema */
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (e) {
    return { valid: false, errors: [`Cannot read/parse schema: ${e.message}`] };
  }

  /* Compile and run schema validation */
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid && validate.errors) {
    validate.errors.forEach(e => errors.push(formatError(e)));
  }

  /* Perform cross-reference checks (beyond schema validation) */
  const dangles = checkDanglingEdgeRefs(data);
  errors.push(...dangles);

  /* Cross-check with canonical runtime node/edge registries */
  const typeErrs = checkKnownTopologyTypes(data);
  errors.push(...typeErrs);

  /* Traffic-specific: check flow references */
  if (name === "traffic") {
    const flowErrs = checkFlowRefs(data);
    errors.push(...flowErrs);
  }

  const uniqueErrors = [...new Set(errors)];
  return { valid: uniqueErrors.length === 0, errors: uniqueErrors };
}

/* ============================================================================
 * FILE PROCESSING
 * ============================================================================ */

/**
 * Process a single data file: check hash, validate if changed, copy to public/data/.
 *
 * This function implements the core logic:
 * 1. Check if source file exists
 * 2. Calculate content hash to detect changes
 * 3. Skip if unchanged (hash matches cache)
 * 4. Parse JSON and validate against schema
 * 5. On success: copy to public/data/ and update cache
 * 6. On failure: keep last valid data, write error metadata
 *
 * @param {string} name - File identifier (e.g., 'physical', 'traffic')
 */
function processFile(name) {
  const fileConfig = FILES[name];
  const { source, dest, meta, schema, validate: shouldValidate } = fileConfig;

  /* Step 1: Check if source file exists */
  if (!fs.existsSync(source)) {
    console.log(`  ${yellow("⚠")} ${cyan(name + ".json")} — source file not found, skipping`);
    return;
  }

  /* Step 2: Calculate content hash */
  const newHash = calculateHash(source);
  if (!newHash) {
    console.log(`  ${red("✗")} ${cyan(name + ".json")} — cannot read file`);
    return;
  }

  /* Step 3: Check cache for unchanged files */
  const cached = cache[name];
  if (cached && cached.hash === newHash) {
    console.log(`  ${dim("↻")} ${cyan(name + ".json")} — unchanged (hash match), skipping`);
    return;
  }

  /* Step 4: Parse JSON */
  const timestamp = new Date().toISOString();
  let data;

  try {
    data = JSON.parse(fs.readFileSync(source, "utf8"));
  } catch (e) {
    console.log(`  ${red("✗")} ${cyan(name + ".json")} — invalid JSON: ${e.message}`);

    /* Write error metadata but keep last valid data */
    if (cached && cached.valid) {
      const errorMeta = {
        hash: newHash,
        timestamp,
        valid: false,
        sourceFile: name + ".json",
        error: `Invalid JSON: ${e.message}`,
        lastValidHash: cached.hash,
        lastValidTimestamp: cached.timestamp,
      };
      fs.writeFileSync(meta, JSON.stringify(errorMeta, null, 2));
      console.log(`    ${yellow("⚠")} Keeping last valid data from ${dim(cached.timestamp)}`);
    }
    return;
  }

  /* Step 5: Validate against schema (if validation is enabled) */
  let validationResult = { valid: true, errors: [] };
  if (shouldValidate) {
    validationResult = validateData(name, data, schema);
  }

  /* Step 6: Handle validation result */
  if (validationResult.valid) {
    /* Valid data: write to destination */
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(data, null, 2));

    /* Write success metadata */
    const metadata = {
      hash: newHash,
      timestamp,
      valid: true,
      sourceFile: name + ".json",
      validationErrors: [],
    };
    fs.writeFileSync(meta, JSON.stringify(metadata, null, 2));

    /* Update cache */
    cache[name] = { hash: newHash, timestamp, valid: true, data };

    console.log(`  ${green("✓")} ${cyan(name + ".json")} — validated and copied to public/data/ (served as /data/)`);
  } else {
    /* Invalid data: keep last valid data if available */
    console.log(`  ${red("✗")} ${cyan(name + ".json")} — ${red(validationResult.errors.length + " validation error(s)")}`);
    validationResult.errors.forEach(e => console.log(`      ${dim(e)}`));

    if (cached && cached.valid) {
      /* Write invalid metadata but keep last valid data file */
      const errorMeta = {
        hash: newHash,
        timestamp,
        valid: false,
        sourceFile: name + ".json",
        validationErrors: validationResult.errors,
        lastValidHash: cached.hash,
        lastValidTimestamp: cached.timestamp,
      };
      fs.writeFileSync(meta, JSON.stringify(errorMeta, null, 2));
      console.log(`    ${yellow("⚠")} Keeping last valid data from ${dim(cached.timestamp)}`);
    } else {
      /* No valid data exists yet (first run with invalid data) */
      const errorMeta = {
        hash: newHash,
        timestamp,
        valid: false,
        sourceFile: name + ".json",
        validationErrors: validationResult.errors,
        error: "No valid data available (first run with invalid data)",
      };
      fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
      fs.writeFileSync(meta, JSON.stringify(errorMeta, null, 2));
      console.log(`    ${red("✗")} No valid data available — fix errors and save again`);
    }
  }
}

/* ============================================================================
 * CACHE MANAGEMENT
 * ============================================================================ */

/**
 * Initialize the in-memory cache from existing metadata and data files.
 * This allows the watcher to resume with knowledge of previously validated data,
 * enabling it to skip unchanged files and provide fallback data.
 */
function initializeCache() {
  Object.keys(FILES).forEach(name => {
    const { meta, dest } = FILES[name];

    if (fs.existsSync(meta) && fs.existsSync(dest)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(meta, "utf8"));
        const data = JSON.parse(fs.readFileSync(dest, "utf8"));

        if (metadata.valid) {
          cache[name] = {
            hash: metadata.hash,
            timestamp: metadata.timestamp,
            valid: true,
            data,
          };
        }
      } catch (e) {
        /* Ignore cache initialization errors (will re-process file) */
      }
    }
  });
}

/* ============================================================================
 * BATCH PROCESSING
 * ============================================================================ */

/**
 * Process all configured data files once.
 * Called on startup and can be used for one-time validation.
 */
function processAllFiles() {
  console.log(`\n${bold("Lab Map Data Watcher")}\n`);
  console.log(`  Watching: ${cyan(DATA_DIR)}`);
  console.log(`  Output:   ${cyan(PUBLIC_DATA_DIR)}\n`);

  Object.keys(FILES).forEach(name => {
    processFile(name);
  });

  console.log();
}

/* ============================================================================
 * WATCHER SERVICE
 * ============================================================================ */

/**
 * Start the file watcher service.
 * Monitors specific data files for changes and triggers validation.
 *
 * Uses chokidar for cross-platform file watching with:
 * - awaitWriteFinish: Waits for file writes to complete before processing
 * - ignoreInitial: Skips initial add events (files processed separately)
 */
function startWatching() {
  /* Initialize cache from existing validated data */
  initializeCache();

  /* Process all files on startup */
  processAllFiles();

  /* Start watching for changes */
  console.log(`${bold("Watching for changes...")} ${dim("(press Ctrl+C to stop)")}\n`);

  /* Build list of specific source file paths to watch */
  const watchPaths = Object.values(FILES).map(f => f.source);

  const watcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  /* Handle file change events */
  watcher.on("change", (filePath) => {
    const fileName = path.basename(filePath, ".json");
    console.log(`\n${dim("→")} ${cyan(fileName + ".json")} changed, processing...\n`);
    processFile(fileName);
    console.log();
  });

  /* Handle new file events (file created after watcher started) */
  watcher.on("add", (filePath) => {
    const fileName = path.basename(filePath, ".json");
    console.log(`\n${dim("+")} ${cyan(fileName + ".json")} added, processing...\n`);
    processFile(fileName);
    console.log();
  });

  /* Handle watcher errors */
  watcher.on("error", (error) => {
    console.error(red(`Watcher error: ${error.message}`));
  });
}

/* ============================================================================
 * CLI ENTRY POINT
 * ============================================================================ */

if (VALIDATE_ONLY) {
  /* One-time validation mode: validate all files and exit */
  initializeCache();
  processAllFiles();
  process.exit(0);
} else {
  /* Watch mode: start file watcher service */
  startWatching();
}
