/**
 * Internal dependencies
 */
import breakpoints from './breakpoint-values';

/**
 * @param {keyof breakpoints} point
 * @return {string} Media query declaration.
 */
export const breakpoint = ( point ) =>
	`@media (min-width: ${ breakpoints[ point ] })`;
