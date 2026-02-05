/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { View } from '../../../types';

interface UseInfiniteScrollDataParams< Item > {
	view: View;
	data: Item[];
	getItemId: ( item: Item ) => string;
}

interface UseInfiniteScrollDataResult< Item > {
	data: Item[];
	setVisibleEntries?: React.Dispatch< React.SetStateAction< number[] > >;
}

/**
 * Hook to manage infinite scroll data loading and visibility tracking.
 *
 * This hook handles:
 * - Loading more data when scrolling up or down
 * - Maintaining stable positions for items
 * - Unloading items that are no longer visible (with a buffer)
 *
 * @param params           - Configuration parameters
 * @param params.view      - Current view configuration
 * @param params.data      - Current page of data
 * @param params.getItemId - Function to extract item ID
 * @return Object containing filtered data, pagination info, and loading state
 */
export function useInfiniteScrollData< Item extends { id: number } >( {
	view,
	data: shownData,
	getItemId,
}: UseInfiniteScrollDataParams< Item > ): UseInfiniteScrollDataResult< Item > {
	// Custom pagination handler that simulates server-side pagination
	const [ allLoadedRecords, setAllLoadedRecords ] = useState< Item[] >( [] );

	const [ visibleEntries, setVisibleEntries ] = useState< number[] >( [] );

	// Track the mapping of item IDs to their positions in the full dataset
	const positionMapRef = useRef< Map< string, number > >( new Map() );

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
		if ( ! allLoadedRecords.length || ! view.infiniteScrollEnabled ) {
			// First page - replace all data and initialize range
			// Use the view's startPosition if defined, otherwise default to 1
			const startPosition = view.startPosition ?? 1;
			const records = shownData.map( ( record, index ) => {
				const position = view.infiniteScrollEnabled
					? startPosition + index
					: undefined;
				if ( position !== undefined ) {
					positionMapRef.current.set( getItemId( record ), position );
				}
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
				// Calculate start position based on the highest position already tracked
				let nextPosition =
					positionMapRef.current.size > 0
						? Math.max( ...positionMapRef.current.values() ) + 1
						: 1;

				const newRecords = shownData.map( ( record ) => {
					const itemId = getItemId( record );
					let position: number | undefined;

					if ( view.infiniteScrollEnabled ) {
						// Check if this record already has a position
						const existingPosition =
							positionMapRef.current.get( itemId );
						if ( existingPosition !== undefined ) {
							position = existingPosition;
						} else {
							// Assign new position and increment for next record
							position = nextPosition;
							positionMapRef.current.set( itemId, position );
							nextPosition++;
						}
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
				const scrollDirection = scrollDirectionRef.current;
				const allRecords =
					scrollDirection === 'up'
						? [ ...newRecords, ...prevWithoutDuplicates ]
						: [ ...prevWithoutDuplicates, ...newRecords ];
				// Filter to keep only records that should remain visible
				// Keep items within a certain range of visible entries
				// Sort all records by position to ensure correct order
				// This is crucial when items are reloaded after scrolling in different directions
				allRecords.sort( ( a, b ) => {
					const posA = ( a as Item & { position: number } ).position;
					const posB = ( b as Item & { position: number } ).position;
					return posA - posB;
				} );

				if ( visibleEntries.length > 0 ) {
					const visibleMin = Math.min( ...visibleEntries );
					const visibleMax = Math.max( ...visibleEntries );
					// Buffer size balances allowing new items to render (when prepended
					// during scroll up) while unloading items no longer on screen.
					// Use a larger buffer to prevent scrollbar from jumping when items
					// are unloaded, which could trigger unwanted scroll events.
					const buffer = 20;

					const filtered = allRecords.filter( ( record ) => {
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
		view.infiniteScrollEnabled,
		allLoadedRecords.length,
		visibleEntries,
		getItemId,
	] );

	return {
		data: allLoadedRecords,
		setVisibleEntries,
	};
}
