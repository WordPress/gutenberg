/**
 * Internal dependencies
 */
import getFieldTypeDefinition from './field-types';
import type {
	CombinedFormField,
	Field,
	NormalizedField,
	NormalizedCombinedFormField,
} from './types';
import { getControl } from './dataform-controls';
import DataFormCombinedEdit from './components/dataform-combined-edit';

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
			field.getValue || ( ( { item } ) => ( item as any )[ field.id ] );

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
				return fieldTypeDefinition.isValid(
					getValue( { item } ),
					context
				);
			};

		const Edit = getControl( field, fieldTypeDefinition );

		const renderFromElements = ( { item }: { item: Item } ) => {
			const value = getValue( { item } );
			return (
				field?.elements?.find( ( element ) => element.value === value )
					?.label || getValue( { item } )
			);
		};

		const render =
			field.render || ( field.elements ? renderFromElements : getValue );

		return {
			...field,
			label: field.label || field.id,
			header: field.header || field.label || field.id,
			getValue,
			render,
			sort,
			isValid,
			Edit,
			enableHiding: field.enableHiding ?? true,
			enableSorting: field.enableSorting ?? true,
		};
	} );
}

/**
 * Apply default values and normalize the fields config.
 *
 * @param combinedFields combined field list.
 * @param fields         Fields config.
 * @return Normalized fields config.
 */
export function normalizeCombinedFields< Item >(
	combinedFields: CombinedFormField< Item >[],
	fields: Field< Item >[]
): NormalizedCombinedFormField< Item >[] {
	return combinedFields.map( ( combinedField ) => {
		return {
			...combinedField,
			Edit: DataFormCombinedEdit,
			fields: normalizeFields(
				combinedField.children
					.map( ( fieldId ) =>
						fields.find( ( { id } ) => id === fieldId )
					)
					.filter( ( field ): field is Field< Item > => !! field )
			),
		};
	} );
}
