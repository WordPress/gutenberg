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
		return field.isValid( item, field.elements );
	} );
}
