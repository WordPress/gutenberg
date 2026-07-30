/**
 * Internal dependencies
 */
import breakpoints from './breakpoint-values';

/**
 * @param {keyof typeof breakpoints} point
 * @return {string} Media query declaration.
 */
export const breakpoint = ( point ) =>
	`@media (min-width: ${ breakpoints[ point ] })`;
