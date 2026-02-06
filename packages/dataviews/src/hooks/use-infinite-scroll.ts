/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
} from '@wordpress/element';
import { throttle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { View } from '../types';

type UseInfiniteScrollProps = {
	view: View;
	onChangeView: ( view: View ) => void;
	isLoading: boolean;
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
	containerRef: React.MutableRefObject< HTMLDivElement | null >;
	displayData: unknown[];
	setVisibleEntries?: React.Dispatch< React.SetStateAction< number[] > >;
};

type UseInfiniteScrollResult = {
	intersectionObserverCallback: IntersectionObserverCallback | undefined;
};

export function useInfiniteScroll( {
	view,
	onChangeView,
	isLoading,
	paginationInfo,
	containerRef,
	displayData,
	setVisibleEntries,
}: UseInfiniteScrollProps ): UseInfiniteScrollResult {
	const isLoadingRef = useRef( false );
	// Store the initial batch size calculated from the first startPosition and endPosition
	const initialBatchSizeRef = useRef< number | null >( null );
	// Track scroll position for preservation when prepending items
	const scrollPreservationRef = useRef< {
		scrollHeight: number;
		scrollTop: number;
		isPending: boolean;
		direction: 'up' | 'down' | null;
	} >( { scrollHeight: 0, scrollTop: 0, isPending: false, direction: null } );

	const intersectionObserverCallback: IntersectionObserverCallback =
		useCallback(
			( entries: IntersectionObserverEntry[] ) => {
				// Calculate new visible entries outside of setState
				if ( ! setVisibleEntries ) {
					return;
				}
				setVisibleEntries( ( prev: number[] ) => {
					const newVisibleEntries = new Set( prev );
					let hasChanged = false;

					entries.forEach( ( entry ) => {
						const posInSet = Number(
							entry.target?.attributes?.getNamedItem(
								'aria-posinset'
							)?.value
						);
						if ( isNaN( posInSet ) ) {
							return;
						}
						if ( entry.isIntersecting ) {
							if ( ! newVisibleEntries.has( posInSet ) ) {
								newVisibleEntries.add( posInSet );
								hasChanged = true;
							}
						} else if ( newVisibleEntries.has( posInSet ) ) {
							newVisibleEntries.delete( posInSet );
							hasChanged = true;
						}
					} );

					// Only return new array if something actually changed
					return hasChanged
						? Array.from( newVisibleEntries ).sort()
						: prev;
				} );
			},
			[ setVisibleEntries ]
		);

	// Preserve scroll position when items are added or removed during infinite scroll
	useLayoutEffect( () => {
		const container = containerRef.current;
		if (
			! container ||
			! view.infiniteScrollEnabled ||
			! scrollPreservationRef.current.isPending
		) {
			return;
		}

		// Calculate the height difference and adjust scroll position
		const heightDiff =
			container.scrollHeight - scrollPreservationRef.current.scrollHeight;
		const { direction } = scrollPreservationRef.current;

		if ( direction === 'up' && heightDiff > 0 ) {
			// Items were prepended while scrolling up, add the difference to maintain position
			container.scrollTop =
				scrollPreservationRef.current.scrollTop + heightDiff;
		} else if ( direction === 'down' && heightDiff < 0 ) {
			// Items were removed from top while scrolling down, adjust to prevent jumping up
			container.scrollTop =
				scrollPreservationRef.current.scrollTop + heightDiff;
		}
		// When scrolling down and items are added at bottom (heightDiff > 0), no adjustment needed
		// When scrolling up and items are removed from bottom (heightDiff < 0), no adjustment needed

		scrollPreservationRef.current.isPending = false;
		scrollPreservationRef.current.direction = null;
	}, [ containerRef, displayData, view.infiniteScrollEnabled ] );

	// Attach scroll event listener for infinite scroll
	useEffect( () => {
		if ( ! view.infiniteScrollEnabled || ! containerRef.current ) {
			return;
		}

		let lastScrollTop = 0;
		// Use larger thresholds to trigger loading earlier during fast scrolling
		const BOTTOM_THRESHOLD = 600; // px from bottom to trigger load
		const TOP_THRESHOLD = 800; // px from top to trigger load

		const handleScroll = throttle( ( event: unknown ) => {
			const target = ( event as Event ).target as HTMLElement;
			const scrollTop = target.scrollTop;
			const scrollHeight = target.scrollHeight;
			const clientHeight = target.clientHeight;

			// Determine scroll direction
			const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
			lastScrollTop = scrollTop;

			// Don't trigger if already loading
			if ( isLoadingRef.current || isLoading ) {
				return;
			}

			const currentStartPosition = view.startPosition || 1;
			const currentEndPosition =
				view.endPosition ||
				currentStartPosition + ( view.perPage || 10 ) - 1;
			// Calculate and store batch size from initial range (only once)
			if ( initialBatchSizeRef.current === null ) {
				initialBatchSizeRef.current =
					currentEndPosition - currentStartPosition + 1;
			}
			const batchSize = initialBatchSizeRef.current;

			// Check if user has scrolled near the bottom
			if (
				scrollDirection === 'down' &&
				scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD
			) {
				// Check if there's more data to load
				if ( currentEndPosition < paginationInfo.totalItems ) {
					isLoadingRef.current = true;

					// Store current scroll state for position preservation when items are unloaded
					scrollPreservationRef.current = {
						scrollHeight: target.scrollHeight,
						scrollTop: target.scrollTop,
						isPending: true,
						direction: 'down',
					};

					const newStartPosition = currentEndPosition - 3;
					const newEndPosition = Math.min(
						newStartPosition + batchSize,
						paginationInfo.totalItems
					);
					onChangeView( {
						...view,
						startPosition: newStartPosition,
						endPosition: newEndPosition,
					} );
					isLoadingRef.current = false;
				}
			}

			// Check if user has scrolled near the top
			if ( scrollDirection === 'up' && scrollTop <= TOP_THRESHOLD ) {
				// Check if there's more data to load
				if ( currentStartPosition > 1 ) {
					isLoadingRef.current = true;

					// Store current scroll state for position preservation
					scrollPreservationRef.current = {
						scrollHeight: target.scrollHeight,
						scrollTop: target.scrollTop,
						isPending: true,
						direction: 'up',
					};

					const newEndPosition = currentStartPosition + 1;
					const newStartPosition = Math.max(
						newEndPosition - batchSize,
						1
					);

					onChangeView( {
						...view,
						startPosition: newStartPosition,
						endPosition: newEndPosition,
					} );
					isLoadingRef.current = false;
				}
			}
		}, 50 ); // Faster throttle (50ms) for better response to fast scrolling

		const container = containerRef.current;
		container.addEventListener( 'scroll', handleScroll );

		return () => {
			container.removeEventListener( 'scroll', handleScroll );
			handleScroll.cancel(); // Cancel any pending throttled calls
		};
	}, [
		containerRef,
		isLoading,
		onChangeView,
		paginationInfo.totalItems,
		view,
	] );

	return {
		intersectionObserverCallback: view.infiniteScrollEnabled
			? intersectionObserverCallback
			: undefined,
	};
}
