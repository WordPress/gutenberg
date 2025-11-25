/**
 * Internal dependencies
 */
import type {
	Field,
	FieldType,
	NormalizedField,
	SortDirection,
} from '../types';
import type { TypeProvidedProps } from '../types/private';
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

/**
 *
 * @param {FieldType} type The field type definition to get.
 *
 * @return A field type definition.
 */
function getDefaultProperties< Item >(
	type?: FieldType
): TypeProvidedProps< Item > {
	switch ( type ) {
		case 'email':
			return email;
		case 'integer':
			return integer;
		case 'number':
			return number;
		case 'text':
			return text;
		case 'datetime':
			return datetime;
		case 'date':
			return date;
		case 'boolean':
			return boolean;
		case 'media':
			return media;
		case 'array':
			return array;
		case 'password':
			return password;
		case 'telephone':
			return telephone;
		case 'color':
			return color;
		case 'url':
			return url;
		// This is a fallback for fields that don't provide a type.
		// It can be removed when the field.type is mandatory.
		default:
			return noType;
	}
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
		const defaultProps = getDefaultProperties< Item >( field.type );

		const getValue = field.getValue || getValueFromId( field.id );
		const sort = function ( a: any, b: any, direction: SortDirection ) {
			const aValue = getValue( { item: a } );
			const bValue = getValue( { item: b } );
			return field.sort
				? field.sort( aValue, bValue, direction )
				: defaultProps.sort( aValue, bValue, direction );
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
			type: defaultProps.type,
			render: field.render ?? defaultProps.render,
			Edit: getControl( field, defaultProps.Edit ),
			sort,
			enableSorting: field.enableSorting ?? defaultProps.enableSorting,
			enableGlobalSearch:
				field.enableGlobalSearch ?? defaultProps.enableGlobalSearch,
			isValid: {
				...defaultProps.isValid,
				...field.isValid,
			},
			filterBy: getFilterBy(
				field,
				defaultProps.defaultOperators,
				defaultProps.validOperators
			),
			format: defaultProps.getFormat( field ),
		};
	} );
}
