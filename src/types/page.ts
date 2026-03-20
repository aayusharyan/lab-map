/**
 * @file page.ts
 * @description Shared page identity types for routing, settings, and page-aware utilities
 */

/**
 * Valid page identifiers.
 *
 * Each page represents a different view of the network:
 * - physical: Hardware topology (devices, cables, ports)
 * - traffic: Data flow visualization (bandwidth, protocols)
 * - vlan: Virtual LAN configuration (segments, assignments)
 * - rack: Physical rack layout (device placement)
 */
export type PageId = 'physical' | 'traffic' | 'vlan' | 'rack';
