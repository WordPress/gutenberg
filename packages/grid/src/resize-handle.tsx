/**
 * External dependencies
 */
import { DndContext, useDraggable } from '@dnd-kit/core';
import type { DragMoveEvent } from '@dnd-kit/core';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useThrottle } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './resize-handle.module.css';

interface ResizeHandleProps {
	disabled?: boolean;
	itemId?: string;
	verticalResizable?: boolean;
	onResize?: ( delta: { width: number; height: number } ) => void;
	onResizeEnd?: () => void;
}

function ResizeHandle( {
	disabled = false,
	itemId,
	verticalResizable = true,
}: ResizeHandleProps ) {
	const { attributes, listeners, setNodeRef } = useDraggable( {
		id: 'draggable',
		data: { itemId },
	} );

	return (
		<div
			ref={ setNodeRef }
			className={ clsx(
				styles[ 'resize-handle' ],
				! verticalResizable && styles[ 'is-horizontal-only' ],
				disabled && styles[ 'is-disabled' ]
			) }
			{ ...listeners }
			{ ...attributes }
		/>
	);
}

export default function ResizeHandleWrapper( props: ResizeHandleProps ) {
	const initialAnchorPosition = useRef< DOMRect | null >( null );

	const throttleDelay = 60;
	const throttledResize = useThrottle(
		( delta: { width: number; height: number } ) => {
			if ( props.onResize ) {
				props.onResize( delta );
			}
		},
		throttleDelay
	);

	const handleDragStart = ( event: DragMoveEvent ) => {
		const target = event.activatorEvent.target as Element;
		// eslint-disable-next-line react-compiler/react-compiler -- Ref mutation during drag is intentional
		initialAnchorPosition.current = target.getBoundingClientRect();
	};

	const handleDragMove = ( event: DragMoveEvent ) => {
		if ( ! initialAnchorPosition.current ) {
			return;
		}
		const target = event.activatorEvent.target as Element;
		const currentPosition = target.getBoundingClientRect();
		const deltaX = currentPosition.x - initialAnchorPosition.current.x;
		const deltaY = currentPosition.y - initialAnchorPosition.current.y;
		const anchorDelta = {
			width: deltaX,
			height: deltaY,
		};

		if ( event.active.id === 'draggable' ) {
			const delta = {
				width: event.delta.x - anchorDelta.width,
				height: event.delta.y - anchorDelta.height,
			};

			throttledResize( delta );
		}
	};

	const handleDragEnd = () => {
		initialAnchorPosition.current = null;

		if ( props.onResizeEnd ) {
			props.onResizeEnd();
		}
	};

	return (
		<DndContext
			onDragStart={ handleDragStart }
			onDragMove={ handleDragMove }
			onDragEnd={ handleDragEnd }
		>
			<ResizeHandle { ...props } />
		</DndContext>
	);
}
