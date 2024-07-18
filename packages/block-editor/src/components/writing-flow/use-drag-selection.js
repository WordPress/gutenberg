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
 * Sets a multi-selection based on the native selection across blocks.
 */
export default function useDragSelection() {
	const { startMultiSelect, stopMultiSelect } =
		useDispatch( blockEditorStore );
	const {
		isSelectionEnabled,
		hasSelectedBlock,
		isDraggingBlocks,
		isMultiSelecting,
	} = useSelect( blockEditorStore );
	return useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			let rafId;

			function onMouseUp() {
				stopMultiSelect();
				// Equivalent to attaching the listener once.
				defaultView.removeEventListener( 'mouseup', onMouseUp );
			}

			function onMouseLeave( { buttons, target, relatedTarget } ) {
				// If we're moving into a child element, ignore. We're tracking
				// the mouse leaving the element to a parent, no a child.
				if ( target.contains( relatedTarget ) ) {
					return;
				}

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

				// Abort if we are already multi-selecting.
				if ( isMultiSelecting() ) {
					return;
				}

				// Abort if selection is leaving writing flow.
				if ( node === target ) {
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

				startMultiSelect();

				// `onSelectionStart` is called after `mousedown` and
				// `mouseleave` (from a block). The selection ends when
				// `mouseup` happens anywhere in the window.
				defaultView.addEventListener( 'mouseup', onMouseUp );
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
			hasSelectedBlock,
		]
	);
}
