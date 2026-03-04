/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

type PaginationInfo = {
	totalItems: number;
	totalPages: number;
	infiniteScrollHandler?: () => void;
};

export default function useData< Item >(
	data: Item[],
	isLoading: boolean | undefined,
	paginationInfo: PaginationInfo
): {
	data: Item[];
	paginationInfo: PaginationInfo;
	hasInitiallyLoaded: boolean;
} {
	const previousDataRef = useRef< Item[] >( data );
	const previousPaginationInfoRef =
		useRef< PaginationInfo >( paginationInfo );
	const [ hasInitiallyLoaded, setHasInitiallyLoaded ] = useState(
		! isLoading
	);
	useEffect( () => {
		if ( ! isLoading ) {
			previousDataRef.current = data;
			previousPaginationInfoRef.current = paginationInfo;
			setHasInitiallyLoaded( true );
		}
	}, [ data, isLoading, paginationInfo ] );
	return {
		data:
			isLoading && previousDataRef.current?.length
				? previousDataRef.current
				: data,
		paginationInfo:
			isLoading && previousDataRef.current?.length
				? previousPaginationInfoRef.current
				: paginationInfo,
		hasInitiallyLoaded,
	};
}
