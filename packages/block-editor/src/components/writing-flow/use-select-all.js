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
import {
	isInsideRootBlock,
	getBlockClientId,
	getSelectionEditableElement,
} from '../../utils/dom';

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

			const selectedClientIds = getSelectedBlockClientIds();
			const { ownerDocument } = node;
			const selection = ownerDocument.defaultView.getSelection();
			// When the wrapper is contentEditable and holds focus (the
			// selected block supports `editableRoot`), the event targets the
			// wrapper; resolve the editable element containing the selection.
			const editable =
				( event.target === node &&
					getSelectionEditableElement( selection, node ) ) ||
				event.target;

			if (
				selectedClientIds.length < 2 &&
				! isEntirelySelected( editable )
			) {
				// While the wrapper is contentEditable, the browser default
				// would select the entire canvas. Select the contents of the
				// editable element instead, like the default does when the
				// element itself holds focus.
				if ( event.target === node && editable !== node ) {
					event.preventDefault();
					const range = ownerDocument.createRange();
					range.selectNodeContents( editable );
					selection.removeAllRanges();
					selection.addRange( range );
					// The native `selectionchange` event is asynchronous;
					// dispatch it synchronously so that listeners depending
					// on it (e.g. the rich text internal record sync) run
					// before any event following this one.
					ownerDocument.dispatchEvent(
						new Event( 'selectionchange' )
					);
				}
				return;
			}

			event.preventDefault();

			const [ firstSelectedClientId ] = selectedClientIds;
			const activeClientId = getBlockClientId(
				ownerDocument.activeElement
			);

			// Handle the case when an appender is selected.
			if (
				activeClientId &&
				activeClientId !== firstSelectedClientId &&
				! isInsideRootBlock(
					ownerDocument.getElementById(
						'block-' + firstSelectedClientId
					),
					ownerDocument.activeElement
				)
			) {
				selectBlock( activeClientId );
				return;
			}

			const rootClientId = getBlockRootClientId( firstSelectedClientId );
			const blockClientIds = getBlockOrder( rootClientId );

			// If we have selected all sibling nested blocks, try selecting up a
			// level. See: https://github.com/WordPress/gutenberg/pull/31859/
			if ( selectedClientIds.length === blockClientIds.length ) {
				if ( rootClientId ) {
					node.ownerDocument.defaultView
						.getSelection()
						.removeAllRanges();
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
