import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

export default function useClickSelection() {
	const { selectBlock } = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		getBlockSelectionStart,
		getSelectionStart,
		hasMultiSelection,
		canHostEditableRoot,
	} = unlock( useSelect( blockEditorStore ) );
	return useRefEffect(
		( node ) => {
			const { defaultView } = node.ownerDocument;
			let pressTarget;

			function onMouseUp() {
				pressTarget = null;
			}

			// A click on an editable that cannot hold focus itself (an inert
			// part of the editing host) focuses the host in Chromium, but the
			// nearest focusable ancestor in Firefox: a block wrapper around
			// the clicked block, whose focus handler would select that block.
			// Move focus to the host before that handler runs.
			function onFocusIn( event ) {
				if (
					node.contentEditable === 'true' &&
					pressTarget &&
					event.target !== node &&
					event.target.contains( pressTarget ) &&
					getBlockClientId( event.target ) !==
						getBlockClientId( pressTarget )
				) {
					node.focus( { preventScroll: true } );
				}
			}

			function onMouseDown( event ) {
				// The main button.
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
				if ( ! isSelectionEnabled() || event.button !== 0 ) {
					return;
				}

				pressTarget = event.target;
				defaultView.addEventListener( 'mouseup', onMouseUp, {
					once: true,
				} );

				const startClientId = getBlockSelectionStart();
				const clickedClientId = getBlockClientId( event.target );

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
						const selection =
							ownerDocument.defaultView.getSelection();
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
									event.target
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
					selectBlock( clickedClientId );
				} else if (
					clickedClientId &&
					clickedClientId !== startClientId &&
					canHostEditableRoot( clickedClientId )
				) {
					// Selecting the block turns its editable element into an
					// inert part of the editing host. Make the DOM reflect
					// that before the browser acts on this mousedown: the
					// default action then places the caret into content
					// editable through the host, and focuses the host,
					// natively. Left to the re-render, the flip lands
					// mid-click, after the browser placed the caret in the
					// editable element, destroying both the caret and focus.
					const editable = event.target.closest(
						'[contenteditable="true"]'
					);

					if (
						editable &&
						editable !== node &&
						getBlockClientId( editable ) === clickedClientId
					) {
						setContentEditableWrapper( node, true );
						// Remove the attribute rather than set "inherit":
						// Gecko does not map the invalid value to the inherit
						// state and treats the element as non-editable.
						editable.removeAttribute( 'contenteditable' );
						selectBlock( clickedClientId, null );
					}
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'focusin', onFocusIn, true );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'focusin', onFocusIn, true );
				defaultView.removeEventListener( 'mouseup', onMouseUp );
			};
		},
		[
			selectBlock,
			isSelectionEnabled,
			getBlockSelectionStart,
			getSelectionStart,
			hasMultiSelection,
		]
	);
}
