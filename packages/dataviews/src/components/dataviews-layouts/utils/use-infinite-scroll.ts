/**
 * WordPress dependencies
 */
import { useContext, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../../dataviews-context';

/**
 * Hook to set up an IntersectionObserver for infinite scroll items.
 * Observes the element and triggers the callback when the item becomes visible.
 *
 * @param elementRef - Ref to the DOM element to observe.
 * @param posinset   - The position of the item in the set (1-based index).
 */
export function useIntersectionObserver(
	elementRef: React.RefObject< HTMLElement | null >,
	posinset: number | undefined
) {
	const { intersectionObserver } = useContext( DataViewsContext );

	useEffect( () => {
		const element = elementRef.current;
		if ( ! element || posinset === undefined || ! intersectionObserver ) {
			return;
		}

		intersectionObserver.observe( element );

		return () => {
			intersectionObserver.unobserve( element );
		};
	}, [ elementRef, intersectionObserver, posinset ] );
}

/**
 * Hook to calculate the number of placeholder items needed for the first row
 * in an infinite scroll grid layout.
 *
 * When items are loaded starting from a position other than 1, placeholders
 * are needed to maintain proper grid alignment.
 *
 * @param data             - The array of data items.
 * @param isInfiniteScroll - Whether infinite scroll is enabled.
 * @param gridColumns      - The number of columns in the grid.
 * @return The number of placeholder items needed.
 */
export function usePlaceholdersNeeded< Item >(
	data: Item[],
	isInfiniteScroll: boolean,
	gridColumns: number
): number {
	const hasData = !! data?.length;
	const firstItemPosition =
		hasData && isInfiniteScroll
			? ( data[ 0 ] as { position?: number } ).position
			: undefined;

	return firstItemPosition && gridColumns
		? ( firstItemPosition - 1 ) % gridColumns
		: 0;
}
