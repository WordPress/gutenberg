/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	SortDirection,
	FieldTypeDefinition,
	NormalizedField,
	FieldType,
} from '../types';
import {
	OPERATOR_IS_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT_ALL,
} from '../constants';
import textFieldType from './text';

const sortText = ( valueA: any, valueB: any, direction: SortDirection ) => {
	const arrA = Array.isArray( valueA ) ? valueA : [];
	const arrB = Array.isArray( valueB ) ? valueB : [];
	if ( arrA.length !== arrB.length ) {
		return direction === 'asc'
			? arrA.length - arrB.length
			: arrB.length - arrA.length;
	}

	const joinedA = arrA.join( ',' );
	const joinedB = arrB.join( ',' );
	return textFieldType.sort( joinedA, joinedB, direction );
};

const sortObject = () => {
	// We don't know how to sort the Field objects.
	return 0;
};

function renderText( { item, field }: DataViewRenderFieldProps< any > ) {
	return ( field.getValue( { item } ) || [] ).join( ',' );
}

function renderObject( { item, field }: DataViewRenderFieldProps< any > ) {
	const value = field.getValue( { item } ) || [];

	if ( ! Array.isArray( value ) || value.length === 0 ) {
		return null;
	}

	const children = field.children as NormalizedField<
		Record< string, unknown >
	>[];

	return (
		<div className="dataviews-array-list">
			<ul>
				{ value.map( ( row, index ) => (
					<li key={ index }>
						{ children.map( ( child, childIndex ) => (
							<span key={ child.id }>
								{ childIndex > 0 && ', ' }
								<strong>{ child.label }:</strong>{ ' ' }
								<child.render item={ row } field={ child } />
							</span>
						) ) }
					</li>
				) ) }
			</ul>
		</div>
	);
}

const isValidText = {
	custom: ( item: any, field: NormalizedField< any > ) => {
		const value = field.getValue( { item } );

		if (
			! [ undefined, '', null ].includes( value ) &&
			! Array.isArray( value )
		) {
			return __( 'Value must be a list.' );
		}

		if ( ! value.every( ( v: any ) => typeof v === 'string' ) ) {
			return __( 'Every value in the list must be a string.' );
		}

		for ( const v of value ) {
			if ( field?.elements ) {
				const validValues = field.elements.map( ( f ) => f.value );
				if ( ! validValues.includes( v ) ) {
					return __(
						'Every value in the list must be one of the elements.'
					);
				}
			}
		}

		return null;
	},
};

const isValidObject = {
	custom: ( item: any, field: NormalizedField< any > ) => {
		const value = field.getValue( { item } );

		if (
			! [ undefined, '', null ].includes( value ) &&
			! Array.isArray( value )
		) {
			return __( 'Value must be a list.' );
		}

		if (
			! value.every( ( v: any ) => typeof v === 'object' && v !== null )
		) {
			return __( 'Every value in the list must be an object.' );
		}

		if ( field?.elements ) {
			const validValues = field.elements.map( ( f ) => f.value );
			if ( ! value.every( ( v: any ) => validValues.includes( v ) ) ) {
				return __(
					'Every value in the list must be one of the elements.'
				);
			}
		}

		return null;
	},
};

export default function createArray(
	children?: FieldType | Record< string, unknown >[]
): FieldTypeDefinition< any > {
	if ( Array.isArray( children ) ) {
		// Each item of the array is a Field object.
		return {
			sort: sortObject,
			isValid: isValidObject,
			Edit: 'table',
			render: renderObject,
			enableSorting: true,
			filterBy: {
				defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
				validOperators: [
					OPERATOR_IS_ANY,
					OPERATOR_IS_NONE,
					OPERATOR_IS_ALL,
					OPERATOR_IS_NOT_ALL,
				],
			},
		};
	}

	// The fallback assumes the items in the array are strings.
	// In the future, we'll add support for any other FieldType
	// (text, number, date, color, etc.).
	return {
		sort: sortText,
		isValid: isValidText,
		Edit: 'array',
		render: renderText,
		enableSorting: true,
		filterBy: {
			defaultOperators: [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ],
			validOperators: [
				OPERATOR_IS_ANY,
				OPERATOR_IS_NONE,
				OPERATOR_IS_ALL,
				OPERATOR_IS_NOT_ALL,
			],
		},
	};
}
