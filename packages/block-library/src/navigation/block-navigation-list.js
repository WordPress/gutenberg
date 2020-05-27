/**
 * WordPress dependencies
 */
import { __experimentalBlockNavigationTree } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

export default function BlockNavigationList( {
	clientId,
	__experimentalWithBlockNavigationSlots,
} ) {
	const { block, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, getBlock } = select(
				'core/block-editor'
			);

			return {
				block: getBlock( clientId ),
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		},
		[ clientId ]
	);

	const { selectBlock } = useDispatch( 'core/block-editor' );

	return (
		<__experimentalBlockNavigationTree
			blocks={ [ block ] }
			selectedBlockClientId={ selectedBlockClientId }
			selectBlock={ selectBlock }
			__experimentalWithBlockNavigationSlots={
				__experimentalWithBlockNavigationSlots
			}
			showNestedBlocks
			showAppender
			showBlockMovers
		/>
	);
}
