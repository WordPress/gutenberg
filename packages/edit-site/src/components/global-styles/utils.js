/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

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

export function compareVariations( a, b ) {
	if ( ! a.styles ) {
		a.styles = {};
	}

	if ( ! a.settings ) {
		a.settings = {};
	}

	if ( ! b.styles ) {
		b.styles = {};
	}

	if ( ! b.settings ) {
		b.settings = {};
	}

	return (
		fastDeepEqual( a.styles, b.styles ) &&
		fastDeepEqual( a.settings, b.settings )
	);
}
