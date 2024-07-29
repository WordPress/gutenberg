/**
 * Internal dependencies
 */
import getFieldTypeDefinition from './field-types';
import type { Field, NormalizedField, ItemRecord } from './types';

/**
 * Apply default values and normalize the fields config.
 *
 * @param fields Fields config.
 * @return Normalized fields config.
 */
export function normalizeFields< Item >(
	fields: Field< Item >[]
): NormalizedField< Item >[] {
	return fields.map( ( field ) => {
		const fieldTypeDefinition = getFieldTypeDefinition( field.type );

		const getValue =
			field.getValue ||
			( ( { item }: { item: ItemRecord } ) => item[ field.id ] );

		const sort = field.sort || fieldTypeDefinition.sort;

		return {
			...field,
			label: field.label || field.id,
			getValue,
			render: field.render || getValue,
			sort,
		};
	} );
}
