/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidMinDate< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	if ( typeof field.isValid.min?.constraint !== 'string' ) {
		return false;
	}

	const value = field.getValue( { item } );

	// Empty values are considered valid for min validation
	// (use required validation to enforce non-empty values)
	if ( [ undefined, '', null ].includes( value ) ) {
		return true;
	}

	// For array values (e.g., date ranges [from, to]), check the first element.
	if ( Array.isArray( value ) ) {
		if ( value.length === 0 ) {
			return true;
		}
		return String( value[ 0 ] ) >= field.isValid.min.constraint;
	}

	return String( value ) >= field.isValid.min.constraint;
}
