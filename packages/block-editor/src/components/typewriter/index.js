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
import { compose } from '@wordpress/compose';

class Typewriter extends Component {
	constructor() {
		super( ...arguments );

		this.ref = createRef();
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onMouseDown = this.onMouseDown.bind( this );
		this.onTouchStart = this.onTouchStart.bind( this );
		this.maintainCaretPositionOnSelectionChange = this.maintainCaretPositionOnSelectionChange.bind( this );
		this.computeCaretRectOnSelectionChange = this.computeCaretRectOnSelectionChange.bind( this );
		this.maintainCaretPosition = this.maintainCaretPosition.bind( this );
		this.computeCaretRect = this.computeCaretRect.bind( this );
		this.debouncedComputeCaretRect = debounce( this.computeCaretRect, 100 );
		this.isSelectionEligibleForScroll = this.isSelectionEligibleForScroll.bind( this );
	}

	componentDidMount() {
		window.addEventListener( 'scroll', this.debouncedComputeCaretRect, true );
		window.addEventListener( 'resize', this.debouncedComputeCaretRect, true );
	}

	componentWillUnmount() {
		window.removeEventListener( 'scroll', this.debouncedComputeCaretRect, true );
		window.removeEventListener( 'resize', this.debouncedComputeCaretRect, true );
		document.removeEventListener( 'selectionchange', this.maintainCaretPositionOnSelectionChange );
		document.removeEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );
		window.cancelAnimationFrame( this.rafId );
		this.debouncedComputeCaretRect.cancel();
	}

	computeCaretRect() {
		if ( this.isSelectionEligibleForScroll() ) {
			this.caretRect = computeCaretRect();
		}
	}

	maintainCaretPositionOnSelectionChange() {
		document.removeEventListener( 'selectionchange', this.maintainCaretPositionOnSelectionChange );
		this.maintainCaretPosition();
	}

	computeCaretRectOnSelectionChange() {
		document.removeEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );
		this.computeCaretRect();
	}

	isSelectionEligibleForScroll() {
		return (
			// There should be one and only one block selected.
			this.props.selectedBlockClientId &&
			// The component must contain the selection.
			this.ref.current.contains( document.activeElement ) &&
			// The active element must be contenteditable.
			document.activeElement.isContentEditable
		);
	}

	maintainCaretPosition() {
		if ( ! this.caretRect ) {
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

		// The scroll container may be different depending on the viewport
		// width.
		if ( scrollContainer === document.body ) {
			window.scrollBy( 0, diff );
		} else {
			scrollContainer.scrollTop += diff;
		}
	}

	onMouseDown() {
		document.addEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );
	}

	onTouchStart() {
		document.addEventListener( 'selectionchange', this.computeCaretRectOnSelectionChange );
	}

	onKeyDown() {
		// Ensure the any remaining request is cancelled.
		window.cancelAnimationFrame( this.rafId );
		// Use an animation frame for a smooth result.
		this.rafId = window.requestAnimationFrame( this.maintainCaretPosition );
		// In rare cases, the selection is not updated before the animation
		// frame. This selection change listener is a back up.
		document.addEventListener( 'selectionchange', this.maintainCaretPositionOnSelectionChange );
	}

	render() {
		// Disable reason: Wrapper itself is non-interactive, but must capture
		// bubbling events from children to determine focus transition intents.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				ref={ this.ref }
				onKeyDown={ this.onKeyDown }
				onKeyUp={ this.onKeyUp }
				onMouseDown={ this.onMouseDown }
				onTouchStart={ this.onTouchStart }
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
export default compose( [
	withSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( 'core/block-editor' );
		return { selectedBlockClientId: getSelectedBlockClientId() };
	} ),
] )( Typewriter );
