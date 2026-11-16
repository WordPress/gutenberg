import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId, getSelectionEditableElement } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

// iOS WebKit places the caret on the tap itself, before the mouse events it
// synthesizes from it. Other engines place it in the mousedown's default
// action, which must run there.
const placesCaretOnTap =
	typeof window !== 'undefined' &&
	!! window.CSS?.supports?.( '-webkit-touch-callout', 'none' );

export default function useClickSelection() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		getBlockSelectionStart,
		getSelectionStart,
		hasMultiSelection,
		isBlockMultiSelected,
		isAncestorMultiSelected,
		__unstableIsFullySelected,
		canMoveBlocks,
		getSelectedBlockClientIds,
		canHostEditableRoot,
	} = unlock( useSelect( blockEditorStore ) );
	return useRefEffect< HTMLElement >(
		( node ) => {
			let pointerType: string | undefined;
			// The block to collapse a multi-selection to on click, recorded
			// on mousedown. See the comment in `onMouseDown`.
			let clickCollapseClientId: string | undefined;

			function onPointerDown( event: PointerEvent ) {
				pointerType = event.pointerType;

				if ( node.contentEditable !== 'true' ) {
					return;
				}

				const clientId = getBlockClientId( event.target as Element );

				// A press on a block that is edited on its own element: give
				// focus back to the field with the caret before the browser
				// handles the press, so it handles a press into another field.
				// A press inside the focused editing host loses the caret once
				// focus moves to the field: Firefox drops it, and iOS moves it.
				if ( ! clientId || canHostEditableRoot( clientId ) ) {
					return;
				}

				const field = getSelectionEditableElement(
					// A mounted element's window has a selection.
					node.ownerDocument.defaultView!.getSelection()!,
					node
				) as HTMLElement | undefined;

				if ( ! field ) {
					return;
				}

				setContentEditableWrapper( node, false );
				field.focus( { preventScroll: true } );

				// A mouse press is also cancelled when a native drag starts,
				// which must leave the field as its own editing host.
				if ( pointerType !== 'touch' ) {
					return;
				}

				// The touch became a scroll: the wrapper hosts the field again.
				function onPointerCancel() {
					setContentEditableWrapper( node, true );
				}
				node.addEventListener( 'pointercancel', onPointerCancel, {
					once: true,
				} );
				// A tap: nothing to undo.
				node.addEventListener(
					'pointerup',
					() =>
						node.removeEventListener(
							'pointercancel',
							onPointerCancel
						),
					{ once: true }
				);
			}

			function onMouseDown( event: MouseEvent ) {
				clickCollapseClientId = undefined;

				// The main button.
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
				if ( ! isSelectionEnabled() || event.button !== 0 ) {
					return;
				}

				const startClientId = getBlockSelectionStart();
				// Mouse events reach the listener from nodes.
				const clickedClientId = getBlockClientId(
					event.target as Node
				);

				// A tap in the block the wrapper hosts, with the caret already
				// placed by the tap: all the default action would do is focus
				// the nearest focusable element (the field, its block element
				// or a container), which the handover moves straight back to
				// the wrapper. On iOS that flicker cancels the double tap word
				// selection.
				if (
					placesCaretOnTap &&
					pointerType === 'touch' &&
					clickedClientId &&
					clickedClientId === startClientId &&
					node.contentEditable === 'true' &&
					// Not `activeElement`: with nothing focused, as after the
					// keyboard is hidden, it falls back to the body, which in
					// the iframe is this wrapper.
					node.matches( ':focus' )
				) {
					event.preventDefault();
					return;
				}

				if ( event.shiftKey ) {
					// When selecting a single block in a document by holding the shift key,
					// don't mark this action as multiselection.
					if ( startClientId && startClientId !== clickedClientId ) {
						// When the selected block has no text selection
						// within it (e.g. an image or spacer), there is no
						// native selection for the wrapper to adopt when it
						// is focused, so Safari inserts a caret at the start
						// of the wrapper and asynchronously reveals it,
						// scrolling a scrolled-down viewport back up, which
						// `preventScroll` does not cover. Leave focus alone
						// in that case: the click moves it.
						const { clientId, attributeKey } = getSelectionStart();
						setContentEditableWrapper( node, true, {
							focus: !! attributeKey,
						} );

						// The browser extends the selection from the native
						// anchor. When a block is selected without a text
						// selection within it, there is no native anchor,
						// and browsers synthesize one at the nearest text
						// instead, excluding the block itself. Give the
						// browser the right anchor before it acts on the
						// click: the near edge of the selected block, so the
						// whole block ends up within the extended selection.
						const { ownerDocument } = node;
						// A mounted element's window has a selection.
						const selection =
							ownerDocument.defaultView!.getSelection()!;
						const blockElement =
							! attributeKey &&
							ownerDocument.getElementById(
								`block-${ clientId }`
							);

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
									event.target as Node
								) & node.DOCUMENT_POSITION_FOLLOWING;
							selection.setPosition(
								blockElement,
								isForward ? 0 : blockElement.childNodes.length
							);
						}
					}
				} else if ( hasMultiSelection() ) {
					// Allow user to escape out of a multi-selection to a
					// singular selection of a block via click. This is handled
					// here since focus handling excludes blocks when there is
					// multiselection, as focus can be incurred by starting a
					// multiselection (focus moved to first block's multi-
					// controls).
					if (
						clickedClientId &&
						__unstableIsFullySelected() &&
						canMoveBlocks( getSelectedBlockClientIds() ) &&
						( isBlockMultiSelected( clickedClientId ) ||
							isAncestorMultiSelected( clickedClientId ) )
					) {
						// Pressing on one of the selected blocks may start a
						// drag of the whole selection, so wait for the click
						// event to collapse the selection: no click fires
						// when a drag takes place.
						clickCollapseClientId = clickedClientId;
					} else {
						// A click outside blocks passes no client ID, as before.
						selectBlock( clickedClientId as string );
					}
				}
			}

			function onClick( event: MouseEvent ) {
				const clientId = clickCollapseClientId;
				clickCollapseClientId = undefined;

				if ( ! clientId || ! hasMultiSelection() ) {
					return;
				}

				// The press did not place a caret because it could have
				// started a drag, so place it at the click on text.
				const { ownerDocument } = node;
				const { clientX, clientY } = event;
				let textNode: Node | null = null;
				let offset = 0;
				if ( ownerDocument.caretPositionFromPoint ) {
					const position = ownerDocument.caretPositionFromPoint(
						clientX,
						clientY
					);
					textNode = position?.offsetNode ?? null;
					offset = position?.offset ?? 0;
				} else {
					const range = ownerDocument.caretRangeFromPoint?.(
						clientX,
						clientY
					);
					textNode = range?.startContainer ?? null;
					offset = range?.startOffset ?? 0;
				}

				if (
					textNode?.nodeType === textNode?.TEXT_NODE &&
					getBlockClientId( textNode ) === clientId
				) {
					// A mounted element's document has a window and a selection.
					ownerDocument
						.defaultView!.getSelection()!
						.collapse( textNode!, offset );
					return;
				}

				selectBlock( clientId );
			}

			node.addEventListener( 'pointerdown', onPointerDown );
			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'click', onClick );

			return () => {
				node.removeEventListener( 'pointerdown', onPointerDown );
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'click', onClick );
			};
		},
		[
			selectBlock,
			isSelectionEnabled,
			getBlockSelectionStart,
			getSelectionStart,
			hasMultiSelection,
			isBlockMultiSelected,
			isAncestorMultiSelected,
			__unstableIsFullySelected,
			canMoveBlocks,
			getSelectedBlockClientIds,
			canHostEditableRoot,
		]
	);
}
