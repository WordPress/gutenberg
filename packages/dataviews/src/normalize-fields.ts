/**
 * Internal dependencies
 */
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
		const getValue =
			field.getValue ||
			( ( { item }: { item: ItemRecord } ) => item[ field.id ] );

		return {
			...field,
			label: field.label || field.id,
			getValue,
			render: field.render || getValue,
		};
	} );
}
