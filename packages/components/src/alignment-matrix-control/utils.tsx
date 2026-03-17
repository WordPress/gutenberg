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
 * Normalizes and transforms an incoming value to better match the alignment values
 *
 * @param value An alignment value to parse.
 *
 * @return The parsed value.
 */
function normalize( value?: string | null ) {
	const normalized = value === 'center' ? 'center center' : value;

	// Strictly speaking, this could be `string | null | undefined`,
	// but will be validated shortly, so we're typecasting to an
	// `AlignmentMatrixControlValue` to keep TypeScript happy.
	const transformed = normalized?.replace(
		'-',
		' '
	) as AlignmentMatrixControlValue;

	return ALIGNMENTS.includes( transformed ) ? transformed : undefined;
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
	value?: AlignmentMatrixControlValue
) {
	const normalized = normalize( value );
	if ( ! normalized ) {
		return;
	}

	const id = normalized.replace( ' ', '-' );
	return `${ prefixId }-${ id }`;
}

/**
 * Extracts an item value from its ID
 *
 * @param prefixId An ID prefix to remove
 * @param id       An item ID
 * @return         The item value
 */
export function getItemValue( prefixId: string, id?: string | null ) {
	const value = id?.replace( prefixId + '-', '' );
	return normalize( value );
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
	const normalized = normalize( alignment );
	if ( ! normalized ) {
		return undefined;
	}

	const index = ALIGNMENTS.indexOf( normalized );
	return index > -1 ? index : undefined;
}
