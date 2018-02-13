/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';

const withDragging = ( OriginalComponent ) => {
	class Draggable extends Component {
		constructor() {
			super( ...arguments );

			this.onDragStart = this.onDragStart.bind( this );
			this.onDragOver = this.onDragOver.bind( this );
			this.onDragEnd = this.onDragEnd.bind( this );
			this.cursorTop = null;
			this.cursorLeft = null;
			this.config = {
				dragImageClass: 'components-with-dragging__invisible-drag-image',
				cloneWrapperClass: 'components-with-dragging__clone',
				cloneHeightTransformationBreakpoint: 700,
				clonePadding: 20,
			};
			this.state = {
				cloneNodeId: null,
				elementId: null,
			};
		}

		/**
		 * Removes the element clone, resets cursor, and removes drag listener.
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

			this.setState( { elementId: null, cloneNodeId: null } );

			document.removeEventListener( 'dragover', this.onDragOver );
			event.stopPropagation();
		}

		/*
		 * Updates positioning of element clone based on mouse movement during dragging.
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
		 *  - Clones the current element and spawns clone over original element.
		 *  - Adds a fake temporary drag image to avoid browser defaults.
		 *  - Sets transfer data.
		 *  - Adds dragover listener.
		 * @param  {Object} event     The non-custom DragEvent.
		 * @param  {string} uid       The unique identifier of the element to be dragged.
		 * @param  {string} elementId The HTML id of the element to be dragged.
		 * @param  {number} order     The current index of the element to be dragged.
		 * @param  {string} type      A unique constant identifying the type of dragging operation.
		 */
		onDragStart( event, uid, elementId, order, type ) {
			const element = document.getElementById( elementId );
			const elementWrapper = element.parentNode;
			const elementRect = element.getBoundingClientRect();
			const elementTopOffset = parseInt( elementRect.top, 10 );
			const elementLeftOffset = parseInt( elementRect.left, 10 );
			const clone = element.cloneNode( true );
			const cloneWrapper = document.createElement( 'div' );
			const cloneNodeId = `clone-wrapper-${ element.id }`;
			const dragImage = document.createElement( 'div' );

			this.setState( { cloneNodeId, elementId } );

			// Set a fake drag image to avoid browser defaults. Remove from DOM right after.
			if ( 'function' === typeof event.dataTransfer.setDragImage ) {
				dragImage.id = `drag-image-${ element.id }`;
				dragImage.classList.add( this.config.dragImageClass );
				document.body.appendChild( dragImage );
				event.dataTransfer.setDragImage( dragImage, 0, 0 );
				setTimeout( ( ( _dragImage ) => () => {
					document.body.removeChild( _dragImage );
				} )( dragImage ), 0 );
			}

			event.dataTransfer.setData(
				'text',
				JSON.stringify( {
					uid: uid,
					fromIndex: order,
					type: type
				} )
			);

			// Prepare element clone and append to element wrapper.
			clone.id = `clone-${ element.id }`;
			cloneWrapper.id = cloneNodeId;
			cloneWrapper.classList.add( this.config.cloneWrapperClass );
			cloneWrapper.style.width = `${ elementRect.width + ( this.config.clonePadding * 2 ) }px`;

			if ( elementRect.height > this.config.cloneHeightTransformationBreakpoint ) {
				// Scale down clone if original element is larger than 700px.
				cloneWrapper.style.transform = 'scale(0.5)';
				cloneWrapper.style.transformOrigin = 'top left';
				// Position clone near the cursor.
				cloneWrapper.style.top = `${ parseInt( event.clientY, 10 ) - 100 }px`;
				cloneWrapper.style.left = `${ parseInt( event.clientX, 10 ) }px`;
			} else {
				// Position clone right over the original element (20px padding).
				cloneWrapper.style.top = `${ elementTopOffset - this.config.clonePadding }px`;
				cloneWrapper.style.left = `${ elementLeftOffset - this.config.clonePadding }px`;
			}

			cloneWrapper.appendChild( clone );
			elementWrapper.appendChild( cloneWrapper );

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
