/**
 * WordPress dependencies
 */
import { useLayoutEffect, useEffect, useState } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BLOCK_LIST_ITEM_HEIGHT } from './';
import { countBlocks } from './branch';
import { store as blockEditorStore } from '../../store';

export default function useListViewOpenSelectedItem( {
	firstSelectedBlockClientId,
	clientIdsTree,
	blockListItemHeight = BLOCK_LIST_ITEM_HEIGHT,
	scrollContainerElement,
	expandedState,
	setExpandedState,
} ) {
	const [ selectedTreeId, setSelectedTreeId ] = useState( null );
	const scrollContainer = getScrollContainer( scrollContainerElement );
	const { selectedBlockParentClientIds } = useSelect(
		( select ) => {
			const { getBlockParents } = select( blockEditorStore );
			return {
				selectedBlockParentClientIds: getBlockParents(
					firstSelectedBlockClientId,
					false
				),
			};
		},
		[ firstSelectedBlockClientId ]
	);

	const parentClientIds =
		Array.isArray( selectedBlockParentClientIds ) &&
		selectedBlockParentClientIds.length
			? selectedBlockParentClientIds
			: null;

	// Track the expanded state of any parents.
	// To calculate the number of expanded items correctly.
	let parentExpandedState = null;
	if ( parentClientIds ) {
		parentExpandedState = expandedState[ parentClientIds[ 0 ] ];
	}

	useEffect( () => {
		// If the selectedTreeId is the same as the selected block,
		// it means that the block was selected using the block list tree.
		if ( selectedTreeId === firstSelectedBlockClientId ) {
			return;
		}

		// If the selected block has parents, get the top-level parent.
		if ( parentClientIds ) {
			// If the selected block has parents,
			// expand the tree branch.
			setExpandedState( {
				type: 'expand',
				clientIds: selectedBlockParentClientIds,
			} );
		}
	}, [ firstSelectedBlockClientId ] );

	useLayoutEffect( () => {
		// If the selectedTreeId is the same as the selected block,
		// it means that the block was selected using the block list tree.
		if ( selectedTreeId === firstSelectedBlockClientId ) {
			return;
		}
		if (
			scrollContainer &&
			!! firstSelectedBlockClientId &&
			Array.isArray( clientIdsTree ) &&
			clientIdsTree.length
		) {
			// Grab the selected id. This is the point at which we can
			// stop counting blocks in the tree.
			let selectedId = firstSelectedBlockClientId;

			// If the selected block has parents, get the top-level parent.
			if ( parentClientIds ) {
				selectedId = parentClientIds[ 0 ];
				// If the selected block has parents,
				// check to see if the selected tree is expanded
				// so we can accurately calculate the scroll container top value.
				if ( ! parentExpandedState ) {
					return;
				}
			}

			// Count expanded blocks in the tree up until the selected block,
			// so we can calculate the scroll container top value.
			let listItemHeightFactor = 0;
			clientIdsTree.every( ( item ) => {
				if ( item?.clientId === selectedId ) {
					return false;
				}
				listItemHeightFactor += countBlocks( item, expandedState, [] );
				return true;
			} );

			// New scroll value is the number of expanded items
			// multiplied by the item height
			// plus the number of expanded children in the selected block
			// multiplied by the item height.
			const newScrollTopValue =
				listItemHeightFactor * blockListItemHeight +
				( parentClientIds ? parentClientIds.length : 1 ) *
					blockListItemHeight;

			const shouldScrollDown =
				newScrollTopValue >
				scrollContainer.scrollTop + scrollContainer.clientHeight;

			const shouldScrollUp =
				newScrollTopValue < scrollContainer.scrollTop;

			if ( ! shouldScrollUp && ! shouldScrollDown ) {
				return;
			}

			// @TODO This doesn't yet work when nested blocks are selected.
			// We're still using the top parent block to calculate/trigger redraw.
			// If selected block is already visible in the list prevent scroll.
			scrollContainer?.scrollTo( {
				top: newScrollTopValue,
			} );
		}
	}, [ firstSelectedBlockClientId, parentExpandedState ] );

	return {
		setSelectedTreeId,
	};
}
