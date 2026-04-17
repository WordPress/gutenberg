/**
 * External dependencies
 */
import { DndContext, useDraggable } from '@dnd-kit/core';
import type { DragMoveEvent } from '@dnd-kit/core';

/**
 * WordPress dependencies
 */
import { useThrottle } from '@wordpress/compose';
import { useRef } from '@wordpress/element';

interface ResizeHandleProps {
	disabled?: boolean;
	itemId?: string;
	onResize?: ( delta: { width: number; height: number } ) => void;
	onResizeEnd?: () => void;
}

function ResizeHandle( { disabled = false, itemId }: ResizeHandleProps ) {
	const { attributes, listeners, setNodeRef } = useDraggable( {
		id: 'draggable',
		data: { itemId },
	} );

	const resizeHandleStyle = {
		position: 'absolute' as const,
		bottom: '0',
		right: '0',
		width: '0',
		height: '0',
		cursor: 'nwse-resize',
		borderStyle: 'solid',
		borderWidth: '0 0 12px 12px',
		borderColor:
			'transparent transparent var(--wp-admin-theme-color, #0087be) transparent',
		zIndex: 1,
		display: disabled ? 'none' : 'block',
	};

	return (
		<div
			ref={ setNodeRef }
			style={ resizeHandleStyle }
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
