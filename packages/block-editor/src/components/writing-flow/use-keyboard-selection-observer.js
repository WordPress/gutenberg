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

function extractSelectionStartNode( selection ) {
	const { anchorNode, anchorOffset } = selection;

	if ( anchorNode.nodeType === anchorNode.TEXT_NODE ) {
		return anchorNode;
	}

	return anchorNode.childNodes[ anchorOffset ];
}

function extractSelectionEndNode( selection ) {
	const { focusNode, focusOffset } = selection;

	if ( focusNode.nodeType === focusNode.TEXT_NODE ) {
		return focusNode;
	}

	return focusNode.childNodes[ focusOffset - 1 ];
}

/**
 * Sets the `contenteditable` wrapper element to `value`.
 *
 * @param {HTMLElement} node  Block element.
 * @param {boolean}     value `contentEditable` value (true or false)
 */
function setContentEditableWrapper( node, value ) {
	// Since `closest` considers `node` as a candidate, use `parentElement`.
	node.contentEditable = value;
	// Firefox doesn't automatically move focus.
	if ( value ) node.focus();
}

/**
 * Sets a multi-selection based on the native selection across blocks.
 */
export default function useKeyboardSelectionObserver() {
	const { multiSelect, selectBlock, selectionChange } = useDispatch(
		blockEditorStore
	);
	const { getBlockParents, isSelectionMergeable } = useSelect(
		blockEditorStore
	);
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
					const depth =
						Math.min( startPath.length, endPath.length ) - 1;

					// Check if selection is already set by rich text.
					multiSelect( startPath[ depth ], endPath[ depth ] );

					if ( ! isSelectionMergeable() ) {
						selectionChange( {
							start: {
								clientId: startPath[ depth ],
							},
							end: {
								clientId: endPath[ depth ],
							},
						} );
					}
				}
			}

			ownerDocument.addEventListener(
				'selectionchange',
				onSelectionChange
			);

			return () => {
				ownerDocument.removeEventListener(
					'selectionchange',
					onSelectionChange
				);
			};
		},
		[
			multiSelect,
			selectBlock,
			selectionChange,
			getBlockParents,
			isSelectionMergeable,
		]
	);
}
