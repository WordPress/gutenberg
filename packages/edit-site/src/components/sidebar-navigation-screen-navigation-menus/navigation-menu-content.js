/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	BlockTools,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { NavigationMenuLoader } from './loader';

export default function NavigationMenuContent( { rootClientId, onSelect } ) {
	const { clientIdsTree, isLoading } = useSelect(
		( select ) => {
			const {
				__unstableGetClientIdsTree,
				areInnerBlocksControlled,
				getBlocksByClientId,
			} = select( blockEditorStore );

			const filterLinksOnly = ( tree ) => {
				if ( tree.innerBlocks && tree.innerBlocks.length > 0 ) {
					tree.innerBlocks = filterLinksOnly( tree.innerBlocks );
				}
				tree = tree.filter( ( item ) => {
					const block = getBlocksByClientId( item.clientId )[ 0 ];
					return (
						block.name === 'core/navigation-link' ||
						block.name === 'core/navigation-submenu' ||
						block.name === 'core/page-list' ||
						block.name === 'core/page-list-item'
					);
				} );
				return tree;
			};
			const _clientIdsTree = filterLinksOnly(
				__unstableGetClientIdsTree( rootClientId )
			);
			return {
				clientIdsTree: _clientIdsTree,

				// This is a small hack to wait for the navigation block
				// to actually load its inner blocks.
				isLoading: ! areInnerBlocksControlled( rootClientId ),
			};
		},
		[ rootClientId ]
	);
	const { replaceBlock, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const { OffCanvasEditor } = unlock( blockEditorPrivateApis );

	const offCanvasOnselect = useCallback(
		( block ) => {
			if (
				block.name === 'core/navigation-link' &&
				! block.attributes.url
			) {
				__unstableMarkNextChangeAsNotPersistent();
				replaceBlock(
					block.clientId,
					createBlock( 'core/navigation-link', block.attributes )
				);
			} else {
				onSelect( block );
			}
		},
		[ onSelect, __unstableMarkNextChangeAsNotPersistent, replaceBlock ]
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ isLoading && <NavigationMenuLoader /> }
			{ ! isLoading && (
				<OffCanvasEditor
					blocks={ clientIdsTree }
					onSelect={ offCanvasOnselect }
					LeafMoreMenu={ false }
					showAppender={ false }
					enableDragAndDrop={ false }
				/>
			) }
			<div style={ { visibility: 'hidden' } }>
				<BlockTools>
					<BlockList />
				</BlockTools>
			</div>
		</>
	);
}
