/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

export default function useData< Item >(
	data: Item[],
	isLoading: boolean | undefined
): { data: Item[]; hasInitiallyLoaded: boolean } {
	const previousDataRef = useRef< Item[] >( data );
	const [ hasInitiallyLoaded, setHasInitiallyLoaded ] = useState(
		! isLoading
	);
	useEffect( () => {
		if ( ! isLoading ) {
			previousDataRef.current = data;
			setHasInitiallyLoaded( true );
		}
	}, [ data, isLoading ] );
	return {
		data:
			isLoading && previousDataRef.current?.length
				? previousDataRef.current
				: data,
		hasInitiallyLoaded,
	};
}
