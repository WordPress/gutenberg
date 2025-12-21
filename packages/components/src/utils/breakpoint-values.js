/**
 * WordPress dependencies
 */
import { BREAKPOINTS as breakpointsSource } from '@wordpress/base-styles';

/**
 * Breakpoint values with px suffix for backwards compatibility.
 * Note: 'xlarge' is aliased as 'x-large' for backwards compatibility.
 *
 * @type {Record<string, string>}
 */
const breakpoints = {};
for ( const [ key, value ] of Object.entries( breakpointsSource ) ) {
	breakpoints[ key ] = `${ value }px`;
}

// Backwards compatibility: provide 'x-large' alias for 'xlarge'
if ( breakpoints.xlarge ) {
	breakpoints[ 'x-large' ] = breakpoints.xlarge;
}

export default breakpoints;
