/**
 * Internal dependencies
 */
import breakpoints from './breakpoint-values';

/**
 * @param {string} point
 * @return {string} Media query declaration.
 */
export const breakpoint = ( point ) => {
	const breakpointValue = breakpoints[ point ];
	if ( ! breakpointValue ) {
		return '';
	}
	return `@media (min-width: ${ breakpointValue })`;
};
