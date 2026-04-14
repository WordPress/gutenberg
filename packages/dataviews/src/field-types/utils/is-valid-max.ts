/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidMax< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	if ( typeof field.isValid.max?.constraint !== 'number' ) {
		return false;
	}

	const value = field.getValue( { item } );

	// Empty values are considered valid for max validation
	// (use required validation to enforce non-empty values)
	if ( [ undefined, '', null ].includes( value ) ) {
		return true;
	}

	return Number( value ) <= field.isValid.max.constraint;
}
