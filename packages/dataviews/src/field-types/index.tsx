/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	FieldType,
	SortDirection,
} from '../types';
import type { TypeProvidedProps } from '../types/private';
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
import RenderFromElements from './utils/render-from-elements';
import { ALL_OPERATORS, OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';
import getValueFromId from './utils/get-value-from-id';

const render = ( {
	item,
	field: normalizedField,
}: DataViewRenderFieldProps< any > ) => {
	return normalizedField.hasElements ? (
		<RenderFromElements item={ item } field={ normalizedField } />
	) : (
		normalizedField.getValue( { item } )
	);
};

function normalizeField< Item >(
	field: Field< Item >
): TypeProvidedProps< Item > {
	const getValue = field.getValue || getValueFromId( field.id );

	const sort = ( a: any, b: any, direction: SortDirection ) => {
		const valueA = getValue( { item: a } );
		const valueB = getValue( { item: b } );

		if ( typeof valueA === 'number' && typeof valueB === 'number' ) {
			return direction === 'asc' ? valueA - valueB : valueB - valueA;
		}

		return direction === 'asc'
			? valueA.localeCompare( valueB )
			: valueB.localeCompare( valueA );
	};

	return {
		// type: no type for this
		render,
		Edit: null,
		sort,
		isValid: {
			elements: true,
			custom: () => null,
		},
		enableSorting: true,
		enableGlobalSearch: false,
		defaultOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
		validOperators: ALL_OPERATORS,
		getFormat: () => ( {} ),
	};
}

/**
 *
 * @param {FieldType} type The field type definition to get.
 *
 * @return A field type definition.
 */
export default function getNormalizeFieldFunction< Item >(
	type?: FieldType
): ( field: Field< Item > ) => TypeProvidedProps< Item > {
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
			return normalizeField;
	}
}
