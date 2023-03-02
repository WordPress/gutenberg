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

export default function NavigationMenuContent( { onSelect } ) {
	const { clientIdsTree } = useSelect( ( select ) => {
		const { __unstableGetClientIdsTree } = select( blockEditorStore );
		return {
			clientIdsTree: __unstableGetClientIdsTree(),
		};
	} );

	const { OffCanvasEditor, LeafMoreMenu } = unlock( blockEditorPrivateApis );

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			<OffCanvasEditor
				blocks={ clientIdsTree }
				onSelect={ onSelect }
				LeafMoreMenu={ LeafMoreMenu }
				showAppender={ false }
			/>
			<div style={ { display: 'none' } }>
				<BlockTools>
					<BlockList />
				</BlockTools>
			</div>
		</>
	);
}
