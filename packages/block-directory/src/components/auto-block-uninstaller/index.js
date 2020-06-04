/**
 * WordPress dependencies
 */
import { unregisterBlockType } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Check if a block list contains a specific block type. Recursively searches
 * through `innerBlocks` if they exist.
 *
 * @param {Object} blockType A block object to search for.
 * @param {Object[]} blocks  The list of blocks to look through.
 *
 * @return {boolean} Whether the blockType is found.
 */
function hasBlockType( blockType, blocks = [] ) {
	if ( ! blocks.length ) {
		return false;
	}
	if ( blocks.some( ( { name } ) => name === blockType.name ) ) {
		return true;
	}
	for ( let i = 0; i < blocks.length; i++ ) {
		if ( hasBlockType( blockType, blocks[ i ].innerBlocks ) ) {
			return true;
		}
	}

	return false;
}

export default function AutoBlockUninstaller() {
	const { uninstallBlockType } = useDispatch( 'core/block-directory' );
	const usedBlocks = useSelect( ( select ) =>
		select( 'core/block-editor' ).getBlocks()
	);

	const shouldRemoveBlockTypes = useSelect( ( select ) => {
		const { isAutosavingPost, isSavingPost } = select( 'core/editor' );
		return isSavingPost() && ! isAutosavingPost();
	} );

	const unusedBlockTypes = useSelect(
		( select ) => {
			const { getInstalledBlockTypes } = select( 'core/block-directory' );
			const installedBlocks = getInstalledBlockTypes();

			const blockList = [];
			installedBlocks.forEach( ( blockType ) => {
				if ( ! hasBlockType( blockType, usedBlocks ) ) {
					blockList.push( blockType );
				}
			} );

			return blockList;
		},
		[ usedBlocks ]
	);

	useEffect( () => {
		if ( shouldRemoveBlockTypes && unusedBlockTypes.length ) {
			unusedBlockTypes.forEach( ( blockType ) => {
				uninstallBlockType( blockType );
				unregisterBlockType( blockType.name );
			} );
		}
	}, [ shouldRemoveBlockTypes ] );

	return null;
}
