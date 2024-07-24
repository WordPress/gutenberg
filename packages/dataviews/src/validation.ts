/**
 * Internal dependencies
 */
import { normalizeFields } from './normalize-fields';
import type { Field } from './types';

export function isItemValid< Item >(
	item: Item,
	fields: Field< Item >[]
): boolean {
	const _fields = normalizeFields( fields );
	return _fields.every( ( field ) => {
		const value = field.getValue( { item } );

		// TODO: this implicitely means the value is required.
		if ( field.type === 'integer' && value === '' ) {
			return false;
		}

		if (
			field.type === 'integer' &&
			! Number.isInteger( Number( value ) )
		) {
			return false;
		}

		// Nothing to validate.
		return true;
	} );
}
