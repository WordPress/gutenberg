/**
 * Internal dependencies
 */
import type {
	Field,
	FieldTypeName,
	NormalizedField,
	SortDirection,
} from '../types';
import type { FieldType } from '../types/private';
import { getControl } from '../dataform-controls';
import getFilterBy from './utils/get-filter-by';
import getValueFromId from './utils/get-value-from-id';
import hasElements from './utils/has-elements';
import setValueFromId from './utils/set-value-from-id';
import { default as email } from './email';
import { default as integer } from './integer';
import { default as number } from './number';
import { default as text } from './text';
import { default as datetime } from './datetime';
import { default as date } from './date';
import { default as boolean } from './boolean';
import { default as media } from './media';
import { default as array } from './array';
import { default as password } from './password';
import { default as telephone } from './telephone';
import { default as color } from './color';
import { default as url } from './url';
import { default as noType } from './no-type';
import getIsValid from './utils/get-is-valid';
import getFormat from './utils/get-format';

/**
 *
 * @param {FieldTypeName} type The field type definition to get.
 *
 * @return A field type definition.
 */
function getFieldTypeByName< Item >( type?: FieldTypeName ): FieldType< Item > {
	const found = [
		email,
		integer,
		number,
		text,
		datetime,
		date,
		boolean,
		media,
		array,
		password,
		telephone,
		color,
		url,
	].find( ( fieldType ) => fieldType?.type === type );

	if ( !! found ) {
		return found;
	}

	// This is a fallback for fields that don't provide a type.
	// It can be removed when/if the field.type becomes mandatory.
	return noType;
}

/**
 * Apply default values and normalize the fields config.
 *
 * @param fields Fields config.
 * @return Normalized fields config.
 */
export default function normalizeFields< Item >(
	fields: Field< Item >[]
): NormalizedField< Item >[] {
	return fields.map( ( field ) => {
		const fieldType = getFieldTypeByName< Item >( field.type );

		const getValue = field.getValue || getValueFromId( field.id );
		const sort = function ( a: any, b: any, direction: SortDirection ) {
			const aValue = getValue( { item: a } );
			const bValue = getValue( { item: b } );
			return field.sort
				? field.sort( aValue, bValue, direction )
				: fieldType.sort( aValue, bValue, direction );
		};

		return {
			id: field.id,
			label: field.label || field.id,
			header: field.header || field.label || field.id,
			description: field.description,
			placeholder: field.placeholder,
			getValue,
			setValue: field.setValue || setValueFromId( field.id ),
			elements: field.elements,
			getElements: field.getElements,
			hasElements: hasElements( field ),
			isVisible: field.isVisible,
			enableHiding: field.enableHiding ?? true,
			readOnly: field.readOnly ?? false,
			// The type provides defaults for the following props
			type: fieldType.type,
			render: field.render ?? fieldType.render,
			Edit: getControl( field, fieldType.Edit ),
			sort,
			enableSorting: field.enableSorting ?? fieldType.enableSorting,
			enableGlobalSearch:
				field.enableGlobalSearch ?? fieldType.enableGlobalSearch,
			isValid: getIsValid( field, fieldType ),
			filterBy: getFilterBy(
				field,
				fieldType.defaultOperators,
				fieldType.validOperators
			),
			format: getFormat( field, fieldType ),
			getValueFormatted:
				field.getValueFormatted ?? fieldType.getValueFormatted,
		};
	} );
}
