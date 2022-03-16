/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * External dependencies
 */
import { throttle } from 'lodash';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const clonePadding = 0;
const bodyClass = 'is-dragging-components-draggable';

/**
 * @typedef RenderProp
 * @property {(event: import('react').DragEvent) => void} onDraggableStart `onDragStart` handler.
 * @property {(event: import('react').DragEvent) => void} onDraggableEnd   `onDragEnd` handler.
 */

/**
 * @typedef Props
 * @property {(props: RenderProp) => JSX.Element | null}  children                         Children.
 * @property {(event: import('react').DragEvent) => void} [onDragStart]                    Callback when dragging starts.
 * @property {(event: import('react').DragEvent) => void} [onDragOver]                     Callback when dragging happens over the document.
 * @property {(event: import('react').DragEvent) => void} [onDragEnd]                      Callback when dragging ends.
 * @property {string}                                     [cloneClassname]                 Classname for the cloned element.
 * @property {string}                                     [elementId]                      ID for the element.
 * @property {any}                                        [transferData]                   Transfer data for the drag event.
 * @property {string}                                     [__experimentalTransferDataType] The transfer data type to set.
 * @property {import('react').ReactNode}                  __experimentalDragComponent      Component to show when dragging.
 */

/**
 * @param {Props} props
 * @return {JSX.Element} A draggable component.
 */
export default function Draggable( {
	children,
	onDragStart,
	onDragOver,
	onDragEnd,
	cloneClassname,
	elementId,
	transferData,
	__experimentalTransferDataType: transferDataType = 'text',
	__experimentalDragComponent: dragComponent,
} ) {
	/** @type {import('react').MutableRefObject<HTMLDivElement | null>} */
	const dragComponentRef = useRef( null );
	const cleanup = useRef( () => {} );

	/**
	 * Removes the element clone, resets cursor, and removes drag listener.
	 *
	 * @param {import('react').DragEvent} event The non-custom DragEvent.
	 */
	function end( event ) {
		event.preventDefault();
		cleanup.current();

		if ( onDragEnd ) {
			onDragEnd( event );
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
	 * @param {import('react').DragEvent} event The non-custom DragEvent.
	 */
	function start( event ) {
		// @ts-ignore We know that ownerDocument does exist on an Element
		const { ownerDocument } = event.target;

		event.dataTransfer.setData(
			transferDataType,
			JSON.stringify( transferData )
		);

		const cloneWrapper = ownerDocument.createElement( 'div' );
		// Reset position to 0,0. Natural stacking order will position this lower, even with a transform otherwise.
		cloneWrapper.style.top = 0;
		cloneWrapper.style.left = 0;

		const dragImage = ownerDocument.createElement( 'div' );

		// Set a fake drag image to avoid browser defaults. Remove from DOM
		// right after. event.dataTransfer.setDragImage is not supported yet in
		// IE, we need to check for its existence first.
		if ( 'function' === typeof event.dataTransfer.setDragImage ) {
			dragImage.classList.add( dragImageClass );
			ownerDocument.body.appendChild( dragImage );
			event.dataTransfer.setDragImage( dragImage, 0, 0 );
		}

		cloneWrapper.classList.add( cloneWrapperClass );

		if ( cloneClassname ) {
			cloneWrapper.classList.add( cloneClassname );
		}

		let x = 0;
		let y = 0;
		// If a dragComponent is defined, the following logic will clone the
		// HTML node and inject it into the cloneWrapper.
		if ( dragComponentRef.current ) {
			// Position dragComponent at the same position as the cursor.
			x = event.clientX;
			y = event.clientY;
			cloneWrapper.style.transform = `translate( ${ x }px, ${ y }px )`;

			const clonedDragComponent = ownerDocument.createElement( 'div' );
			clonedDragComponent.innerHTML = dragComponentRef.current.innerHTML;
			cloneWrapper.appendChild( clonedDragComponent );

			// Inject the cloneWrapper into the DOM.
			ownerDocument.body.appendChild( cloneWrapper );
		} else {
			const element = ownerDocument.getElementById( elementId );

			// Prepare element clone and append to element wrapper.
			const elementRect = element.getBoundingClientRect();
			const elementWrapper = element.parentNode;
			const elementTopOffset = parseInt( elementRect.top, 10 );
			const elementLeftOffset = parseInt( elementRect.left, 10 );

			cloneWrapper.style.width = `${
				elementRect.width + clonePadding * 2
			}px`;

			const clone = element.cloneNode( true );
			clone.id = `clone-${ elementId }`;

			// Position clone right over the original element (20px padding).
			x = elementLeftOffset - clonePadding;
			y = elementTopOffset - clonePadding;
			cloneWrapper.style.transform = `translate( ${ x }px, ${ y }px )`;

			// Hack: Remove iFrames as it's causing the embeds drag clone to freeze.
			Array.from(
				clone.querySelectorAll( 'iframe' )
			).forEach( ( child ) => child.parentNode.removeChild( child ) );

			cloneWrapper.appendChild( clone );

			// Inject the cloneWrapper into the DOM.
			elementWrapper.appendChild( cloneWrapper );
		}

		// Mark the current cursor coordinates.
		let cursorLeft = event.clientX;
		let cursorTop = event.clientY;

		/**
		 * @param {import('react').DragEvent<Element>} e
		 */
		function over( e ) {
			// Skip doing any work if mouse has not moved.
			if ( cursorLeft === e.clientX && cursorTop === e.clientY ) {
				return;
			}
			const nextX = x + e.clientX - cursorLeft;
			const nextY = y + e.clientY - cursorTop;
			cloneWrapper.style.transform = `translate( ${ nextX }px, ${ nextY }px )`;
			cursorLeft = e.clientX;
			cursorTop = e.clientY;
			x = nextX;
			y = nextY;
			if ( onDragOver ) {
				onDragOver( e );
			}
		}

		// Aim for 60fps (16 ms per frame) for now. We can potentially use requestAnimationFrame (raf) instead,
		// note that browsers may throttle raf below 60fps in certain conditions.
		const throttledDragOver = throttle( over, 16 );

		ownerDocument.addEventListener( 'dragover', throttledDragOver );

		// Update cursor to 'grabbing', document wide.
		ownerDocument.body.classList.add( bodyClass );

		// Allow the Synthetic Event to be accessed from asynchronous code.
		// https://reactjs.org/docs/events.html#event-pooling
		event.persist();

		/** @type {number | undefined} */
		let timerId;

		if ( onDragStart ) {
			timerId = setTimeout( () => onDragStart( event ) );
		}

		cleanup.current = () => {
			// Remove drag clone.
			if ( cloneWrapper && cloneWrapper.parentNode ) {
				cloneWrapper.parentNode.removeChild( cloneWrapper );
			}

			if ( dragImage && dragImage.parentNode ) {
				dragImage.parentNode.removeChild( dragImage );
			}

			// Reset cursor.
			ownerDocument.body.classList.remove( bodyClass );

			ownerDocument.removeEventListener( 'dragover', throttledDragOver );

			clearTimeout( timerId );
		};
	}

	useEffect(
		() => () => {
			cleanup.current();
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
