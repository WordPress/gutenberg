/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const cloneHeightTransformationBreakpoint = 700;
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

		// If a dragComponent is defined, the following logic will clone the
		// HTML node and inject it into the cloneWrapper.
		if ( dragComponentRef.current ) {
			// Position dragComponent at the same position as the cursor.
			cloneWrapper.style.top = `${ event.clientY }px`;
			cloneWrapper.style.left = `${ event.clientX }px`;

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

			if ( elementRect.height > cloneHeightTransformationBreakpoint ) {
				// Scale down clone if original element is larger than 700px.
				cloneWrapper.style.transform = 'scale(0.5)';
				cloneWrapper.style.transformOrigin = 'top left';
				// Position clone near the cursor.
				cloneWrapper.style.top = `${ event.clientY - 100 }px`;
				cloneWrapper.style.left = `${ event.clientX }px`;
			} else {
				// Position clone right over the original element (20px padding).
				cloneWrapper.style.top = `${
					elementTopOffset - clonePadding
				}px`;
				cloneWrapper.style.left = `${
					elementLeftOffset - clonePadding
				}px`;
			}

			// Hack: Remove iFrames as it's causing the embeds drag clone to freeze
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
		 * @param {import('react').DragEvent} e
		 */
		function over( e ) {
			cloneWrapper.style.top = `${
				parseInt( cloneWrapper.style.top, 10 ) + e.clientY - cursorTop
			}px`;
			cloneWrapper.style.left = `${
				parseInt( cloneWrapper.style.left, 10 ) + e.clientX - cursorLeft
			}px`;

			// Update cursor coordinates.
			cursorLeft = e.clientX;
			cursorTop = e.clientY;

			if ( onDragOver ) {
				onDragOver( e );
			}
		}

		ownerDocument.addEventListener( 'dragover', over );

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
			// Remove drag clone
			if ( cloneWrapper && cloneWrapper.parentNode ) {
				cloneWrapper.parentNode.removeChild( cloneWrapper );
			}

			if ( dragImage && dragImage.parentNode ) {
				dragImage.parentNode.removeChild( dragImage );
			}

			// Reset cursor.
			ownerDocument.body.classList.remove( bodyClass );

			ownerDocument.removeEventListener( 'dragover', over );

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
