/**
 * External dependencies
 */
import { DndContext, useDraggable } from '@dnd-kit/core';
import type { DragMoveEvent } from '@dnd-kit/core';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useMergeRefs, useThrottle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { ResizeDelta, ResizeHandleProps } from './types';
import styles from './resize-handle.module.css';

/**
 * Sets `document.documentElement.style.cursor` for the duration of a drag
 * and restores it on cleanup. Lives outside the component so cursor writes
 * are not analyzed as mutating values derived from refs in the component
 * body (react-hooks/immutability).
 *
 * @param getDocument Returns the document whose root element should receive
 *                    the cursor (handle owner, or global `document`).
 * @param cursor      CSS cursor value while active.
 * @return Cleanup that restores the previous cursor.
 */
function lockDocumentCursorWhileActive(
	getDocument: () => Document,
	cursor: string
): () => void {
	const root = getDocument().documentElement;
	const previous = root.style.cursor;
	root.style.cursor = cursor;
	return () => {
		root.style.cursor = previous;
	};
}

function ResizeHandle( {
	itemId,
	verticalResizable = true,
	renderResizeHandle,
}: ResizeHandleProps ) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable( {
		id: 'draggable',
		data: { itemId },
	} );

	// Snapshot owner document on mount/update via ref callback so the
	// cursor-lock effect can resolve the correct document in an iframe.
	const ownerDocumentRef = useRef< Document | null >( null );
	const setOwnerDocumentRef = useCallback( ( node: HTMLElement | null ) => {
		ownerDocumentRef.current = node?.ownerDocument ?? null;
	}, [] );
	const mergedRef = useMergeRefs( [ setOwnerDocumentRef, setNodeRef ] );

	// Lock the document cursor while the gesture is active. Without
	// this, the OS pointer reverts to the default arrow as soon as it
	// leaves the handle's hit area, even though the resize is still
	// in progress.
	useEffect( () => {
		if ( ! isDragging ) {
			return;
		}
		const cursor = verticalResizable ? 'nwse-resize' : 'ew-resize';
		return lockDocumentCursorWhileActive(
			() => ownerDocumentRef.current ?? document,
			cursor
		);
	}, [ isDragging, verticalResizable ] );

	if ( renderResizeHandle ) {
		const RenderResizeHandle = renderResizeHandle;
		return (
			<RenderResizeHandle
				ref={ mergedRef }
				listeners={ listeners }
				attributes={ attributes }
				verticalResizable={ verticalResizable }
				isResizing={ isDragging }
				itemId={ itemId }
			/>
		);
	}

	return (
		<div
			ref={ mergedRef }
			className={ clsx(
				styles[ 'resize-handle' ],
				! verticalResizable && styles[ 'is-horizontal-only' ]
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
 * Auto-scroll is enabled with a tight trigger zone and a low
 * acceleration so a resize gesture near the viewport edge scrolls
 * the page only when the user deliberately pushes against the very
 * edge, and even then at a pace the user can interrupt by releasing.
 * Default tuning would otherwise produce a runaway loop where the
 * page scrolls fast, dnd-kit's document-coordinate `delta` inflates
 * with the scroll, and the tile keeps growing without further user
 * input.
 *
 * @param props Component props.
 */
export default function ResizeHandleWrapper( props: ResizeHandleProps ) {
	const throttleDelay = 16;
	const throttledResize = useThrottle( ( delta: ResizeDelta ) => {
		if ( props.onResize ) {
			props.onResize( delta );
		}
	}, throttleDelay );

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
		<DndContext
			autoScroll={ {
				threshold: { x: 0.005, y: 0.005 },
				acceleration: 1,
			} }
			onDragMove={ handleDragMove }
			onDragEnd={ handleDragEnd }
		>
			<div className={ styles[ 'resize-handle-slot' ] }>
				<ResizeHandle { ...props } />
			</div>
		</DndContext>
	);
}
