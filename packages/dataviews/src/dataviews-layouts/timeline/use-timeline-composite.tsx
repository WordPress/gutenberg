/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	generateItemWrapperCompositeId,
	generateDropdownTriggerCompositeId,
} from './utils';

export function useTimelineComposite< Item >( {
	data,
	getItemId,
	baseId,
	selectedItem,
}: {
	data: Item[];
	getItemId: ( item: Item ) => string;
	baseId: string;
	selectedItem: Item | undefined;
} ) {
	// Generate unique ID prefix for each item based on its data ID
	const generateCompositeItemIdPrefix = useCallback(
		( item: Item ) => `${ baseId }-${ getItemId( item ) }`,
		[ baseId, getItemId ]
	);

	// Check if a given ID belongs to a specific item
	const isActiveCompositeItem = useCallback(
		( item: Item, idToCheck: string ) => {
			return idToCheck.startsWith(
				generateCompositeItemIdPrefix( item )
			);
		},
		[ generateCompositeItemIdPrefix ]
	);

	// Track the currently focused composite item
	const [ activeCompositeId, setActiveCompositeId ] = useState<
		string | null | undefined
	>( undefined );

	// When selection changes, update the active composite item to match
	useEffect( () => {
		if ( selectedItem ) {
			setActiveCompositeId(
				generateItemWrapperCompositeId(
					generateCompositeItemIdPrefix( selectedItem )
				)
			);
		}
	}, [ selectedItem, generateCompositeItemIdPrefix ] );

	// Find the index of the currently active item
	const activeItemIndex = data.findIndex( ( item ) =>
		isActiveCompositeItem( item, activeCompositeId ?? '' )
	);
	const previousActiveItemIndex = usePrevious( activeItemIndex );
	const isActiveIdInList = activeItemIndex !== -1;

	// Programmatically select and focus a composite item by index
	const selectCompositeItem = useCallback(
		(
			targetIndex: number,
			generateCompositeId: ( idPrefix: string ) => string
		) => {
			// Clamp index to valid range
			const clampedIndex = Math.min(
				data.length - 1,
				Math.max( 0, targetIndex )
			);
			if ( ! data[ clampedIndex ] ) {
				return;
			}
			const itemIdPrefix = generateCompositeItemIdPrefix(
				data[ clampedIndex ]
			);
			const targetCompositeItemId = generateCompositeId( itemIdPrefix );

			setActiveCompositeId( targetCompositeItemId );
			document.getElementById( targetCompositeItemId )?.focus();
		},
		[ data, generateCompositeItemIdPrefix ]
	);

	// Handle the case when an active item is removed from the list
	useEffect( () => {
		const wasActiveIdInList =
			previousActiveItemIndex !== undefined &&
			previousActiveItemIndex !== -1;
		if ( ! isActiveIdInList && wasActiveIdInList ) {
			// Select the next item, or the last item if the removed item was at the end
			selectCompositeItem(
				previousActiveItemIndex,
				generateItemWrapperCompositeId
			);
		}
	}, [ isActiveIdInList, selectCompositeItem, previousActiveItemIndex ] );

	// Handle arrow key navigation for dropdown triggers
	// Prevents default dropdown behavior and navigates between rows instead
	const onDropdownTriggerKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLButtonElement > ) => {
			if ( event.key === 'ArrowDown' ) {
				event.preventDefault();
				selectCompositeItem(
					activeItemIndex + 1,
					generateDropdownTriggerCompositeId
				);
			}
			if ( event.key === 'ArrowUp' ) {
				event.preventDefault();
				selectCompositeItem(
					activeItemIndex - 1,
					generateDropdownTriggerCompositeId
				);
			}
		},
		[ selectCompositeItem, activeItemIndex ]
	);

	return {
		activeCompositeId,
		setActiveCompositeId,
		generateCompositeItemIdPrefix,
		onDropdownTriggerKeyDown,
	};
}
