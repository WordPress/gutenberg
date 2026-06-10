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
import { isInsideRootBlock, getBlockClientId } from '../../utils/dom';

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

			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;
			const selection = defaultView.getSelection();

			// When the writing flow wrapper is the editing host, keydown
			// targets the wrapper rather than the inner rich text. Resolve the
			// editable element from the selection so the gradual select-all
			// steps operate per block.
			const { anchorNode } = selection;
			const anchorElement =
				anchorNode?.nodeType === anchorNode?.ELEMENT_NODE
					? anchorNode
					: anchorNode?.parentElement;
			const editable =
				anchorElement?.closest( '[data-wp-block-attribute-key]' ) ??
				event.target;

			const selectedClientIds = getSelectedBlockClientIds();

			// Only carve out a block's text content on the first select-all when
			// the selection is within a rich text (resolved from the anchor).
			// When a block is selected at the block level (no text caret) the
			// editable falls back to the event target, and we should escalate
			// the selection rather than re-select content.
			if (
				editable !== event.target &&
				selectedClientIds.length < 2 &&
				! isEntirelySelected( editable )
			) {
				// If the wrapper is the editing host, the native select-all
				// would select the entire wrapper (all blocks) at once. Select
				// just this block's content first, preserving the gradual
				// select-all behavior.
				if ( ownerDocument.activeElement === node ) {
					event.preventDefault();
					const range = ownerDocument.createRange();
					range.selectNodeContents( editable );
					selection.removeAllRanges();
					selection.addRange( range );
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
					// Select the parent as a unit without an initial caret
					// position: a caret would otherwise be placed into the
					// first child, collapsing the block-level selection.
					selectBlock( rootClientId, null );
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
