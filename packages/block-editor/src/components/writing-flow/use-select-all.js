/**
 * WordPress dependencies
 */
import { isEntirelySelected } from '@wordpress/dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { __unstableUseShortcutEventMatch as useShortcutEventMatch } from '@wordpress/keyboard-shortcuts';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getSelectionRoot } from './utils';

export default function useSelectAll() {
	const { getBlockOrder, getSelectedBlockClientIds, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { multiSelect, selectBlock } = useDispatch( blockEditorStore );
	const isMatch = useShortcutEventMatch();

	return useRefEffect( ( node ) => {
		function onKeyDown( event ) {
			if ( ! isMatch( 'core/block-editor/select-all', event ) ) {
				return;
			}

			const selectionRoot = getSelectionRoot( node.ownerDocument );
			const selectedClientIds = getSelectedBlockClientIds();

			// Abort if there is selection, but it is not within a block.
			if ( selectionRoot && ! selectedClientIds.length ) {
				return;
			}

			if (
				selectionRoot &&
				selectedClientIds.length < 2 &&
				! isEntirelySelected( selectionRoot )
			) {
				if ( node === node.ownerDocument.activeElement ) {
					event.preventDefault();
					node.ownerDocument.defaultView
						.getSelection()
						.selectAllChildren( selectionRoot );
					return;
				}

				return;
			}

			event.preventDefault();

			const [ firstSelectedClientId ] = selectedClientIds;
			const rootClientId = getBlockRootClientId( firstSelectedClientId );
			const blockClientIds = getBlockOrder( rootClientId );

			// If we have selected all sibling nested blocks, try selecting up a
			// level. See: https://github.com/WordPress/gutenberg/pull/31859/
			if ( selectedClientIds.length === blockClientIds.length ) {
				if ( rootClientId ) {
					node.ownerDocument.defaultView
						.getSelection()
						.removeAllRanges();
					node.contentEditable = 'false';
					selectBlock( rootClientId );
				}
				return;
			}

			multiSelect(
				blockClientIds[ 0 ],
				blockClientIds[ blockClientIds.length - 1 ]
			);
		}

		node.addEventListener( 'keydown', onKeyDown );

		return () => {
			node.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
