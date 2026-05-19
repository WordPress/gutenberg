/**
 * WordPress dependencies
 */
import { useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { View } from '../types';

/**
 * Hook to get selected items, with support for infinite scroll.
 *
 * When infinite scroll is enabled, items that scroll out of view are cached
 * so they remain available for bulk actions even when not in the current data set.
 *
 * @param view      The current view configuration.
 * @param data      The current page of data items.
 * @param selection Array of selected item IDs.
 * @param getItemId Function to get the ID of an item.
 * @param filterFn  Optional filter function to apply to selected items (e.g., for selectability).
 * @return Array of selected items.
 */
export default function useSelectedItems< Item >(
	view: View,
	data: Item[],
	selection: string[],
	getItemId: ( item: Item ) => string,
	filterFn?: ( item: Item ) => boolean
): Item[] {
	// With infinite scroll enabled items scroll out of view, but we want to keep the selection unaltered,
	// unlike page-based navigation where we might clear selection upon navigating to a different page.
	const selectedItemsCacheRef = useRef< Map< string, Item > >( new Map() );

	return useMemo( () => {
		const selectionSet = new Set( selection );

		if ( view.infiniteScrollEnabled ) {
			// Selection array contains selected item IDs
			// Cache selected items so they remain available when scrolled out of view
			data.forEach( ( item ) => {
				const id = getItemId( item );
				if ( selectionSet.has( id ) ) {
					const passesFilter = filterFn ? filterFn( item ) : true;
					if ( passesFilter ) {
						selectedItemsCacheRef.current.set( id, item );
					}
				}
			} );

			// Remove items from cache that are no longer selected
			selectedItemsCacheRef.current.forEach( ( _, id ) => {
				if ( ! selectionSet.has( id ) ) {
					selectedItemsCacheRef.current.delete( id );
				}
			} );

			// Return all cached selected items
			return Array.from( selectedItemsCacheRef.current.values() );
		}

		// Non-infinite scroll mode
		return data.filter( ( item ) => {
			const id = getItemId( item );
			if ( ! selectionSet.has( id ) ) {
				return false;
			}
			// Apply optional filter (e.g., selectability check for bulk actions)
			return filterFn ? filterFn( item ) : true;
		} );
	}, [ view.infiniteScrollEnabled, selection, getItemId, data, filterFn ] );
}
