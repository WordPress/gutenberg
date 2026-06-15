/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';

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
	selection?: string[];
}

interface UseDataResult< Item > {
	data: ( Item & { position?: number } )[];
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
 * @param params.selection      - Currently selected item IDs
 * @return Object containing data, paginationInfo, hasInitiallyLoaded,
 *         and optional setVisibleEntries callback
 */
export default function useData< Item >( {
	view,
	data: shownData,
	getItemId,
	isLoading,
	paginationInfo,
	selection,
}: UseDataParams< Item > ): UseDataResult< Item > {
	const isInfiniteScrollEnabled = view.infiniteScrollEnabled;

	const [ hasInitiallyLoaded, setHasInitiallyLoaded ] = useState(
		! isLoading
	);
	useEffect( () => {
		if ( ! isLoading ) {
			setHasInitiallyLoaded( true );
		}
	}, [ isLoading ] );

	const previousDataRef = useRef< Item[] >( shownData );
	const previousPaginationInfoRef =
		useRef< PaginationInfo >( paginationInfo );
	useEffect( () => {
		if ( ! isLoading ) {
			previousDataRef.current = shownData;
			previousPaginationInfoRef.current = paginationInfo;
		}
	}, [ shownData, isLoading, paginationInfo ] );

	// Infinite scroll state.
	const [ visibleEntries, setVisibleEntries ] = useState< number[] >( [] );

	// Track the mapping of item IDs to their positions in the full dataset
	const positionMapRef = useRef< Map< string, number > >( new Map() );

	// Store accumulated records in a ref for persistence across renders
	const allLoadedRecordsRef = useRef< Item[] >( [] );

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

	// Track whether we've done initial load
	const hasInitializedRef = useRef( false );

	// Compute data synchronously during render using useMemo
	// This ensures the returned data is always in sync with shownData
	const allLoadedRecords = useMemo( () => {
		// Update scroll direction based on position changes
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

		// Serialize filters for comparison
		const currentFiltersKey = JSON.stringify( view.filters ?? [] );
		const prevFiltersKey = prevViewParamsRef.current.filters;

		// Check if view parameters that require a reset have changed
		const shouldReset =
			! hasInitializedRef.current ||
			! view.infiniteScrollEnabled ||
			view.search !== prevViewParamsRef.current.search ||
			currentFiltersKey !== prevFiltersKey ||
			view.perPage !== prevViewParamsRef.current.perPage;
		hasInitializedRef.current = true;
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
			const startPosition = view.search ? 1 : view.startPosition ?? 1;
			const records = shownData.map( ( record, index ) => {
				const position = startPosition + index;
				positionMapRef.current.set( getItemId( record ), position );
				return {
					...record,
					position,
				};
			} );
			allLoadedRecordsRef.current = records;
			return records;
		}

		// Subsequent pages - merge with existing data
		const prev = allLoadedRecordsRef.current;
		const shownDataIds = new Set( shownData.map( getItemId ) );
		const scrollDirection = scrollDirectionRef.current;

		// The position for each item in shownData should be based on the
		// current startPosition from the view, which reflects the actual
		// offset in the dataset. This ensures aria-posinset values are
		// semantically correct - if startPosition is 40, there are exactly
		// 39 items before the first item in shownData.
		// When there's an active search, always start from position 1 since
		// search results are a filtered subset, not a paginated view.
		const basePosition = view.search ? 1 : view.startPosition ?? 1;
		const newRecords = shownData.map( ( record, index ) => {
			const itemId = getItemId( record );
			const position = view.infiniteScrollEnabled
				? basePosition + index
				: undefined;

			// Always update the position map with the correct position
			// based on the current query's startPosition
			if ( position !== undefined ) {
				positionMapRef.current.set( itemId, position );
			}

			return {
				...record,
				position,
			};
		} );

		if ( newRecords.length === 0 ) {
			return prev;
		}

		// Remove duplicates from prev, keeping only records not in shownData
		const prevWithoutDuplicates = prev.filter(
			( record ) => ! shownDataIds.has( getItemId( record ) )
		);

		// Update the loaded range
		const allRecords =
			scrollDirection === 'up'
				? [ ...newRecords, ...prevWithoutDuplicates ]
				: [ ...prevWithoutDuplicates, ...newRecords ];

		// Sort all records by position to ensure correct order
		// This is crucial when items are reloaded after scrolling in different directions
		allRecords.sort( ( a, b ) => {
			const posA = ( a as Item & { position: number } ).position;
			const posB = ( b as Item & { position: number } ).position;
			return posA - posB;
		} );

		let result = allRecords;

		if ( visibleEntries.length > 0 ) {
			const visibleMin = Math.min( ...visibleEntries );
			const visibleMax = Math.max( ...visibleEntries );
			// Buffer size balances allowing new items to render (when prepended
			// during scroll up) while unloading items no longer on screen.
			// Use a larger buffer to prevent scrollbar from jumping when items
			// are unloaded, which could trigger unwanted scroll events.
			const buffer = 20;

			const recordPositions = allRecords.map(
				( r ) => ( r as Item & { position: number } ).position
			);
			const minRecordPos = Math.min( ...recordPositions );
			const maxRecordPos = Math.max( ...recordPositions );

			// Check if there's any overlap between visible range and actual record positions
			// to avoid filtering when visibleEntries are stale (e.g., after search/filter reset)
			const hasOverlap = ! (
				maxRecordPos < visibleMin - buffer ||
				minRecordPos > visibleMax + buffer
			);

			if ( hasOverlap ) {
				result = allRecords.filter( ( record ) => {
					const itemId = getItemId( record );
					const isSelected = selection?.includes( itemId );
					// Never unload selected items, even if outside visible range
					if ( isSelected ) {
						return true;
					}

					const itemPosition = (
						record as Item & { position: number }
					 ).position;
					// When scrolling, only trim items from the end we're scrolling away from
					if ( scrollDirection === 'up' ) {
						// When scrolling up, only trim items below the visible range
						return itemPosition <= visibleMax + buffer;
					} else if ( scrollDirection === 'down' ) {
						// When scrolling down, only trim items above the visible range
						return itemPosition >= visibleMin - buffer;
					}
					// When not scrolling or first load, keep items within buffer range
					return (
						itemPosition >= visibleMin - buffer &&
						itemPosition <= visibleMax + buffer
					);
				} );
			}
		}

		allLoadedRecordsRef.current = result;
		return result;
	}, [
		shownData,
		view.search,
		view.filters,
		view.perPage,
		view.startPosition,
		view.infiniteScrollEnabled,
		visibleEntries,
		selection,
		getItemId,
	] );

	// When infinite scroll is disabled, preserve previous data while loading
	if ( ! isInfiniteScrollEnabled ) {
		const dataToReturn =
			isLoading && previousDataRef.current?.length
				? previousDataRef.current
				: shownData;
		return {
			data: dataToReturn.map( ( item ) => ( {
				...item,
				position: undefined,
			} ) ) as ( Item & { position?: number } )[],
			paginationInfo:
				isLoading && previousDataRef.current?.length
					? previousPaginationInfoRef.current
					: paginationInfo,
			hasInitiallyLoaded,
			setVisibleEntries: undefined,
		};
	}

	return {
		data: allLoadedRecords as ( Item & { position?: number } )[],
		paginationInfo,
		hasInitiallyLoaded,
		setVisibleEntries,
	};
}
