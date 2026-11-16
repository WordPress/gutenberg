import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import {
	create,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { isSelectionForward } from '@wordpress/dom';
import { store as blockEditorStore } from '../../store';
import { getBlockClientId } from '../../utils/dom';
import { setContentEditableWrapper } from './utils';
import { unlock } from '../../lock-unlock';

const { ownsSelection } = unlock( richTextPrivateApis );

/**
 * Extract the selection start node from the selection. When the anchor node is
 * not a text node, the selection offset is the index of a child node.
 *
 * @param selection The selection.
 *
 * @return The selection start node.
 */
function extractSelectionStartNode( selection: Selection ): Node {
	// Callers only read a selection with a range.
	const { anchorNode, anchorOffset } = selection;

	if ( anchorNode!.nodeType === anchorNode!.TEXT_NODE ) {
		return anchorNode!;
	}

	if ( anchorOffset === 0 ) {
		return anchorNode!;
	}

	return anchorNode!.childNodes[ anchorOffset - 1 ];
}

/**
 * Extract the selection end node from the selection. When the focus node is not
 * a text node, the selection offset is the index of a child node. The selection
 * reaches up to but excluding that child node.
 *
 * @param selection     The selection.
 * @param isTripleClick Whether the selection comes from a triple
 *                      click.
 *
 * @return The selection start node.
 */
function extractSelectionEndNode(
	selection: Selection,
	isTripleClick: boolean
): Node {
	// Callers only read a selection with a range.
	const { focusNode, focusOffset } = selection;

	if ( focusNode!.nodeType === focusNode!.TEXT_NODE ) {
		return focusNode!;
	}

	if ( focusOffset === focusNode!.childNodes.length ) {
		return focusNode!;
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
		// Return the node before the focus node. Its parent may still be in
		// the next block (e.g. a list item's rich text), so walk up.
		let node = focusNode!;
		while ( ! node.previousSibling && node.parentNode ) {
			node = node.parentNode;
		}
		return node.previousSibling ?? node;
	}

	return focusNode!.childNodes[ focusOffset ];
}

function findDepth( a: string[], b: string[] ) {
	let depth = 0;

	while ( a[ depth ] === b[ depth ] ) {
		depth++;
	}

	return depth;
}

function getRichTextElement( node: Node ) {
	const element =
		node.nodeType === node.ELEMENT_NODE
			? ( node as Element )
			: node.parentElement;
	return element?.closest< HTMLElement >( '[data-wp-block-attribute-key]' );
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
	const {
		getBlockParents,
		getBlockSelectionStart,
		isDraggingBlocks,
		isMultiSelecting,
		getSelectionStart,
		getSelectionEnd,
		getSelectedBlockClientId,
		canHostEditableRoot,
	} = unlock( useSelect( blockEditorStore ) );
	return useRefEffect< HTMLElement >(
		( node ) => {
			const { ownerDocument } = node;
			// A mounted element's document has a window.
			const { defaultView } = ownerDocument;

			let isTripleClick = false;

			function onMouseDown( event: MouseEvent ) {
				isTripleClick = event.detail === 3;
				// A shift+click makes a multi-selection: mark the gesture as
				// in progress so the clicked block's focus handler does not
				// select it (collapsing the native range being made), and so
				// use-multi-selection does not clear the native selection.
				// When shift+clicking within the same block, leave multi-selection
				// inactive so rich text selection is preserved. The selection
				// is built on mouseup.
				if (
					event.shiftKey &&
					getBlockSelectionStart() !==
						// Mouse events reach the listener from nodes.
						getBlockClientId( event.target as Node )
				) {
					startMultiSelect();
				}
			}

			function onKeyDown() {
				isTripleClick = false;
			}

			function onSelectionChange( event: Event | MouseEvent ) {
				// While blocks are being dragged, the selection is driven
				// by the drag, not by the caret the press may have left
				// behind.
				if ( isDraggingBlocks() ) {
					return;
				}

				// A window has a selection.
				const selection = defaultView!.getSelection()!;

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
				const isClickShift =
					( event as MouseEvent ).shiftKey &&
					event.type === 'mouseup';
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
						canHostEditableRoot( collapsedClientId )
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
							( activeElement as HTMLElement | null )
								?.isContentEditable &&
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
						// Only return focus to the field if the wrapper had
						// it. If Escape moved focus to the canvas stop in the
						// parent document, the wrapper is only the stale
						// active element and focus must not come back.
						if (
							ownerDocument.activeElement === node &&
							ownerDocument.hasFocus()
						) {
							let element: Element | null | undefined =
								startNode.nodeType === startNode.ELEMENT_NODE
									? ( startNode as Element )
									: startNode.parentElement;
							element = element?.closest( '[contenteditable]' );
							(
								element as HTMLElement | null | undefined
							 )?.focus();
						}
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
					const clickedClientId = getBlockClientId(
						event.target as Node | null
					);
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
					! ( event as MouseEvent ).shiftKey &&
					! isMultiSelecting() &&
					startClientId === endClientId
				) {
					const clickedClientId = getBlockClientId(
						event.target as Node | null
					);
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
							// usePreventFocusCapture).
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
							// A selection within a block has its client ID.
							selectBlock( startClientId as string );
						}
					} else {
						multiSelect(
							startClientId as string,
							startClientId as string
						);
					}
				} else {
					const startPath = [
						...getBlockParents( startClientId as string ),
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
						// A selection across blocks has both client IDs.
						multiSelect(
							startClientId as string,
							endClientId as string
						);
					}
				}
			}

			// Native `selectionchange` events are asynchronous: a clipboard
			// event or a keydown may fire before the store has been updated
			// with a cross block selection that was just made. Sync it before
			// the handlers that read the store run.
			function ensureMultiBlockSelectionSync( event: Event ) {
				// A window has a selection.
				const selection = defaultView!.getSelection()!;

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

				if ( startClientId === endClientId ) {
					return;
				}

				// Skip when the store already reflects the block range. The
				// sync runs on every keydown, and a `multiSelect` dispatch
				// announces itself to screen readers, so an unchanged range
				// must not be dispatched again.
				if (
					getSelectionStart().clientId === startClientId &&
					getSelectionEnd().clientId === endClientId
				) {
					return;
				}

				onSelectionChange( event );
			}

			ownerDocument.addEventListener(
				'selectionchange',
				onSelectionChange
			);
			function onMouseUp( event: MouseEvent ) {
				onSelectionChange( event );
				stopMultiSelect();
			}

			defaultView!.addEventListener( 'mouseup', onMouseUp );
			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'keydown', onKeyDown );
			// On the window, so it runs before any document listener that
			// reads the store on keydown, whatever order they were added in.
			defaultView!.addEventListener(
				'keydown',
				ensureMultiBlockSelectionSync,
				true
			);
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
				defaultView!.removeEventListener( 'mouseup', onMouseUp );
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'keydown', onKeyDown );
				defaultView!.removeEventListener(
					'keydown',
					ensureMultiBlockSelectionSync,
					true
				);
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
