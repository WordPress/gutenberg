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
	totalDataLength: number;
}

interface UseInfiniteScrollDataResult< Item > {
	data: Item[];
	paginationInfo: {
		totalItems: number;
		totalPages: number;
		setVisibleEntries?: React.Dispatch< React.SetStateAction< number[] > >;
	};
}

/**
 * Hook to manage infinite scroll data loading and visibility tracking.
 *
 * This hook handles:
 * - Loading more data when scrolling up or down
 * - Maintaining stable positions for items
 * - Unloading items that are no longer visible (with a buffer)
 * - Managing placeholders for unloaded items
 *
 * @param params                 - Configuration parameters
 * @param params.view            - Current view configuration
 * @param params.data            - Current page of data
 * @param params.getItemId       - Function to extract item ID
 * @param params.totalDataLength - Total number of items in the dataset
 * @return Object containing filtered data, pagination info, and loading state
 */
export function useInfiniteScrollData< Item extends { id: number } >( {
	view,
	data: shownData,
	getItemId,
	totalDataLength,
}: UseInfiniteScrollDataParams< Item > ): UseInfiniteScrollDataResult< Item > {
	// Custom pagination handler that simulates server-side pagination
	const [ allLoadedRecords, setAllLoadedRecords ] = useState<
		( Item | null )[]
	>( [] );

	const [ visibleEntries, setVisibleEntries ] = useState< number[] >( [] );

	// Track the mapping of item IDs to their positions in the full dataset
	const positionMapRef = useRef< Map< string, number > >( new Map() );

	// Track the range of data we've loaded to maintain placeholders
	const loadedRangeRef = useRef< { min: number; max: number } | null >(
		null
	);

	const totalItems = totalDataLength;
	const totalPages = Math.ceil( totalItems / ( view.perPage || 10 ) );

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
		if (
			( view.startPosition === undefined && ! allLoadedRecords.length ) ||
			! view.infiniteScrollEnabled
		) {
			// First page - replace all data and initialize range
			const startPosition = 1;
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

			if ( records.length > 0 ) {
				loadedRangeRef.current = {
					min: Math.min(
						...records.map(
							( r ) =>
								positionMapRef.current.get( getItemId( r ) )!
						)
					),
					max: Math.max(
						...records.map(
							( r ) =>
								positionMapRef.current.get( getItemId( r ) )!
						)
					),
				};
			}
		} else {
			// Subsequent pages - load more data with placeholders
			setAllLoadedRecords( ( prev ) => {
				const existingIds = new Set(
					prev
						.filter( ( item ): item is Item => item !== null )
						.map( getItemId )
				);
				// Calculate start position based on the highest position already tracked
				let nextPosition =
					positionMapRef.current.size > 0
						? Math.max( ...positionMapRef.current.values() ) + 1
						: 1;

				const newRecords = shownData
					.filter(
						( record ) => ! existingIds.has( getItemId( record ) )
					)
					.map( ( record ) => {
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

				if ( newRecords.length === 0 ) {
					return prev;
				}

				// Update the loaded range
				const scrollDirection = scrollDirectionRef.current;
				const allRecords =
					scrollDirection === 'up'
						? [ ...newRecords, ...prev ]
						: [ ...prev, ...newRecords ];

				const allPositions = allRecords
					.filter( ( r ): r is Item => r !== null )
					.map(
						( r ) => positionMapRef.current.get( getItemId( r ) )!
					);
				const newMin = Math.min( ...allPositions );
				const newMax = Math.max( ...allPositions );

				loadedRangeRef.current = {
					min: newMin,
					max: newMax,
				};

				// Create array with placeholders to maintain positions
				const result: ( Item | null )[] = [];
				for ( let pos = newMin; pos <= newMax; pos++ ) {
					const record = allRecords.find(
						( r ) =>
							r !== null &&
							positionMapRef.current.get( getItemId( r ) ) === pos
					);
					result.push( record || null );
				}

				// Filter to keep only records that should remain visible
				// Keep items within a certain range of visible entries
				if ( visibleEntries.length > 0 ) {
					const visibleMin = Math.min( ...visibleEntries );
					const visibleMax = Math.max( ...visibleEntries );
					// Buffer size balances allowing new items to render (when prepended
					// during scroll up) while unloading items no longer on screen
					const buffer = 6;

					const filtered = result
						.map( ( record, index ) => {
							const itemPosition = newMin + index;
							// Keep records that are null (placeholders) or within the visible range
							if ( record === null ) {
								return record;
							}
							// Keep items within buffer range of visible items
							if (
								itemPosition >= visibleMin - buffer &&
								itemPosition <= visibleMax + buffer
							) {
								return record;
							}
							// Replace with placeholder if outside buffer
							return null;
						} )
						.filter(
							( record, index ) =>
								record !== null ||
								( newMin + index >= visibleMin - buffer &&
									newMin + index <= visibleMax + buffer )
						);

					return filtered;
				}

				return result.filter( ( r ) => r !== null );
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

	const paginationInfo = {
		totalItems,
		totalPages,
		setVisibleEntries,
	};

	// Filter out null placeholders for display
	const displayData = allLoadedRecords.filter(
		( record ): record is Item => record !== null
	);

	return {
		data: displayData,
		paginationInfo,
	};
}
