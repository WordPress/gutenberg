/**
 *
 * @param {string} path The variation path in the Global Styles tree.
 *
 * @return {string} The variation class name.
 */
export function getVariationClassNameFromPath( path ) {
	if ( ! path ) {
		return '';
	}
	return `is-style-${ path.split( '.' )[ 1 ] }`;
}
