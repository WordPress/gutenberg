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
		getSelectionStart,
	} = select( blockEditorStore );

	return {
		isMultiSelecting: isMultiSelecting(),
		multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
		hasMultiSelection: hasMultiSelection(),
		selectedBlockClientId: getSelectedBlockClientId(),
		initialPosition: getSelectedBlocksInitialCaretPosition(),
		isFullSelection: __unstableIsFullySelected(),
		isShellSelection: ! getSelectionStart().attributeKey,
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
		isShellSelection,
	} = useSelect( selector, [] );

	/**
	 * When the component updates, and there is multi selection, we need to
	 * select the entire block contents.
	 */
	return useRefEffect(
		( node ) => {
			// Allow initialPosition to bypass focus behavior. This is useful
			// for the list view or other areas where we don't want to transfer
			// focus to the editor canvas.
			if ( initialPosition === undefined || initialPosition === null ) {
				return;
			}

			if ( isMultiSelecting ) {
				return;
			}

			if ( ! hasMultiSelection ) {
				// A single block selected as a block (without a text
				// selection within) needs no editing host.
				if ( selectedBlockClientId && isShellSelection ) {
					setContentEditableWrapper( node, false );
				}
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
			// happens BEFORE the selection is read or changed.
			setContentEditableWrapper( node, true );

			// The native selection is deliberately left alone: it is the
			// selection the user made, presented as selected blocks (the
			// text highlight is transparent within them). It stays real,
			// so gestures can continue from it, and the focused editing
			// host is never left without a selection, which browsers
			// respond to by inserting a caret at its start and scrolling
			// it into view.
		},
		[
			hasMultiSelection,
			isMultiSelecting,
			multiSelectedBlockClientIds,
			selectedBlockClientId,
			initialPosition,
			isFullSelection,
			isShellSelection,
		]
	);
}
