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
	block,
	insertedBlock,
	insertedBlockClientId,
	setInsertedBlock,
	setInsertedBlockClientId,
	editingBlock,
	editingPopoverAnchor,
	editingPopoverProps,
	setEditingBlock,
} ) {
	const { updateBlockAttributes, removeBlock } =
		useDispatch( blockEditorStore );

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

	const currentInsertedBlock =
		insertedBlock ||
		( insertedBlockClientId
			? {
					clientId: insertedBlockClientId,
					name: insertedBlockName,
					attributes: insertedBlockAttributes || {},
			  }
			: null );

	const isEditingExistingBlock =
		editingBlock?.clientId === block?.clientId &&
		BLOCKS_WITH_LINK_UI_SUPPORT.includes( block?.name );
	const activeBlock = isEditingExistingBlock ? block : currentInsertedBlock;
	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT.includes(
		activeBlock?.name
	);
	const blockWasJustInserted = block
		? activeBlock?.clientId === block?.clientId
		: Boolean( activeBlock?.clientId );
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	// Get binding utilities for the active block.
	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: activeBlock?.clientId,
		attributes: activeBlock?.attributes || {},
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

	const setActiveBlock = ( newBlock ) => {
		if ( isEditingExistingBlock ) {
			setEditingBlock?.( newBlock );
			return;
		}

		if ( setInsertedBlock ) {
			setInsertedBlock( newBlock );
			return;
		}

		setInsertedBlockClientId?.( newBlock?.clientId ?? null );
	};

	const cleanupActiveBlock = () => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// Follows the exact same pattern as Navigation Link block's onClose handler
		// but only for newly inserted blocks, never while editing an existing link.
		if (
			! isEditingExistingBlock &&
			! activeBlock?.attributes?.url &&
			activeBlock?.clientId
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

	const handleSetActiveBlock = ( newBlock ) => {
		// Prevent automatic block selection when removing blocks in list view context
		// This avoids focus stealing that would close the list view and switch to canvas
		const shouldAutoSelectBlock = false;

		// If we have an existing inserted block and a new block is being set,
		// remove the original block to avoid duplicates.
		if ( ! isEditingExistingBlock && activeBlock?.clientId && newBlock ) {
			removeBlock( activeBlock.clientId, shouldAutoSelectBlock );
		}

		setActiveBlock( newBlock );
	};

	return (
		<LinkUI
			clientId={ activeBlock?.clientId }
			link={ activeBlock?.attributes }
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
