/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	BlockTools,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

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

	const { OffCanvasEditor, LeafMoreMenu } = unlock( blockEditorPrivateApis );

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ isLoading && <NavigationMenuLoader /> }
			{ ! isLoading && (
				<OffCanvasEditor
					blocks={ clientIdsTree }
					onSelect={ onSelect }
					LeafMoreMenu={ LeafMoreMenu }
					showAppender={ false }
				/>
			) }
			<div style={ { display: 'none' } }>
				<BlockTools>
					<BlockList />
				</BlockTools>
			</div>
		</>
	);
}
