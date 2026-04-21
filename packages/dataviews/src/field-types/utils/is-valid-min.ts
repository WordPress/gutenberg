/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidMin< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	if ( typeof field.isValid.min?.constraint !== 'number' ) {
		return false;
	}

	const value = field.getValue( { item } );

	// Empty values are considered valid for min validation
	// (use required validation to enforce non-empty values)
	if ( [ undefined, '', null ].includes( value ) ) {
		return true;
	}

	return Number( value ) >= field.isValid.min.constraint;
}
