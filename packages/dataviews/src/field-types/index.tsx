/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	NormalizedField,
	FieldType,
	FieldTypeDefinition,
	SortDirection,
	Option,
	NormalizedFilter,
} from '../types';
import { default as email } from './email';
import { default as integer } from './integer';
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
import { renderFromElements } from '../utils';
import { ALL_OPERATORS, OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';

/**
 *
 * @param Field The field to get elements for.
 *
 * @return The loading state and elements for the field.
 */
export function useFieldElements( Field: NormalizedField< any > ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ elements, setElements ] = useState< Option[] >(
		Field.elements || []
	);

	useEffect( () => {
		if ( typeof Field.elementsLoader === 'function' ) {
			setIsLoading( true );
			Field.elementsLoader()
				.then( ( resolvedElements ) => {
					setElements( resolvedElements );
				} )
				.finally( () => {
					setIsLoading( false );
				} );
		}
	}, [ Field ] );

	return { isLoading, elements };
}

/**
 *
 * @param Filter The filter to get elements for.
 *
 * @return The loading state and elements for the filter.
 */
export function useFilterElements( Filter: NormalizedFilter ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ elements, setElements ] = useState< Option[] >(
		Filter.elements || []
	);

	useEffect( () => {
		if ( typeof Filter.elementsLoader === 'function' ) {
			setIsLoading( true );
			Filter.elementsLoader()
				.then( ( resolvedElements ) => {
					setElements( resolvedElements );
				} )
				.finally( () => {
					setIsLoading( false );
				} );
		}
	}, [ Filter, Filter.elementsLoader ] );

	return { isLoading, elements };
}

/**
 *
 * @param {FieldType} type The field type definition to get.
 *
 * @return A field type definition.
 */
export default function getFieldTypeDefinition< Item >(
	type?: FieldType
): FieldTypeDefinition< Item > {
	if ( 'email' === type ) {
		return email;
	}

	if ( 'integer' === type ) {
		return integer;
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
	return {
		sort: ( a: any, b: any, direction: SortDirection ) => {
			if ( typeof a === 'number' && typeof b === 'number' ) {
				return direction === 'asc' ? a - b : b - a;
			}

			return direction === 'asc'
				? a.localeCompare( b )
				: b.localeCompare( a );
		},
		isValid: {
			custom: ( item: any, field: NormalizedField< any > ) => {
				if ( field?.elements ) {
					const value = field.getValue( { item } );
					const validValues = field?.elements?.map(
						( f ) => f.value
					);
					if ( ! validValues.includes( value ) ) {
						return __( 'Value must be one of the elements.' );
					}
				}

				return null;
			},
		},
		Edit: null,
		render: ( { item, field }: DataViewRenderFieldProps< Item > ) => {
			return field.elements
				? renderFromElements( { item, field } )
				: field.getValue( { item } );
		},
		enableSorting: true,
		filterBy: {
			defaultOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
			validOperators: ALL_OPERATORS,
		},
	};
}
