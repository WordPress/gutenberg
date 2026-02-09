/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { View } from '../types';

type PaginationInfo = {
	totalItems: number;
	totalPages: number;
};

interface UseDataParams< Item > {
	view: View;
	data: Item[];
	getItemId: ( item: Item ) => string;
	isLoading?: boolean;
	paginationInfo: PaginationInfo;
}

interface UseDataResult< Item > {
	data: Item[];
	paginationInfo: PaginationInfo;
	hasInitiallyLoaded: boolean;
	setVisibleEntries?: React.Dispatch< React.SetStateAction< number[] > >;
}

/**
 * Hook to manage data for DataViews.
 *
 * When infinite scroll is enabled, this hook handles:
 * - Loading more data when scrolling up or down
 * - Maintaining stable positions for items
 * - Unloading items that are no longer visible (with a buffer)
 *
 * When infinite scroll is disabled, it preserves the previous data and
 * pagination info while loading, so the UI doesn't flash empty.
 *
 * In both cases, it tracks whether data has initially loaded.
 *
 * @param params                - Configuration parameters
 * @param params.view           - Current view configuration
 * @param params.data           - Current page of data
 * @param params.getItemId      - Function to extract item ID
 * @param params.isLoading      - Whether data is currently loading
 * @param params.paginationInfo - Pagination info (totalItems, totalPages)
 * @return Object containing data, paginationInfo, hasInitiallyLoaded,
 *         and optional setVisibleEntries callback
 */
export default function useData< Item >( {
	view,
	data: shownData,
	getItemId,
	isLoading,
	paginationInfo,
}: UseDataParams< Item > ): UseDataResult< Item > {
	const isInfiniteScrollEnabled = view.infiniteScrollEnabled;

	// --- hasInitiallyLoaded tracking (from trunk) ---
	const [ hasInitiallyLoaded, setHasInitiallyLoaded ] = useState(
		! isLoading
	);
	useEffect( () => {
		if ( ! isLoading ) {
			setHasInitiallyLoaded( true );
		}
	}, [ isLoading ] );

	// --- Previous data / paginationInfo preservation while loading (from trunk) ---
	const previousDataRef = useRef< Item[] >( shownData );
	const previousPaginationInfoRef =
		useRef< PaginationInfo >( paginationInfo );
	useEffect( () => {
		if ( ! isLoading ) {
			previousDataRef.current = shownData;
			previousPaginationInfoRef.current = paginationInfo;
		}
	}, [ shownData, isLoading, paginationInfo ] );

	// --- Infinite scroll state ---
	const [ allLoadedRecords, setAllLoadedRecords ] = useState< Item[] >( [] );
	const [ visibleEntries, setVisibleEntries ] = useState< number[] >( [] );

	// Track the mapping of item IDs to their positions in the full dataset
	const positionMapRef = useRef< Map< string, number > >( new Map() );

	// Track previous view parameters to detect when we need to reset
	const prevViewParamsRef = useRef< {
		search: string | undefined;
		filters: string | undefined;
		perPage: number | undefined;
	} >( {
		search: undefined,
		filters: undefined,
		perPage: undefined,
	} );

	// Determine scroll direction based on position changes
	const scrollDirectionRef = useRef< 'up' | 'down' | undefined >( undefined );
	const prevStartPositionRef = useRef< number | undefined >( undefined );

	if (
		view.startPosition !== undefined &&
		prevStartPositionRef.current !== undefined
	) {
		if ( view.startPosition < prevStartPositionRef.current ) {
			scrollDirectionRef.current = 'up';
		} else if ( view.startPosition > prevStartPositionRef.current ) {
			scrollDirectionRef.current = 'down';
		}
	}
	prevStartPositionRef.current = view.startPosition;

	// Initialize data on first load or when view changes significantly
	useEffect( () => {
		if ( ! isInfiniteScrollEnabled ) {
			return;
		}

		// First page - replace all data and initialize range
		// Serialize filters for comparison
		const currentFiltersKey = JSON.stringify( view.filters ?? [] );
		const prevFiltersKey = prevViewParamsRef.current.filters;

		// Check if view parameters that require a reset have changed
		const shouldReset =
			! allLoadedRecords.length ||
			! view.infiniteScrollEnabled ||
			view.search !== prevViewParamsRef.current.search ||
			currentFiltersKey !== prevFiltersKey ||
			view.perPage !== prevViewParamsRef.current.perPage;

		// Update tracked view parameters
		prevViewParamsRef.current = {
			search: view.search,
			filters: currentFiltersKey,
			perPage: view.perPage,
		};

		if ( shouldReset ) {
			// Reset - clear position map and replace all data
			positionMapRef.current.clear();
			// Reset scroll direction to prevent stale directional filtering
			scrollDirectionRef.current = undefined;
			// Use the view's startPosition if defined, otherwise default to 1
			const startPosition = view.startPosition ?? 1;
			const records = shownData.map( ( record, index ) => {
				const position = startPosition + index;
				positionMapRef.current.set( getItemId( record ), position );
				return {
					...record,
					position,
				};
			} );
			setAllLoadedRecords( records );
		} else {
			// Subsequent pages - load more data
			setAllLoadedRecords( ( prev ) => {
				const shownDataIds = new Set( shownData.map( getItemId ) );
				const scrollDirection = scrollDirectionRef.current;

				// Count how many new items need positions assigned
				const newItemsCount = shownData.filter( ( record ) => {
					const itemId = getItemId( record );
					return ! positionMapRef.current.has( itemId );
				} ).length;

				// Calculate start position based on scroll direction
				// When scrolling up, new items should have positions before the minimum
				// We start at (min - count) so that after incrementing through all items,
				// the last new item ends up just before the previous minimum.
				// When scrolling down, new items should have positions after the maximum
				let nextPosition: number;
				if ( positionMapRef.current.size > 0 ) {
					if ( scrollDirection === 'up' ) {
						nextPosition =
							Math.min( ...positionMapRef.current.values() ) -
							newItemsCount;
					} else {
						nextPosition =
							Math.max( ...positionMapRef.current.values() ) + 1;
					}
				} else {
					nextPosition = 1;
				}

				const newRecords = shownData.map( ( record ) => {
					const itemId = getItemId( record );
					const existingPosition =
						positionMapRef.current.get( itemId );
					let position: number;

					if ( existingPosition !== undefined ) {
						position = existingPosition;
					} else {
						position = nextPosition;
						positionMapRef.current.set( itemId, position );
						nextPosition++;
					}

					return {
						...record,
						position,
					};
				} );

				// Remove duplicates from prev, keeping only records not in shownData
				const prevWithoutDuplicates = prev.filter(
					( record ) => ! shownDataIds.has( getItemId( record ) )
				);

				if (
					newRecords.length === 0 &&
					prevWithoutDuplicates.length === 0
				) {
					return prev;
				}

				// Update the loaded range
				const allRecords =
					scrollDirection === 'up'
						? [ ...newRecords, ...prevWithoutDuplicates ]
						: [ ...prevWithoutDuplicates, ...newRecords ];

				// Sort all records by position to ensure correct order
				allRecords.sort( ( a, b ) => {
					const posA = ( a as Item & { position: number } ).position;
					const posB = ( b as Item & { position: number } ).position;
					return posA - posB;
				} );

				if ( visibleEntries.length > 0 ) {
					const visibleMin = Math.min( ...visibleEntries );
					const visibleMax = Math.max( ...visibleEntries );
					const buffer = 20;

					const filtered = allRecords.filter( ( record ) => {
						const itemPosition = (
							record as Item & { position: number }
						 ).position;
						if ( scrollDirection === 'up' ) {
							return itemPosition <= visibleMax + buffer;
						} else if ( scrollDirection === 'down' ) {
							return itemPosition >= visibleMin - buffer;
						}
						return (
							itemPosition >= visibleMin - buffer &&
							itemPosition <= visibleMax + buffer
						);
					} );

					return filtered;
				}

				return allRecords;
			} );
		}
	}, [
		shownData,
		view.search,
		view.filters,
		view.perPage,
		view.startPosition,
		view.endPosition,
		isInfiniteScrollEnabled,
		allLoadedRecords.length,
		visibleEntries,
		getItemId,
		view.infiniteScrollEnabled,
	] );

	// When infinite scroll is disabled, preserve previous data while loading
	if ( ! isInfiniteScrollEnabled ) {
		return {
			data:
				isLoading && previousDataRef.current?.length
					? previousDataRef.current
					: shownData,
			paginationInfo:
				isLoading && previousDataRef.current?.length
					? previousPaginationInfoRef.current
					: paginationInfo,
			hasInitiallyLoaded,
			setVisibleEntries: undefined,
		};
	}

	return {
		data: allLoadedRecords,
		paginationInfo,
		hasInitiallyLoaded,
		setVisibleEntries,
	};
}
