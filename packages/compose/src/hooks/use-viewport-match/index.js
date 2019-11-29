/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

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
 * Object mapping media query operators to the condition to be used.
 *
 * @type {Object}
 */
const CONDITIONS = {
	'>=': 'min-width',
	'<': 'max-width',
};

/**
 * Returns true if the viewport matches the given query, or false otherwise.
 *
 * @param {string} query Query string. Includes operator and breakpoint name,
 *                       space separated. Operator defaults to >=.
 *
 * @example
 *
 * ```js
 * useViewportMatch( '< huge' );
 * useViewportMatch( 'medium' );
 * ```
 *
 * @return {boolean} Whether viewport matches query.
 */
const useViewportMatch = ( query ) => {
	if ( query.indexOf( ' ' ) === -1 ) {
		query = '>= ' + query;
	}
	const [ operator, breakpoint ] = query.split( ' ' );
	const mediaQuery = `(${ CONDITIONS[ operator ] }: ${ BREAKPOINTS[ breakpoint ] }px)`;
	return useMediaQuery( mediaQuery );
};

export default useViewportMatch;
