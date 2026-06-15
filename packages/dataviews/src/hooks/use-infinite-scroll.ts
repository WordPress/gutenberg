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

/**
 * Captures an anchor element for scroll position preservation.
 * Finds the element closest to the center of the viewport and stores its position.
 *
 * @param container        The scrollable container element.
 * @param anchorElementRef Ref to store the anchor element data.
 * @param direction        The scroll direction ('up' or 'down').
 * @return Whether an anchor element was successfully captured.
 */
function captureAnchorElement(
	container: HTMLElement,
	anchorElementRef: React.MutableRefObject< {
		posinset: number;
		viewportOffset: number;
		direction: 'up' | 'down' | null;
	} | null >,
	direction: 'up' | 'down'
): boolean {
	// Find a visible element to use as anchor - prefer one in the middle of the viewport
	const containerRect = container.getBoundingClientRect();
	const centerY = containerRect.top + containerRect.height / 2;

	// Query all items with aria-posinset and find the one closest to center
	const items = Array.from( container.querySelectorAll( '[aria-posinset]' ) );

	if ( items.length === 0 ) {
		return false;
	}

	// Find the item closest to the center of the viewport
	const bestAnchor = items.reduce( ( best, item ) => {
		const itemRect = item.getBoundingClientRect();
		const itemCenterY = itemRect.top + itemRect.height / 2;
		const distance = Math.abs( itemCenterY - centerY );

		const bestRect = best.getBoundingClientRect();
		const bestCenterY = bestRect.top + bestRect.height / 2;
		const bestDistance = Math.abs( bestCenterY - centerY );

		return distance < bestDistance ? item : best;
	} );

	const posinset = Number( bestAnchor.getAttribute( 'aria-posinset' ) );
	const anchorRect = bestAnchor.getBoundingClientRect();
	anchorElementRef.current = {
		posinset,
		viewportOffset: anchorRect.top - containerRect.top,
		direction,
	};
	return true;
}

type UseInfiniteScrollProps = {
	view: View;
	onChangeView: ( view: View ) => void;
	isLoading: boolean;
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
	containerRef: React.MutableRefObject< HTMLDivElement | null >;
	setVisibleEntries?: React.Dispatch< React.SetStateAction< number[] > >;
};

type UseInfiniteScrollResult = {
	intersectionObserver?: IntersectionObserver | null;
};

export function useInfiniteScroll( {
	view,
	onChangeView,
	isLoading,
	paginationInfo,
	containerRef,
	setVisibleEntries,
}: UseInfiniteScrollProps ): UseInfiniteScrollResult {
	// Track an anchor element for scroll position preservation
	// This approach is robust even when items are added/removed from both ends simultaneously
	const anchorElementRef = useRef< {
		posinset: number;
		viewportOffset: number;
		direction: 'up' | 'down' | null;
	} | null >( null );
	const viewRef = useRef( view );
	const isLoadingRef = useRef( isLoading );
	const onChangeViewRef = useRef( onChangeView );
	const totalItemsRef = useRef( paginationInfo.totalItems );

	useLayoutEffect( () => {
		viewRef.current = view;
		isLoadingRef.current = isLoading;
		onChangeViewRef.current = onChangeView;
		totalItemsRef.current = paginationInfo.totalItems;
	}, [ view, isLoading, onChangeView, paginationInfo.totalItems ] );

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
	// Uses anchor element approach: find the same element after render and restore its viewport position
	useLayoutEffect( () => {
		const container = containerRef.current;
		const anchor = anchorElementRef.current;

		if (
			! container ||
			! view.infiniteScrollEnabled ||
			! anchor ||
			isLoading
		) {
			return;
		}

		// Find the anchor element by its posinset
		const anchorElement = container.querySelector(
			`[aria-posinset="${ anchor.posinset }"]`
		);

		if ( anchorElement ) {
			const containerRect = container.getBoundingClientRect();
			const anchorRect = anchorElement.getBoundingClientRect();
			const currentOffset = anchorRect.top - containerRect.top;

			// Calculate how much the anchor has moved and adjust scroll to compensate
			const scrollAdjustment = currentOffset - anchor.viewportOffset;

			if ( Math.abs( scrollAdjustment ) > 1 ) {
				container.scrollTop += scrollAdjustment;
			}
		}

		// Reset the anchor state now that we've adjusted
		anchorElementRef.current = null;
	}, [ containerRef, isLoading, view.infiniteScrollEnabled ] );

	// Create and expose a shared IntersectionObserver for provider-level reuse.
	const intersectionObserverRef = useRef< IntersectionObserver | null >(
		null
	);
	useEffect( () => {
		if ( ! view.infiniteScrollEnabled || ! intersectionObserverCallback ) {
			if ( intersectionObserverRef.current ) {
				intersectionObserverRef.current.disconnect();
				intersectionObserverRef.current = null;
			}
			return;
		}

		intersectionObserverRef.current = new IntersectionObserver(
			intersectionObserverCallback,
			{ root: null, rootMargin: '0px', threshold: 0.1 }
		);

		return () => {
			if ( intersectionObserverRef.current ) {
				intersectionObserverRef.current.disconnect();
				intersectionObserverRef.current = null;
			}
		};
	}, [ view.infiniteScrollEnabled, intersectionObserverCallback ] );

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
			const currentView = viewRef.current;
			const totalItems = totalItemsRef.current;
			const target = ( event as Event ).target as HTMLElement;
			const scrollTop = target.scrollTop;
			const scrollHeight = target.scrollHeight;
			const clientHeight = target.clientHeight;

			// Determine scroll direction
			const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
			lastScrollTop = scrollTop;

			// Don't trigger if already loading
			if ( isLoadingRef.current ) {
				return;
			}

			const currentStartPosition = currentView.startPosition || 1;
			const batchSize = currentView.perPage || 10;
			const currentEndPosition = Math.min(
				currentStartPosition + batchSize,
				totalItems
			);

			// Check if user has scrolled near the bottom
			if (
				scrollDirection === 'down' &&
				scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD
			) {
				// Check if there's more data to load
				if ( currentEndPosition < totalItems ) {
					const newStartPosition = currentEndPosition;

					// Capture anchor element for scroll position preservation
					captureAnchorElement( target, anchorElementRef, 'down' );

					onChangeViewRef.current( {
						...currentView,
						startPosition: newStartPosition,
					} );
				}
			}

			// Check if user has scrolled near the top
			if ( scrollDirection === 'up' && scrollTop <= TOP_THRESHOLD ) {
				// Check if there's more data to load
				if ( currentStartPosition > 1 ) {
					// Round to 1 if we're close to the beginning to avoid tiny batches
					const calculatedStartPosition =
						currentStartPosition - batchSize;
					const newStartPosition =
						calculatedStartPosition < 6
							? 1
							: calculatedStartPosition;

					// Capture anchor element for scroll position preservation
					captureAnchorElement( target, anchorElementRef, 'up' );

					onChangeViewRef.current( {
						...currentView,
						startPosition: newStartPosition,
					} );
				}
			}
		}, 50 ); // Faster throttle (50ms) for better response to fast scrolling

		const container = containerRef.current;
		container.addEventListener( 'scroll', handleScroll );

		return () => {
			container.removeEventListener( 'scroll', handleScroll );
			handleScroll.cancel(); // Cancel any pending throttled calls
		};
	}, [ containerRef, view.infiniteScrollEnabled ] );

	return {
		intersectionObserver: intersectionObserverRef.current,
	};
}
