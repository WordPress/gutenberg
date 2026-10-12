import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { toRecord } from '../rich-text/utils';
import { setContentEditableWrapper } from './utils';

const { getDomPosition } = unlock( richTextPrivateApis );

function selector( select ) {
	const {
		isMultiSelecting,
		getMultiSelectedBlockClientIds,
		hasMultiSelection,
		getSelectedBlockClientId,
		getSelectedBlocksInitialCaretPosition,
		__unstableIsFullySelected,
		getSelectionStart,
		getSelectionEnd,
		getBlockAttributes,
	} = select( blockEditorStore );
	const selectionStart = getSelectionStart();
	const selectionEnd = getSelectionEnd();
	const isFullSelection = __unstableIsFullySelected();
	const isTextSelection =
		hasMultiSelection() &&
		! isFullSelection &&
		selectionStart.attributeKey !== undefined &&
		selectionEnd.attributeKey !== undefined &&
		selectionStart.offset !== undefined &&
		selectionEnd.offset !== undefined;

	return {
		isMultiSelecting: isMultiSelecting(),
		multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
		hasMultiSelection: hasMultiSelection(),
		selectedBlockClientId: getSelectedBlockClientId(),
		initialPosition: getSelectedBlocksInitialCaretPosition(),
		isFullSelection,
		selectionStart,
		selectionEnd,
		startValue: isTextSelection
			? getBlockAttributes( selectionStart.clientId )?.[
					selectionStart.attributeKey
				]
			: undefined,
		endValue: isTextSelection
			? getBlockAttributes( selectionEnd.clientId )?.[
					selectionEnd.attributeKey
				]
			: undefined,
	};
}

function getFieldElement( root, { clientId, attributeKey } ) {
	return root.querySelector(
		`[data-block="${ clientId }"][data-wp-block-attribute-key="${ attributeKey }"], [data-block="${ clientId }"] [data-wp-block-attribute-key="${ attributeKey }"]`
	);
}

function getPosition( value, offset, element ) {
	const record = toRecord( value );
	return getDomPosition(
		record,
		Math.min( offset, record.text.length ),
		element
	);
}

/**
 * Whether the element has focus, or it is inside the editing host that has it.
 *
 * @param {HTMLElement} element Element.
 *
 * @return {boolean} Whether it has focus.
 */
function hasFocus( element ) {
	const { activeElement } = element.ownerDocument;
	return (
		activeElement === element ||
		( activeElement?.isContentEditable &&
			element.contains( activeElement ) )
	);
}

export default function useMultiSelection() {
	const {
		initialPosition,
		isMultiSelecting,
		multiSelectedBlockClientIds,
		hasMultiSelection,
		selectedBlockClientId,
		isFullSelection,
		selectionStart,
		selectionEnd,
		startValue,
		endValue,
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

			// A text selection across blocks is set from the store, as rich
			// text does within a block. Changing the formats rerenders the
			// text nodes, which moves the native selection; the store still
			// has it. It also puts the selection back after undo.
			if ( ! isFullSelection ) {
				if (
					startValue === undefined ||
					endValue === undefined ||
					! hasFocus( node )
				) {
					return;
				}
				const startElement = getFieldElement( node, selectionStart );
				const endElement = getFieldElement( node, selectionEnd );
				if ( ! startElement || ! endElement ) {
					return;
				}
				const start = getPosition(
					startValue,
					selectionStart.offset,
					startElement
				);
				const end = getPosition(
					endValue,
					selectionEnd.offset,
					endElement
				);
				const selection = defaultView.getSelection();
				if (
					selection.anchorNode === start.node &&
					selection.anchorOffset === start.offset &&
					selection.focusNode === end.node &&
					selection.focusOffset === end.offset
				) {
					return;
				}
				setContentEditableWrapper( node, true );
				selection.setBaseAndExtent(
					start.node,
					start.offset,
					end.node,
					end.offset
				);
				return;
			}

			// Allow cross contentEditable selection by temporarily making
			// all content editable. We can't rely on using the store and
			// React because re-rending happens too slowly. We need to be
			// able to select across instances immediately.
			// For some browsers, like Safari, it is important that focus
			// happens BEFORE selection removal.
			setContentEditableWrapper( node, true );

			defaultView.getSelection().removeAllRanges();
		},
		[
			hasMultiSelection,
			isMultiSelecting,
			multiSelectedBlockClientIds,
			selectedBlockClientId,
			initialPosition,
			isFullSelection,
			selectionStart,
			selectionEnd,
			startValue,
			endValue,
		]
	);
}
