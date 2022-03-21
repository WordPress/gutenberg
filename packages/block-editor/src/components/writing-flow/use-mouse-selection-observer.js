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

function findDepth( a, b ) {
	let depth = 0;

	while ( a[ depth ] === b[ depth ] ) {
		depth++;
	}

	return depth;
}

/**
 * Sets a multi-selection based on the native selection across blocks.
 */
export default function useSelectionObserver() {
	const {
		startMultiSelect,
		stopMultiSelect,
		multiSelect,
		selectBlock,
		selectionChange,
	} = useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		getBlockParents,
		isSelectionMergeable,
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

				const clientId = getBlockClientId( selection.anchorNode );
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
					const depth = findDepth( startPath, endPath );

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

			function onMouseLeave( { buttons, target } ) {
				// The primary button must be pressed to initiate selection.
				// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
				if ( buttons !== 1 ) {
					return;
				}

				if ( ! target.contentEditable ) {
					return;
				}

				if ( ! isSelectionEnabled() ) {
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

			node.addEventListener( 'mouseout', onMouseLeave );

			return () => {
				node.removeEventListener( 'mouseout', onMouseLeave );
				ownerDocument.removeEventListener(
					'selectionchange',
					onSelectionChange
				);
				defaultView.removeEventListener( 'mouseup', onSelectionEnd );
				defaultView.cancelAnimationFrame( rafId );
			};
		},
		[
			startMultiSelect,
			stopMultiSelect,
			multiSelect,
			selectBlock,
			selectionChange,
			isSelectionEnabled,
			getBlockParents,
			isSelectionMergeable,
		]
	);
}
