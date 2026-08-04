/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';

function selector( select ) {
	const {
		isMultiSelecting,
		getMultiSelectedBlockClientIds,
		hasMultiSelection,
		getSelectedBlockClientId,
		getSelectedBlocksInitialCaretPosition,
		__unstableIsFullySelected,
	} = select( blockEditorStore );

	return {
		isMultiSelecting: isMultiSelecting(),
		multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
		hasMultiSelection: hasMultiSelection(),
		selectedBlockClientId: getSelectedBlockClientId(),
		initialPosition: getSelectedBlocksInitialCaretPosition(),
		isFullSelection: __unstableIsFullySelected(),
	};
}

export default function useMultiSelection() {
	const {
		initialPosition,
		isMultiSelecting,
		multiSelectedBlockClientIds,
		hasMultiSelection,
		selectedBlockClientId,
		isFullSelection,
	} = useSelect( selector, [] );

	/**
	 * When the component updates, and there is multi selection, we need to
	 * select the entire block contents.
	 */
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			// Allow initialPosition to bypass focus behavior. This is useful
			// for the list view or other areas where we don't want to transfer
			// focus to the editor canvas.
			if ( initialPosition === undefined || initialPosition === null ) {
				return;
			}

			if ( ! hasMultiSelection || isMultiSelecting ) {
				return;
			}

			const { length } = multiSelectedBlockClientIds;

			if ( length < 2 ) {
				return;
			}

			if ( ! isFullSelection ) {
				return;
			}

			// Allow cross contentEditable selection by temporarily making
			// all content editable. We can't rely on using the store and
			// React because re-rending happens too slowly. We need to be
			// able to select across instances immediately.
			// For some browsers, like Safari, it is important that focus
			// happens BEFORE selection removal.
			setContentEditableWrapper( node, true );

			// Make the native selection span the multi-selected blocks
			// instead of clearing it: an editing host that holds focus with
			// no selection gets a caret re-seeded at its start (Chromium),
			// which the first block's rich text then syncs to the store,
			// collapsing the multi-selection. A selection that agrees with
			// the store is stable, and native copy matches what is selected.
			const firstElement = ownerDocument.getElementById(
				'block-' + multiSelectedBlockClientIds[ 0 ]
			);
			const lastElement = ownerDocument.getElementById(
				'block-' + multiSelectedBlockClientIds[ length - 1 ]
			);

			if ( firstElement && lastElement ) {
				const selection = defaultView.getSelection();
				const range = ownerDocument.createRange();
				range.setStartBefore( firstElement );
				range.setEndAfter( lastElement );
				selection.removeAllRanges();
				selection.addRange( range );
			}
		},
		[
			hasMultiSelection,
			isMultiSelecting,
			multiSelectedBlockClientIds,
			selectedBlockClientId,
			initialPosition,
			isFullSelection,
		]
	);
}
