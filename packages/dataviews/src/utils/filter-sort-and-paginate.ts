/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { OPERATOR_IS_NOT_ALL } from '../constants';
import normalizeFields from '../field-types';
import type { Field, Operator, View } from '../types';

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

const EMPTY_ARRAY: [] = [];

/**
 * Applies the filtering, sorting and pagination to the raw data based on the view configuration.
 *
 * @param data   Raw data.
 * @param view   View config.
 * @param fields Fields config.
 *
 * @return Filtered, sorted and paginated data.
 */
export default function filterSortAndPaginate< Item >(
	data: Item[],
	view: View,
	fields: Field< Item >[]
): {
	data: Item[];
	paginationInfo: { totalItems: number; totalPages: number };
} {
	if ( ! data ) {
		return {
			data: EMPTY_ARRAY,
			paginationInfo: { totalItems: 0, totalPages: 0 },
		};
	}
	const _fields = normalizeFields( fields );
	let filteredData = [ ...data ];
	// Handle global search.
	if ( view.search ) {
		const normalizedSearch = normalizeSearchInput( view.search );
		filteredData = filteredData.filter( ( item ) => {
			return _fields
				.filter( ( field ) => field.enableGlobalSearch )
				.some( ( field ) => {
					const fieldValue = field.getValue( { item } );
					const values = Array.isArray( fieldValue )
						? fieldValue
						: [ fieldValue ];
					return values.some( ( value ) =>
						normalizeSearchInput( String( value ) ).includes(
							normalizedSearch
						)
					);
				} );
		} );
	}

	if ( view.filters && view.filters?.length > 0 ) {
		view.filters.forEach( ( filter ) => {
			const field = _fields.find(
				( _field ) => _field.id === filter.field
			);
			if ( field ) {
				// Show deprecation warning for `isNotAll` operator.
				// We still handle this by mapping it to `isNone` in `getFilter`.
				if ( filter.operator === OPERATOR_IS_NOT_ALL ) {
					deprecated( "The 'isNotAll' filter operator", {
						since: '7.0',
						alternative: "'isNone'",
					} );
				}

				const handler = field.filter[ filter.operator as Operator ];
				if ( handler ) {
					filteredData = filteredData.filter( ( item ) =>
						handler( item, field, filter.value )
					);
				}
			}
		} );
	}

	// Handle sorting.
	const sortByField = view.sort?.field
		? _fields.find( ( field ) => {
				return (
					field.enableSorting !== false &&
					field.id === view.sort?.field
				);
		  } )
		: null;
	const groupByField = view.groupBy?.field
		? _fields.find( ( field ) => {
				return (
					field.enableSorting !== false &&
					field.id === view.groupBy?.field
				);
		  } )
		: null;
	if ( sortByField || groupByField ) {
		filteredData.sort( ( a, b ) => {
			if ( groupByField ) {
				const groupCompare = groupByField.sort(
					a,
					b,
					view.groupBy?.direction ?? 'asc'
				);

				// If items are in different groups, return the group comparison result.
				// Otherwise, fall back to sorting by the sort field.
				if ( groupCompare !== 0 ) {
					return groupCompare;
				}
			}

			if ( sortByField ) {
				return sortByField.sort( a, b, view.sort?.direction ?? 'desc' );
			}

			return 0;
		} );
	}

	// Handle pagination.
	let totalItems = filteredData.length;
	let totalPages = 1;
	if ( view.page !== undefined && view.perPage !== undefined ) {
		const start = ( view.page - 1 ) * view.perPage;
		totalItems = filteredData?.length || 0;
		totalPages = Math.ceil( totalItems / view.perPage );
		filteredData = filteredData?.slice( start, start + view.perPage );
	}

	return {
		data: filteredData,
		paginationInfo: {
			totalItems,
			totalPages,
		},
	};
}
