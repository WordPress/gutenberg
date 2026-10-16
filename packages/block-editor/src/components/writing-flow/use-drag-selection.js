import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import {
	DRAG_THRESHOLD,
	isOnScrollbar,
	setContentEditableWrapper,
} from './utils';

function caretFromPoint( document, x, y ) {
	if ( document.caretPositionFromPoint ) {
		const position = document.caretPositionFromPoint( x, y );
		return position && [ position.offsetNode, position.offset ];
	}

	const range = document.caretRangeFromPoint?.( x, y );
	return range && [ range.startContainer, range.startOffset ];
}

/**
 * Sets a multi-selection based on the native selection across blocks.
 *
 * The native selection can only cross blocks once the canvas is the editing
 * host, so the canvas becomes one when a drag leaves the block it started in,
 * or when a drag starts from empty space: the canvas, the gaps between blocks
 * or a container's padding.
 */
export default function useDragSelection() {
	const { startMultiSelect, stopMultiSelect } =
		useDispatch( blockEditorStore );
	const {
		getSettings,
		isSelectionEnabled,
		hasSelectedBlock,
		isDraggingBlocks,
		isMultiSelecting,
	} = useSelect( blockEditorStore );
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
					if ( ! hasSelectedBlock() ) {
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
						const range = selection.getRangeAt( 0 );
						const { commonAncestorContainer } = range;
						const clonedRange = range.cloneRange();
						// A drag from empty space has no anchor element: use
						// the field the selection ended up in, if any.
						const element =
							anchorElement ??
							getEditableElement( commonAncestorContainer );

						if ( element?.contains( commonAncestorContainer ) ) {
							element.focus();
							selection.removeAllRanges();
							selection.addRange( clonedRange );
						}
					}
				} );
			}

			function getEditableElement( container ) {
				const element =
					container.nodeType === container.ELEMENT_NODE
						? container
						: container.parentElement;
				const editable = element?.closest( '[contenteditable="true"]' );
				return editable !== node ? editable : null;
			}

			// Whether a press is on empty space: the canvas, a block list
			// layout (the gaps between its blocks), or a block's own element
			// (its padding) rather than its content. Anything else, interactive
			// or not, may handle the press itself.
			function isEmptySpace( event ) {
				const { target } = event;
				return (
					! isOnScrollbar( event ) &&
					( target === node ||
						target.classList.contains(
							'block-editor-block-list__layout'
						) ||
						( target.hasAttribute( 'data-block' ) &&
							// Not `isContentEditable`: the whole canvas is
							// editable while blocks are multi-selected.
							target.getAttribute( 'contenteditable' ) !==
								'true' ) )
				);
			}

			function startMultiSelecting( element ) {
				// Do not rely on the active element because it may change after
				// the mouse leaves for the first time. See
				// https://github.com/WordPress/gutenberg/issues/48747.
				anchorElement = element;

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

			let lastMouseDownTarget;
			let emptySpaceMouseDown;

			function stopWatchingEmptySpaceDrag() {
				emptySpaceMouseDown = null;
				defaultView.removeEventListener(
					'mousemove',
					onEmptySpaceMouseMove
				);
				defaultView.removeEventListener(
					'mouseup',
					stopWatchingEmptySpaceDrag
				);
			}

			// Not on the press: a click on empty space must keep collapsing
			// the selection rather than put a caret in the nearest field.
			function onEmptySpaceMouseMove( event ) {
				if ( event.buttons !== 1 ) {
					stopWatchingEmptySpaceDrag();
					return;
				}

				const distance = Math.hypot(
					event.clientX - emptySpaceMouseDown.clientX,
					event.clientY - emptySpaceMouseDown.clientY
				);

				if ( distance < DRAG_THRESHOLD ) {
					return;
				}

				const { clientX, clientY } = emptySpaceMouseDown;
				stopWatchingEmptySpaceDrag();

				if (
					isDraggingBlocks() ||
					isMultiSelecting() ||
					! isSelectionEnabled()
				) {
					return;
				}

				startMultiSelecting( null );

				// A press on empty space does not always start the native
				// selection (Chromium does not start it away from text), so
				// start it where the press was: the drag extends it from
				// there.
				const position = caretFromPoint(
					ownerDocument,
					clientX,
					clientY
				);

				if ( position ) {
					defaultView.getSelection().collapse( ...position );
				}
			}

			function onMouseDown( event ) {
				lastMouseDownTarget = event.target;
				stopWatchingEmptySpaceDrag();

				if (
					event.button !== 0 ||
					event.shiftKey ||
					! isEmptySpace( event )
				) {
					return;
				}

				emptySpaceMouseDown = event;
				defaultView.addEventListener(
					'mousemove',
					onEmptySpaceMouseMove
				);
				defaultView.addEventListener(
					'mouseup',
					stopWatchingEmptySpaceDrag
				);
			}

			function onMouseLeave( { buttons, target, relatedTarget } ) {
				if ( ! target.contains( lastMouseDownTarget ) ) {
					return;
				}

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
				// In preview mode, allow drag selection from blocks since they
				// are not contenteditable.
				if (
					target.getAttribute( 'contenteditable' ) !== 'true' &&
					! getSettings().isPreviewMode
				) {
					return;
				}

				if ( ! isSelectionEnabled() ) {
					return;
				}

				startMultiSelecting( target );
			}

			node.addEventListener( 'mouseout', onMouseLeave );
			node.addEventListener( 'mousedown', onMouseDown );

			return () => {
				node.removeEventListener( 'mouseout', onMouseLeave );
				node.removeEventListener( 'mousedown', onMouseDown );
				stopWatchingEmptySpaceDrag();
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
