/**
 * WordPress dependencies
 */
import { throttle } from '@wordpress/compose';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';

const dragImageClass = 'components-draggable__invisible-drag-image';
const cloneWrapperClass = 'components-draggable__clone';
const clonePadding = 0;
const bodyClass = 'is-dragging-components-draggable';

export default function useDragChip( {
	blockDropTarget,
	cloneClassname,
	listViewRef,
	elementId,
	transferData,
	__experimentalTransferDataType: transferDataType = 'text',
} ) {
	const { clientId, rootClientId } = blockDropTarget || {};
	// const horizontalOffset = useRef( 0 );
	const targetAriaLevelRef = useRef( 1 );
	const originalAriaLevelRef = useRef( 1 );
	const cleanup = useRef( () => {} );
	const [ isWithinListView, setIsWithinListView ] = useState( false );

	// TODO: Add RTL support.
	// const rtl = isRTL();

	const [ rootBlockElement ] = useMemo( () => {
		if ( ! listViewRef.current ) {
			return [];
		}
		// The rootClientId will be defined whenever dropping into inner
		// block lists, but is undefined when dropping at the root level.
		const _rootBlockElement = rootClientId
			? listViewRef.current.querySelector(
					`[data-block="${ rootClientId }"]`
			  )
			: undefined;
		// The clientId represents the sibling block, the dragged block will
		// usually be inserted adjacent to it. It will be undefined when
		// dropping a block into an empty block list.
		const _blockElement = clientId
			? listViewRef.current.querySelector(
					`[data-block="${ clientId }"]`
			  )
			: undefined;
		return [ _rootBlockElement, _blockElement ];
	}, [ listViewRef, rootClientId, clientId ] );

	useEffect( () => {
		let ariaLevel = 1;

		if ( rootBlockElement ) {
			const _ariaLevel = parseInt(
				rootBlockElement.getAttribute( 'aria-level' ),
				10
			);

			ariaLevel = _ariaLevel ? _ariaLevel + 1 : 1;
		}

		targetAriaLevelRef.current = ariaLevel;
	}, [ rootBlockElement ] );

	/**
	 * Removes the element clone, resets cursor, and removes drag listener.
	 *
	 * @param {DragEvent} event The non-custom DragEvent.
	 */
	function end( event ) {
		event.preventDefault();
		cleanup.current();
	}

	/**
	 * This method does a couple of things:
	 *
	 * - Clones the current element and spawns clone over original element.
	 * - Adds a fake temporary drag image to avoid browser defaults.
	 * - Sets transfer data.
	 * - Adds dragover listener.
	 *
	 * @param {DragEvent} event The non-custom DragEvent.
	 */
	function start( event ) {
		const { ownerDocument } = event.target;

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

		const element = ownerDocument.getElementById( elementId );

		const _originalAriaLevel = element.getAttribute( 'aria-level' );

		if ( _originalAriaLevel ) {
			originalAriaLevelRef.current = parseInt( _originalAriaLevel, 10 );
		}

		// Prepare element clone and append to element wrapper.
		const elementRect = element.getBoundingClientRect();
		const elementTopOffset = elementRect.top;
		const elementLeftOffset = elementRect.left;

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
		Array.from( clone.querySelectorAll( 'iframe' ) ).forEach( ( child ) =>
			child.parentNode?.removeChild( child )
		);

		cloneWrapper.appendChild( clone );

		ownerDocument.body.appendChild( cloneWrapper );

		// Mark the current cursor coordinates.
		let cursorLeft = event.clientX;
		let cursorTop = event.clientY;

		function over( e ) {
			if ( listViewRef.current ) {
				if (
					! isWithinListView &&
					listViewRef.current.contains( e.target )
				) {
					setIsWithinListView( true );
				} else if (
					isWithinListView &&
					! listViewRef.current.contains( e.target )
				) {
					setIsWithinListView( false );
				}
			}

			// Skip doing any work if mouse has not moved.
			if ( cursorLeft === e.clientX && cursorTop === e.clientY ) {
				return;
			}

			const horizontalOffset =
				( targetAriaLevelRef.current - originalAriaLevelRef.current ) *
				28;

			const nextY = y + e.clientY - cursorTop;
			const nextX = x + horizontalOffset;

			cloneWrapper.style.transform = `translate( ${ nextX }px, ${ nextY }px )`;
			cursorLeft = e.clientX;
			cursorTop = e.clientY;
			// x = nextX;
			y = nextY;
		}

		// Aim for 60fps (16 ms per frame) for now. We can potentially use requestAnimationFrame (raf) instead,
		// note that browsers may throttle raf below 60fps in certain conditions.
		// @ts-ignore
		const throttledDragOver = throttle( over, 16 );

		ownerDocument.addEventListener( 'dragover', throttledDragOver );

		// Update cursor to 'grabbing', document wide.
		ownerDocument.body.classList.add( bodyClass );

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
		};
	}

	useEffect(
		() => () => {
			cleanup.current();
		},
		[]
	);

	return {
		dragChipOnDragStart: start,
		dragChipOnDragEnd: end,
		isWithinListView,
	};
}
