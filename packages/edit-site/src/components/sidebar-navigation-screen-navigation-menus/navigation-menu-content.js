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
			const { __unstableGetClientIdsTree, areInnerBlocksControlled } =
				select( blockEditorStore );
			return {
				clientIdsTree: __unstableGetClientIdsTree( rootClientId ),

				// This is a small hack to wait for the navigation block
				// to actually load its inner blocks.
				isLoading: ! areInnerBlocksControlled( rootClientId ),
			};
		},
		[ rootClientId ]
	);
	const { replaceBlock, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const { OffCanvasEditor, LeafMoreMenu } = unlock( blockEditorPrivateApis );

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
					LeafMoreMenu={ LeafMoreMenu }
					showAppender={ false }
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
