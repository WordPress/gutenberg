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
 * When isSelectAllMode is true, the selection array acts as a deselection list:
 * items are selected if they are NOT in the array.
 *
 * @param view            The current view configuration.
 * @param data            The current page of data items.
 * @param selection       Array of selected item IDs (or deselected IDs if isSelectAllMode).
 * @param getItemId       Function to get the ID of an item.
 * @param filterFn        Optional filter function to apply to selected items (e.g., for selectability).
 * @param isSelectAllMode Whether we're in "select all" mode where selection is a deselection list.
 * @return Array of selected items.
 */
export default function useSelectedItems< Item >(
	view: View,
	data: Item[],
	selection: string[],
	getItemId: ( item: Item ) => string,
	filterFn?: ( item: Item ) => boolean,
	isSelectAllMode?: boolean
): Item[] {
	// With infinite scroll enabled items scroll out of view, but we want to keep the selection unaltered,
	// unlike page-based navigation where we might clear selection upon navigating to a different page.
	const selectedItemsCacheRef = useRef< Map< string, Item > >( new Map() );

	return useMemo( () => {
		if ( view.infiniteScrollEnabled ) {
			if ( isSelectAllMode ) {
				// In select all mode, selection is a deselection list.
				// All items are selected EXCEPT those in the selection array.
				// We cache items that are NOT in the deselection list.
				data.forEach( ( item ) => {
					const id = getItemId( item );
					const isDeselected = selection.includes( id );
					if ( ! isDeselected ) {
						// Item is selected (not in deselection list)
						const passesFilter = filterFn ? filterFn( item ) : true;
						if ( passesFilter ) {
							selectedItemsCacheRef.current.set( id, item );
						}
					} else {
						// Item is deselected, remove from cache
						selectedItemsCacheRef.current.delete( id );
					}
				} );
			} else {
				// Normal mode: selection array contains selected items
				data.forEach( ( item ) => {
					const id = getItemId( item );
					if ( selection.includes( id ) ) {
						selectedItemsCacheRef.current.set( id, item );
					}
				} );

				// Remove items from cache that are no longer selected
				selectedItemsCacheRef.current.forEach( ( _, id ) => {
					if ( ! selection.includes( id ) ) {
						selectedItemsCacheRef.current.delete( id );
					}
				} );
			}

			// Return all cached selected items
			return Array.from( selectedItemsCacheRef.current.values() );
		}

		// Non-infinite scroll mode
		return data.filter( ( item ) => {
			const id = getItemId( item );
			const isInSelectionArray = selection.includes( id );
			// In select all mode, selected = NOT in array; otherwise selected = IN array
			const isSelected = isSelectAllMode
				? ! isInSelectionArray
				: isInSelectionArray;
			if ( ! isSelected ) {
				return false;
			}
			// Apply optional filter (e.g., selectability check for bulk actions)
			return filterFn ? filterFn( item ) : true;
		} );
	}, [
		view.infiniteScrollEnabled,
		selection,
		getItemId,
		data,
		filterFn,
		isSelectAllMode,
	] );
}
