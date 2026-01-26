/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	Option,
	GetElementsResult,
	GetElementsPaginationInfo,
} from '../types';

const EMPTY_ARRAY: Option[] = [];

export default function useElements( {
	elements,
	getElements,
}: {
	elements?: Option[];
	getElements?: () => Promise< GetElementsResult >;
} ) {
	const [ records, setRecords ] = useState< Option[] >( EMPTY_ARRAY );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ paginationInfo, setPaginationInfo ] =
		useState< GetElementsPaginationInfo >( {
			totalItems: elements?.length || 0,
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
				totalItems: currentElements.length,
				totalPages: 1,
			} );
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		getElements()
			.then( ( result ) => {
				if ( ! cancelled ) {
					const fetchedElements =
						Array.isArray( result.elements ) &&
						!! result.elements.length
							? result.elements
							: EMPTY_ARRAY;
					setRecords( fetchedElements );
					setPaginationInfo( {
						totalItems:
							result.paginationInfo?.totalItems ??
							fetchedElements.length,
						totalPages: result.paginationInfo?.totalPages ?? 1,
					} );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setRecords( currentElements );
					setPaginationInfo( {
						totalItems: currentElements.length,
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
	}, [ getElements, elements ] );

	return {
		elements: records,
		isLoading,
		paginationInfo,
	};
}
