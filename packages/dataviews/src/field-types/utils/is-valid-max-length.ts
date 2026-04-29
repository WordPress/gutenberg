/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidMaxLength< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	if ( typeof field.isValid.maxLength?.constraint !== 'number' ) {
		return false;
	}

	const value = field.getValue( { item } );

	// Empty values are considered valid for maxLength validation
	// (use required validation to enforce non-empty values)
	if ( [ undefined, '', null ].includes( value ) ) {
		return true;
	}

	return String( value ).length <= field.isValid.maxLength.constraint;
}
