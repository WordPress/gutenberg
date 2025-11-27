/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidPattern< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	// There was an issue creating the constraint (e.g., parsing the regexp pattern).
	if ( ! ( field?.isValid.pattern?.constraint instanceof RegExp ) ) {
		return false;
	}

	const value = field.getValue( { item } );

	// Empty values are considered valid for pattern validation
	// (use required validation to enforce non-empty values)
	if ( [ undefined, '', null ].includes( value ) ) {
		return true;
	}

	return field.isValid.pattern.constraint.test( String( value ) );
}
