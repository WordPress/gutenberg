/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
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
	block,
	insertedBlock,
	setInsertedBlock,
	editingBlock,
	setEditingBlock,
} ) {
	const { updateBlockAttributes, removeBlock } =
		useDispatch( blockEditorStore );

	// Handle editing existing blocks
	const isEditingExistingBlock =
		editingBlock?.clientId === block.clientId &&
		BLOCKS_WITH_LINK_UI_SUPPORT.includes( editingBlock?.name );

	// Handle newly inserted blocks
	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT?.includes(
		insertedBlock?.name
	);
	const blockWasJustInserted = insertedBlock?.clientId === block.clientId;
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	// Determine which block is active
	const activeBlock = isEditingExistingBlock ? editingBlock : insertedBlock;
	const setActiveBlock = isEditingExistingBlock
		? setEditingBlock
		: setInsertedBlock;

	// Get binding utilities for the active block
	// Use a valid clientId or empty string to satisfy hook rules
	const activeClientId = activeBlock?.clientId || '';
	const activeAttributes = activeBlock?.attributes || {};
	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: activeClientId,
		attributes: activeAttributes,
	} );

	if ( ! showLinkControls && ! isEditingExistingBlock ) {
		return null;
	}

	/**
	 * Cleanup function for auto-inserted Navigation Link blocks.
	 *
	 * Removes the block if it has no URL and clears the inserted block state.
	 * This ensures consistent cleanup behavior across different contexts.
	 */
	const cleanupInsertedBlock = () => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// Follows the exact same pattern as Navigation Link block's onClose handler
		// If there is no URL then remove the auto-inserted block to avoid empty blocks
		if (
			! activeBlock?.attributes?.url &&
			activeBlock?.clientId &&
			! isEditingExistingBlock
		) {
			// Remove the block entirely to avoid poor UX
			// This matches the Navigation Link block's behavior
			removeBlock( activeBlock.clientId, shouldAutoSelectBlock );
		}
		setActiveBlock( null );
	};

	const setActiveBlockAttributes =
		( _activeBlockClientId ) => ( _updatedAttributes ) => {
			if ( ! _activeBlockClientId ) {
				return;
			}
			updateBlockAttributes( _activeBlockClientId, _updatedAttributes );
		};

	// Wrapper function to clean up original block when a new block is selected
	const handleSetActiveBlock = ( newBlock ) => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// If we have an existing inserted block and a new block is being set,
		// remove the original block to avoid duplicates
		// Only do this for inserted blocks, not for editing existing blocks
		if ( ! isEditingExistingBlock && activeBlock?.clientId && newBlock ) {
			removeBlock( activeBlock.clientId, shouldAutoSelectBlock );
		}
		setActiveBlock( newBlock );
	};

	return (
		<LinkUI
			clientId={ activeBlock?.clientId }
			link={ activeBlock?.attributes }
			onBlockInsert={ handleSetActiveBlock }
			onClose={ () => {
				// Use cleanup function
				cleanupInsertedBlock();
			} }
			onChange={ ( updatedValue ) => {
				// updateAttributes determines the final state and returns metadata
				const { isEntityLink, attributes: updatedAttributes } =
					updateAttributes(
						updatedValue,
						setActiveBlockAttributes( activeBlock?.clientId ),
						activeBlock?.attributes
					);

				// Handle URL binding based on the final computed state
				// Only create bindings for entity links (posts, pages, taxonomies)
				// Never create bindings for custom links (manual URLs)
				if ( isEntityLink ) {
					createBinding( updatedAttributes );
				} else {
					clearBinding();
				}

				setActiveBlock( null );
			} }
		/>
	);
}
