/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { computeCaretRect, getScrollContainer } from '@wordpress/dom';
import { withSelect } from '@wordpress/data';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

const isIE = window.navigator.userAgent.indexOf( 'Trident' ) !== -1;
const arrowKeyCodes = new Set( [ UP, DOWN, LEFT, RIGHT ] );

class Typewriter extends Component {
	constructor() {
		super( ...arguments );

		this.ref = createRef();
		this.onKeyDown = this.onKeyDown.bind( this );
		this.addSelectionChangeListener = this.addSelectionChangeListener.bind( this );
		this.computeCaretRectOnSelectionChange = this.computeCaretRectOnSelectionChange.bind( this );
		this.maintainCaretPosition = this.maintainCaretPosition.bind( this );
		this.computeCaretRect = this.computeCaretRect.bind( this );
		this.debouncedComputeCaretRect = debounce( this.computeCaretRect, 100 );
		this.isSelectionEligibleForScroll = this.isSelectionEligibleForScroll.bind( this );
	}

	componentDidMount() {
		// When the user scrolls or resizes, the scroll position should be
		// reset.
		window.addEventListener( 'scroll', this.debouncedComputeCaretRect, true );
		window.addEventListener( 'resize', this.debouncedComputeCaretRect, true );
	}

	componentWillUnmount() {
		window.removeEventListener( 'scroll', this.debouncedComputeCaretRect, true );
		window.removeEventListener( 'resize', this.debouncedComputeCaretRect, true );
		document.removeEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );
		window.cancelAnimationFrame( this.rafId );
		this.debouncedComputeCaretRect.cancel();
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

	/**
	 * Maintains the scroll position after a selection change caused by a
	 * keyboard event.
	 *
	 * @param {SyntheticEvent} event Synthetic keyboard event.
	 */
	maintainCaretPosition( { keyCode } ) {
		// If for some reason there is no position set to be scrolled to, let
		// this be the position to be scrolled to in the future.
		if ( ! this.caretRect ) {
			this.computeCaretRect();
			return;
		}

		// Even though enabling the typewriter effect for arrow keys results in
		// a pleasant experience, it may not be the case for everyone, so, for
		// now, let's disable it.
		if ( arrowKeyCodes.has( keyCode ) ) {
			this.computeCaretRect();
			return;
		}

		if ( ! this.isSelectionEligibleForScroll() ) {
			return;
		}

		const currentCaretRect = computeCaretRect();

		if ( ! currentCaretRect ) {
			return;
		}

		const diff = currentCaretRect.y - this.caretRect.y;

		if ( diff === 0 ) {
			return;
		}

		const scrollContainer = getScrollContainer( this.ref.current );

		// The page must be scrollable.
		if ( ! scrollContainer ) {
			return;
		}

		const editableNodes = this.ref.current.querySelectorAll( '[contenteditable="true"]' );
		const lastEditableNode = editableNodes[ editableNodes.length - 1 ];
		const isLastEditableNode = lastEditableNode === document.activeElement;

		// The scroll container may be different depending on the viewport
		// width.
		// Nested condition: if the scroll position is at the start and the
		// active editable element is the last one, do not scroll the page.
		// The typewriter effect should not kick in until an empty page has been
		// filled or the user scrolls intentionally down.
		if ( scrollContainer === document.body ) {
			if ( isLastEditableNode && window.scrollY === 0 ) {
				return;
			}

			window.scrollBy( 0, diff );
		} else {
			if ( isLastEditableNode && scrollContainer.scrollTop === 0 ) {
				return;
			}

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
		window.cancelAnimationFrame( this.rafId );
		// Use an animation frame for a smooth result.
		this.rafId = window.requestAnimationFrame( () =>
			this.maintainCaretPosition( event )
		);
	}

	render() {
		// There are some issues with Internet Explorer, which are probably not
		// worth spending time on. Let's disable it.
		if ( isIE ) {
			return null;
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
			>
				{ this.props.children }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

/**
 * Ensures that the text selection keeps the same vertical distance from the
 * viewport during keyboard events within this component.
 */
export default withSelect( ( select ) => {
	const { getSelectedBlockClientId } = select( 'core/block-editor' );
	return { selectedBlockClientId: getSelectedBlockClientId() };
} )( Typewriter );
