/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidElements< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	const elements = field.elements ?? [];
	const validValues = elements.map( ( el ) => el.value );
	if ( validValues.length === 0 ) {
		return true;
	}

	const value = field.getValue( { item } );

	// Covers both array and non-array values.
	return [].concat( value ).every( ( v ) => validValues.includes( v ) );
}
