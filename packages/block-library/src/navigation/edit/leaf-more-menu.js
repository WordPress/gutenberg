/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { addSubmenu } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { DEFAULT_BLOCK } from '../constants';

const BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU = [
	'core/navigation-link',
	'core/navigation-submenu',
];

function AddSubmenuItem( {
	block,
	onClose,
	expandedState,
	expand,
	setInsertedBlock,
} ) {
	const { insertBlock, replaceBlock, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	if (
		! block ||
		! BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU.includes( block.name )
	) {
		return null;
	}

	const clientId = block.clientId;

	return (
		<MenuItem
			icon={ addSubmenu }
			onClick={ () => {
				const updateSelectionOnInsert = false;
				const newLink = createBlock(
					DEFAULT_BLOCK.name,
					DEFAULT_BLOCK.attributes
				);

				if ( block.name === 'core/navigation-submenu' ) {
					insertBlock(
						newLink,
						block.innerBlocks.length,
						clientId,
						updateSelectionOnInsert
					);
				} else {
					// Convert to a submenu if the block currently isn't one.
					const newSubmenu = createBlock(
						'core/navigation-submenu',
						block.attributes,
						block.innerBlocks
					);

					// The following must happen as two independent actions.
					// Why? Because the offcanvas editor relies on the getLastInsertedBlocksClientIds
					// selector to determine which block is "active". As the UX needs the newLink to be
					// the "active" block it must be the last block to be inserted.
					// Therefore the Submenu is first created and **then** the newLink is inserted
					// thus ensuring it is the last inserted block.
					replaceBlock( clientId, newSubmenu );

					replaceInnerBlocks(
						newSubmenu.clientId,
						[ newLink ],
						updateSelectionOnInsert
					);
				}

				// This call sets the local List View state for the "last inserted block".
				// This is required for the Nav Block to determine whether or not to display
				// the Link UI for this new block.
				if ( setInsertedBlock ) {
					setInsertedBlock( newLink );
				}

				if ( expandedState && expand && ! expandedState[ clientId ] ) {
					expand( clientId );
				}
				onClose();
			} }
		>
			{ __( 'Add submenu link' ) }
		</MenuItem>
	);
}

export default function AddSubmenuItemFill() {
	return (
		<BlockSettingsMenuControls>
			{ ( fillProps ) => <AddSubmenuItem { ...fillProps } /> }
		</BlockSettingsMenuControls>
	);
}
