/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * Internal dependencies
 */
import type { GlobalStylesConfig } from '../types';

/**
 * Compares global style variations according to their styles and settings properties.
 *
 * @param original  A global styles object.
 * @param variation A global styles object.
 * @return Whether `original` and `variation` match.
 */
export function areGlobalStylesEqual(
	original: GlobalStylesConfig,
	variation: GlobalStylesConfig
): boolean {
	if ( typeof original !== 'object' || typeof variation !== 'object' ) {
		return original === variation;
	}
	return (
		fastDeepEqual( original?.styles, variation?.styles ) &&
		fastDeepEqual( original?.settings, variation?.settings )
	);
}
