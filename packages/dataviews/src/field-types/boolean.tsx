/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	NormalizedField,
	SortDirection,
} from '../types';
import type { FieldType } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import { OPERATOR_IS, OPERATOR_IS_NOT } from '../constants';
import isValidElements from './utils/is-valid-elements';
import isValidRequiredForBool from './utils/is-valid-required-for-bool';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	if ( field.hasElements ) {
		return <RenderFromElements item={ item } field={ field } />;
	}

	if ( field.getValue( { item } ) === true ) {
		return __( 'True' );
	}

	if ( field.getValue( { item } ) === false ) {
		return __( 'False' );
	}

	return null;
}

function isValidCustom< Item >( item: Item, field: NormalizedField< Item > ) {
	const value = field.getValue( { item } );

	if (
		! [ undefined, '', null ].includes( value ) &&
		! [ true, false ].includes( value )
	) {
		return __( 'Value must be true, false, or undefined' );
	}

	return null;
}

const sort = ( a: any, b: any, direction: SortDirection ) => {
	const boolA = Boolean( a );
	const boolB = Boolean( b );

	if ( boolA === boolB ) {
		return 0;
	}

	// In ascending order, false comes before true
	if ( direction === 'asc' ) {
		return boolA ? 1 : -1;
	}

	// In descending order, true comes before false
	return boolA ? -1 : 1;
};

export default {
	type: 'boolean',
	render,
	Edit: 'checkbox',
	sort,
	validate: {
		required: isValidRequiredForBool,
		elements: isValidElements,
		custom: isValidCustom,
	},
	enableSorting: true,
	enableGlobalSearch: false,
	defaultOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
	validOperators: [ OPERATOR_IS, OPERATOR_IS_NOT ],
	getFormat: () => ( {} ),
} satisfies FieldType< any >;
