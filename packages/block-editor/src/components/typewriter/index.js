/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { computeCaretRect, getScrollContainer } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const isIE = window.navigator.userAgent.indexOf( 'Trident' ) !== -1;
const arrowKeyCodes = new Set( [ UP, DOWN, LEFT, RIGHT ] );
const initialTriggerPercentage = 0.75;

export function useTypewriter() {
	const hasSelectedBlock = useSelect(
		( select ) => select( blockEditorStore ).hasSelectedBlock(),
		[]
	);

	return useRefEffect(
		( node ) => {
			if ( ! hasSelectedBlock ) {
				return;
			}

			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			let scrollResizeRafId;
			let onKeyDownRafId;

			let caretRect;

			function onScrollResize() {
				if ( scrollResizeRafId ) {
					return;
				}

				scrollResizeRafId = defaultView.requestAnimationFrame( () => {
					computeCaretRectangle();
					scrollResizeRafId = null;
				} );
			}

			function onKeyDown( event ) {
				// Ensure the any remaining request is cancelled.
				if ( onKeyDownRafId ) {
					defaultView.cancelAnimationFrame( onKeyDownRafId );
				}

				// Use an animation frame for a smooth result.
				onKeyDownRafId = defaultView.requestAnimationFrame( () => {
					maintainCaretPosition( event );
					onKeyDownRafId = null;
				} );
			}

			/**
			 * Maintains the scroll position after a selection change caused by a
			 * keyboard event.
			 *
			 * @param {KeyboardEvent} event Keyboard event.
			 */
			function maintainCaretPosition( { keyCode } ) {
				if ( ! isSelectionEligibleForScroll() ) {
					return;
				}

				const currentCaretRect = computeCaretRect( defaultView );

				if ( ! currentCaretRect ) {
					return;
				}

				// If for some reason there is no position set to be scrolled to, let
				// this be the position to be scrolled to in the future.
				if ( ! caretRect ) {
					caretRect = currentCaretRect;
					return;
				}

				// Even though enabling the typewriter effect for arrow keys results in
				// a pleasant experience, it may not be the case for everyone, so, for
				// now, let's disable it.
				if ( arrowKeyCodes.has( keyCode ) ) {
					// Reset the caret position to maintain.
					caretRect = currentCaretRect;
					return;
				}

				const diff = currentCaretRect.top - caretRect.top;

				if ( diff === 0 ) {
					return;
				}

				const scrollContainer = getScrollContainer( node );

				// The page must be scrollable.
				if ( ! scrollContainer ) {
					return;
				}

				const windowScroll =
					scrollContainer === ownerDocument.body ||
					scrollContainer === ownerDocument.documentElement;
				const scrollY = windowScroll
					? defaultView.scrollY
					: scrollContainer.scrollTop;
				const scrollContainerY = windowScroll
					? 0
					: scrollContainer.getBoundingClientRect().top;
				const relativeScrollPosition = windowScroll
					? caretRect.top / defaultView.innerHeight
					: ( caretRect.top - scrollContainerY ) /
					  ( defaultView.innerHeight - scrollContainerY );

				// If the scroll position is at the start, the active editable element
				// is the last one, and the caret is positioned within the initial
				// trigger percentage of the page, do not scroll the page.
				// The typewriter effect should not kick in until an empty page has been
				// filled with the initial trigger percentage or the user scrolls
				// intentionally down.
				if (
					scrollY === 0 &&
					relativeScrollPosition < initialTriggerPercentage &&
					isLastEditableNode()
				) {
					// Reset the caret position to maintain.
					caretRect = currentCaretRect;
					return;
				}

				const scrollContainerHeight = windowScroll
					? defaultView.innerHeight
					: scrollContainer.clientHeight;

				// Abort if the target scroll position would scroll the caret out of
				// view.
				if (
					// The caret is under the lower fold.
					caretRect.top + caretRect.height >
						scrollContainerY + scrollContainerHeight ||
					// The caret is above the upper fold.
					caretRect.top < scrollContainerY
				) {
					// Reset the caret position to maintain.
					caretRect = currentCaretRect;
					return;
				}

				if ( windowScroll ) {
					defaultView.scrollBy( 0, diff );
				} else {
					scrollContainer.scrollTop += diff;
				}
			}

			/**
			 * Adds a `selectionchange` listener to reset the scroll position to be
			 * maintained.
			 */
			function addSelectionChangeListener() {
				ownerDocument.addEventListener(
					'selectionchange',
					computeCaretRectOnSelectionChange
				);
			}

			/**
			 * Resets the scroll position to be maintained during a `selectionchange`
			 * event. Also removes the listener, so it acts as a one-time listener.
			 */
			function computeCaretRectOnSelectionChange() {
				ownerDocument.removeEventListener(
					'selectionchange',
					computeCaretRectOnSelectionChange
				);
				computeCaretRectangle();
			}

			/**
			 * Resets the scroll position to be maintained.
			 */
			function computeCaretRectangle() {
				if ( isSelectionEligibleForScroll() ) {
					caretRect = computeCaretRect( defaultView );
				}
			}

			/**
			 * Checks if the current situation is elegible for scroll:
			 * - There should be one and only one block selected.
			 * - The component must contain the selection.
			 * - The active element must be contenteditable.
			 */
			function isSelectionEligibleForScroll() {
				return (
					node.contains( ownerDocument.activeElement ) &&
					ownerDocument.activeElement.isContentEditable
				);
			}

			function isLastEditableNode() {
				const editableNodes = node.querySelectorAll(
					'[contenteditable="true"]'
				);
				const lastEditableNode =
					editableNodes[ editableNodes.length - 1 ];
				return lastEditableNode === ownerDocument.activeElement;
			}

			// When the user scrolls or resizes, the scroll position should be
			// reset.
			defaultView.addEventListener( 'scroll', onScrollResize, true );
			defaultView.addEventListener( 'resize', onScrollResize, true );

			node.addEventListener( 'keydown', onKeyDown );
			node.addEventListener( 'keyup', maintainCaretPosition );
			node.addEventListener( 'mousedown', addSelectionChangeListener );
			node.addEventListener( 'touchstart', addSelectionChangeListener );

			return () => {
				defaultView.removeEventListener(
					'scroll',
					onScrollResize,
					true
				);
				defaultView.removeEventListener(
					'resize',
					onScrollResize,
					true
				);

				node.removeEventListener( 'keydown', onKeyDown );
				node.removeEventListener( 'keyup', maintainCaretPosition );
				node.removeEventListener(
					'mousedown',
					addSelectionChangeListener
				);
				node.removeEventListener(
					'touchstart',
					addSelectionChangeListener
				);

				ownerDocument.removeEventListener(
					'selectionchange',
					computeCaretRectOnSelectionChange
				);

				defaultView.cancelAnimationFrame( scrollResizeRafId );
				defaultView.cancelAnimationFrame( onKeyDownRafId );
			};
		},
		[ hasSelectedBlock ]
	);
}

function Typewriter( { children } ) {
	return (
		<div ref={ useTypewriter() } className="block-editor__typewriter">
			{ children }
		</div>
	);
}

/**
 * The exported component. The implementation of Typewriter faced technical
 * challenges in Internet Explorer, and is simply skipped, rendering the given
 * props children instead.
 *
 * @type {WPComponent}
 */
const TypewriterOrIEBypass = isIE ? ( props ) => props.children : Typewriter;

/**
 * Ensures that the text selection keeps the same vertical distance from the
 * viewport during keyboard events within this component. The vertical distance
 * can vary. It is the last clicked or scrolled to position.
 */
export default TypewriterOrIEBypass;
