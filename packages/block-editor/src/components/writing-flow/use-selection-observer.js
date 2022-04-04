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

	return anchorNode.childNodes[ anchorOffset ];
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

	return focusNode.childNodes[ focusOffset - 1 ];
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
	node.contentEditable = value;
	// Firefox doesn't automatically move focus.
	if ( value ) node.focus();
}

/**
 * Sets a multi-selection based on the native selection across blocks.
 */
export default function useSelectionObserver() {
	const { multiSelect, selectBlock, selectionChange } = useDispatch(
		blockEditorStore
	);
	const { getBlockParents } = useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			function onSelectionChange() {
				const selection = defaultView.getSelection();

				// If no selection is found, end multi selection and disable the
				// contentEditable wrapper.
				if ( ! selection.rangeCount || selection.isCollapsed ) {
					setContentEditableWrapper( node, false );
					return;
				}

				const clientId = getBlockClientId(
					extractSelectionStartNode( selection )
				);
				const endClientId = getBlockClientId(
					extractSelectionEndNode( selection )
				);
				const isSingularSelection = clientId === endClientId;

				if ( isSingularSelection ) {
					selectBlock( clientId );
				} else {
					const startPath = [
						...getBlockParents( clientId ),
						clientId,
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
