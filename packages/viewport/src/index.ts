/**
 * Internal dependencies
 */
import addDimensionsEventListener from './listener';
import type { Breakpoints, Operators } from './types';

export { store } from './store';
export { default as ifViewportMatches } from './if-viewport-matches';
export { default as withViewportMatch } from './with-viewport-match';

/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 *
 * @see _breakpoints.scss
 */
const BREAKPOINTS: Breakpoints = {
	huge: 1440,
	wide: 1280,
	large: 960,
	medium: 782,
	small: 600,
	mobile: 480,
};

/**
 * Hash of query operators with corresponding condition for media query.
 */
const OPERATORS: Operators = {
	'<': 'max-width',
	'>=': 'min-width',
};

addDimensionsEventListener( BREAKPOINTS, OPERATORS );
