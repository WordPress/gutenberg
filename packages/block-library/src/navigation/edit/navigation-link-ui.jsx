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
		if ( ! insertedBlockAttributes?.url && insertedBlockClientId ) {
			// Remove the block entirely to avoid poor UX
			// This matches the Navigation Link block's behavior
			removeBlock( insertedBlockClientId, shouldAutoSelectBlock );
		}
		setInsertedBlockClientId( null );
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
		if ( insertedBlockClientId && newBlock ) {
			removeBlock( insertedBlockClientId, shouldAutoSelectBlock );
		}
		setInsertedBlockClientId( newBlock?.clientId ?? null );
	};

	return (
		<LinkUI
			clientId={ insertedBlockClientId }
			link={ insertedBlockAttributes }
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

				setInsertedBlockClientId( null );
			} }
		/>
	);
}
