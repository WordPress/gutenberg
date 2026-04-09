/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidMaxDate< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	if ( typeof field.isValid.max?.constraint !== 'string' ) {
		return false;
	}

	const value = field.getValue( { item } );

	// Empty values are considered valid for max validation
	// (use required validation to enforce non-empty values)
	if ( [ undefined, '', null ].includes( value ) ) {
		return true;
	}

	// For array values (e.g., date ranges [from, to]), check the last element.
	if ( Array.isArray( value ) ) {
		if ( value.length === 0 ) {
			return true;
		}
		return (
			String( value[ value.length - 1 ] ) <=
			field.isValid.max.constraint
		);
	}

	return String( value ) <= field.isValid.max.constraint;
}
