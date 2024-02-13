/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useHasBlockToolbar } from '../block-toolbar/use-has-block-toolbar';

/**
 * Returns true if the block toolbar should be able to receive focus.
 *
 * @return {boolean} Whether the block toolbar should be able to receive focus
 */
export function useShowBlockTools() {
	const hasBlockToolbar = useHasBlockToolbar();

	return useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				getFirstMultiSelectedBlockClientId,
				getBlock,
				getSettings,
				hasMultiSelection,
				__unstableGetEditorMode,
				isTyping,
			} = select( blockEditorStore );

			const clientId =
				getSelectedBlockClientId() ||
				getFirstMultiSelectedBlockClientId();

			const { name = '', attributes = {} } = getBlock( clientId ) || {};
			const editorMode = __unstableGetEditorMode();
			const hasSelectedBlock = clientId && name;
			const isEmptyDefaultBlock = isUnmodifiedDefaultBlock( {
				name,
				attributes,
			} );
			const _showEmptyBlockSideInserter =
				clientId &&
				! isTyping() &&
				editorMode === 'edit' &&
				isUnmodifiedDefaultBlock( { name, attributes } );
			const maybeShowBreadcrumb =
				hasSelectedBlock &&
				! hasMultiSelection() &&
				( editorMode === 'navigation' || editorMode === 'zoom-out' );

			return {
				showEmptyBlockSideInserter: _showEmptyBlockSideInserter,
				showBreadcrumb:
					! _showEmptyBlockSideInserter && maybeShowBreadcrumb,
				showBlockToolbarPopover:
					hasBlockToolbar &&
					! getSettings().hasFixedToolbar &&
					! _showEmptyBlockSideInserter &&
					hasSelectedBlock &&
					! isEmptyDefaultBlock &&
					! maybeShowBreadcrumb,
				showFixedToolbar:
					hasBlockToolbar &&
					!! clientId &&
					getSettings().hasFixedToolbar,
			};
		},
		[ hasBlockToolbar ]
	);
}
