/**
 * Internal dependencies
 */
import serialize from './serialize';

export * from './api';
export * from './components';

/**
 * Renders a given element into a string.
 *
 * @param {WPElement} element Element to render
 *
 * @return {string} HTML.
 */
export { serialize as renderToString };
