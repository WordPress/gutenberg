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
import { setContentEditableWrapper } from './utils';
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
	const {
		multiSelect,
		selectBlock,
		selectionChange,
		startMultiSelect,
		stopMultiSelect,
	} = useDispatch( blockEditorStore );
	const blockEditorSelectors = useSelect( blockEditorStore );
	const {
		getBlockParents,
		getBlockSelectionStart,
		isMultiSelecting,
		getSelectionStart,
		getSelectionEnd,
		getSelectedBlockClientId,
		hasMultiSelection,
		__unstableIsFullySelected,
	} = blockEditorSelectors;
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			let isTripleClick = false;

			function onMouseDown( event ) {
				if ( ! node.contains( event.target ) ) {
					return;
				}
				isTripleClick = event.detail === 3;
				// A shift+click makes a multi-selection: mark the gesture as
				// in progress so the clicked block's focus handler does not
				// select it (collapsing the native range being made), and so
				// use-multi-selection does not clear the native selection.
				if ( event.shiftKey ) {
					startMultiSelect();

// The browser can only extend the selection to the
					// clicked position when a common editing host contains
					// both it and the selection to extend. Blocks are
					// separate editing hosts, so before the browser acts
					// on the click, the wrapper must become the editing
					// host, like it does for shift+arrow in use-arrow-nav.
					// Without it, the selection collapses to a caret in
					// the clicked block (extending forward) or stops at
					// the edge of the block it started in (extending
					// backward). Focus is left alone: the click moves it.
					setContentEditableWrapper( node, true, { focus: false } );

					// The browser extends the selection from the native
					// anchor. When a block is selected without a text
					// selection within it (e.g. an image or spacer),
					// there is no native anchor, or a stale one in
					// previously edited text. Give the browser the right
					// anchor before it acts on the click: the near edge
					// of the selected block, so the whole block ends up
					// within the extended selection.
					const { clientId, attributeKey } = getSelectionStart();
					const selection = defaultView.getSelection();
					const blockElement =
						clientId &&
						! attributeKey &&
						ownerDocument.getElementById( `block-${ clientId }` );

					if (
						blockElement &&
						! (
							selection.anchorNode &&
							blockElement.contains( selection.anchorNode )
						)
					) {
						const isForward =
							// eslint-disable-next-line no-bitwise
							blockElement.compareDocumentPosition(
								event.target
							) & node.DOCUMENT_POSITION_FOLLOWING;
						selection.setPosition(
							blockElement,
							isForward ? 0 : blockElement.childNodes.length
						);
					}
				}
			}

			function onKeyDown() {
				isTripleClick = false;
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
					// A block multi-selection clears the native selection
					// (use-multi-selection), after which the browser may
					// place a stray caret in the focused editing host.
					// That caret must not dissolve the multi-selection. A
					// real click or key press changes the block selection
					// first, so this guard releases for them.
					if (
						hasMultiSelection() &&
						__unstableIsFullySelected() &&
						node.contentEditable === 'true'
					) {
						return;
					}

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
				// When an endpoint needs correcting, the native selection
				// disagrees with the gesture (e.g. there was no caret to
				// extend from a block without text selection), so the
				// result must be recorded as a block selection instead of
				// a text selection between the native endpoints.
				let isReconstructedClickShift = false;
				if ( isClickShift ) {
					const selectedClientId = getBlockSelectionStart();
					// The element under the pointer, not `event.target`:
					// browsers may retarget the mouseup (WebKit can
					// dispatch it on the block the selection started
					// from).
					const clickedElement =
						ownerDocument.elementFromPoint(
							event.clientX,
							event.clientY
						) ?? event.target;
					const clickedClientId =
						getBlockClientId( clickedElement );
					// When the click lands within text, the browser's own
					// extension is the better end: pointer coordinates
					// can be unreliable (WebKit reports stale positions
					// after scrolling, cutting the selection short). The
					// pointer only corrects the end when there is nothing
					// to extend to at the click, e.g. a block without
					// text selection.
					const clickedText = clickedElement?.closest?.(
						'[data-wp-block-attribute-key]'
					);
					if (
						clickedClientId &&
						( ( startClientId === endClientId &&
							selection.isCollapsed ) ||
							! endClientId ||
							( ! clickedText &&
								clickedClientId !== endClientId ) )
					) {
						isReconstructedClickShift =
							isReconstructedClickShift ||
							endClientId !== clickedClientId;
						endClientId = clickedClientId;
					}
					// Handle the case when we have a non-selectable block
					// selected and click another one.
					if ( startClientId !== selectedClientId ) {
						startClientId = selectedClientId;
						isReconstructedClickShift = true;
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

				// With only one endpoint in a block, there is nothing
				// coherent to record: dispatching would produce a broken
				// multi-selection between a block and nothing.
				if (
					startClientId === undefined ||
					endClientId === undefined
				) {
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

					// If one path ends before they diverge, one block
					// contains the other, so there are no sibling blocks
					// to promote the selection to. Record the selection as
					// is: it resolves to the outer block, which is treated
					// as fully selected. See `getSelectionNestingAncestor`
					// in the store.
					const isAncestorDescendant =
						depth >= startPath.length || depth >= endPath.length;

					// A reconstructed shift+click selects blocks: the
					// block the gesture started from and the clicked
					// block. The native selection is noise (browsers may
					// move it during the click), so it must not be
					// recorded as a text selection, nor left behind to be
					// recorded later.
					if ( isReconstructedClickShift ) {
						if ( isAncestorDescendant ) {
							// One block contains the other: select the
							// outer block.
							selectBlock(
								depth >= startPath.length
									? startClientId
									: endClientId
							);
						} else {
							multiSelect(
								startPath[ depth ],
								endPath[ depth ]
							);
						}
						// The native selection is noise here (the
						// browser may have moved it during the click,
						// from a stale position), but it is left alone:
						// clearing it would leave the editing host
						// without a selection, and browsers insert a
						// caret at the start of the host and scroll to
						// it. The collapsed-selection guard above keeps
						// it from being recorded over the block
						// selection.
						return;
					}

					if (
						! isAncestorDescendant &&
						( startPath[ depth ] !== startClientId ||
							endPath[ depth ] !== endClientId )
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
			// Returns the caret position at the given point, like the
			// standard `caretPositionFromPoint`, with a fallback to the
			// WebKit-only `caretRangeFromPoint`.
			function caretPositionFromPoint( x, y ) {
				if ( ownerDocument.caretPositionFromPoint ) {
					return ownerDocument.caretPositionFromPoint( x, y );
				}
				const range = ownerDocument.caretRangeFromPoint?.( x, y );
				return (
					range && {
						offsetNode: range.startContainer,
						offset: range.startOffset,
					}
				);
			}

			function onMouseUp( event ) {
				// Browsers may fail to extend the selection to the
				// clicked position in another block, even within a
				// common editing host (Firefox leaves it where it was).
				// Complete the extension at the clicked caret position
				// before the selection is recorded.
				if ( event.shiftKey ) {
					const selection = defaultView.getSelection();
					const clickedClientId = getBlockClientId( event.target );
					if (
						selection.anchorNode &&
						clickedClientId &&
						getBlockClientId( selection.focusNode ) !==
							clickedClientId
					) {
						const position = caretPositionFromPoint(
							event.clientX,
							event.clientY
						);
						if (
							position &&
							getBlockClientId( position.offsetNode ) ===
								clickedClientId
						) {
							selection.extend(
								position.offsetNode,
								position.offset
							);
						}
					}
				}

				onSelectionChange( event );
				stopMultiSelect();
			}

			defaultView.addEventListener( 'mouseup', onMouseUp );
			// On the document in the capture phase: this is passive
			// gesture bookkeeping that must reliably see the events, even
			// when a deeper handler stops their propagation, and before
			// any of them runs.
			ownerDocument.addEventListener( 'mousedown', onMouseDown, true );
			ownerDocument.addEventListener( 'keydown', onKeyDown, true );
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
				ownerDocument.removeEventListener(
					'mousedown',
					onMouseDown,
					true
				);
				ownerDocument.removeEventListener( 'keydown', onKeyDown, true );
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
