/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	FieldType,
	NormalizedField,
	Operator,
	SortDirection,
} from '../types';
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
import { getControl } from '../dataform-controls';
import hasElements from './utils/has-elements';
import getValueFromId from './utils/get-value-from-id';
import setValueFromId from './utils/set-value-from-id';
import getFilterBy from './utils/get-filter-by';

function normalizeField< Item >(
	field: Field< Item >
): NormalizedField< Item > {
	const getValue = field.getValue || getValueFromId( field.id );
	const setValue = field.setValue || setValueFromId( field.id );

	const isValid = {
		elements: true,
		custom: () => null,
	};

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

	const render = ( {
		item,
		field: normalizedField,
	}: DataViewRenderFieldProps< Item > ) => {
		return normalizedField.hasElements ? (
			<RenderFromElements item={ item } field={ normalizedField } />
		) : (
			normalizedField.getValue( { item } )
		);
	};

	const defaultOperators: Operator[] = [ OPERATOR_IS, OPERATOR_IS_NOT ];
	const validOperators: Operator[] = ALL_OPERATORS;

	return {
		id: field.id,
		// type — it does not have a type
		label: field.label || field.id,
		header: field.header || field.label || field.id,
		description: field.description,
		placeholder: field.placeholder,
		getValue,
		setValue,
		elements: field.elements,
		getElements: field.getElements,
		hasElements: hasElements( field ),
		render: field.render ?? render,
		Edit: getControl( field, null ),
		sort: field.sort ?? sort,
		isValid: {
			...isValid,
			...field.isValid,
		},
		isVisible: field.isVisible,
		enableSorting: field.enableSorting ?? true,
		enableGlobalSearch: field.enableGlobalSearch ?? false,
		enableHiding: field.enableHiding ?? true,
		readOnly: field.readOnly ?? false,
		filterBy: getFilterBy( field, defaultOperators, validOperators ),
		format: {},
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
): ( field: Field< Item > ) => NormalizedField< Item > {
	if ( 'email' === type ) {
		return email;
	}

	if ( 'integer' === type ) {
		return integer;
	}

	if ( 'number' === type ) {
		return number;
	}

	if ( 'text' === type ) {
		return text;
	}

	if ( 'datetime' === type ) {
		return datetime;
	}

	if ( 'date' === type ) {
		return date;
	}

	if ( 'boolean' === type ) {
		return boolean;
	}

	if ( 'media' === type ) {
		return media;
	}

	if ( 'array' === type ) {
		return array;
	}

	if ( 'password' === type ) {
		return password;
	}

	if ( 'telephone' === type ) {
		return telephone;
	}

	if ( 'color' === type ) {
		return color;
	}

	if ( 'url' === type ) {
		return url;
	}

	// This is a fallback for fields that don't provide a type.
	// It can be removed when the field.type is mandatory.
	return normalizeField;
}
