/**
 * External dependencies
 */
import { useSortable } from '@dnd-kit/sortable';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useRef, useLayoutEffect } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ResizeHandle from '../shared/resize-handle';
import type { ResizeDelta } from '../shared/types';
import type { GridItemProps } from './types';
import styles from './grid-item.module.css';

function getItemCursor(
	disabled: boolean,
	interacting: boolean
): React.CSSProperties[ 'cursor' ] {
	if ( disabled ) {
		return 'default';
	}

	if ( interacting ) {
		return undefined;
	}

	return 'grab';
}

export function GridItem( {
	item,
	maxColumns,
	disabled = false,
	verticalResizable = true,
	interacting = false,
	children,
	actionableArea = null,
	onResize,
	onResizeEnd,
	renderResizeHandle,
}: GridItemProps ) {
	const [ previewDelta, setPreviewDelta ] = useState< ResizeDelta | null >(
		null
	);
	const itemRef = useRef< HTMLDivElement >( null );
	// Tile bounding rect at the first resize frame. The cursor `delta`
	// from the handle is anchored to the gesture start, but the
	// overlay needs to track the cursor against the *current* tile
	// edge — which has shifted whenever the width/height stepped a
	// column/row. Re-anchor locally by subtracting the tile growth.
	const initialResizeRectRef = useRef< DOMRect | null >( null );
	// Document scroll position at the start of a resize. The handle's
	// `delta` is in document coordinates; `getBoundingClientRect` is
	// in viewport coordinates. Auto-scroll near the viewport edge
	// shifts both: the delta inflates by the scroll change, while the
	// tile's viewport bottom drifts up by the same amount. Without a
	// scroll reference, the preview overlay would carry that
	// inflation forward and drift away from the tile's edge.
	const initialResizeScrollRef = useRef< {
		x: number;
		y: number;
	} | null >( null );
	// Latest cursor delta from the resize handle. Reading this in a
	// `useLayoutEffect` lets the overlay re-measure the tile rect
	// *after* React commits a width step but before paint, so the
	// frame that follows a column step never renders the overlay
	// at the pre-step offset.
	const lastResizeDeltaRef = useRef< ResizeDelta | null >( null );
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		isDragging,
	} = useSortable( {
		id: item.key,
		disabled,
	} );
	const mergedRef = useMergeRefs( [ itemRef, setNodeRef ] );
	/*
	 * With `<DragOverlay>` handling the cursor-following clone, the
	 * sortable item stays put in its grid cell and acts as a
	 * placeholder. No `transform` is applied here — applying one
	 * would double-move the placeholder alongside the overlay.
	 */
	const style = {
		gridColumnEnd: `span ${
			item.width === 'full'
				? maxColumns
				: Math.min(
						typeof item.width === 'number' ? item.width : 1,
						maxColumns
				  )
		}`,
		gridRowEnd: `span ${ item.height || 1 }`,
	};

	const itemClassName = clsx(
		styles.item,
		isDragging && styles[ 'is-dragging' ]
	);

	const handleResize = ( delta: ResizeDelta ) => {
		const clamped = {
			width: delta.width,
			height: verticalResizable ? delta.height : 0,
		};
		const node = itemRef.current;
		if ( node && ! initialResizeRectRef.current ) {
			initialResizeRectRef.current = node.getBoundingClientRect();
			const ownerWindow = node.ownerDocument.defaultView ?? window;
			initialResizeScrollRef.current = {
				x: ownerWindow.scrollX,
				y: ownerWindow.scrollY,
			};
		}
		lastResizeDeltaRef.current = clamped;
		onResize( item.key, clamped );
		// Provisional preview against the pre-commit rect; the
		// `useLayoutEffect` below refines it once React commits the
		// new tile size so a column step never paints with the
		// stale offset. Subtract the scroll change so the overlay
		// tracks the cursor's viewport-space position rather than
		// drifting with the document scroll under it.
		if (
			node &&
			initialResizeRectRef.current &&
			initialResizeScrollRef.current
		) {
			const currentRect = node.getBoundingClientRect();
			const ownerWindow = node.ownerDocument.defaultView ?? window;
			const scrollDelta = {
				x: ownerWindow.scrollX - initialResizeScrollRef.current.x,
				y: ownerWindow.scrollY - initialResizeScrollRef.current.y,
			};
			const offsetX =
				currentRect.right - initialResizeRectRef.current.right;
			const offsetY =
				currentRect.bottom - initialResizeRectRef.current.bottom;
			setPreviewDelta( {
				width: clamped.width - offsetX - scrollDelta.x,
				height: verticalResizable
					? clamped.height - offsetY - scrollDelta.y
					: 0,
			} );
		}
	};

	useLayoutEffect( () => {
		const lastDelta = lastResizeDeltaRef.current;
		const initialRect = initialResizeRectRef.current;
		const initialScroll = initialResizeScrollRef.current;
		const node = itemRef.current;
		if ( ! lastDelta || ! initialRect || ! initialScroll || ! node ) {
			return;
		}
		const currentRect = node.getBoundingClientRect();
		const ownerWindow = node.ownerDocument.defaultView ?? window;
		const scrollDelta = {
			x: ownerWindow.scrollX - initialScroll.x,
			y: ownerWindow.scrollY - initialScroll.y,
		};
		const offsetX = currentRect.right - initialRect.right;
		const offsetY = currentRect.bottom - initialRect.bottom;
		const next = {
			width: lastDelta.width - offsetX - scrollDelta.x,
			height: verticalResizable
				? lastDelta.height - offsetY - scrollDelta.y
				: 0,
		};
		// Use the updater form so the effect doesn't need `previewDelta`
		// in its deps. Returning `prev` when nothing changed lets React
		// bail out without a re-render.
		setPreviewDelta( ( prev ) =>
			next.width === prev?.width && next.height === prev?.height
				? prev
				: next
		);
	}, [ item.width, item.height, verticalResizable ] );

	const handleResizeEnd = () => {
		setPreviewDelta( null );
		initialResizeRectRef.current = null;
		initialResizeScrollRef.current = null;
		lastResizeDeltaRef.current = null;
		onResizeEnd();
	};

	const previewOverlay = previewDelta ? (
		<div
			className={ styles[ 'preview-overlay' ] }
			style={ {
				insetInlineEnd: -previewDelta.width,
				bottom: -previewDelta.height,
			} }
		/>
	) : null;

	return (
		<div ref={ mergedRef } className={ itemClassName } style={ style }>
			{ actionableArea ? (
				<div
					style={ { display: 'contents' } }
					{ ...( interacting ? { inert: '' } : {} ) }
				>
					{ actionableArea }
				</div>
			) : null }

			<div
				ref={ setActivatorNodeRef }
				{ ...attributes }
				{ ...listeners }
				style={ {
					height: '100%',
					// Keyboard activation needs `attributes` (tabIndex)
					// and `listeners` (onKeyDown) on the same focused
					// node; `setActivatorNodeRef` points dnd-kit's
					// keyboard sensor here, the outer keeps `setNodeRef`
					// for measurement.
					//
					// Cursor lives on this wrapper so `actionableArea`
					// children (mounted outside it) keep their own;
					// `undefined` during a gesture defers to the resize
					// handle's document cursor lock.
					cursor: getItemCursor( disabled, interacting ),
				} }
			>
				<div className={ styles[ 'item-content' ] }>
					{ children }
					{ ! disabled && (
						<ResizeHandle
							itemId={ item.key }
							verticalResizable={ verticalResizable }
							onResize={ handleResize }
							onResizeEnd={ handleResizeEnd }
							renderResizeHandle={ renderResizeHandle }
						/>
					) }
				</div>
				{ previewOverlay }
			</div>
		</div>
	);
}
