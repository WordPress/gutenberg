/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getBlockClientId } from '../../utils/dom';

/**
 * Extract the selection start node from the selection. When the anchor node is
 * not a text node, the selection offset is the index of a child node.
 *
 * @param {Selection} selection The selection.
 *
 * @return {Element} The selection start node.
 */
function extractSelectionStartNode( selection ) {
	const { anchorNode, anchorOffset } = selection;

	if ( anchorNode.nodeType === anchorNode.TEXT_NODE ) {
		return anchorNode;
	}

	if ( anchorOffset === 0 ) {
		return anchorNode;
	}

	return anchorNode.childNodes[ anchorOffset - 1 ];
}

/**
 * Extract the selection end node from the selection. When the focus node is not
 * a text node, the selection offset is the index of a child node. The selection
 * reaches up to but excluding that child node.
 *
 * @param {Selection} selection The selection.
 *
 * @return {Element} The selection start node.
 */
function extractSelectionEndNode( selection ) {
	const { focusNode, focusOffset } = selection;

	if ( focusNode.nodeType === focusNode.TEXT_NODE ) {
		return focusNode;
	}

	if ( focusOffset === focusNode.childNodes.length ) {
		return focusNode;
	}

	return focusNode.childNodes[ focusOffset ];
}

function findDepth( a, b ) {
	let depth = 0;

	while ( a[ depth ] === b[ depth ] ) {
		depth++;
	}

	return depth;
}

/**
 * Sets the `contenteditable` wrapper element to `value`.
 *
 * @param {HTMLElement} node  Block element.
 * @param {boolean}     value `contentEditable` value (true or false)
 */
function setContentEditableWrapper( node, value ) {
	// Since we are calling this on every selection change, check if the value
	// needs to be updated first because it trigger the browser to recalculate
	// style.
	if ( node.contentEditable !== String( value ) )
		node.contentEditable = value;
	// Firefox doesn't automatically move focus.
	if ( value ) node.focus();
}

/**
 * Sets a multi-selection based on the native selection across blocks.
 */
export default function useSelectionObserver() {
	const { multiSelect, selectBlock, selectionChange } =
		useDispatch( blockEditorStore );
	const { getBlockParents, getBlockSelectionStart } =
		useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			function onSelectionChange( event ) {
				const selection = defaultView.getSelection();

				if ( ! selection.rangeCount ) {
					return;
				}

				// If selection is collapsed and we haven't used `shift+click`,
				// end multi selection and disable the contentEditable wrapper.
				// We have to check about `shift+click` case because elements
				// that don't support text selection might be involved, and we might
				// update the clientIds to multi-select blocks.
				// For now we check if the event is a `mouse` event.
				const isClickShift = event.shiftKey && event.type === 'mouseup';
				if ( selection.isCollapsed && ! isClickShift ) {
					setContentEditableWrapper( node, false );
					return;
				}

				let startClientId = getBlockClientId(
					extractSelectionStartNode( selection )
				);
				let endClientId = getBlockClientId(
					extractSelectionEndNode( selection )
				);
				// If the selection has changed and we had pressed `shift+click`,
				// we need to check if in an element that doesn't support
				// text selection has been clicked.
				if ( isClickShift ) {
					const selectedClientId = getBlockSelectionStart();
					const clickedClientId = getBlockClientId( event.target );
					// `endClientId` is not defined if we end the selection by clicking a non-selectable block.
					// We need to check if there was already a selection with a non-selectable focusNode.
					const focusNodeIsNonSelectable =
						clickedClientId !== endClientId;
					if (
						( startClientId === endClientId &&
							selection.isCollapsed ) ||
						! endClientId ||
						focusNodeIsNonSelectable
					) {
						endClientId = clickedClientId;
					}
					// Handle the case when we have a non-selectable block
					// selected and click another one.
					if ( startClientId !== selectedClientId ) {
						startClientId = selectedClientId;
					}
				}

				// If the selection did not involve a block, return.
				if (
					startClientId === undefined &&
					endClientId === undefined
				) {
					setContentEditableWrapper( node, false );
					return;
				}

				const isSingularSelection = startClientId === endClientId;
				if ( isSingularSelection ) {
					selectBlock( startClientId );
				} else {
					const startPath = [
						...getBlockParents( startClientId ),
						startClientId,
					];
					const endPath = [
						...getBlockParents( endClientId ),
						endClientId,
					];
					const depth = findDepth( startPath, endPath );

					multiSelect( startPath[ depth ], endPath[ depth ] );
				}
			}

			function addListeners() {
				ownerDocument.addEventListener(
					'selectionchange',
					onSelectionChange
				);
				defaultView.addEventListener( 'mouseup', onSelectionChange );
			}

			function removeListeners() {
				ownerDocument.removeEventListener(
					'selectionchange',
					onSelectionChange
				);
				defaultView.removeEventListener( 'mouseup', onSelectionChange );
			}

			function resetListeners() {
				removeListeners();
				addListeners();
			}

			addListeners();
			// We must allow rich text to set selection first. This ensures that
			// our `selectionchange` listener is always reset to be called after
			// the rich text one.
			node.addEventListener( 'focusin', resetListeners );
			return () => {
				removeListeners();
				node.removeEventListener( 'focusin', resetListeners );
			};
		},
		[ multiSelect, selectBlock, selectionChange, getBlockParents ]
	);
}
