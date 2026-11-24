import { createBlock } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { DEFAULT_BLOCK } from '../constants';

export const BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU = [
	'core/navigation-link',
	'core/navigation-submenu',
];

export type ListViewCallbacks = {
	updateExpansion: ( action: {
		type: 'expand' | 'collapse';
		clientIds: string[];
	} ) => void;
	setInsertedBlockClientId: ( clientId: string ) => void;
};

/**
 * Returns a function that adds a link at the end of a Navigation item, turning
 * a link into a submenu first, and opens the new link's Link UI in the List
 * View.
 *
 * @param clientId                           The item's block.
 * @param callbacks                          The List View's callbacks.
 * @param callbacks.updateExpansion          Expands or collapses List View rows.
 * @param callbacks.setInsertedBlockClientId Marks the new link as just inserted, which opens its Link UI.
 * @return Adds the link.
 */
export function useAddSubmenuLink(
	clientId: string,
	{ updateExpansion, setInsertedBlockClientId }: ListViewCallbacks
) {
	const { insertBlock, replaceBlock, replaceInnerBlocks } =
		useDispatch( blockEditorStore );
	const { getBlock } = useSelect( blockEditorStore );

	return () => {
		const updateSelectionOnInsert = false;
		const newLink = createBlock(
			DEFAULT_BLOCK.name,
			DEFAULT_BLOCK.attributes
		);
		// The item is the List View row that called this, so it exists.
		const block = getBlock( clientId ) as Block;

		if ( block.name === 'core/navigation-submenu' ) {
			insertBlock(
				newLink,
				block.innerBlocks.length,
				clientId,
				updateSelectionOnInsert
			);
		} else {
			// Convert to a submenu if the block currently isn't one.
			// The submenu keeps the link's client ID, so List View keeps the
			// item's row, and focus can return to its Options button once the
			// link UI closes.
			const newSubmenu = {
				...createBlock(
					'core/navigation-submenu',
					block.attributes,
					block.innerBlocks
				),
				clientId,
			};

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
		setInsertedBlockClientId( newLink.clientId );
		updateExpansion( { type: 'expand', clientIds: [ clientId ] } );
	};
}
