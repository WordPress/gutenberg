/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

export default function useDisplayData< Item >(
	data: Item[],
	isLoading: boolean | undefined
): Item[] {
	const previousDataRef = useRef< Item[] >( data );
	useEffect( () => {
		if ( ! isLoading ) {
			previousDataRef.current = data;
		}
	}, [ data, isLoading ] );
	return isLoading && previousDataRef.current?.length
		? previousDataRef.current
		: data;
}
