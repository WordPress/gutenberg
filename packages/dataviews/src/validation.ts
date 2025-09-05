/**
 * Internal dependencies
 */
import { normalizeFields } from './normalize-fields';
import type { Field, Form } from './types';

/**
 * Whether or not the given item's value is valid according to the fields and form config.
 *
 * @param item   The item to validate.
 * @param fields Fields config.
 * @param form   Form config.
 *
 * @return A boolean indicating if the item is valid (true) or not (false).
 */
export function isItemValid< Item >(
	item: Item,
	fields: Field< Item >[],
	form: Form
): boolean {
	const _fields = normalizeFields(
		fields.filter( ( { id } ) => !! form.fields?.includes( id ) )
	);

	const isEmptyNullOrUndefined = ( value: any ) =>
		[ undefined, '', null ].includes( value );

	return _fields.every( ( field ) => {
		const value = field.getValue( { item } );

		if ( field.isValid.required ) {
			if (
				( field.type === 'text' && isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'email' && isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'integer' &&
					isEmptyNullOrUndefined( value ) ) ||
				( field.type === undefined && isEmptyNullOrUndefined( value ) )
			) {
				return false;
			}

			if ( field.type === 'boolean' && value !== true ) {
				return false;
			}
		}

		if (
			typeof field.isValid.custom === 'function' &&
			field.isValid.custom( item, field ) !== null
		) {
			return false;
		}

		return true;
	} );
}
