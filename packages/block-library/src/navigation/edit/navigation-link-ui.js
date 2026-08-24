import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
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
	editingBlock,
	editingPopoverAnchor,
	editingPopoverProps,
	setEditingBlock,
} ) {
	const { updateBlockAttributes, removeBlock } =
		useDispatch( blockEditorStore );

	const activeBlockClientId = editingBlock?.clientId ?? insertedBlockClientId;

	const { activeBlockName, activeBlockAttributes } = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );

			return {
				activeBlockName: getBlockName( activeBlockClientId ),
				activeBlockAttributes:
					getBlockAttributes( activeBlockClientId ),
			};
		},
		[ activeBlockClientId ]
	);

	const activeBlock = {
		clientId: activeBlockClientId,
		name: activeBlockName,
		attributes: activeBlockAttributes || {},
	};

	const isEditingExistingBlock = Boolean( editingBlock?.clientId );
	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT.includes(
		activeBlock?.name
	);
	const showLinkControls =
		supportsLinkControls && Boolean( activeBlockClientId );

	// Get binding utilities for the active block.
	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: activeBlockClientId,
		attributes: activeBlock.attributes,
	} );

	if ( ! showLinkControls && ! isEditingExistingBlock ) {
		return null;
	}

	if (
		isEditingExistingBlock &&
		editingPopoverProps &&
		! editingPopoverAnchor
	) {
		return null;
	}

	/**
	 * Cleanup function for the currently active Navigation Link block.
	 *
	 * Removes a newly inserted block if it has no URL and clears the active
	 * block state. Existing blocks are never removed on close.
	 */
	const cleanupActiveBlock = () => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// Follows the exact same pattern as Navigation Link block's onClose handler
		// but only for newly inserted blocks, never while editing an existing link.
		if (
			! isEditingExistingBlock &&
			! activeBlock.attributes?.url &&
			activeBlockClientId
		) {
			// Remove the block entirely to avoid poor UX
			// This matches the Navigation Link block's behavior
			removeBlock( activeBlockClientId, shouldAutoSelectBlock );
		}

		if ( isEditingExistingBlock ) {
			setEditingBlock?.( null );
			return;
		}

		setInsertedBlockClientId?.( null );
	};

	const setActiveBlockAttributes =
		( _activeBlockClientId ) => ( _updatedAttributes ) => {
			if ( ! _activeBlockClientId ) {
				return;
			}
			updateBlockAttributes( _activeBlockClientId, _updatedAttributes );
		};

	// Wrapper function to clean up original block when a new block is selected.
	const handleSetActiveBlock = ( newBlock ) => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// If we have an existing inserted block and a new block is being set,
		// remove the original block to avoid duplicates.
		if ( ! isEditingExistingBlock && activeBlockClientId && newBlock ) {
			removeBlock( activeBlockClientId, shouldAutoSelectBlock );
		}

		if ( isEditingExistingBlock ) {
			setEditingBlock?.( newBlock );
			return;
		}

		setInsertedBlockClientId?.( newBlock?.clientId ?? null );
	};

	return (
		<LinkUI
			clientId={ activeBlockClientId }
			link={ activeBlock.attributes }
			anchor={ isEditingExistingBlock ? editingPopoverAnchor : undefined }
			onBlockInsert={ handleSetActiveBlock }
			onClose={ cleanupActiveBlock }
			popoverProps={
				isEditingExistingBlock ? editingPopoverProps : undefined
			}
			onChange={ ( updatedValue ) => {
				// updateAttributes determines the final state and returns metadata
				const { isEntityLink, attributes: updatedAttributes } =
					updateAttributes(
						updatedValue,
						setActiveBlockAttributes( activeBlockClientId ),
						activeBlock.attributes
					);

				// Handle URL binding based on the final computed state
				// Only create bindings for entity links (posts, pages, taxonomies)
				// Never create bindings for custom links (manual URLs)
				if ( isEntityLink ) {
					createBinding( updatedAttributes );
				} else {
					clearBinding();
				}

				if ( isEditingExistingBlock ) {
					setEditingBlock?.( null );
					return;
				}

				setInsertedBlockClientId?.( null );
			} }
		/>
	);
}
