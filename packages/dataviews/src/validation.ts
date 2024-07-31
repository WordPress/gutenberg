/**
 * Internal dependencies
 */
import { normalizeFields } from './normalize-fields';
import type { Field, Form } from './types';

export function isItemValid< Item >(
	item: Item,
	fields: Field< Item >[],
	form: Form
): boolean {
	const _fields = normalizeFields(
		fields.filter( ( { id } ) => !! form.visibleFields?.includes( id ) )
	);
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

		if ( field.elements ) {
			const validValues = field.elements.map( ( f ) => f.value );
			if ( ! validValues.includes( Number( value ) ) ) {
				return false;
			}
		}

		// Nothing to validate.
		return true;
	} );
}
