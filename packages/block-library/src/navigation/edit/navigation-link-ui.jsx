import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import {
	LinkUI,
	updateAttributes,
	useEntityBinding,
} from '../../navigation-link/shared';

const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

export function NavigationLinkUI( {
	insertedBlockClientId,
	setInsertedBlockClientId,
	allowedBlockNames,
} ) {
	const { updateBlockAttributes, removeBlock, replaceBlock } =
		useDispatch( blockEditorStore );
	const { getBlock, getBlockRootClientId } = useSelect( blockEditorStore );

	// Rendered in the inserted block's List View row, to find the List View.
	const rowMarkerRef = useRef( null );
	const popoverRef = useRef( null );
	const openedWithoutFocusRef = useRef( false );
	const setPopoverRef = useCallback( ( node ) => {
		popoverRef.current = node;
		if ( node ) {
			const { activeElement, body } = node.ownerDocument;
			openedWithoutFocusRef.current =
				! activeElement || activeElement === body;
		}
	}, [] );

	const { insertedBlockName, insertedBlockAttributes } = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );

			return {
				insertedBlockName: getBlockName( insertedBlockClientId ),
				insertedBlockAttributes: getBlockAttributes(
					insertedBlockClientId
				),
			};
		},
		[ insertedBlockClientId ]
	);

	const showLinkControls =
		BLOCKS_WITH_LINK_UI_SUPPORT?.includes( insertedBlockName );

	// Get binding utilities for the inserted block
	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: insertedBlockClientId,
		attributes: insertedBlockAttributes || {},
	} );

	if ( ! showLinkControls ) {
		return null;
	}

	/**
	 * Returns a function that moves focus to the Options button of a block's
	 * List View row, if the Link UI has nowhere to return focus to.
	 *
	 * "Add submenu link" on a link replaces the link with a submenu, which
	 * removes the link's row, along with the Options button that had focus,
	 * before the Link UI opens. Closing the Link UI would then lose focus.
	 *
	 * Call it before the Link UI closes. Focus is left alone if it has moved
	 * out of the Link UI, such as when the user clicked elsewhere.
	 *
	 * @return {(clientId: string) => void} Takes the client ID of the block to focus.
	 */
	const getFocusRestorer = () => {
		const popover = popoverRef.current;
		const treeGrid = rowMarkerRef.current?.closest( '[role="treegrid"]' );

		if (
			! openedWithoutFocusRef.current ||
			! treeGrid ||
			! popover?.contains( popover.ownerDocument.activeElement )
		) {
			return () => {};
		}

		return ( clientId ) => {
			// Wait for the row of a block that has just been added.
			treeGrid.ownerDocument.defaultView.requestAnimationFrame( () => {
				treeGrid
					.querySelector(
						`[role="row"][data-block="${ clientId }"] .block-editor-list-view-block__menu`
					)
					?.focus();
			} );
		};
	};

	/**
	 * Cleanup function for auto-inserted Navigation Link blocks.
	 *
	 * Removes the block if it has no URL and clears the inserted block state.
	 * This ensures consistent cleanup behavior across different contexts.
	 *
	 * @return {string} The client ID of the block that holds the inserted block's
	 *                  place in the menu: its parent, or the link that replaces
	 *                  the parent.
	 */
	const cleanupInsertedBlock = () => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;
		let parentClientId = getBlockRootClientId( insertedBlockClientId );

		// Follows the exact same pattern as Navigation Link block's onClose handler
		// If there is no URL then remove the auto-inserted block to avoid empty blocks
		if ( ! insertedBlockAttributes?.url && insertedBlockClientId ) {
			const parent = getBlock( parentClientId );
			if (
				parent?.name === 'core/navigation-submenu' &&
				parent.innerBlocks.length === 1
			) {
				// A submenu without items turns back into a link. Do it here,
				// rather than leave it to the submenu, to know which block
				// takes the submenu's place.
				const link = createBlock(
					'core/navigation-link',
					parent.attributes
				);
				replaceBlock( parentClientId, link );
				parentClientId = link.clientId;
			} else {
				// Remove the block entirely to avoid poor UX
				// This matches the Navigation Link block's behavior
				removeBlock( insertedBlockClientId, shouldAutoSelectBlock );
			}
		}
		setInsertedBlockClientId( null );
		return parentClientId;
	};

	const setInsertedBlockAttributes =
		( _insertedBlockClientId ) => ( _updatedAttributes ) => {
			if ( ! _insertedBlockClientId ) {
				return;
			}
			updateBlockAttributes( _insertedBlockClientId, _updatedAttributes );
		};

	// Wrapper function to clean up original block when a new block is selected
	const handleSetInsertedBlock = ( newBlock ) => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// If we have an existing inserted block and a new block is being set,
		// remove the original block to avoid duplicates.
		// "Browse all" calls this from the main inserter after the link UI has
		// closed, and closing already removed the original block.
		if ( newBlock && getBlock( insertedBlockClientId ) ) {
			removeBlock( insertedBlockClientId, shouldAutoSelectBlock );
		}
		setInsertedBlockClientId( newBlock?.clientId ?? null );
	};

	return (
		<>
			<span ref={ rowMarkerRef } hidden />
			<LinkUI
				ref={ setPopoverRef }
				clientId={ insertedBlockClientId }
				link={ insertedBlockAttributes }
				allowedBlockNames={ allowedBlockNames }
				onBlockInsert={ handleSetInsertedBlock }
				onClose={ () => {
					const restoreFocus = getFocusRestorer();
					// Use cleanup function
					restoreFocus( cleanupInsertedBlock() );
				} }
				onChange={ ( updatedValue ) => {
					// updateAttributes determines the final state and returns metadata
					const { isEntityLink, attributes: updatedAttributes } =
						updateAttributes(
							updatedValue,
							setInsertedBlockAttributes( insertedBlockClientId ),
							insertedBlockAttributes
						);

					// Handle URL binding based on the final computed state
					// Only create bindings for entity links (posts, pages, taxonomies)
					// Never create bindings for custom links (manual URLs)
					if ( isEntityLink ) {
						createBinding( updatedAttributes );
					} else {
						clearBinding();
					}

					getFocusRestorer()(
						getBlockRootClientId( insertedBlockClientId )
					);
					setInsertedBlockClientId( null );
				} }
			/>
		</>
	);
}
