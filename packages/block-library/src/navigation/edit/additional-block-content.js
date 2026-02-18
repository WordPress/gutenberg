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

/**
 * Additional content component for navigation items in list view.
 * Provides inline link editing functionality for navigation link blocks.
 *
 * @param {Object}   props                  Component props.
 * @param {Object}   props.block            The block being rendered.
 * @param {Object}   props.insertedBlock    The inserted block to edit.
 * @param {Function} props.setInsertedBlock Callback to update inserted block state.
 * @return {Element|null} The additional content or null.
 */
export function AdditionalBlockContent( {
	block,
	insertedBlock,
	setInsertedBlock,
} ) {
	const { updateBlockAttributes, removeBlock } =
		useDispatch( blockEditorStore );

	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT?.includes(
		insertedBlock?.name
	);
	const blockWasJustInserted = insertedBlock?.clientId === block.clientId;
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	// Get binding utilities for the inserted block
	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: insertedBlock?.clientId,
		attributes: insertedBlock?.attributes || {},
	} );

	if ( ! showLinkControls ) {
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
		if ( ! insertedBlock?.attributes?.url && insertedBlock?.clientId ) {
			// Remove the block entirely to avoid poor UX
			// This matches the Navigation Link block's behavior
			removeBlock( insertedBlock.clientId, shouldAutoSelectBlock );
		}
		setInsertedBlock( null );
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
		// remove the original block to avoid duplicates
		if ( insertedBlock?.clientId && newBlock ) {
			removeBlock( insertedBlock.clientId, shouldAutoSelectBlock );
		}
		setInsertedBlock( newBlock );
	};

	return (
		<LinkUI
			clientId={ insertedBlock?.clientId }
			link={ insertedBlock?.attributes }
			onBlockInsert={ handleSetInsertedBlock }
			onClose={ () => {
				// Use cleanup function
				cleanupInsertedBlock();
			} }
			onChange={ ( updatedValue ) => {
				// updateAttributes determines the final state and returns metadata
				const { isEntityLink, attributes: updatedAttributes } =
					updateAttributes(
						updatedValue,
						setInsertedBlockAttributes( insertedBlock?.clientId ),
						insertedBlock?.attributes
					);

				// Handle URL binding based on the final computed state
				// Only create bindings for entity links (posts, pages, taxonomies)
				// Never create bindings for custom links (manual URLs)
				if ( isEntityLink ) {
					createBinding( updatedAttributes );
				} else {
					clearBinding();
				}

				setInsertedBlock( null );
			} }
		/>
	);
}
