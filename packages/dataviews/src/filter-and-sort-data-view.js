/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * Internal dependencies
 */
import {
	OPERATOR_IS,
	OPERATOR_IS_NOT,
	OPERATOR_IS_NONE,
	OPERATOR_IS_ANY,
	OPERATOR_IS_ALL,
	OPERATOR_IS_NOT_ALL,
} from './constants';
import { normalizeFields } from './normalize-fields';

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

const EMPTY_ARRAY = [];

/**
 * Applies the filtering, sorting and pagination to the raw data based on the view configuration.
 *
 * @param {any[]}    data   Raw data.
 * @param {Object}   view   View config.
 * @param {Object[]} fields Fields config.
 *
 * @return {Object} { data: any[], paginationInfo: { totalItems: number, totalPages: number } }
 */
export function filterSortAndPaginate( data, view, fields ) {
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
				.map( ( field ) => {
					return normalizeSearchInput( field.getValue( { item } ) );
				} )
				.some( ( field ) => field.includes( normalizedSearch ) );
		} );
	}

	if ( view.filters.length > 0 ) {
		view.filters.forEach( ( filter ) => {
			const field = _fields.find(
				( _field ) => _field.id === filter.field
			);
			if (
				filter.operator === OPERATOR_IS_ANY &&
				filter?.value?.length > 0
			) {
				filteredData = filteredData.filter( ( item ) => {
					const fieldValue = field.getValue( { item } );
					if ( Array.isArray( fieldValue ) ) {
						return filter.value.some( ( filterValue ) =>
							fieldValue.includes( filterValue )
						);
					} else if ( typeof fieldValue === 'string' ) {
						return filter.value.includes( fieldValue );
					}
					return false;
				} );
			} else if (
				filter.operator === OPERATOR_IS_NONE &&
				filter?.value?.length > 0
			) {
				filteredData = filteredData.filter( ( item ) => {
					const fieldValue = field.getValue( { item } );
					if ( Array.isArray( fieldValue ) ) {
						return ! filter.value.some( ( filterValue ) =>
							fieldValue.includes( filterValue )
						);
					} else if ( typeof fieldValue === 'string' ) {
						return ! filter.value.includes( fieldValue );
					}
					return false;
				} );
			} else if (
				filter.operator === OPERATOR_IS_ALL &&
				filter?.value?.length > 0
			) {
				filteredData = filteredData.filter( ( item ) => {
					return filter.value.every( ( value ) => {
						return field.getValue( { item } ).includes( value );
					} );
				} );
			} else if (
				filter.operator === OPERATOR_IS_NOT_ALL &&
				filter?.value?.length > 0
			) {
				filteredData = filteredData.filter( ( item ) => {
					return filter.value.every( ( value ) => {
						return ! field.getValue( { item } ).includes( value );
					} );
				} );
			} else if ( filter.operator === OPERATOR_IS ) {
				filteredData = filteredData.filter( ( item ) => {
					return filter.value === field.getValue( { item } );
				} );
			} else if ( filter.operator === OPERATOR_IS_NOT ) {
				filteredData = filteredData.filter( ( item ) => {
					return filter.value !== field.getValue( { item } );
				} );
			}
		} );
	}

	// Handle sorting.
	if ( view.sort ) {
		const fieldId = view.sort.field;
		const fieldToSort = _fields.find( ( field ) => {
			return field.id === fieldId;
		} );
		filteredData.sort( ( a, b ) => {
			const valueA = fieldToSort.getValue( { item: a } ) ?? '';
			const valueB = fieldToSort.getValue( { item: b } ) ?? '';
			return view.sort.direction === 'asc'
				? valueA.localeCompare( valueB )
				: valueB.localeCompare( valueA );
		} );
	}

	// Handle pagination.
	const hasPagination = view.page && view.perPage;
	const start = hasPagination ? ( view.page - 1 ) * view.perPage : 0;
	const totalItems = filteredData?.length || 0;
	const totalPages = hasPagination
		? Math.ceil( totalItems / view.perPage )
		: 1;
	filteredData = hasPagination
		? filteredData?.slice( start, start + view.perPage )
		: filteredData;

	return {
		data: filteredData,
		paginationInfo: {
			totalItems,
			totalPages,
		},
	};
}
