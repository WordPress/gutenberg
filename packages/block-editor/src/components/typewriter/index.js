/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { computeCaretRect, getScrollContainer } from '@wordpress/dom';
import { withSelect } from '@wordpress/data';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

const isIE = window.navigator.userAgent.indexOf( 'Trident' ) !== -1;
const arrowKeyCodes = new Set( [ UP, DOWN, LEFT, RIGHT ] );
const initialTriggerPercentage = 0.75;

class Typewriter extends Component {
	constructor() {
		super( ...arguments );

		this.ref = createRef();
		this.onKeyDown = this.onKeyDown.bind( this );
		this.addSelectionChangeListener = this.addSelectionChangeListener.bind( this );
		this.computeCaretRectOnSelectionChange = this.computeCaretRectOnSelectionChange.bind( this );
		this.maintainCaretPosition = this.maintainCaretPosition.bind( this );
		this.computeCaretRect = this.computeCaretRect.bind( this );
		this.onScrollResize = this.onScrollResize.bind( this );
		this.isSelectionEligibleForScroll = this.isSelectionEligibleForScroll.bind( this );
	}

	componentDidMount() {
		// When the user scrolls or resizes, the scroll position should be
		// reset.
		window.addEventListener( 'scroll', this.onScrollResize, true );
		window.addEventListener( 'resize', this.onScrollResize, true );
	}

	componentWillUnmount() {
		window.removeEventListener( 'scroll', this.onScrollResize, true );
		window.removeEventListener( 'resize', this.onScrollResize, true );
		document.removeEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );

		if ( this.onScrollResize.rafId ) {
			window.cancelAnimationFrame( this.onScrollResize.rafId );
		}

		if ( this.onKeyDown.rafId ) {
			window.cancelAnimationFrame( this.onKeyDown.rafId );
		}
	}

	/**
	 * Resets the scroll position to be maintained.
	 */
	computeCaretRect() {
		if ( this.isSelectionEligibleForScroll() ) {
			this.caretRect = computeCaretRect();
		}
	}

	/**
	 * Resets the scroll position to be maintained during a `selectionchange`
	 * event. Also removes the listener, so it acts as a one-time listener.
	 */
	computeCaretRectOnSelectionChange() {
		document.removeEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );
		this.computeCaretRect();
	}

	onScrollResize() {
		if ( this.onScrollResize.rafId ) {
			return;
		}

		this.onScrollResize.rafId = window.requestAnimationFrame( () => {
			this.computeCaretRect();
			delete this.onScrollResize.rafId;
		} );
	}

	/**
	 * Checks if the current situation is elegible for scroll:
	 * - There should be one and only one block selected.
	 * - The component must contain the selection.
	 * - The active element must be contenteditable.
	 */
	isSelectionEligibleForScroll() {
		return (
			this.props.selectedBlockClientId &&
			this.ref.current.contains( document.activeElement ) &&
			document.activeElement.isContentEditable
		);
	}

	isLastEditableNode() {
		const editableNodes = this.ref.current.querySelectorAll(
			'[contenteditable="true"]'
		);
		const lastEditableNode = editableNodes[ editableNodes.length - 1 ];
		return lastEditableNode === document.activeElement;
	}

	/**
	 * Maintains the scroll position after a selection change caused by a
	 * keyboard event.
	 *
	 * @param {WPSyntheticEvent} event Synthetic keyboard event.
	 */
	maintainCaretPosition( { keyCode } ) {
		if ( ! this.isSelectionEligibleForScroll() ) {
			return;
		}

		const currentCaretRect = computeCaretRect();

		if ( ! currentCaretRect ) {
			return;
		}

		// If for some reason there is no position set to be scrolled to, let
		// this be the position to be scrolled to in the future.
		if ( ! this.caretRect ) {
			this.caretRect = currentCaretRect;
			return;
		}

		// Even though enabling the typewriter effect for arrow keys results in
		// a pleasant experience, it may not be the case for everyone, so, for
		// now, let's disable it.
		if ( arrowKeyCodes.has( keyCode ) ) {
			// Reset the caret position to maintain.
			this.caretRect = currentCaretRect;
			return;
		}

		const diff = currentCaretRect.top - this.caretRect.top;

		if ( diff === 0 ) {
			return;
		}

		const scrollContainer = getScrollContainer( this.ref.current );

		// The page must be scrollable.
		if ( ! scrollContainer ) {
			return;
		}

		const windowScroll = scrollContainer === document.body;
		const scrollY = windowScroll ?
			window.scrollY :
			scrollContainer.scrollTop;
		const scrollContainerY = windowScroll ?
			0 :
			scrollContainer.getBoundingClientRect().top;
		const relativeScrollPosition = windowScroll ?
			this.caretRect.top / window.innerHeight :
			( this.caretRect.top - scrollContainerY ) /
			( window.innerHeight - scrollContainerY );

		// If the scroll position is at the start, the active editable element
		// is the last one, and the caret is positioned within the initial
		// trigger percentage of the page, do not scroll the page.
		// The typewriter effect should not kick in until an empty page has been
		// filled with the initial trigger percentage or the user scrolls
		// intentionally down.
		if (
			scrollY === 0 &&
			relativeScrollPosition < initialTriggerPercentage &&
			this.isLastEditableNode()
		) {
			// Reset the caret position to maintain.
			this.caretRect = currentCaretRect;
			return;
		}

		const scrollContainerHeight = windowScroll ?
			window.innerHeight :
			scrollContainer.clientHeight;

		// Abort if the target scroll position would scroll the caret out of
		// view.
		if (
			// The caret is under the lower fold.
			this.caretRect.top + this.caretRect.height >
				scrollContainerY + scrollContainerHeight ||
			// The caret is above the upper fold.
			this.caretRect.top < scrollContainerY
		) {
			// Reset the caret position to maintain.
			this.caretRect = currentCaretRect;
			return;
		}

		if ( windowScroll ) {
			window.scrollBy( 0, diff );
		} else {
			scrollContainer.scrollTop += diff;
		}
	}

	/**
	 * Adds a `selectionchange` listener to reset the scroll position to be
	 * maintained.
	 */
	addSelectionChangeListener() {
		document.addEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );
	}

	onKeyDown( event ) {
		event.persist();

		// Ensure the any remaining request is cancelled.
		if ( this.onKeyDown.rafId ) {
			window.cancelAnimationFrame( this.onKeyDown.rafId );
		}

		// Use an animation frame for a smooth result.
		this.onKeyDown.rafId = window.requestAnimationFrame( () => {
			this.maintainCaretPosition( event );
			delete this.onKeyDown.rafId;
		} );
	}

	render() {
		// There are some issues with Internet Explorer, which are probably not
		// worth spending time on. Let's disable it.
		if ( isIE ) {
			return this.props.children;
		}

		// Disable reason: Wrapper itself is non-interactive, but must capture
		// bubbling events from children to determine focus transition intents.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				ref={ this.ref }
				onKeyDown={ this.onKeyDown }
				onKeyUp={ this.maintainCaretPosition }
				onMouseDown={ this.addSelectionChangeListener }
				onTouchStart={ this.addSelectionChangeListener }
				className="block-editor__typewriter"
			>
				{ this.props.children }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

/**
 * Ensures that the text selection keeps the same vertical distance from the
 * viewport during keyboard events within this component. The vertical distance
 * can vary. It is the last clicked or scrolled to position.
 */
export default withSelect( ( select ) => {
	const { getSelectedBlockClientId } = select( 'core/block-editor' );
	return { selectedBlockClientId: getSelectedBlockClientId() };
} )( Typewriter );
