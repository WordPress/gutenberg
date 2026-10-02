export { speak } from '../shared/index';
export { prefersReducedMotion } from '../shared/prefers-reduced-motion';

/**
 * This no-op function is exported to provide compatibility with the `wp-a11y` Script.
 *
 * Filters should inject the relevant HTML on page load instead of requiring setup.
 */
export const setup = () => {};
