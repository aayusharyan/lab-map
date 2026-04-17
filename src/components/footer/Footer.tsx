/**
 * @file Footer.tsx
 * @description Application footer component
 *
 * Renders a footer bar at the bottom of the main content area with
 * an optional page description on the left and a GitHub link on the right.
 *
 * @see Footer.types.ts - Props interface
 * @see Footer.module.css - Component styles
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import styles from './Footer.module.css';

import type { FooterProps } from './Footer.types';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/** GitHub repository URL */
const GITHUB_URL = 'https://github.com/aayusharyan/lab-map';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Footer component - displays page description and GitHub link.
 *
 * @param {FooterProps} props - Component props
 * @param {string} [props.description] - Optional page description text
 * @returns {JSX.Element} Footer element
 */
export function Footer({ description }: FooterProps): JSX.Element {
  return (
    <footer className={`app-footer ${styles.footer}`}>
      <span className={styles.text}>{description}</span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        Star on GitHub
      </a>
    </footer>
  );
}
