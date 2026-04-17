/**
 * @file data.ts
 * @description Data loading utilities for fetching topology JSON files
 *
 * This file provides utility functions for loading topology data and raw
 * validation metadata from the /data/ directory. The data files are
 * generated and validated by the watcher.js service.
 *
 * Data Files:
 * - /data/{page}.json - Topology data (nodes, edges, flows)
 * - /data/{page}.meta.json - Validation metadata from watcher
 *
 * Error Handling:
 * - HTTP errors: Throws with status code
 * - Malformed data: Throws with descriptive message
 * - Missing metadata: Returns null (not an error)
 *
 * @example
 * import { loadPageDataOrThrow, loadValidationMetadata } from '@/utils/data';
 *
 * // Load topology data
 * const data = await loadPageDataOrThrow('physical');
 * console.log(data.nodes, data.edges);
 *
 * // Check raw validation metadata
 * const meta = await loadValidationMetadata('physical');
 * if (meta && !meta.valid) {
 *   console.warn('Validation failed:', meta.validationErrors);
 * }
 *
 * @see watcher.js - Service that generates the data files
 * @see usePageData.ts - Hook that uses these functions
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { Node, NodeAttribute, NodeSection, NodeSubSection } from '@/utils/node';
import type { PageData } from '@/utils/page';

/**
 * Raw validation metadata loaded from /data/{page}.meta.json.
 *
 * This is a local loader-only type used by loadValidationMetadata().
 * It intentionally stays out of src/utils/validationWarning/validationWarning.types.ts,
 * which is reserved for the normalized UI warning model.
 *
 * @property {string} hash - Hash of the current source file contents
 * @property {boolean} valid - Whether the source file passed validation
 * @property {string} sourceFile - Source filename associated with this metadata
 * @property {string[]} validationErrors - Raw validation error strings
 * @property {string} [lastValidHash] - Hash of the last known valid snapshot
 * @property {string} [error] - General validation failure message
 */
interface ValidationMetadata {
  hash: string;
  valid: boolean;
  sourceFile: string;
  validationErrors: string[];
  lastValidHash?: string;
  error?: string;
}

const SECTION_LABELS: Record<string, string> = {
  hardware: 'Hardware',
  nics: 'NICs',
  storage: 'Storage',
  serviceConfig: 'Service Config',
  services: 'Services',
  routes: 'Routes',
  interVlanRules: 'Inter-VLAN Rules',
  members: 'Members',
  vips: 'Virtual IPs',
};

/**
 * Convert a raw JSON key into a human-readable section label.
 *
 * Checks `SECTION_LABELS` first for exact matches (e.g., `"nics"` → `"NICs"`),
 * then falls back to splitting camelCase/snake_case and title-casing each word.
 *
 * @param {string} key - Raw JSON key (camelCase or snake_case)
 * @returns {string} Display label shown in sidebar section headers
 */
function sectionLabelFor(key: string): string {
  if (SECTION_LABELS[key]) return SECTION_LABELS[key];
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, s => s.toUpperCase());
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Convert a plain key-value object into a flat `NodeAttribute[]` array.
 *
 * Each entry becomes a `{ key: stringValue }` pair. Arrays of primitives
 * are joined with `", "`; arrays of objects and nested objects are
 * JSON-serialised. Null and undefined values are skipped.
 *
 * @param {Record<string, unknown>} obj - Source object to flatten
 * @returns {NodeAttribute[]} Flat attribute pairs for sidebar display
 */
function objectToAttributes(obj: Record<string, unknown>): NodeAttribute[] {
  const result: NodeAttribute[] = [];

  Object.entries(obj).forEach(([k, v]) => {
    if (v === null || v === undefined) return;

    if (Array.isArray(v)) {
      if (v.length === 0) return;
      if (v.every(item => typeof item !== 'object' || item === null)) {
        result.push({ [k]: v.map(asString).join(', ') });
      } else {
        result.push({ [k]: asString(v) });
      }
      return;
    }

    if (typeof v === 'object') {
      result.push({ [k]: asString(v) });
      return;
    }

    result.push({ [k]: asString(v) });
  });

  return result;
}

/**
 * Convert an array of objects into a `NodeAttribute[]` table for sidebar display.
 *
 * Each object becomes a single `NodeAttribute` row where all its properties are
 * stringified. Non-object items (primitives, arrays, nulls) are skipped.
 *
 * @param {unknown[]} value - Array whose object elements become attribute rows
 * @returns {NodeAttribute[]} One row per valid object in the input array
 */
function arrayOfObjectsToAttributes(value: unknown[]): NodeAttribute[] {
  const result: NodeAttribute[] = [];
  value.forEach(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row: NodeAttribute = {};
    Object.entries(item).forEach(([k, v]) => {
      row[k] = asString(v);
    });
    if (Object.keys(row).length) result.push(row);
  });
  return result;
}

/**
 * Migrate a node from the legacy `meta` flat-object shape to the current
 * `attributes / subSections / sections` schema.
 *
 * Older data files stored device metadata in an untyped `meta` object.
 * This function inspects each `meta` key and promotes it into the correct
 * typed structure:
 * - Primitive values → `attributes[]`
 * - Arrays of primitives → `attributes[]` (joined)
 * - Arrays of objects → `sections[]` with a table sub-section
 * - Plain objects → `sections[]` with nested sub-sections
 * - Objects matching `{ label, attributes|subSections }` → `sections[]` directly
 *
 * Also initialises `attributes`, `subSections`, and `sections` to `[]` if absent,
 * so downstream code can safely iterate them without null-checks.
 *
 * @param {T} node - Raw node, possibly with a legacy `meta` object
 * @returns {T} Normalised node with `meta` content promoted into typed fields
 */
function normalizeLegacyNodeShape<T extends Node & { meta?: Record<string, unknown> }>(node: T): T {
  const normalized = { ...node };

  if (!Array.isArray(normalized.attributes)) normalized.attributes = [];
  if (!Array.isArray(normalized.subSections)) normalized.subSections = [];
  if (!Array.isArray(normalized.sections)) normalized.sections = [];

  const meta = normalized.meta;
  if (!meta || typeof meta !== 'object') return normalized;

  Object.entries(meta).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (typeof value === 'object' && !Array.isArray(value)) {
      const maybeSection = value as Partial<NodeSection>;
      if (
        typeof maybeSection.label === 'string' &&
        (Array.isArray(maybeSection.attributes) || Array.isArray(maybeSection.subSections))
      ) {
        normalized.sections!.push({
          key,
          label: maybeSection.label,
          attributes: Array.isArray(maybeSection.attributes) ? maybeSection.attributes : [],
          subSections: Array.isArray(maybeSection.subSections) ? maybeSection.subSections : [],
        });
        return;
      }

      const subSections: NodeSubSection[] = [];
      const detailAttrs: NodeAttribute[] = [];
      Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
        if (subValue === null || subValue === undefined) return;

        if (Array.isArray(subValue)) {
          if (!subValue.length) return;
          if (subValue.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
            const tableAttrs = arrayOfObjectsToAttributes(subValue);
            if (tableAttrs.length) {
              subSections.push({
                key: subKey,
                label: sectionLabelFor(subKey),
                attributes: tableAttrs,
              });
            }
            return;
          }

          if (subValue.every(item => typeof item !== 'object' || item === null)) {
            detailAttrs.push({ [subKey]: subValue.map(asString).join(', ') });
          } else {
            detailAttrs.push({ [subKey]: asString(subValue) });
          }
          return;
        }

        if (typeof subValue === 'object') {
          subSections.push({
            key: subKey,
            label: sectionLabelFor(subKey),
            attributes: objectToAttributes(subValue as Record<string, unknown>),
          });
          return;
        }

        detailAttrs.push({ [subKey]: asString(subValue) });
      });

      if (detailAttrs.length) {
        subSections.unshift({
          key: `${key}-details`,
          label: 'Details',
          attributes: detailAttrs,
        });
      }

      if (subSections.length) {
        normalized.sections!.push({
          key,
          label: sectionLabelFor(key),
          subSections,
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return;

      if (key === 'subSections') {
        normalized.subSections!.push(
          ...(value.filter(item => item && typeof item === 'object' && !Array.isArray(item)) as NodeSubSection[])
        );
        return;
      }
      if (key === 'sections') {
        normalized.sections!.push(
          ...(value.filter(item => item && typeof item === 'object' && !Array.isArray(item)) as NodeSection[])
        );
        return;
      }

      if (value.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
        const tableAttrs = arrayOfObjectsToAttributes(value);
        if (tableAttrs.length) {
          normalized.sections!.push({
            key,
            label: sectionLabelFor(key),
            subSections: [{ key: `${key}-table`, label: sectionLabelFor(key), attributes: tableAttrs }],
          });
        }
        return;
      }
      if (value.every(item => typeof item !== 'object' || item === null)) {
        normalized.attributes!.push({ [key]: value.map(asString).join(', ') });
      } else {
        normalized.attributes!.push({ [key]: asString(value) });
      }
      return;
    }

    normalized.attributes!.push({ [key]: asString(value) });
  });

  return normalized;
}

/**
 * Migrate an edge from the legacy flat-port shape to the current endpoint object shape.
 *
 * Older data files used `{ from: "nodeId", fromPort: "eth0" }` (separate string IDs
 * and port fields). The current schema uses `{ from: { nodeId, port } }`.
 * This function accepts both forms and always returns the current shape.
 *
 * @param {T} edge - Raw edge, possibly in the legacy string-ID + separate-port format
 * @returns {T} Edge normalised to `{ from: { nodeId, port? }, to: { nodeId, port? } }`
 */
function normalizeLegacyEdgeShape<T extends { from: unknown; to: unknown; fromPort?: string; toPort?: string }>(edge: T): T {
  const toEdgeEndpoint = (value: string | { nodeId: string; port?: string }, legacyPort?: string) => {
    if (typeof value === 'string') {
      return legacyPort ? { nodeId: value, port: legacyPort } : { nodeId: value };
    }
    if (value && typeof value === 'object' && typeof value.nodeId === 'string') {
      if (value.port && value.port !== '') return { nodeId: value.nodeId, port: value.port };
      return { nodeId: value.nodeId };
    }
    return { nodeId: '' };
  };

  const normalized = { ...edge } as T & { from: unknown; to: unknown };
  normalized.from = toEdgeEndpoint(normalized.from as string | { nodeId: string; port?: string }, edge.fromPort);
  normalized.to = toEdgeEndpoint(normalized.to as string | { nodeId: string; port?: string }, edge.toPort);
  return normalized;
}

/**
 * Fetch a URL with all caches bypassed.
 *
 * Appends a `?t=<timestamp>` cache-buster and sets `Cache-Control: no-store`
 * so that updates written by watcher.js are visible immediately in the browser
 * during development without a hard reload.
 *
 * @param {string} url - URL to fetch (relative or absolute)
 * @returns {Promise<Response>} Raw fetch Response (not yet parsed)
 * @throws {Error} Network-level failures (DNS, connection refused, etc.)
 */
async function fetchJsonOrThrow(url: string): Promise<Response> {
  const separator = url.includes('?') ? '&' : '?';
  const cacheBustedUrl = `${url}${separator}t=${Date.now()}`;

  return fetch(cacheBustedUrl, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
}

/* ============================================================================
 * DATA LOADING FUNCTIONS
 * ============================================================================ */

/**
 * Fetch and parse a page's topology data from /data/{pageId}.json.
 *
 * This function fetches the JSON file for a specific page, validates
 * that it contains the required structure (nodes and edges arrays),
 * and returns the parsed data.
 *
 * Expected JSON structure:
 * ```json
 * {
 *   "nodes": [...],
 *   "edges": [...],
 *   "flows": [...]  // optional, traffic page only
 * }
 * ```
 *
 * @param {string} pageId - Page identifier ('physical', 'traffic', 'vlan')
 * @returns {Promise<PageData>} Parsed page data with nodes, edges, and optional flows
 * @throws {Error} HTTP error if fetch fails (includes status code)
 * @throws {Error} Structure error if nodes/edges arrays are missing
 *
 * @example
 * try {
 *   const data = await loadPageDataOrThrow('physical');
 *   console.log(`Loaded ${data.nodes.length} nodes`);
 * } catch (err) {
 *   console.error('Failed to load data:', err.message);
 * }
 */
export async function loadPageDataOrThrow(pageId: string): Promise<PageData> {
  /* Fetch the JSON file */
  const res = await fetchJsonOrThrow(`/data/${pageId}.json`);

  /* Check for HTTP errors */
  if (!res.ok) {
    throw new Error(`${pageId}.json: HTTP ${res.status}`);
  }

  /* Parse JSON response */
  const data = await res.json();

  /* Validate required structure */
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error(`${pageId}.json must contain { nodes: [], edges: [] }`);
  }

  /* Normalize legacy node shapes (e.g. meta -> attributes/sections). */
  const nodes = data.nodes.map((node: any) => normalizeLegacyNodeShape(node));
  const edges = data.edges.map((edge: any) => normalizeLegacyEdgeShape(edge));

  /* Return normalized data (flows defaults to empty array) */
  return {
    nodes,
    edges,
    flows: data.flows || [],
  };
}

/**
 * Fetch validation metadata for a page from /data/{pageId}.meta.json.
 *
 * Metadata files are generated by watcher.js after validating data files
 * against JSON schemas. The metadata indicates whether validation passed
 * and contains error messages if it failed.
 *
 * Returns null if the metadata file doesn't exist (validation hasn't
 * been run yet) or if fetch fails for any reason.
 *
 * Raw metadata structure (when valid):
 * ```json
 * {
 *   "hash": "sha256...",
 *   "valid": true,
 *   "sourceFile": "physical.json",
 *   "validationErrors": []
 * }
 * ```
 *
 * Raw metadata structure (when invalid):
 * ```json
 * {
 *   "hash": "sha256...",
 *   "valid": false,
 *   "sourceFile": "physical.json",
 *   "validationErrors": ["error 1", "error 2"],
 *   "lastValidHash": "sha256..."
 * }
 * ```
 *
 * @param {string} pageId - Page identifier ('physical', 'traffic', 'vlan')
 * @returns {Promise<ValidationMetadata | null>} Parsed metadata or null if unavailable
 *
 * @example
 * const meta = await loadValidationMetadata('physical');
 * if (meta && !meta.valid) {
 *   console.warn('Validation failed:', meta.validationErrors);
 * }
 */
export async function loadValidationMetadata(pageId: string): Promise<ValidationMetadata | null> {
  try {
    /* Fetch the metadata file */
    const res = await fetchJsonOrThrow(`/data/${pageId}.meta.json`);

    /* Return null if file doesn't exist (404) or other HTTP error */
    if (!res.ok) {
      return null;
    }

    /* Parse and return metadata */
    return await res.json();
  } catch {
    /* Return null on any error (network, parse, etc.) */
    return null;
  }
}
