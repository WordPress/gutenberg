/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	AlignmentMatrixControlValue,
	VoidableAlignmentMatrixControlValue,
} from './types';

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
 * Normalizes an incoming value to better match the alignment values
 *
 * @param value an alignment value to normalize
 *
 * @return The normalized value
 */
export function normalizeValue( value: VoidableAlignmentMatrixControlValue ) {
	return value === 'center' ? 'center center' : value;
}

/**
 * Normalizes and transforms an incoming value to better match the alignment values
 *
 * @param value An alignment value to parse.
 *
 * @return The parsed value.
 */
export function transformValue( value: VoidableAlignmentMatrixControlValue ) {
	return normalizeValue( value )?.replace(
		'-',
		' '
	) as VoidableAlignmentMatrixControlValue;
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
	value: VoidableAlignmentMatrixControlValue
) {
	const valueId = transformValue( value )?.replace( ' ', '-' );
	return valueId && `${ prefixId }-${ valueId }`;
}

/**
 * Extracts an item value from its ID
 *
 * @param prefixId An ID prefix to remove
 * @param id       An item ID
 * @return         The item value
 */
export function getItemValue(
	prefixId: string,
	id: VoidableAlignmentMatrixControlValue
) {
	return transformValue(
		id?.replace( prefixId + '-', '' ) as VoidableAlignmentMatrixControlValue
	);
}

/**
 * Retrieves the alignment index from a value.
 *
 * @param alignment Value to check.
 *
 * @return The index of a matching alignment.
 */
export function getAlignmentIndex(
	alignment: VoidableAlignmentMatrixControlValue = 'center'
) {
	const transformedValue = transformValue(
		alignment
	) as AlignmentMatrixControlValue;

	// `transformedValue` could come back as undefined or null,
	// but `indexOf` will still return -1, so we can proceed
	// without any problems.
	const index = ALIGNMENTS.indexOf( transformedValue );

	return index > -1 ? index : undefined;
}
