/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { create } from '@wordpress/rich-text';
import { isSelectionForward } from '@wordpress/dom';

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

	// When the selection is forward (the selection ends with the focus node),
	// the selection may extend into the next element with an offset of 0. This
	// may trigger multi selection even though the selection does not visually
	// end in the next block.
	if ( focusOffset === 0 && isSelectionForward( selection ) ) {
		return focusNode.previousSibling ?? focusNode.parentElement;
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
	if ( node.contentEditable !== String( value ) ) {
		node.contentEditable = value;

		// Firefox doesn't automatically move focus.
		if ( value ) {
			node.focus();
		}
	}
}

function getRichTextElement( node ) {
	const element =
		node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
	return element?.closest( '[data-wp-block-attribute-key]' );
}

/**
 * Sets a multi-selection based on the native selection across blocks.
 */
export default function useSelectionObserver() {
	const { multiSelect, selectBlock, selectionChange } =
		useDispatch( blockEditorStore );
	const { getBlockParents, getBlockSelectionStart, isMultiSelecting } =
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

				const startNode = extractSelectionStartNode( selection );
				const endNode = extractSelectionEndNode( selection );

				if (
					! node.contains( startNode ) ||
					! node.contains( endNode )
				) {
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
					if (
						node.contentEditable === 'true' &&
						! isMultiSelecting()
					) {
						setContentEditableWrapper( node, false );
						let element =
							startNode.nodeType === startNode.ELEMENT_NODE
								? startNode
								: startNode.parentElement;
						element = element?.closest( '[contenteditable]' );
						element?.focus();
					}
					return;
				}

				let startClientId = getBlockClientId( startNode );
				let endClientId = getBlockClientId( endNode );

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
					if ( ! isMultiSelecting() ) {
						selectBlock( startClientId );
					} else {
						multiSelect( startClientId, startClientId );
					}
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

					if (
						startPath[ depth ] !== startClientId ||
						endPath[ depth ] !== endClientId
					) {
						multiSelect( startPath[ depth ], endPath[ depth ] );
						return;
					}

					const richTextElementStart =
						getRichTextElement( startNode );
					const richTextElementEnd = getRichTextElement( endNode );

					if ( richTextElementStart && richTextElementEnd ) {
						const range = selection.getRangeAt( 0 );
						const richTextDataStart = create( {
							element: richTextElementStart,
							range,
							__unstableIsEditableTree: true,
						} );
						const richTextDataEnd = create( {
							element: richTextElementEnd,
							range,
							__unstableIsEditableTree: true,
						} );

						const startOffset =
							richTextDataStart.start ?? richTextDataStart.end;
						const endOffset =
							richTextDataEnd.start ?? richTextDataEnd.end;
						selectionChange( {
							start: {
								clientId: startClientId,
								attributeKey:
									richTextElementStart.dataset
										.wpBlockAttributeKey,
								offset: startOffset,
							},
							end: {
								clientId: endClientId,
								attributeKey:
									richTextElementEnd.dataset
										.wpBlockAttributeKey,
								offset: endOffset,
							},
						} );
					} else {
						multiSelect( startClientId, endClientId );
					}
				}
			}

			ownerDocument.addEventListener(
				'selectionchange',
				onSelectionChange
			);
			defaultView.addEventListener( 'mouseup', onSelectionChange );
			return () => {
				ownerDocument.removeEventListener(
					'selectionchange',
					onSelectionChange
				);
				defaultView.removeEventListener( 'mouseup', onSelectionChange );
			};
		},
		[ multiSelect, selectBlock, selectionChange, getBlockParents ]
	);
}
