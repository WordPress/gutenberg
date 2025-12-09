/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidMinLength< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	if ( typeof field.isValid.minLength?.constraint !== 'number' ) {
		return false;
	}

	const value = field.getValue( { item } );

	// Empty values are considered valid for minLength validation
	// (use required validation to enforce non-empty values)
	if ( [ undefined, '', null ].includes( value ) ) {
		return true;
	}

	return String( value ).length >= field.isValid.minLength.constraint;
}
