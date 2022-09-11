/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

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
			node.contentEditable = true;

			// For some browsers, like Safari, it is important that focus
			// happens BEFORE selection removal.
			node.focus();

			defaultView.getSelection().removeAllRanges();
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
