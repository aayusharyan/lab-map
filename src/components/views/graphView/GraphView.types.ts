/**
 * @file GraphView.types.ts
 * @description Graph-specific type definitions for vis-network rendering
 *
 * Contains physics simulation configuration interfaces used by GraphView
 * and useVisNetwork hook for controlling graph layout behavior.
 *
 * @see GraphView.tsx - Main component consuming these types
 * @see useVisNetwork.ts - Hook that applies physics settings
 */

/* ============================================================================
 * PHYSICS CONFIGURATION
 * Settings for vis-network force-directed graph simulation
 * ============================================================================ */

/**
 * Physics simulation settings for vis-network graph layout.
 *
 * Controls force-directed layout behavior including gravity, spring forces,
 * and stabilization parameters passed to vis-network's physics engine.
 *
 * @property enabled - Whether physics simulation is active
 * @property solver - Physics solver algorithm (e.g., 'forceAtlas2Based')
 * @property forceAtlas2Based - ForceAtlas2 algorithm parameters
 * @property stabilization - Initial stabilization settings
 */
export interface GraphPhysics {
  enabled: boolean;
  solver: string;
  forceAtlas2Based: {
    /** Repulsion force between nodes (negative = repel) */
    gravitationalConstant: number;
    /** Pull toward center of canvas */
    centralGravity: number;
    /** Ideal edge length in pixels */
    springLength: number;
    /** Edge stiffness coefficient */
    springConstant: number;
    /** Velocity decay factor (0-1) */
    damping: number;
  };
  stabilization: {
    /** Max iterations before stopping */
    iterations: number;
    /** Progress callback interval */
    updateInterval: number;
  };
}
