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
export function normalizeFields< Item, Name extends string >(
	fields: Field< Item, Name >[]
): NormalizedField< Item >[] {
	return fields.map( normalizeField );
}

function normalizeField< Item, Name extends string >(
	field: Field< Item, Name >
): NormalizedField< Item > {
	const fieldTypeDefinition = getFieldTypeDefinition( field.type );

	const getValue =
		field.getValue ||
		( ( { item }: { item: ItemRecord< Name > } ) => item[ field.id ] );

	const sort =
		field.sort ??
		function sort( a, b, direction ) {
			return fieldTypeDefinition.sort(
				getValue( { item: a } ),
				getValue( { item: b } ),
				direction
			);
		};

	const isValid =
		field.isValid ??
		function isValid( item, context ) {
			return fieldTypeDefinition.isValid( getValue( { item } ), context );
		};

	const Edit = field.Edit || fieldTypeDefinition.Edit;

	return {
		...field,
		label: field.label || field.id,
		getValue,
		render: field.render || getValue,
		sort,
		isValid,
		Edit,
	};
}
