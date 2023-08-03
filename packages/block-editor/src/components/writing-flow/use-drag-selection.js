/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

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

/**
 * Sets a multi-selection based on the native selection across blocks.
 */
export default function useDragSelection() {
	const { startMultiSelect, stopMultiSelect } =
		useDispatch( blockEditorStore );
	const { isSelectionEnabled, hasMultiSelection, isDraggingBlocks } =
		useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			let anchorElement;
			let rafId;

			function onMouseUp() {
				stopMultiSelect();
				// Equivalent to attaching the listener once.
				defaultView.removeEventListener( 'mouseup', onMouseUp );
				// The browser selection won't have updated yet at this point,
				// so wait until the next animation frame to get the browser
				// selection.
				rafId = defaultView.requestAnimationFrame( () => {
					if ( hasMultiSelection() ) {
						return;
					}

					// If the selection is complete (on mouse up), and no
					// multiple blocks have been selected, set focus back to the
					// anchor element. if the anchor element contains the
					// selection. Additionally, the contentEditable wrapper can
					// now be disabled again.
					setContentEditableWrapper( node, false );

					const selection = defaultView.getSelection();

					if ( selection.rangeCount ) {
						const { commonAncestorContainer } =
							selection.getRangeAt( 0 );

						if (
							anchorElement.contains( commonAncestorContainer )
						) {
							anchorElement.focus();
						}
					}
				} );
			}

			function onMouseLeave( { buttons, target } ) {
				// Avoid triggering a multi-selection if the user is already
				// dragging blocks.
				if ( isDraggingBlocks() ) {
					return;
				}

				// The primary button must be pressed to initiate selection.
				// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
				if ( buttons !== 1 ) {
					return;
				}

				// Check the attribute, not the contentEditable attribute. All
				// child elements of the content editable wrapper are editable
				// and return true for this property. We only want to start
				// multi selecting when the mouse leaves the wrapper.
				if ( target.getAttribute( 'contenteditable' ) !== 'true' ) {
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
				defaultView.addEventListener( 'mouseup', onMouseUp );

				// Allow cross contentEditable selection by temporarily making
				// all content editable. We can't rely on using the store and
				// React because re-rending happens too slowly. We need to be
				// able to select across instances immediately.
				setContentEditableWrapper( node, true );
			}

			node.addEventListener( 'mouseout', onMouseLeave );

			return () => {
				node.removeEventListener( 'mouseout', onMouseLeave );
				defaultView.removeEventListener( 'mouseup', onMouseUp );
				defaultView.cancelAnimationFrame( rafId );
			};
		},
		[
			startMultiSelect,
			stopMultiSelect,
			isSelectionEnabled,
			hasMultiSelection,
		]
	);
}
