/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

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
			hasMultiSelection,
			__unstableGetEditorMode,
			isTyping,
		} = select( blockEditorStore );

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
		const maybeShowBreadcrumb =
			hasSelectedBlock &&
			! hasMultiSelection() &&
			editorMode === 'navigation';

		const isZoomOut = editorMode === 'zoom-out';
		const _showZoomOutToolbar =
			isZoomOut &&
			block?.attributes?.align === 'full' &&
			! _showEmptyBlockSideInserter &&
			! maybeShowBreadcrumb;
		const _showBlockToolbarPopover =
			! _showZoomOutToolbar &&
			! getSettings().hasFixedToolbar &&
			! _showEmptyBlockSideInserter &&
			hasSelectedBlock &&
			! isEmptyDefaultBlock &&
			! maybeShowBreadcrumb;

		return {
			showEmptyBlockSideInserter: _showEmptyBlockSideInserter,
			showBreadcrumb:
				! _showEmptyBlockSideInserter && maybeShowBreadcrumb,
			showBlockToolbarPopover: _showBlockToolbarPopover,
			showZoomOutToolbar: _showZoomOutToolbar,
		};
	}, [] );
}
