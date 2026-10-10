import { useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Source of truth for which block tools are showing in the block editor.
 *
 * @return {Object} Object of which block tools will be shown.
 */
export function useShowBlockTools() {
	return useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
			getBlock,
			getBlockMode,
			getSettings,
			isTyping,
			isBlockInterfaceHidden,
			hasMultiSelection,
		} = unlock( select( blockEditorStore ) );

		const clientId =
			getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

		const block = getBlock( clientId );
		const hasSelectedBlock = !! clientId && !! block;
		const isEmptyDefaultBlock =
			hasSelectedBlock &&
			isUnmodifiedDefaultBlock( block, 'content' ) &&
			getBlockMode( clientId ) !== 'html';
		const _showEmptyBlockSideInserter =
			clientId && ! isTyping() && isEmptyDefaultBlock;
		const _showBlockToolbarPopover =
			! isBlockInterfaceHidden() &&
			! getSettings().hasFixedToolbar &&
			! _showEmptyBlockSideInserter &&
			hasSelectedBlock &&
			! isEmptyDefaultBlock;

		// The label names the single selected block on the canvas. An empty
		// default block shows its placeholder instead, and typing hides it
		// along with the rest of the block UI.
		const _showBlockSelectionLabel =
			! isBlockInterfaceHidden() &&
			hasSelectedBlock &&
			! hasMultiSelection() &&
			! isEmptyDefaultBlock &&
			! isTyping();

		return {
			showEmptyBlockSideInserter: _showEmptyBlockSideInserter,
			showBlockToolbarPopover: _showBlockToolbarPopover,
			showBlockSelectionLabel: _showBlockSelectionLabel,
		};
	}, [] );
}
