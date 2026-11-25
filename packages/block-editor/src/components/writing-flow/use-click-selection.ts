import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { isAppleOS } from '@wordpress/keycodes';
import { focus, isFormElement } from '@wordpress/dom';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import {
	getBlockClientId,
	getSelectionEditableElement,
	isBlockElementOutsideFields,
} from '../../utils/dom';
import { unlock } from '../../lock-unlock';
import { getCommonDepthClientIds } from '../list-view/utils';

// iOS WebKit places the caret on the tap itself, before the mouse events it
// synthesizes from it. Other engines place it in the mousedown's default
// action, which must run there.
const placesCaretOnTap =
	typeof window !== 'undefined' &&
	!! window.CSS?.supports?.( '-webkit-touch-callout', 'none' );

export default function useClickSelection() {
	const { selectBlock, multiSelect, toggleBlockSelection } = unlock(
		useDispatch( blockEditorStore )
	);
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
		getSetSelectionClientIds,
		getBlockParents,
	} = unlock( useSelect( blockEditorStore ) );
	return useRefEffect< HTMLElement >(
		( node ) => {
			let pointerType: string | undefined;
			let isFocusedOnPointerDown = false;
			// The block to collapse a multi-selection to on click, recorded
			// on mousedown. See the comment in `onMouseDown`.
			let clickCollapseClientId: string | undefined;
			let isToggleClick = false;

			function onPointerDown( event: PointerEvent ) {
				pointerType = event.pointerType;
				// iOS places the caret on a tap only in a focused page. A tap
				// on a page that lost focus, as when the keyboard is swiped
				// away, focuses it again before mousedown.
				isFocusedOnPointerDown = node.matches( ':focus' );
				if (
					! event.shiftKey &&
					! event.altKey &&
					( isAppleOS() ? event.metaKey : event.ctrlKey )
				) {
					// The mousedown capture toggles block selection before native caret placement.
					return;
				}

				// A press on a block's own element outside its fields, such as
				// a list item's bullet: stop editing so the browser drags the
				// block instead of placing a caret.
				if ( isBlockElementOutsideFields( event.target as Element ) ) {
					setContentEditableWrapper( node, false );
				}
			}

			function onMouseDown( event: MouseEvent ) {
				// Mouse events reach the listener from nodes.
				const clickedClientId = getBlockClientId(
					event.target as Node
				);

				// A press on a block that is edited on its own element: give
				// focus back to the field with the caret before the browser
				// handles the press, so it handles a press into another field.
				// A press inside the focused editing host loses the caret once
				// focus moves to the field: Firefox drops it, and iOS moves it.
				if (
					node.contentEditable === 'true' &&
					clickedClientId &&
					! canHostEditableRoot( clickedClientId )
				) {
					const field = getSelectionEditableElement(
						// A mounted element's window has a selection.
						node.ownerDocument.defaultView!.getSelection()!,
						node
					) as HTMLElement | undefined;

					if ( field ) {
						setContentEditableWrapper( node, false );
						field.focus( { preventScroll: true } );
					}
				}

				clickCollapseClientId = undefined;
				isToggleClick = false;

				// The main button.
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
				if ( ! isSelectionEnabled() || event.button !== 0 ) {
					return;
				}

				if (
					clickedClientId &&
					! event.shiftKey &&
					! event.altKey &&
					( isAppleOS() ? event.metaKey : event.ctrlKey )
				) {
					const blockElement = node.ownerDocument.getElementById(
						`block-${ clickedClientId }`
					)!;
					// Plugins may load this package with an older WordPress DOM API.
					const isFocusable =
						typeof focus.focusable.isFocusable === 'function'
							? focus.focusable.isFocusable
							: undefined;
					const focusableElements = isFocusable
						? undefined
						: focus.focusable.find( blockElement );
					// Stop at the clicked block: its focusable wrapper (or a control
					// in an ancestor block) does not make its contents a nested control.
					for (
						let element: Element | null = event.target as Element;
						element && element !== blockElement;
						element = element.parentElement
					) {
						if (
							// Disabled form controls and non-focusable button roles
							// retain their existing exclusion from block selection.
							isFormElement( element ) ||
							// Clicking a form label or its contents activates the associated control.
							// Let that happen instead of toggling block selection.
							( element.tagName === 'LABEL' &&
								!! ( element as HTMLLabelElement ).control ) ||
							element.getAttribute( 'role' ) === 'button' ||
							// Ordinary editable text remains a block-selection target.
							( ! element.matches(
								'[contenteditable]:not([contenteditable="false"])'
							) &&
								( isFocusable?.( element ) ??
									focusableElements?.includes(
										element as HTMLElement
									) ) )
						) {
							return;
						}
					}
					event.preventDefault();
					event.stopPropagation();
					isToggleClick = true;
					node.ownerDocument
						.defaultView!.getSelection()!
						.removeAllRanges();
					toggleBlockSelection( clickedClientId );
					return;
				}
				const startClientId = getBlockSelectionStart();
				if (
					event.shiftKey &&
					clickedClientId &&
					startClientId &&
					getSetSelectionClientIds()
				) {
					event.preventDefault();
					event.stopPropagation();
					const { start, end } = getCommonDepthClientIds(
						startClientId,
						clickedClientId,
						getBlockParents( startClientId ),
						getBlockParents( clickedClientId ),
						true
					);
					multiSelect( start, end );
					return;
				}

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
					isFocusedOnPointerDown
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
				if ( isToggleClick ) {
					isToggleClick = false;
					event.preventDefault();
					event.stopPropagation();
					return;
				}
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

			node.addEventListener( 'pointerdown', onPointerDown, true );
			node.addEventListener( 'mousedown', onMouseDown, true );
			node.addEventListener( 'click', onClick, true );

			return () => {
				node.removeEventListener( 'pointerdown', onPointerDown, true );
				node.removeEventListener( 'mousedown', onMouseDown, true );
				node.removeEventListener( 'click', onClick, true );
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
			multiSelect,
			toggleBlockSelection,
			getSetSelectionClientIds,
			getBlockParents,
		]
	);
}
