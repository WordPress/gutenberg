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
	const viewRef = useRef( view );
	const isLoadingRef = useRef( isLoading );
	const onChangeViewRef = useRef( onChangeView );
	const totalItemsRef = useRef( paginationInfo.totalItems );
	// Position of the first rendered item when an earlier page is requested.
	// Native scroll anchoring handles prepends except at scrollTop 0.
	const prependAnchorRef = useRef< number | null >( null );

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

	// The browser's native scroll anchoring preserves the viewport when pages
	// load and the observer unloads offscreen items. Applying another
	// JavaScript adjustment here would double-compensate those removals.
	//
	// Native anchoring is suppressed at scrollTop 0, so handle only the case
	// where an earlier page is prepended while the user remains at the top.
	useLayoutEffect( () => {
		const container = containerRef.current;
		const anchorPosinset = prependAnchorRef.current;

		if (
			! container ||
			! view.infiniteScrollEnabled ||
			isLoading ||
			anchorPosinset === null
		) {
			return;
		}

		const firstItem = container.querySelector( '[aria-posinset]' );
		const firstPosinset = firstItem
			? Number( firstItem.getAttribute( 'aria-posinset' ) )
			: null;

		// The prepended page has not rendered yet.
		if ( firstPosinset === null || firstPosinset >= anchorPosinset ) {
			return;
		}

		prependAnchorRef.current = null;

		// Away from the top, native anchoring already compensated the prepend.
		if ( container.scrollTop > 2 ) {
			return;
		}

		const anchorElement = container.querySelector(
			`[aria-posinset="${ anchorPosinset }"]`
		);
		if ( ! anchorElement ) {
			return;
		}

		const prependedHeight =
			anchorElement.getBoundingClientRect().top -
			container.getBoundingClientRect().top;

		if ( prependedHeight > 1 ) {
			container.scrollTop += prependedHeight;
		}
	}, [
		containerRef,
		isLoading,
		view.infiniteScrollEnabled,
		view.startPosition,
	] );

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

					const firstItem = target.querySelector( '[aria-posinset]' );
					prependAnchorRef.current = firstItem
						? Number( firstItem.getAttribute( 'aria-posinset' ) )
						: null;

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
