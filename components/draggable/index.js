/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import withSafeTimeout from '../higher-order/with-safe-timeout';
import './style.scss';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const cloneHeightTransformationBreakpoint = 700;
const clonePadding = 20;

class Draggable extends Component {
	constructor() {
		super( ...arguments );
		this.onDragStart = this.onDragStart.bind( this );
		this.onDragOver = this.onDragOver.bind( this );
		this.onDragEnd = this.onDragEnd.bind( this );
	}

	/**
	 * Removes the element clone, resets cursor, and removes drag listener.
	 * @param  {Object} event     The non-custom DragEvent.
	 */
	onDragEnd( event ) {
		const { onDragEnd = noop } = this.props;
		this.removeDragClone();
		// Reset cursor.
		document.body.classList.remove( 'dragging' );
		event.preventDefault();

		this.props.setTimeout( onDragEnd );
	}

	/*
	 * Updates positioning of element clone based on mouse movement during dragging.
	 * @param  {Object} event     The non-custom DragEvent.
	 */
	onDragOver( event ) {
		this.cloneWrapper.style.top =
			`${ parseInt( this.cloneWrapper.style.top, 10 ) + event.clientY - this.cursorTop }px`;
		this.cloneWrapper.style.left =
			`${ parseInt( this.cloneWrapper.style.left, 10 ) + event.clientX - this.cursorLeft }px`;

		// Update cursor coordinates.
		this.cursorLeft = event.clientX;
		this.cursorTop = event.clientY;
	}

	/**
	 *  - Clones the current element and spawns clone over original element.
	 *  - Adds a fake temporary drag image to avoid browser defaults.
	 *  - Sets transfer data.
	 *  - Adds dragover listener.
	 * @param  {Object} event					The non-custom DragEvent.
	 * @param  {string} elementId				The HTML id of the element to be dragged.
	 * @param  {Object} transferData			The data to be set to the event's dataTransfer - to be accessible in any later drop logic.
	 */
	onDragStart( event ) {
		const { elementId, transferData, onDragStart = noop } = this.props;
		const element = document.getElementById( elementId );

		// Set a fake drag image to avoid browser defaults. Remove from DOM right after.
		// event.dataTransfer.setDragImage is not supported yet in IE,
		// we need to check for its existance first.
		if ( 'function' === typeof event.dataTransfer.setDragImage ) {
			const dragImage = document.createElement( 'div' );
			dragImage.id = `drag-image-${ elementId }`;
			dragImage.classList.add( dragImageClass );
			document.body.appendChild( dragImage );
			event.dataTransfer.setDragImage( dragImage, 0, 0 );
			this.props.setTimeout( () => {
				document.body.removeChild( dragImage );
			} );
		}

		event.dataTransfer.setData( 'text', JSON.stringify( transferData ) );

		// Prepare element clone and append to element wrapper.
		const elementRect = element.getBoundingClientRect();
		const elementWrapper = element.parentNode;
		const elementTopOffset = parseInt( elementRect.top, 10 );
		const elementLeftOffset = parseInt( elementRect.left, 10 );
		const clone = element.cloneNode( true );
		clone.id = `clone-${ elementId }`;
		this.cloneWrapper = document.createElement( 'div' );
		this.cloneWrapper.classList.add( cloneWrapperClass );
		this.cloneWrapper.style.width = `${ elementRect.width + ( clonePadding * 2 ) }px`;

		if ( elementRect.height > cloneHeightTransformationBreakpoint ) {
			// Scale down clone if original element is larger than 700px.
			this.cloneWrapper.style.transform = 'scale(0.5)';
			this.cloneWrapper.style.transformOrigin = 'top left';
			// Position clone near the cursor.
			this.cloneWrapper.style.top = `${ event.clientY - 100 }px`;
			this.cloneWrapper.style.left = `${ event.clientX }px`;
		} else {
			// Position clone right over the original element (20px padding).
			this.cloneWrapper.style.top = `${ elementTopOffset - clonePadding }px`;
			this.cloneWrapper.style.left = `${ elementLeftOffset - clonePadding }px`;
		}
		this.cloneWrapper.appendChild( clone );
		elementWrapper.appendChild( this.cloneWrapper );

		// Mark the current cursor coordinates.
		this.cursorLeft = event.clientX;
		this.cursorTop = event.clientY;
		// Update cursor to 'grabbing', document wide.
		document.body.classList.add( 'dragging' );
		document.addEventListener( 'dragover', this.onDragOver );

		this.props.setTimeout( onDragStart );
	}

	componentWillUnmount() {
		this.removeDragClone();
	}

	removeDragClone() {
		document.removeEventListener( 'dragover', this.onDragOver );
		if ( this.cloneWrapper && this.cloneWrapper.parentElement ) {
			// Remove clone.
			this.cloneWrapper.remove();
			this.cloneWrapper = null;
		}
	}

	render() {
		const { children, className } = this.props;
		return (
			<div
				className={ classnames( 'components-draggable', className ) }
				onDragStart={ this.onDragStart }
				onDragEnd={ this.onDragEnd }
				draggable
			>
				{ children }
			</div>
		);
	}
}

export default withSafeTimeout( Draggable );
