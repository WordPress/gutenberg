/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const cloneHeightTransformationBreakpoint = 700;
const clonePadding = 0;
const bodyClass = 'is-dragging-components-draggable';

export default function Draggable( {
	children,
	onDragStart,
	onDragOver,
	onDragEnd,
	cloneClassname,
	elementId,
	transferData,
	__experimentalDragComponent: dragComponent,
} ) {
	const dragComponentRef = useRef();
	const cloneWrapper = useRef();
	const cursorLeft = useRef();
	const cursorTop = useRef();
	const timerId = useRef();

	/**
	 * Removes the element clone, resets cursor, and removes drag listener.
	 *
	 * @param {Object} event The non-custom DragEvent.
	 */
	function end( event ) {
		event.preventDefault();
		resetDragState();

		if ( onDragOver ) {
			onDragEnd( event );
		}
	}

	/**
	 * Updates positioning of element clone based on mouse movement during dragging.
	 *
	 * @param {Object} event The non-custom DragEvent.
	 */
	function over( event ) {
		cloneWrapper.current.style.top = `${
			parseInt( cloneWrapper.current.style.top, 10 ) +
			event.clientY -
			cursorTop.current
		}px`;
		cloneWrapper.current.style.left = `${
			parseInt( cloneWrapper.current.style.left, 10 ) +
			event.clientX -
			cursorLeft.current
		}px`;

		// Update cursor coordinates.
		cursorLeft.current = event.clientX;
		cursorTop.current = event.clientY;

		if ( onDragOver ) {
			onDragOver( event );
		}
	}

	/**
	 * This method does a couple of things:
	 *
	 * - Clones the current element and spawns clone over original element.
	 * - Adds a fake temporary drag image to avoid browser defaults.
	 * - Sets transfer data.
	 * - Adds dragover listener.
	 *
	 * @param {Object} event The non-custom DragEvent.
	 */
	function start( event ) {
		const element = document.getElementById( elementId );
		if ( ! element ) {
			event.preventDefault();
			return;
		}

		// Set a fake drag image to avoid browser defaults. Remove from DOM
		// right after. event.dataTransfer.setDragImage is not supported yet in
		// IE, we need to check for its existence first.
		if ( 'function' === typeof event.dataTransfer.setDragImage ) {
			const dragImage = document.createElement( 'div' );
			dragImage.classList.add( dragImageClass );
			event.dataTransfer.setDragImage( dragImage, 0, 0 );
		}

		event.dataTransfer.setData( 'text', JSON.stringify( transferData ) );

		// Prepare element clone and append to element wrapper.
		const elementRect = element.getBoundingClientRect();
		const elementWrapper = element.parentNode;
		const elementTopOffset = parseInt( elementRect.top, 10 );
		const elementLeftOffset = parseInt( elementRect.left, 10 );
		cloneWrapper.current = document.createElement( 'div' );
		cloneWrapper.current.classList.add( cloneWrapperClass );
		if ( cloneClassname ) {
			cloneWrapper.current.classList.add( cloneClassname );
		}

		cloneWrapper.current.style.width = `${
			elementRect.width + clonePadding * 2
		}px`;

		// If a dragComponent is defined, the following logic will clone the
		// HTML node and inject it into the cloneWrapper.
		if ( dragComponentRef.current ) {
			// Position dragComponent at the same position as the cursor.
			cloneWrapper.current.style.top = `${ event.clientY }px`;
			cloneWrapper.current.style.left = `${ event.clientX }px`;

			const clonedDragComponent = document.createElement( 'div' );
			clonedDragComponent.innerHTML = dragComponentRef.current.innerHTML;
			cloneWrapper.current.appendChild( clonedDragComponent );
		} else {
			const clone = element.cloneNode( true );
			clone.id = `clone-${ elementId }`;

			if ( elementRect.height > cloneHeightTransformationBreakpoint ) {
				// Scale down clone if original element is larger than 700px.
				cloneWrapper.current.style.transform = 'scale(0.5)';
				cloneWrapper.current.style.transformOrigin = 'top left';
				// Position clone near the cursor.
				cloneWrapper.current.style.top = `${ event.clientY - 100 }px`;
				cloneWrapper.current.style.left = `${ event.clientX }px`;
			} else {
				// Position clone right over the original element (20px padding).
				cloneWrapper.current.style.top = `${
					elementTopOffset - clonePadding
				}px`;
				cloneWrapper.current.style.left = `${
					elementLeftOffset - clonePadding
				}px`;
			}

			// Hack: Remove iFrames as it's causing the embeds drag clone to freeze
			Array.from(
				clone.querySelectorAll( 'iframe' )
			).forEach( ( child ) => child.parentNode.removeChild( child ) );

			cloneWrapper.current.appendChild( clone );
		}

		// Inject the cloneWrapper into the DOM.
		elementWrapper.appendChild( cloneWrapper.current );

		// Mark the current cursor coordinates.
		cursorLeft.current = event.clientX;
		cursorTop.current = event.clientY;

		// Update cursor to 'grabbing', document wide.
		document.body.classList.add( bodyClass );

		document.addEventListener( 'dragover', over );

		// Allow the Synthetic Event to be accessed from asynchronous code.
		// https://reactjs.org/docs/events.html#event-pooling
		event.persist();

		if ( onDragStart ) {
			timerId.current = setTimeout( () => onDragStart( event ) );
		}
	}

	/**
	 * Cleans up drag state when drag has completed, or component unmounts
	 * while dragging.
	 */
	function resetDragState() {
		// Remove drag clone
		if ( cloneWrapper.current && cloneWrapper.current.parentNode ) {
			cloneWrapper.current.parentNode.removeChild( cloneWrapper.current );
			cloneWrapper.current = null;
		}

		cursorLeft.current = null;
		cursorTop.current = null;

		// Reset cursor.
		document.body.classList.remove( bodyClass );

		document.removeEventListener( 'dragover', over );
	}

	useEffect(
		() => () => {
			resetDragState();
			clearTimeout( timerId.current );
		},
		[]
	);

	return (
		<>
			{ children( {
				onDraggableStart: start,
				onDraggableEnd: end,
			} ) }
			{ dragComponent && (
				<div
					className="components-draggable-drag-component-root"
					style={ { display: 'none' } }
					ref={ dragComponentRef }
				>
					{ dragComponent }
				</div>
			) }
		</>
	);
}
