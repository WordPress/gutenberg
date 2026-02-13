/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Option } from '../types';

const EMPTY_ARRAY: Option[] = [];

export default function useElements< Item >( {
	elements,
	getElements,
	item,
}: {
	elements?: Option[];
	getElements?: ( args?: { item: Item } ) => Promise< Option[] >;
	item?: Item;
} ) {
	const staticElements =
		Array.isArray( elements ) && elements.length > 0
			? elements
			: EMPTY_ARRAY;
	const [ records, setRecords ] = useState< Option[] >( staticElements );
	const [ isLoading, setIsLoading ] = useState( false );
	const itemRef = useRef( item );
	itemRef.current = item;

	useEffect( () => {
		if ( ! getElements ) {
			setRecords( staticElements );
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		getElements(
			itemRef.current !== undefined
				? { item: itemRef.current }
				: undefined
		)
			.then( ( fetchedElements ) => {
				if ( ! cancelled ) {
					const dynamicElements =
						Array.isArray( fetchedElements ) &&
						fetchedElements.length > 0
							? fetchedElements
							: staticElements;
					setRecords( dynamicElements );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setRecords( staticElements );
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
	}, [ getElements, staticElements ] );

	return {
		elements: records,
		isLoading,
	};
}
