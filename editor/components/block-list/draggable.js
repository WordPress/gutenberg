/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';

/**
 * withDragging provides dragStart and dragEnd properties for the component being wrapped.
 * When used, a cross-browser drag image is created. The component clones the specified element on drag-start
 * and uses the clone as a drag image during drag-over. Discards the clone on drag-end.
 * - See block-list and blockListBlock for example use.
 * - Provides "dragStart" and "dragEnd" handlers as properties to the wrapped component.
 *   - These can be used on any draggable element and the effect will be the same.
 * - Styling and drop handlers implemented by the consuming component.
 * @param {Component} OriginalComponent Original Component.
 * @return {Component} The original component wrapped with the additional properties.
 */
const withDragging = ( OriginalComponent ) => {
	class Draggable extends Component {
		constructor() {
			super( ...arguments );

			this.onDragStart = this.onDragStart.bind( this );
			this.onDragOver = this.onDragOver.bind( this );
			this.onDragEnd = this.onDragEnd.bind( this );

			this.state = {
				cloneNodeId: null,
				elementId: null,
			};

			this.cursorTop = null;
			this.cursorLeft = null;
		}

		/**
		 * Reorder via Drag & Drop. Step 3 of 4.
		 * Strategy: Remove inset and block clone, reset cursor, and remove drag listener.
		 * @param  {Object} event     The non-custom DragEvent.
		 */
		onDragEnd( event ) {
			const { elementId, cloneNodeId } = this.state;
			const element = document.getElementById( elementId );
			const cloneWrapper = document.getElementById( cloneNodeId );

			if ( element && cloneWrapper ) {
				// Remove clone.
				element.parentNode.removeChild( cloneWrapper );
			}

			// Reset cursor.
			document.body.classList.remove( 'dragging' );

			// A slight delay here gives a nicer effect.
			//  - The gray inset remains until reordering happens.
			this.setState( { elementId: null, cloneNodeId: null } );

			document.removeEventListener( 'dragover', this.onDragOver );
			event.stopPropagation();
		}

		/*
		 * Reorder via Drag & Drop. Step 2 of 4.
		 * Strategy: Update positioning of element clone based on mouse movement.
		 * @param  {Object} event     The non-custom DragEvent.
		 */
		onDragOver( event ) {
			const { cloneNodeId } = this.state;
			const cloneWrapper = document.getElementById( cloneNodeId );

			cloneWrapper.style.top =
				`${ parseInt( cloneWrapper.style.top, 10 ) + parseInt( event.clientY, 10 ) - parseInt( this.cursorTop, 10 ) }px`;
			cloneWrapper.style.left =
				`${ parseInt( cloneWrapper.style.left, 10 ) + parseInt( event.clientX, 10 ) - parseInt( this.cursorLeft, 10 ) }px`;

			// Update cursor coordinates.
			this.cursorLeft = event.clientX;
			this.cursorTop = event.clientY;
		}

		/**
		 * Reorder via Drag & Drop. Step 1 of 4.
		 * Strategy:
		 *  - Clone the current element and spawn clone over original element. Hide original element and set inset.
		 *  - Set transfer data.
		 *  - Add dragover listener.
		 * @param  {Object} event     The non-custom DragEvent.
		 * @param  {string} uid       The unique identifier of the element to be dragged.
		 * @param  {string} elementId The HTML id of the element to be dragged.
		 * @param  {number} order     The current index of the element to be dragged.
		 * @param  {string} type      A unique constant identifying the type of dragging operation.
		 */
		onDragStart( event, uid, elementId, order, type ) {
			const element = document.getElementById( elementId );
			const draggableWrapper = element.parentNode;
			const cloneWrapper = document.createElement( 'div' );
			const cloneNodeId = `clone-wrapper-${ element.id }`;
			const clone = element.cloneNode( true );
			const elementRect = element.getBoundingClientRect();
			const elementTopOffset = parseInt( elementRect.top, 10 );
			const elementLeftOffset = parseInt( elementRect.left, 10 );

			this.setState( { cloneNodeId, elementId } );

			// Set a fake drag image to avoid browser defaults.
			// It has been observed that some browsers change the cursor if a drag image is missing.
			if ( 'function' === typeof event.dataTransfer.setDragImage ) {
				const dragImage = document.createElement( 'div' );

				dragImage.id = `drag-image-${ element.id }`;
				dragImage.classList.add( 'invisible-drag-image' );
				document.body.appendChild( dragImage );
				// Set the invisible dragImage and remove from DOM right after.
				event.dataTransfer.setDragImage( dragImage, 0, 0 );
				setTimeout( ( ( _dragImage ) => () => {
					document.body.removeChild( _dragImage );
				} )( dragImage ), 0 );
			}

			event.dataTransfer.setData( 'text', JSON.stringify( { uid: uid, fromIndex: order, type: type } ) );

			// Prepare element clone and append to element wrapper.
			clone.id = `clone-${ element.id }`;
			cloneWrapper.id = cloneNodeId;
			cloneWrapper.classList.add( 'editor-block-list__draggable-clone' );
			cloneWrapper.style.width = `${ elementRect.width + 40 }px`;

			if ( elementRect.height > 700 ) {
				// Scale down clone if original element is larger than 700px.
				cloneWrapper.style.transform = 'scale(0.5)';
				cloneWrapper.style.transformOrigin = 'top left';
				// Position clone near the cursor.
				cloneWrapper.style.top = `${ parseInt( event.clientY, 10 ) - 100 }px`;
				cloneWrapper.style.left = `${ parseInt( event.clientX, 10 ) }px`;
			} else {
				// Position clone right over the original element (20px padding).
				cloneWrapper.style.top = `${ elementTopOffset - 20 }px`;
				cloneWrapper.style.left = `${ elementLeftOffset - 20 }px`;
			}

			cloneWrapper.appendChild( clone );
			draggableWrapper.appendChild( cloneWrapper );

			// Mark the current cursor coordinates.
			this.cursorLeft = event.clientX;
			this.cursorTop = event.clientY;

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
