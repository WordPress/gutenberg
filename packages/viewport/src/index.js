/**
 * Internal dependencies
 */
import './store';
import addDimensionsEventListener from './listener';

export { default as ifViewportMatches } from './if-viewport-matches';
export { default as withViewportMatch } from './with-viewport-match';

/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 *
 * @see _breakpoints.scss
 *
 * @type {Object}
 */
const BREAKPOINTS = {
	huge: 1440,
	wide: 1280,
	large: 960,
	medium: 782,
	small: 600,
	mobile: 480,
};

/**
 * Hash of query operators with corresponding condition for media query.
 *
 * @type {Object}
 */
const OPERATORS = {
	'<': 'max-width',
	'>=': 'min-width',
};

addDimensionsEventListener( BREAKPOINTS, OPERATORS );
