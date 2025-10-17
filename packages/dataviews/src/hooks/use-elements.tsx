/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Option } from '../types';

const EMPTY_ARRAY: Option[] = [];

export default function useElements( {
	elements,
	getElements,
}: {
	elements?: Option[];
	getElements?: () => Promise< Option[] >;
} ) {
	const staticElements =
		Array.isArray( elements ) && elements.length > 0
			? elements
			: EMPTY_ARRAY;
	const [ records, setRecords ] = useState< Option[] >( staticElements );
	const [ isLoading, setIsLoading ] = useState( false );

	useEffect( () => {
		if ( ! getElements ) {
			setRecords( staticElements );
			return;
		}

		setIsLoading( true );
		getElements()
			.then( ( fetchedElements ) => {
				const dynamicElements =
					Array.isArray( fetchedElements ) &&
					fetchedElements.length > 0
						? fetchedElements
						: staticElements;
				setRecords( dynamicElements );
			} )
			.catch( () => {
				setRecords( staticElements );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [ getElements, staticElements ] );

	return {
		elements: records,
		isLoading,
	};
}
