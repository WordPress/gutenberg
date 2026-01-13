/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	Option,
	GetElementsQuery,
	GetElementsResult,
	GetElementsPaginationInfo,
} from '../types';

const EMPTY_ARRAY: Option[] = [];
const EMPTY_QUERY = {};

export default function useElements( {
	elements,
	getElements,
	query = EMPTY_QUERY,
}: {
	elements?: Option[];
	getElements?: ( query?: GetElementsQuery ) => Promise< GetElementsResult >;
	query?: GetElementsQuery;
} ) {
	const [ records, setRecords ] = useState< Option[] >( EMPTY_ARRAY );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ paginationInfo, setPaginationInfo ] =
		useState< GetElementsPaginationInfo >( {
			totalPages: 1,
		} );

	useEffect( () => {
		// Compute static elements from current elements prop
		const currentElements =
			Array.isArray( elements ) && elements.length > 0
				? elements
				: EMPTY_ARRAY;

		if ( ! getElements ) {
			setRecords( currentElements );
			setPaginationInfo( {
				totalPages: 1,
			} );
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		getElements( query )
			.then( ( result ) => {
				if ( ! cancelled ) {
					const fetchedElements =
						Array.isArray( result.elements ) &&
						!! result.elements.length
							? result.elements
							: EMPTY_ARRAY;
					setRecords( fetchedElements );
					setPaginationInfo( {
						totalPages: result.paginationInfo?.totalPages ?? 1,
					} );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setRecords( currentElements );
					setPaginationInfo( {
						totalPages: 1,
					} );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ getElements, elements, query ] );

	return {
		elements: records,
		isLoading,
		paginationInfo,
	};
}
