/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';

const dragImageClass = 'components-with-dragging__invisible-drag-image';
const cloneWrapperClass = 'components-with-dragging__clone';
const cloneHeightTransformationBreakpoint = 700;
const clonePadding = 20;
const context = {
	cloneNodeId: null,
	elementId: null,
	cursorTop: null,
	cursorLeft: null,
};

const withDragging = ( OriginalComponent ) => {
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
			const element = document.getElementById( context.elementId );
			const cloneWrapper = document.getElementById( context.cloneNodeId );

			if ( element && cloneWrapper ) {
				// Remove clone.
				element.parentNode.removeChild( cloneWrapper );
				context.elementId = null;
				context.cloneNodeId = null;
			}

			// Reset cursor.
			document.body.classList.remove( 'dragging' );
			document.removeEventListener( 'dragover', this.onDragOver );
			event.stopPropagation();
			event.preventDefault();
		}

		/*
		 * Updates positioning of element clone based on mouse movement during dragging.
		 * @param  {Object} event     The non-custom DragEvent.
		 */
		onDragOver( event ) {
			const cloneWrapper = document.getElementById( context.cloneNodeId );

			cloneWrapper.style.top =
				`${ parseInt( cloneWrapper.style.top, 10 ) + event.clientY - context.cursorTop }px`;
			cloneWrapper.style.left =
				`${ parseInt( cloneWrapper.style.left, 10 ) + event.clientX - context.cursorLeft }px`;

			// Update cursor coordinates.
			context.cursorLeft = event.clientX;
			context.cursorTop = event.clientY;
		}

		/**
		 *  - Clones the current element and spawns clone over original element.
		 *  - Adds a fake temporary drag image to avoid browser defaults.
		 *  - Sets transfer data.
		 *  - Adds dragover listener.
		 * @param  {Object} event					The non-custom DragEvent.
		 * @param  {string} elementId				The HTML id of the element to be dragged.
		 * @param  {Object} transferData			The data to be set to event's dataTransfer and will be made accessible in any later drop logic.
		 * @param  {string} transferData.rootUID	A unique identifier of the element's root.
		 * @param  {string} transferData.uid		A unique identifier of the element to be dragged.
		 * @param  {number} transferData.order		The current index of the element to be dragged.
		 * @param  {string} transferData.type		A unique constant identifying the type of dragging operation.
		 * @param  {string} transferData.layout		A layout identifier used to distinguish nested elements.
		 */
		onDragStart( event, elementId, transferData ) {
			const element = document.getElementById( elementId );
			const elementWrapper = element.parentNode;
			const elementRect = element.getBoundingClientRect();
			const elementTopOffset = parseInt( elementRect.top, 10 );
			const elementLeftOffset = parseInt( elementRect.left, 10 );
			const clone = element.cloneNode( true );
			const cloneWrapper = document.createElement( 'div' );
			const dragImage = document.createElement( 'div' );

			context.elementId = elementId;
			context.cloneNodeId = `clone-wrapper-${ elementId }`;

			// Set a fake drag image to avoid browser defaults. Remove from DOM right after.
			if ( 'function' === typeof event.dataTransfer.setDragImage ) {
				dragImage.id = `drag-image-${ context.elementId }`;
				dragImage.classList.add( dragImageClass );
				document.body.appendChild( dragImage );
				event.dataTransfer.setDragImage( dragImage, 0, 0 );
				setTimeout( ( ( _dragImage ) => () => {
					document.body.removeChild( _dragImage );
				} )( dragImage ), 0 );
			}

			event.dataTransfer.setData( 'text', JSON.stringify( transferData ) );

			// Prepare element clone and append to element wrapper.
			clone.id = `clone-${ context.elementId }`;
			cloneWrapper.id = context.cloneNodeId;
			cloneWrapper.classList.add( cloneWrapperClass );
			cloneWrapper.style.width = `${ elementRect.width + ( clonePadding * 2 ) }px`;

			if ( elementRect.height > cloneHeightTransformationBreakpoint ) {
				// Scale down clone if original element is larger than 700px.
				cloneWrapper.style.transform = 'scale(0.5)';
				cloneWrapper.style.transformOrigin = 'top left';
				// Position clone near the cursor.
				cloneWrapper.style.top = `${ event.clientY - 100 }px`;
				cloneWrapper.style.left = `${ event.clientX }px`;
			} else {
				// Position clone right over the original element (20px padding).
				cloneWrapper.style.top = `${ elementTopOffset - clonePadding }px`;
				cloneWrapper.style.left = `${ elementLeftOffset - clonePadding }px`;
			}

			cloneWrapper.appendChild( clone );
			elementWrapper.appendChild( cloneWrapper );

			// Mark the current cursor coordinates.
			context.cursorLeft = event.clientX;
			context.cursorTop = event.clientY;
			// Update cursor to 'grabbing', document wide.
			document.body.classList.add( 'dragging' );
			document.addEventListener( 'dragover', this.onDragOver );
			event.stopPropagation();
		}

		render() {
			return (
				<OriginalComponent
					{ ...this.props }
					onDragStart={ this.onDragStart }
					onDragEnd={ this.onDragEnd }
				/>
			);
		}
	}

	return Draggable;
};

export default withDragging;
