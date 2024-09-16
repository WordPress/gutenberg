/**
 * Internal dependencies
 */
export { speak } from '../shared/index';

/**
 * This no-op function is exported to provide compatibility with the `wp-a11y` Script.
 *
 * The Script Module should include the relevant HTML as part of page load.
 */
export const setup = () => {};
