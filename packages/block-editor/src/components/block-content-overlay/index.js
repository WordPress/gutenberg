/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useBlockOverlayActive( clientId ) {
	return useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				canEditBlock,
				areInnerBlocksControlled,
				__unstableGetEditorMode,
				getBlockRootClientId,
			} = select( blockEditorStore );

			// If the block editing is locked, the block overlay is always active.
			if ( ! canEditBlock( clientId ) ) {
				return true;
			}

			const editorMode = __unstableGetEditorMode();

			// In zoom-out mode, the block overlay is always active for top level blocks.
			if (
				editorMode === 'zoom-out' &&
				! getBlockRootClientId( clientId )
			) {
				return true;
			}

			// In navigation mode, the block overly is active when
			// the block is not selected (or one of its children selected)
			// The same behavior is also enabled in all modes for blocks
			// that have controlled children (reusable block, template part, navigation)
			const shouldEnableIfUnselected =
				editorMode === 'navigation' ||
				areInnerBlocksControlled( clientId );

			return (
				shouldEnableIfUnselected &&
				! isBlockSelected( clientId ) &&
				! hasSelectedInnerBlock( clientId, true )
			);
		},
		[ clientId ]
	);
}
