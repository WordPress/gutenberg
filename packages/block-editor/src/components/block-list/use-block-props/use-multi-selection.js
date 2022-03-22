/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { getBlockClientId } from '../../../utils/dom';

/**
 * Sets the `contenteditable` wrapper element to `value`.
 *
 * @param {HTMLElement} node  Block element.
 * @param {boolean}     value `contentEditable` value (true or false)
 */
export function setContentEditableWrapper( node, value ) {
	// Since `closest` considers `node` as a candidate, use `parentElement`.
	node.parentElement.closest( '[contenteditable]' ).contentEditable = value;
}

/**
 * Sets a multi-selection based on the native selection across blocks.
 *
 * @param {string} clientId Block client ID.
 */
export function useMultiSelection( clientId ) {
	const {
		startMultiSelect,
		stopMultiSelect,
		multiSelect,
		selectBlock,
	} = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		isBlockSelected,
		getBlockParents,
		getBlockSelectionStart,
		hasMultiSelection,
	} = useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			let anchorElement;
			let rafId;

			function onSelectionChange( { isSelectionEnd } ) {
				const selection = defaultView.getSelection();

				// If no selection is found, end multi selection and disable the
				// contentEditable wrapper.
				if ( ! selection.rangeCount || selection.isCollapsed ) {
					setContentEditableWrapper( node, false );
					return;
				}

				const endClientId = getBlockClientId( selection.focusNode );
				const isSingularSelection = clientId === endClientId;

				if ( isSingularSelection ) {
					selectBlock( clientId );

					// If the selection is complete (on mouse up), and no
					// multiple blocks have been selected, set focus back to the
					// anchor element. if the anchor element contains the
					// selection. Additionally, the contentEditable wrapper can
					// now be disabled again.
					if ( isSelectionEnd ) {
						setContentEditableWrapper( node, false );

						if ( selection.rangeCount ) {
							const {
								commonAncestorContainer,
							} = selection.getRangeAt( 0 );

							if (
								anchorElement.contains(
									commonAncestorContainer
								)
							) {
								anchorElement.focus();
							}
						}
					}
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

					multiSelect( startPath[ depth ], endPath[ depth ] );
				}
			}

			function onSelectionEnd() {
				ownerDocument.removeEventListener(
					'selectionchange',
					onSelectionChange
				);
				// Equivalent to attaching the listener once.
				defaultView.removeEventListener( 'mouseup', onSelectionEnd );
				// The browser selection won't have updated yet at this point,
				// so wait until the next animation frame to get the browser
				// selection.
				rafId = defaultView.requestAnimationFrame( () => {
					onSelectionChange( { isSelectionEnd: true } );
					stopMultiSelect();
				} );
			}

			function onMouseLeave( { buttons } ) {
				// The primary button must be pressed to initiate selection.
				// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
				if ( buttons !== 1 ) {
					return;
				}

				if ( ! isSelectionEnabled() || ! isBlockSelected( clientId ) ) {
					return;
				}

				anchorElement = ownerDocument.activeElement;
				startMultiSelect();

				// `onSelectionStart` is called after `mousedown` and
				// `mouseleave` (from a block). The selection ends when
				// `mouseup` happens anywhere in the window.
				ownerDocument.addEventListener(
					'selectionchange',
					onSelectionChange
				);
				defaultView.addEventListener( 'mouseup', onSelectionEnd );

				// Allow cross contentEditable selection by temporarily making
				// all content editable. We can't rely on using the store and
				// React because re-rending happens too slowly. We need to be
				// able to select across instances immediately.
				setContentEditableWrapper( node, true );
			}

			function onMouseDown( event ) {
				// The main button.
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
				if ( ! isSelectionEnabled() || event.button !== 0 ) {
					return;
				}

				if ( event.shiftKey ) {
					const blockSelectionStart = getBlockSelectionStart();
					// By checking `blockSelectionStart` to be set, we handle the
					// case where we select a single block. We also have to check
					// the selectionEnd (clientId) not to be included in the
					// `blockSelectionStart`'s parents because the click event is
					// propagated.
					const startParents = getBlockParents( blockSelectionStart );
					if (
						blockSelectionStart &&
						blockSelectionStart !== clientId &&
						! startParents?.includes( clientId )
					) {
						const startPath = [
							...startParents,
							blockSelectionStart,
						];
						const endPath = [
							...getBlockParents( clientId ),
							clientId,
						];
						const depth =
							Math.min( startPath.length, endPath.length ) - 1;
						const start = startPath[ depth ];
						const end = endPath[ depth ];
						// Handle the case of having selected a parent block and
						// then shift+click on a child.
						if ( start !== end ) {
							setContentEditableWrapper( node, true );
							multiSelect( start, end );
							event.preventDefault();
						}
					}
				} else if ( hasMultiSelection() ) {
					// Allow user to escape out of a multi-selection to a
					// singular selection of a block via click. This is handled
					// here since focus handling excludes blocks when there is
					// multiselection, as focus can be incurred by starting a
					// multiselection (focus moved to first block's multi-
					// controls).
					selectBlock( clientId );
				}
			}

			node.addEventListener( 'mousedown', onMouseDown );
			node.addEventListener( 'mouseleave', onMouseLeave );

			return () => {
				node.removeEventListener( 'mousedown', onMouseDown );
				node.removeEventListener( 'mouseleave', onMouseLeave );
				ownerDocument.removeEventListener(
					'selectionchange',
					onSelectionChange
				);
				defaultView.removeEventListener( 'mouseup', onSelectionEnd );
				defaultView.cancelAnimationFrame( rafId );
			};
		},
		[
			clientId,
			startMultiSelect,
			stopMultiSelect,
			multiSelect,
			selectBlock,
			isSelectionEnabled,
			isBlockSelected,
			getBlockParents,
		]
	);
}
