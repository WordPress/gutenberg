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

			// Only remove the native selection when it does not already span
			// the multi-selected blocks. When it does, the multi-selection
			// was made natively, and the gesture that makes it can still be
			// in progress: on a slow machine the selection change reaches
			// the store before the mouse is released, and removing the
			// ranges then destroys the selection being made.
			const { anchorNode, focusNode } = defaultView.getSelection();
			const firstElement = ownerDocument.getElementById(
				'block-' + multiSelectedBlockClientIds[ 0 ]
			);
			const lastElement = ownerDocument.getElementById(
				'block-' + multiSelectedBlockClientIds[ length - 1 ]
			);

			if (
				anchorNode &&
				focusNode &&
				( ( firstElement?.contains( anchorNode ) &&
					lastElement?.contains( focusNode ) ) ||
					( firstElement?.contains( focusNode ) &&
						lastElement?.contains( anchorNode ) ) )
			) {
				return;
			}

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
