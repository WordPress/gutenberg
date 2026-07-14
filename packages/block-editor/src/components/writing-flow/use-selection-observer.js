/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import {
	create,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { isSelectionForward } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getBlockClientId } from '../../utils/dom';
import { canHostEditableRoot } from './use-editable-root';
import { setContentEditableWrapper, setShiftClickInProgress } from './utils';
import { unlock } from '../../lock-unlock';

const { ownsSelection } = unlock( richTextPrivateApis );

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
 * @param {Selection} selection     The selection.
 * @param {boolean}   isTripleClick Whether the selection comes from a triple
 *                                  click.
 *
 * @return {Element} The selection start node.
 */
function extractSelectionEndNode( selection, isTripleClick ) {
	const { focusNode, focusOffset } = selection;

	if ( focusNode.nodeType === focusNode.TEXT_NODE ) {
		return focusNode;
	}

	if ( focusOffset === focusNode.childNodes.length ) {
		return focusNode;
	}

	// A triple click selects the paragraph, but the browser extends the
	// forward selection into the next element at an offset of 0. This may
	// trigger multi selection even though the selection does not visually end
	// in the next block. Keyboard selections that legitimately extend to the
	// same boundary (e.g. Shift+ArrowDown into a focusable block, where the
	// browser reports the boundary at the element instead of its first text
	// position) must not be corrected, so only do this for triple clicks.
	if (
		focusOffset === 0 &&
		isSelectionForward( selection ) &&
		isTripleClick
	) {
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
	const blockEditorSelectors = useSelect( blockEditorStore );
	const {
		getBlockParents,
		getBlockSelectionStart,
		isMultiSelecting,
		getSelectionStart,
		getSelectionEnd,
		getSelectedBlockClientId,
	} = blockEditorSelectors;
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			let isTripleClick = false;

			function onMouseDown( event ) {
				isTripleClick = event.detail === 3;
				setShiftClickInProgress( event.shiftKey );
			}

			function onKeyDown() {
				isTripleClick = false;
				setShiftClickInProgress( false );
			}

			function onSelectionChange( event ) {
				const selection = defaultView.getSelection();

				if ( ! selection.rangeCount ) {
					return;
				}

				const startNode = extractSelectionStartNode( selection );
				const endNode = extractSelectionEndNode(
					selection,
					isTripleClick
				);

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
					const collapsedClientId = getBlockClientId( startNode );

					// If the block supports an editable root, keep (or make)
					// the wrapper contentEditable so the native selection can
					// extend across blocks. The wrapper holds focus, so rich
					// text instances don't sync the selection; do it here.
					if (
						! isMultiSelecting() &&
						collapsedClientId &&
						// Only keep the wrapper editable when the collapsed
						// selection is in the block that is actually selected.
						// A stale native selection may linger in a previously
						// selected editable root block (e.g. Firefox does not
						// always move it), which must not re-enable the wrapper
						// after another block has been selected.
						collapsedClientId === getSelectedBlockClientId() &&
						canHostEditableRoot(
							blockEditorSelectors,
							collapsedClientId
						)
					) {
						setContentEditableWrapper( node, true );

						// While the wrapper is editable it must hold focus: a
						// nested editable element cannot retain it (the first
						// DOM mutation moves focus to the host, inconsistently
						// across browsers). Don't steal focus from UI elements
						// (e.g. buttons) or editables outside the block (e.g.
						// the post title). The rich text instance owning the
						// selection syncs it to the store itself.
						const { activeElement } = ownerDocument;
						if (
							activeElement !== node &&
							activeElement?.isContentEditable &&
							node.contains( activeElement ) &&
							getBlockClientId( activeElement ) ===
								collapsedClientId
						) {
							node.focus();
						}
						return;
					}

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

				// On mouseup, if the native selection is within one block
				// but the click target is a different block, bail out
				// and let the clicked block's focus handler manage
				// selection.
				if (
					event.type === 'mouseup' &&
					! event.shiftKey &&
					! isMultiSelecting() &&
					startClientId === endClientId
				) {
					const clickedClientId = getBlockClientId( event.target );
					if (
						clickedClientId &&
						clickedClientId !== startClientId
					) {
						selection.removeAllRanges();
						return;
					}
				}
				const isSingularSelection = startClientId === endClientId;
				if ( isSingularSelection ) {
					if ( ! isMultiSelecting() ) {
						// If the selection is not collapsed and falls
						// within a RichText that doesn't have focus
						// (e.g. the user started dragging from the block
						// wrapper padding), dispatch a full
						// selectionChange so the format toolbar appears.
						const richTextElement =
							! selection.isCollapsed &&
							( getRichTextElement( startNode ) ||
								getRichTextElement( endNode ) );

						if (
							richTextElement &&
							// The rich text instance syncs the selection
							// itself when its element is editable and owns the
							// selection (also through a focused editing host).
							// It may be temporarily non-editable while a drag
							// that started outside it is in progress (see
							// rich-text's preventFocusCapture).
							( richTextElement.contentEditable !== 'true' ||
								( ownerDocument.activeElement !==
									richTextElement &&
									! ownsSelection( richTextElement ) ) )
						) {
							const range = selection.getRangeAt( 0 );
							const richTextData = create( {
								element: richTextElement,
								range,
								__unstableIsEditableTree: true,
							} );
							const selectionUpdate = {
								start: {
									clientId: startClientId,
									attributeKey:
										richTextElement.dataset
											.wpBlockAttributeKey,
									offset: richTextData.start ?? 0,
								},
								end: {
									clientId: startClientId,
									attributeKey:
										richTextElement.dataset
											.wpBlockAttributeKey,
									// Clamp the end offset to the element. A
									// forward selection can overshoot past the
									// rich text (e.g. a triple click extends
									// into the next block at offset 0), leaving
									// `end` undefined; that means the selection
									// reaches through the end of this element's
									// content.
									offset:
										richTextData.end ??
										richTextData.text.length,
								},
							};
							const { start, end } = selectionUpdate;
							const selectionStart = getSelectionStart();
							const selectionEnd = getSelectionEnd();

							// Skip the dispatch when the store already holds
							// the same selection.
							if (
								selectionStart.clientId !== start.clientId ||
								selectionEnd.clientId !== end.clientId ||
								selectionStart.attributeKey !==
									start.attributeKey ||
								selectionStart.offset !== start.offset ||
								selectionEnd.offset !== end.offset
							) {
								selectionChange( selectionUpdate );
							}
						} else {
							selectBlock( startClientId );
						}
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

			// Native `selectionchange` events are asynchronous: a clipboard
			// event may fire before the store has been updated with a cross
			// block selection that was just made. Sync it before the clipboard
			// handlers (bubble phase) read the store.
			function ensureMultiBlockSelectionSync( event ) {
				const selection = defaultView.getSelection();

				if ( ! selection.rangeCount || selection.isCollapsed ) {
					return;
				}

				// Only a selection across different blocks needs to be synced
				// here; rich text owns selections within a single block.
				const startClientId = getBlockClientId(
					extractSelectionStartNode( selection )
				);
				const endClientId = getBlockClientId(
					extractSelectionEndNode( selection, isTripleClick )
				);

				if ( startClientId !== endClientId ) {
					onSelectionChange( event );
				}
			}

			ownerDocument.addEventListener(
				'selectionchange',
				onSelectionChange
			);
			function onMouseUp( event ) {
				onSelectionChange( event );
				setShiftClickInProgress( false );
			}

			defaultView.addEventListener( 'mouseup', onMouseUp );
			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'keydown', onKeyDown );
			ownerDocument.addEventListener(
				'copy',
				ensureMultiBlockSelectionSync,
				true
			);
			ownerDocument.addEventListener(
				'cut',
				ensureMultiBlockSelectionSync,
				true
			);
			ownerDocument.addEventListener(
				'paste',
				ensureMultiBlockSelectionSync,
				true
			);
			return () => {
				ownerDocument.removeEventListener(
					'selectionchange',
					onSelectionChange
				);
				defaultView.removeEventListener( 'mouseup', onMouseUp );
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'keydown', onKeyDown );
				ownerDocument.removeEventListener(
					'copy',
					ensureMultiBlockSelectionSync,
					true
				);
				ownerDocument.removeEventListener(
					'cut',
					ensureMultiBlockSelectionSync,
					true
				);
				ownerDocument.removeEventListener(
					'paste',
					ensureMultiBlockSelectionSync,
					true
				);
			};
		},
		[ multiSelect, selectBlock, selectionChange, getBlockParents ]
	);
}
