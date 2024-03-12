/**
 * WordPress dependencies
 */
import { Children, Fragment } from '@wordpress/element';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	ALL_OPERATORS,
	OPERATOR_IS,
	OPERATOR_IS_NOT,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
} from './constants';
import { unlock } from './lock-unlock';

const { DropdownMenuSeparatorV2: DropdownMenuSeparator } = unlock(
	componentsPrivateApis
);

/**
 * Helper util to sort data by text fields, when sorting is done client side.
 *
 * @param {Object}   params            Function params.
 * @param {Object[]} params.data       Data to sort.
 * @param {Object}   params.view       Current view object.
 * @param {Object[]} params.fields     Array of available fields.
 * @param {string[]} params.textFields Array of the field ids to sort.
 *
 * @return {Object[]} Sorted data.
 */
export const sortByTextFields = ( { data, view, fields, textFields } ) => {
	const sortedData = [ ...data ];
	const fieldId = view.sort.field;
	if ( textFields.includes( fieldId ) ) {
		const fieldToSort = fields.find( ( field ) => {
			return field.id === fieldId;
		} );
		sortedData.sort( ( a, b ) => {
			const valueA = fieldToSort.getValue( { item: a } ) ?? '';
			const valueB = fieldToSort.getValue( { item: b } ) ?? '';
			return view.sort.direction === 'asc'
				? valueA.localeCompare( valueB )
				: valueB.localeCompare( valueA );
		} );
	}
	return sortedData;
};

/**
 * Helper util to get the paginated data and the paginateInfo needed,
 * when pagination is done client side.
 *
 * @param {Object}   params      Function params.
 * @param {Object[]} params.data Available data.
 * @param {Object}   params.view Current view object.
 *
 * @return {Object} Paginated data and paginationInfo.
 */
export function getPaginationResults( { data, view } ) {
	const start = ( view.page - 1 ) * view.perPage;
	const totalItems = data?.length || 0;
	data = data?.slice( start, start + view.perPage );
	return {
		data,
		paginationInfo: {
			totalItems,
			totalPages: Math.ceil( totalItems / view.perPage ),
		},
	};
}

export const sanitizeOperators = ( field ) => {
	let operators = field.filterBy?.operators;

	// Assign default values.
	if ( ! operators || ! Array.isArray( operators ) ) {
		operators = [ OPERATOR_IS_ANY, OPERATOR_IS_NONE ];
	}

	// Transform legacy in, notIn operators to is, isNot.
	// To be removed in the future.
	if ( operators.includes( 'in' ) ) {
		operators = operators.filter( ( operator ) => operator !== 'is' );
		operators.push( 'is' );
	}
	if ( operators.includes( 'notIn' ) ) {
		operators = operators.filter( ( operator ) => operator !== 'notIn' );
		operators.push( 'isNot' );
	}

	// Make sure only valid operators are used.
	operators = operators.filter( ( operator ) =>
		ALL_OPERATORS.includes( operator )
	);

	// Do not allow mixing single & multiselection operators.
	// Remove multiselection operators if any of the single selection ones is present.
	if (
		operators.includes( OPERATOR_IS ) ||
		operators.includes( OPERATOR_IS_NOT )
	) {
		operators = operators.filter( ( operator ) =>
			[ OPERATOR_IS, OPERATOR_IS_NOT ].includes( operator )
		);
	}

	return operators;
};

export function WithDropDownMenuSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}
