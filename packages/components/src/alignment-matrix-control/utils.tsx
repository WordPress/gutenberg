/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { AlignmentMatrixControlValue } from './types';

export const GRID: AlignmentMatrixControlValue[][] = [
	[ 'top left', 'top center', 'top right' ],
	[ 'center left', 'center center', 'center right' ],
	[ 'bottom left', 'bottom center', 'bottom right' ],
];

// Stored as map as i18n __() only accepts strings (not variables)
export const ALIGNMENT_LABEL: Record< AlignmentMatrixControlValue, string > = {
	'top left': __( 'Top Left' ),
	'top center': __( 'Top Center' ),
	'top right': __( 'Top Right' ),
	'center left': __( 'Center Left' ),
	'center center': __( 'Center' ),
	center: __( 'Center' ),
	'center right': __( 'Center Right' ),
	'bottom left': __( 'Bottom Left' ),
	'bottom center': __( 'Bottom Center' ),
	'bottom right': __( 'Bottom Right' ),
};

// Transforms GRID into a flat Array of values.
export const ALIGNMENTS = GRID.flat();

/**
 * Parses and transforms an incoming value to better match the alignment values
 *
 * @param value An alignment value to parse.
 *
 * @return The parsed value.
 */
export function transformValue( value: AlignmentMatrixControlValue ) {
	const nextValue = value === 'center' ? 'center center' : value;

	return nextValue.replace( '-', ' ' ) as AlignmentMatrixControlValue;
}

/**
 * Creates an item ID based on a prefix ID and an alignment value.
 *
 * @param prefixId An ID to prefix.
 * @param value    An alignment value.
 *
 * @return The item id.
 */
export function getItemId(
	prefixId: string,
	value: AlignmentMatrixControlValue
) {
	const valueId = transformValue( value ).replace( ' ', '-' );

	return `${ prefixId }-${ valueId }`;
}

/**
 * Retrieves the alignment index from a value.
 *
 * @param alignment Value to check.
 *
 * @return The index of a matching alignment.
 */
export function getAlignmentIndex(
	alignment: AlignmentMatrixControlValue = 'center'
) {
	const item = transformValue( alignment );
	const index = ALIGNMENTS.indexOf( item );

	return index > -1 ? index : undefined;
}
