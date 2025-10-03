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

	const isArrayOrElementsEmptyNullOrUndefined = ( value: any ) => {
		return (
			! Array.isArray( value ) ||
			value.length === 0 ||
			value.every( ( element: any ) => isEmptyNullOrUndefined( element ) )
		);
	};

	return _fields.every( ( field ) => {
		const value = field.getValue( { item } );

		if ( field.isValid.required ) {
			if (
				( field.type === 'text' && isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'email' && isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'url' && isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'telephone' &&
					isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'password' &&
					isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'integer' &&
					isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'number' &&
					isEmptyNullOrUndefined( value ) ) ||
				( field.type === 'array' &&
					isArrayOrElementsEmptyNullOrUndefined( value ) ) ||
				( field.type === undefined && isEmptyNullOrUndefined( value ) )
			) {
				return false;
			}

			if ( field.type === 'boolean' && value !== true ) {
				return false;
			}

			if (
				field.type === 'array' &&
				( ! Array.isArray( value ) || value.length === 0 )
			) {
				return false;
			}
		}

		if ( field.isValid.elements ) {
			if ( field.elements ) {
				const validValues = field.elements.map(
					( element ) => element.value
				);

				if ( field.type === 'array' ) {
					// For arrays, check if all values are valid elements
					if ( Array.isArray( value ) ) {
						return value.every( ( arrayItem ) =>
							validValues.includes( arrayItem )
						);
					}
					return false;
				}
				// For single-value fields, check if the value is a valid element
				return validValues.includes( value );
			}
		}

		if (
			typeof field.isValid.custom === 'function' &&
			field.isValid.custom( item, field ) !== null
		) {
			return false;
		}

		// The array field.type can have children.
		if ( field.type === 'array' && Array.isArray( field.children ) ) {
			// children is NormalizedField, but we'll use it below
			// as a parameter to isItemValid, which uses the more permissive
			// Field. Hence, the cast.
			const children = field.children as Field<
				Record< string, unknown >
			>[];

			return field
				.getValue( { item } )
				.every( ( row: Record< string, unknown > ) => {
					return isItemValid( row, children, {
						fields: children.map( ( child ) => child.id ),
					} );
				} );
		}

		return true;
	} );
}
