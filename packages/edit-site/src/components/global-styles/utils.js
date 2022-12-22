/**
 *
 * @param {string} variation The variation name.
 *
 * @return {string} The variation class name.
 */
export function getVariationClassName( variation ) {
	if ( ! variation ) {
		return '';
	}
	return `is-style-${ variation }`;
}

/**
 * Compares global style variations according to their styles and settings properties.
 *
 * @example
 * ```js
 * const globalStyles = { styles: { typography: { fontSize: '10px' } }, settings: {} };
 * const variation = { styles: { typography: { fontSize: '10000px' } }, settings: {} };
 * const isEqual = isGlobalStyleConfigEqual( globalStyles, variation );
 * // false
 * ```
 *
 * @param {Object} original  A global styles object.
 * @param {Object} variation A global styles object.
 *
 * @return {boolean} Whether `original` and `variation` match.
 */
export function isGlobalStyleConfigEqual( original, variation ) {
	if ( ! original || ! variation ) {
		return false;
	}
	return (
		fastDeepEqual( original?.styles, variation?.styles ) &&
		fastDeepEqual( original?.settings, variation?.settings )
	);
}
