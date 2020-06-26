/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockDraggableChip from '../block-draggable/draggable-chip';

function useOnLongPress( ref, timeout, callback, deps ) {
	useEffect( () => {
		let timeoutId;
		const set = ( event ) => {
			clearTimeout( timeoutId );
			timeoutId = setTimeout( () => callback( event ), timeout );
		};
		const unset = () => {
			clearTimeout( timeoutId );
		};
		ref.current.addEventListener( 'mousedown', set );
		ref.current.addEventListener( 'mouseup', unset );
		return () => {
			ref.current.removeEventListener( 'mousedown', set );
			ref.current.removeEventListener( 'mouseup', unset );
			clearTimeout( timeoutId );
		};
	}, deps );
}

export function DragOnLongPress( { target, index, clientId, rootClientId } ) {
	const [ isDraggging, setIsDragging ] = useState( false );
	const container = useRef( document.createElement( 'div' ) );

	useOnLongPress(
		target,
		250,
		() => {
			if (
				// isSelected is oudated.
				! target.current.classList.contains( 'is-selected' ) ||
				! window.getSelection().isCollapsed
			) {
				return;
			}

			const cancel = () => {
				window.removeEventListener( 'mouseup', cancel );
				document.removeEventListener( 'selectionchange', cancel );

				target.current.style.transform = '';
				target.current.style.transition = '';
			};

			window.addEventListener( 'mouseup', cancel );
			document.addEventListener( 'selectionchange', cancel );

			target.current.style.transform = 'scale(1.02)';
			target.current.style.transition = 'transform .75s ease-in-out';
		},
		[]
	);

	useOnLongPress(
		target,
		1000,
		( _event ) => {
			target.current.style.transform = '';
			target.current.style.transition = '';

			if (
				! target.current.classList.contains( 'is-selected' ) ||
				! window.getSelection().isCollapsed
			) {
				return;
			}

			const { parentNode } = target.current;

			setIsDragging( true );
			target.current.style.display = 'none';
			window.getSelection().removeAllRanges();
			parentNode.appendChild( container.current );
			container.current.style.position = 'fixed';
			container.current.style.pointerEvents = 'none';
			container.current.style.left = _event.clientX - 20 + 'px';
			container.current.style.top = _event.clientY + 20 + 'px';

			const onMouseMove = ( event ) => {
				const newEvent = new window.CustomEvent( 'dragover', {
					bubbles: true,
					detail: {
						clientX: event.clientX,
						clientY: event.clientY,
					},
				} );
				window.dispatchEvent( newEvent );

				container.current.style.left = event.clientX - 20 + 'px';
				container.current.style.top = event.clientY + 20 + 'px';
			};

			const onMouseUp = ( event ) => {
				window.removeEventListener( 'mousemove', onMouseMove );
				window.removeEventListener( 'mouseup', onMouseUp );

				setIsDragging( false );

				const dataTransfer = new window.DataTransfer();
				const data = {
					type: 'block',
					srcIndex: index,
					srcClientId: clientId,
					srcRootClientId: rootClientId || '',
				};

				dataTransfer.setData( 'text', JSON.stringify( data ) );

				const newEvent = new window.DragEvent( 'drop', {
					bubbles: true,
					dataTransfer,
				} );
				event.target.dispatchEvent( newEvent );
				parentNode.removeChild( container.current );

				if ( target.current ) {
					target.current.style.display = '';
				}
			};

			window.addEventListener( 'mousemove', onMouseMove );
			window.addEventListener( 'mouseup', onMouseUp );
		},
		[]
	);

	if ( ! isDraggging ) {
		return null;
	}

	return createPortal(
		<BlockDraggableChip clientIds={ [ clientId ] } />,
		container.current
	);
}
