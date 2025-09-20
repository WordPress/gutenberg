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
} from '../types';
import {
	OPERATOR_IS_ALL,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_NOT_ALL,
} from '../constants';

// Sort arrays by length, then alphabetically by joined string
function sort( valueA: any, valueB: any, direction: SortDirection ) {
	const arrA = Array.isArray( valueA ) ? valueA : [];
	const arrB = Array.isArray( valueB ) ? valueB : [];
	if ( arrA.length !== arrB.length ) {
		return direction === 'asc'
			? arrA.length - arrB.length
			: arrB.length - arrA.length;
	}

	const joinedA = arrA.join( ',' );
	const joinedB = arrB.join( ',' );
	return direction === 'asc'
		? joinedA.localeCompare( joinedB )
		: joinedB.localeCompare( joinedA );
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	const value = field.getValue( { item } ) || [];

	// If field has children, render as table
	if ( field.children && field.children.length > 0 ) {
		if ( ! Array.isArray( value ) || value.length === 0 ) {
			return null;
		}

		return (
			<div className="dataviews-array-table">
				<table>
					<thead>
						<tr>
							{ field.children.map( ( child ) => (
								<th key={ child.id }>
									{ child.label || child.id }
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ value.map( ( row, index ) => (
							<tr key={ index }>
								{ field.children!.map( ( child ) => (
									<td key={ child.id }>
										{ row[ child.id ] || '' }
									</td>
								) ) }
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		);
	}

	// Default behavior for simple arrays
	return value.join( ', ' );
}

const arrayFieldType: FieldTypeDefinition< any > = {
	sort,
	isValid: {
		custom: ( item: any, field: NormalizedField< any > ) => {
			const value = field.getValue( { item } );

			if (
				! [ undefined, '', null ].includes( value ) &&
				! Array.isArray( value )
			) {
				return __( 'Value must be an array.' );
			}

			// For arrays with children, allow objects. Otherwise, only strings.
			if ( field.children && field.children.length > 0 ) {
				if (
					! value.every(
						( v: any ) => typeof v === 'object' && v !== null
					)
				) {
					return __(
						'Every value must be an object when using children fields.'
					);
				}
			} else if ( ! value.every( ( v: any ) => typeof v === 'string' ) ) {
				return __( 'Every value must be a string.' );
			}

			return null;
		},
	},
	Edit: 'array', // Use array control by default, but this will be overridden by getControl logic
	render,
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

export default arrayFieldType;
