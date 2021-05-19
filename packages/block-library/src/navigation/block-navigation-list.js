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
	const { blocks, selectedBlockClientId } = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				__unstableGetClientIdsTree,
			} = select( blockEditorStore );

			return {
				blocks: __unstableGetClientIdsTree( clientId ),
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		},
		[ clientId ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	return (
		<__experimentalBlockNavigationTree
			blocks={ blocks }
			selectedBlockClientIds={ [ selectedBlockClientId ] }
			selectBlock={ selectBlock }
			__experimentalFeatures={ __experimentalFeatures }
			showNestedBlocks
			showAppender
			showBlockMovers
		/>
	);
}
