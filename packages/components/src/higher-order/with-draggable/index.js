/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const cloneHeightTransformationBreakpoint = 700;
const clonePadding = 20;

const withDraggable = createHigherOrderComponent(
	( OriginalComponent ) => {
		return class extends Component {
			constructor() {
				super( ...arguments );
				this.onDragStart = this.onDragStart.bind( this );
				this.onDragOver = this.onDragOver.bind( this );
				this.onDragEnd = this.onDragEnd.bind( this );
				this.resetDragState = this.resetDragState.bind( this );
			}

			componentWillUnmount() {
				this.resetDragState();
			}

			/**
			 * Function that creates the dragstart event handler.
			 *
			 * @param  {string} elementId The HTML id of the element to be dragged.
			 * @param  {Object} data The data to be set to the event's dataTransfer - to be accessible in any later drop logic.
			 * @return {function} A function for wrapped components to use as their onDragStart handler.
			 */
			onDragStart( elementId, data ) {
				return ( event ) => {
					const element = document.getElementById( elementId );
					if ( ! element || ! data ) {
						event.preventDefault();
						return;
					}

					event.dataTransfer.setData( 'text', JSON.stringify( data ) );

					// Set a fake drag image to avoid browser defaults. Remove from DOM
					// right after. event.dataTransfer.setDragImage is not supported yet in
					// IE, we need to check for its existence first.
					if ( 'function' === typeof event.dataTransfer.setDragImage ) {
						const dragImage = document.createElement( 'div' );
						dragImage.id = `drag-image-${ elementId }`;
						dragImage.classList.add( dragImageClass );
						document.body.appendChild( dragImage );
						event.dataTransfer.setDragImage( dragImage, 0, 0 );
						setTimeout( () => {
							document.body.removeChild( dragImage );
						} );
					}

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

					// Hack: Remove iFrames as it's causing the embeds drag clone to freeze
					[ ...clone.querySelectorAll( 'iframe' ) ].forEach( ( child ) => child.parentNode.removeChild( child ) );

					this.cloneWrapper.appendChild( clone );
					elementWrapper.appendChild( this.cloneWrapper );

					// Mark the current cursor coordinates.
					this.cursorLeft = event.clientX;
					this.cursorTop = event.clientY;
					// Update cursor to 'grabbing', document wide.
					document.body.classList.add( 'is-dragging-components-draggable' );

					// connect listeners
					document.addEventListener( 'dragover', this.onDragOver );
					document.addEventListener( 'dragend', this.onDragEnd );
				};
			}

			/**
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
			 * Removes the element clone, resets cursor, and removes drag listener.
			 */
			onDragEnd( ) {
				this.resetDragState();
			}

			/**
			 * Cleans up drag state when drag has completed, or component unmounts
			 * while dragging.
			 */
			resetDragState() {
				// Remove listeners
				document.removeEventListener( 'dragover', this.onDragOver );
				document.removeEventListener( 'dragend', this.onDragEnd );

				// Remove drag clone
				if ( this.cloneWrapper && this.cloneWrapper.parentNode ) {
					this.cloneWrapper.parentNode.removeChild( this.cloneWrapper );
					this.cloneWrapper = null;
				}

				// Reset cursor.
				document.body.classList.remove( 'is-dragging-components-draggable' );
			}

			render() {
				return (
					<OriginalComponent
						initDragging={ this.onDragStart }
						{ ...this.props }
					/>
				);
			}
		};
	},
	'withDraggable'
);

export default withDraggable;
