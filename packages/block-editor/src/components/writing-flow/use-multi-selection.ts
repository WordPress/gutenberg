import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import type { SelectFunction } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';

function selector( select: SelectFunction ) {
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
	return useRefEffect< HTMLElement >(
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

			// A text selection across blocks needs the wrapper as the editing
			// host, also when it is set from the store, as after undo. The
			// fields at either end put the native selection in place.
			if ( ! isFullSelection ) {
				if ( node.contains( ownerDocument.activeElement ) ) {
					setContentEditableWrapper( node, true );
				}
				return;
			}

			// Allow cross contentEditable selection by temporarily making
			// all content editable. We can't rely on using the store and
			// React because re-rending happens too slowly. We need to be
			// able to select across instances immediately.
			// For some browsers, like Safari, it is important that focus
			// happens BEFORE selection removal.
			setContentEditableWrapper( node, true );

			// A mounted element's window has a selection.
			const selection = defaultView!.getSelection()!;
			selection.removeAllRanges();

			// Select the blocks natively too, so that the browser treats a
			// press on them (e.g. to open the context menu) as one within
			// the selection, and keeps it.
			const first = ownerDocument.getElementById(
				`block-${ multiSelectedBlockClientIds[ 0 ] }`
			);
			const last = ownerDocument.getElementById(
				`block-${ multiSelectedBlockClientIds[ length - 1 ] }`
			);

			// The blocks may not be rendered yet, e.g. when dragged into
			// another block.
			if ( first && last ) {
				const range = ownerDocument.createRange();
				range.setStart( first, 0 );
				range.setEnd( last, last.childNodes.length );
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
