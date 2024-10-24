/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
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
			__unstableGetEditorMode,
			isTyping,
		} = unlock( select( blockEditorStore ) );

		const clientId =
			getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

		const block = getBlock( clientId );
		const editorMode = __unstableGetEditorMode();
		const hasSelectedBlock = !! clientId && !! block;
		const isEmptyDefaultBlock =
			hasSelectedBlock &&
			isUnmodifiedDefaultBlock( block ) &&
			getBlockMode( clientId ) !== 'html';
		const _showEmptyBlockSideInserter =
			clientId &&
			! isTyping() &&
			editorMode === 'edit' &&
			isEmptyDefaultBlock;
		const _showBlockToolbarPopover =
			! getSettings().hasFixedToolbar &&
			! _showEmptyBlockSideInserter &&
			hasSelectedBlock &&
			! isEmptyDefaultBlock;

		return {
			showEmptyBlockSideInserter: _showEmptyBlockSideInserter,
			showBlockToolbarPopover: _showBlockToolbarPopover,
		};
	}, [] );
}
