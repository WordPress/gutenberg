/**
 * WordPress dependencies
 */
import {
	__experimentalBlockNavigationTree,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

export default function BlockNavigationList( {
	clientId,
	__experimentalFeatures,
} ) {
	const { block, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, getBlock } = select(
				blockEditorStore
			);

			return {
				block: getBlock( clientId ),
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		},
		[ clientId ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	return (
		<__experimentalBlockNavigationTree
			blocks={ block.innerBlocks }
			selectedBlockClientId={ selectedBlockClientId }
			selectBlock={ selectBlock }
			__experimentalFeatures={ __experimentalFeatures }
			showNestedBlocks
			showAppender
			showBlockMovers
		/>
	);
}
