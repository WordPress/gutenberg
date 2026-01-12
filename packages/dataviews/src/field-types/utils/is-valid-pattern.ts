/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

export default function isValidPattern< Item >(
	item: Item,
	field: NormalizedField< Item >
): boolean {
	if ( field.isValid.pattern?.constraint === undefined ) {
		return true;
	}

	try {
		const regexp = new RegExp( field.isValid.pattern.constraint );

		const value = field.getValue( { item } );

		// Empty values are considered valid for pattern validation
		// (use required validation to enforce non-empty values)
		if ( [ undefined, '', null ].includes( value ) ) {
			return true;
		}

		return regexp.test( String( value ) );
	} catch {
		return false;
	}
}
