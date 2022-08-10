/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';

export const GRID = [
	[ 'top left', 'top center', 'top right' ],
	[ 'center left', 'center center', 'center right' ],
	[ 'bottom left', 'bottom center', 'bottom right' ],
];

// Stored as map as i18n __() only accepts strings (not variables)
export const ALIGNMENT_LABEL = {
	'top left': ! isRTL() ? __( 'Top Left' ) : __( 'Top Right' ),
	'top center': __( 'Top Center' ),
	'top right': ! isRTL() ? __( 'Top Right' ) : __( 'Top Left' ),
	'center left': ! isRTL() ? __( 'Center Left' ) : __( 'Center Right' ),
	'center center': __( 'Center Center' ),
	'center right': ! isRTL() ? __( 'Center Right' ) : __( 'Center Left' ),
	'bottom left': ! isRTL() ? __( 'Bottom Left' ) : __( 'Bottom Right' ),
	'bottom center': __( 'Bottom Center' ),
	'bottom right': ! isRTL() ? __( 'Bottom Right' ) : __( 'Bottom Left' ),
};

// Transforms GRID into a flat Array of values.
export const ALIGNMENTS = GRID.flat();

/**
 * Parses and transforms an incoming value to better match the alignment values
 *
 * @param {string} value An alignment value to parse.
 *
 * @return {string} The parsed value.
 */
export function transformValue( value ) {
	const nextValue = value === 'center' ? 'center center' : value;

	return nextValue.replace( '-', ' ' );
}

/**
 * Creates an item ID based on a prefix ID and an alignment value.
 *
 * @param {string} prefixId An ID to prefix.
 * @param {string} value    An alignment value.
 *
 * @return {string} The item id.
 */
export function getItemId( prefixId, value ) {
	const valueId = transformValue( value ).replace( ' ', '-' );

	return `${ prefixId }-${ valueId }`;
}

/**
 * Retrieves the alignment index from a value.
 *
 * @param {string} alignment Value to check.
 *
 * @return {number} The index of a matching alignment.
 */
export function getAlignmentIndex( alignment = 'center' ) {
	const item = transformValue( alignment ).replace( '-', ' ' );
	const index = ALIGNMENTS.indexOf( item );

	return index > -1 ? index : undefined;
}
