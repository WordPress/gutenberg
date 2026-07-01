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
	// posinset of the top rendered item captured when a "load earlier items"
	// (scroll-up) request is triggered, used to keep the viewport in place when
	// the prepended page arrives while pinned at the very top — the one spot
	// native scroll anchoring can't cover (see the effect below).
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

	// Scroll position across content changes (pages loading in, items unloading
	// from either end) is preserved by the browser's native scroll anchoring
	// (`overflow-anchor`, on by default). It keeps whatever element is adjacent
	// to the viewport visually fixed as content is inserted or removed above it,
	// including across the async gap of a page load — the data is preserved
	// while a request is in flight, so the user scrolls freely and the only
	// content mutation happens when the page resolves. A JS anchor-restore used
	// to run here too, but it duplicated that work and double-compensated
	// unload-induced shifts (the list would jump upward as pages arrived).

	// Keep the viewport in place when a "load earlier items" page is prepended
	// while the user is pinned at the very top. Native scroll anchoring covers
	// prepends everywhere else, but is suppressed at scrollTop 0, so without this
	// the content jumps down by the height of the newly inserted items. Runs on
	// `isLoading` transitions; acts only once the prepend has actually landed
	// (the top posinset dropped below the captured one) and only while still at
	// the top (scrollTop ~ 0), so it never overlaps with native anchoring.
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

		// The prepended page hasn't rendered yet; wait for a later commit.
		if ( firstPosinset === null || firstPosinset >= anchorPosinset ) {
			return;
		}

		prependAnchorRef.current = null;

		// Above scrollTop 0 the browser already compensated the prepend; leaving
		// it alone avoids double-adjusting.
		if ( container.scrollTop > 2 ) {
			return;
		}

		const anchorElement = container.querySelector(
			`[aria-posinset="${ anchorPosinset }"]`
		);
		if ( ! anchorElement ) {
			return;
		}

		// The captured item was at the top edge (scrollTop 0) before the page
		// arrived; its offset now equals the height inserted above it.
		const prependedHeight =
			anchorElement.getBoundingClientRect().top -
			container.getBoundingClientRect().top;

		if ( prependedHeight > 1 ) {
			container.scrollTop += prependedHeight;
		}
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

					// Remember the current top item so the viewport can be kept
					// in place if this page arrives while pinned at the top.
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
