import type { DragEvent } from 'react';
import { throttle } from '@wordpress/compose';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { getWpCompatOverlaySlot } from '@wordpress/ui';
import type { DraggableProps } from './types';
import styles from './style.module.scss';

// Legacy class names preserved alongside the CSS-module hashed ones for
// backwards compatibility. `filter(Boolean)` strips `undefined` from the
// CSS-module mock.
const dragImageClasses = [
	styles[ 'invisible-drag-image' ],
	'components-draggable__invisible-drag-image',
].filter( Boolean );
const cloneWrapperClasses = [
	styles.clone,
	'components-draggable__clone',
].filter( Boolean );
// Global class — shared with external code (e.g. block-editor keyboard drag).
const bodyClass = 'is-dragging-components-draggable';
const clonePadding = 0;

/**
 * `Draggable` is a Component that provides a way to set up a cross-browser
 * (including IE) customizable drag image and the transfer data for the drag
 * event. It decouples the drag handle and the element to drag: use it by
 * wrapping the component that will become the drag handle and providing the DOM
 * ID of the element to drag.
 *
 * Note that the drag handle needs to declare the `draggable="true"` property
 * and bind the `Draggable`s `onDraggableStart` and `onDraggableEnd` event
 * handlers to its own `onDragStart` and `onDragEnd` respectively. `Draggable`
 * takes care of the logic to setup the drag image and the transfer data, but is
 * not concerned with creating an actual DOM element that is draggable.
 *
 * ```jsx
 * import { Draggable, Panel, PanelBody } from '@wordpress/components';
 * import { Icon, more } from '@wordpress/icons';
 *
 * const MyDraggable = () => (
 *   <div id="draggable-panel">
 *     <Panel header="Draggable panel">
 *       <PanelBody>
 *         <Draggable elementId="draggable-panel" transferData={ {} }>
 *           { ( { onDraggableStart, onDraggableEnd } ) => (
 *             <div
 *               className="example-drag-handle"
 *               draggable
 *               onDragStart={ onDraggableStart }
 *               onDragEnd={ onDraggableEnd }
 *             >
 *               <Icon icon={ more } />
 *             </div>
 *           ) }
 *         </Draggable>
 *       </PanelBody>
 *     </Panel>
 *   </div>
 * );
 * ```
 */
export function Draggable( {
	children,
	onDragStart,
	onDragOver,
	onDragEnd,
	appendToOwnerDocument = false,
	cloneClassname,
	elementId,
	transferData,
	__experimentalTransferDataType: transferDataType = 'text',
	__experimentalDragComponent: dragComponent,
}: DraggableProps ) {
	const cleanupRef = useRef( () => {} );
	// The clone wrapper `dragComponent` is portalled into while a drag is in
	// progress. Nothing is rendered for it outside of a drag, so a long list
	// of draggables (the inserter) does not pay for one hidden preview per
	// item.
	const [ dragComponentContainer, setDragComponentContainer ] =
		useState< HTMLDivElement | null >( null );

	/**
	 * Removes the element clone, resets cursor, and removes drag listener.
	 *
	 * @param event The non-custom DragEvent.
	 */
	function end( event: DragEvent ) {
		event.preventDefault();
		cleanupRef.current();
		onDragEnd?.( event );
	}

	/**
	 * This method does a couple of things:
	 *
	 * - Clones the current element and spawns clone over original element.
	 * - Adds a fake temporary drag image to avoid browser defaults.
	 * - Sets transfer data.
	 * - Adds dragover listener.
	 *
	 * @param event The non-custom DragEvent.
	 */
	function start( event: DragEvent ) {
		const { ownerDocument } = event.target as HTMLElement;
		// Only use the slot when it lives in the same document as the
		// dragged element, so coordinate resolution stays in one space.
		const slot = getWpCompatOverlaySlot();
		const compatSlot = slot?.ownerDocument === ownerDocument ? slot : null;

		event.dataTransfer.setData(
			transferDataType,
			JSON.stringify( transferData )
		);

		const cloneWrapper = ownerDocument.createElement( 'div' );
		// Reset position to 0,0. Natural stacking order will position this lower, even with a transform otherwise.
		cloneWrapper.style.top = '0';
		cloneWrapper.style.left = '0';

		const dragImage = ownerDocument.createElement( 'div' );

		// Set a fake drag image to avoid browser defaults. Remove from DOM
		// right after. event.dataTransfer.setDragImage is not supported yet in
		// IE, we need to check for its existence first.
		if ( 'function' === typeof event.dataTransfer.setDragImage ) {
			dragImage.classList.add( ...dragImageClasses );
			// Invisible — stays at the document body, no slot needed.
			ownerDocument.body.appendChild( dragImage );
			event.dataTransfer.setDragImage( dragImage, 0, 0 );
		}

		cloneWrapper.classList.add( ...cloneWrapperClasses );

		const inSlotClass = styles[ 'is-in-compat-slot' ];
		if ( compatSlot && inSlotClass ) {
			cloneWrapper.classList.add( inSlotClass );
		}

		if ( cloneClassname ) {
			cloneWrapper.classList.add( cloneClassname );
		}

		let x = 0;
		let y = 0;
		if ( dragComponent ) {
			// Position dragComponent at the same position as the cursor. The
			// component itself is rendered into the wrapper by the portal
			// below.
			x = event.clientX;
			y = event.clientY;
			cloneWrapper.style.transform = `translate( ${ x }px, ${ y }px )`;

			( compatSlot ?? ownerDocument.body ).appendChild( cloneWrapper );
			setDragComponentContainer( cloneWrapper );
		} else {
			const element = ownerDocument.getElementById(
				elementId
			) as HTMLElement;

			// Prepare element clone and append to element wrapper.
			const elementRect = element.getBoundingClientRect();
			const elementWrapper = element.parentNode;
			const elementTopOffset = elementRect.top;
			const elementLeftOffset = elementRect.left;

			cloneWrapper.style.width = `${
				elementRect.width + clonePadding * 2
			}px`;

			const clone = element.cloneNode( true ) as HTMLElement;
			clone.id = `clone-${ elementId }`;

			// Position clone right over the original element (20px padding).
			x = elementLeftOffset - clonePadding;
			y = elementTopOffset - clonePadding;
			cloneWrapper.style.transform = `translate( ${ x }px, ${ y }px )`;

			// Hack: Remove iFrames as it's causing the embeds drag clone to freeze.
			Array.from< HTMLIFrameElement >(
				clone.querySelectorAll( 'iframe' )
			).forEach( ( child ) => child.parentNode?.removeChild( child ) );

			cloneWrapper.appendChild( clone );

			if ( compatSlot ) {
				compatSlot.appendChild( cloneWrapper );
			} else if ( appendToOwnerDocument ) {
				ownerDocument.body.appendChild( cloneWrapper );
			} else {
				elementWrapper?.appendChild( cloneWrapper );
			}
		}

		// Mark the current cursor coordinates.
		let cursorLeft = event.clientX;
		let cursorTop = event.clientY;

		function over( e: DragEvent ) {
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
			onDragOver?.( e );
		}

		// Aim for 60fps (16 ms per frame) for now. We can potentially use requestAnimationFrame (raf) instead,
		// note that browsers may throttle raf below 60fps in certain conditions.
		// @ts-expect-error `throttle` expects a `(...args: unknown[]) => unknown` callback.
		const throttledDragOver = throttle( over, 16 );

		ownerDocument.addEventListener( 'dragover', throttledDragOver );

		// Update cursor to 'grabbing', document wide.
		ownerDocument.body.classList.add( bodyClass );

		onDragStart?.( event );

		cleanupRef.current = () => {
			cloneWrapper.remove();
			dragImage.remove();
			setDragComponentContainer( null );

			// Reset cursor.
			ownerDocument.body.classList.remove( bodyClass );

			ownerDocument.removeEventListener( 'dragover', throttledDragOver );
			cleanupRef.current = () => {};
		};
	}

	useEffect( () => () => cleanupRef.current(), [] );

	return (
		<>
			{ children( {
				onDraggableStart: start,
				onDraggableEnd: end,
			} ) }
			{ dragComponentContainer &&
				createPortal( dragComponent, dragComponentContainer ) }
		</>
	);
}

export default Draggable;
