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

/**
 * Renders a corner resize handle inside an isolated `<DndContext>`.
 * Reports the cursor offset since the gesture started (in pixels)
 * via `onResize`, throttled to one animation frame so the grid
 * commit loop runs at most once per paint.
 *
 * @param props Component props.
 */
export default function ResizeHandleWrapper( props: ResizeHandleProps ) {
	const throttleDelay = 16;
	const throttledResize = useThrottle(
		( delta: { width: number; height: number } ) => {
			if ( props.onResize ) {
				props.onResize( delta );
			}
		},
		throttleDelay
	);

	// `event.delta` is the cursor offset from the gesture start —
	// not from the handle's current position — so it stays stable
	// even when the tile (and therefore the handle) jumps a column.
	// The grid's resize logic snapshots the start width and adds
	// `delta`, so the two must share the same frame of reference.
	const handleDragMove = ( event: DragMoveEvent ) => {
		if ( event.active.id !== 'draggable' ) {
			return;
		}
		throttledResize( {
			width: event.delta.x,
			height: event.delta.y,
		} );
	};

	const handleDragEnd = () => {
		if ( props.onResizeEnd ) {
			props.onResizeEnd();
		}
	};

	return (
		<DndContext onDragMove={ handleDragMove } onDragEnd={ handleDragEnd }>
			<ResizeHandle { ...props } />
		</DndContext>
	);
}
