/**
 * WordPress dependencies
 */
import { BREAKPOINTS as ALL_BREAKPOINTS } from '@wordpress/base-styles';

/**
 * Internal dependencies
 */
import addDimensionsEventListener from './listener';

export { store } from './store';
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
	huge: ALL_BREAKPOINTS.huge,
	wide: ALL_BREAKPOINTS.wide,
	large: ALL_BREAKPOINTS.large,
	medium: ALL_BREAKPOINTS.medium,
	small: ALL_BREAKPOINTS.small,
	mobile: ALL_BREAKPOINTS.mobile,
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
