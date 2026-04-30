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
import ResizeHandle from './resize-handle';
import type { DashboardGridLayoutItem } from './types';
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

type GridItemProps = {
	/**
	 * The layout item containing grid positioning information.
	 */
	item: DashboardGridLayoutItem;

	/**
	 * The maximum number of columns in the grid.
	 */
	maxColumns: number;

	/**
	 * Whether drag and resize interactions are disabled.
	 *
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Whether the item can be resized vertically. Disabled when the
	 * grid uses `rowHeight: 'auto'`, where row height is driven by
	 * content rather than by the user.
	 *
	 * @default true
	 */
	verticalResizable?: boolean;

	/**
	 * Whether any tile in the grid is currently being dragged or
	 * resized. When true, the item mutes its `actionableArea` with
	 * `inert` so pointer hovers over buttons in other tiles do not
	 * steal the in-progress gesture.
	 *
	 * @default false
	 */
	interacting?: boolean;

	/**
	 * The content to be displayed within the grid item.
	 */
	children: React.ReactNode;

	/**
	 * Content rendered above the draggable area that stays interactive
	 * in edit mode — typically action buttons, menus, or links. While
	 * any tile in the grid is being dragged or resized, this content
	 * is set `inert` so hovers on other tiles can't steal the gesture.
	 */
	actionableArea?: React.ReactNode;

	/**
	 * Callback fired while the item is being resized. Receives the
	 * item's `key` plus the cursor offset from the gesture start in
	 * pixels; the grid converts the offset to column/row spans.
	 */
	onResize: ( id: string, delta: { width: number; height: number } ) => void;

	/**
	 * Callback fired when the resize gesture ends.
	 */
	onResizeEnd: () => void;
};

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
}: GridItemProps ) {
	const [ previewDelta, setPreviewDelta ] = useState< {
		width: number;
		height: number;
	} | null >( null );
	const itemRef = useRef< HTMLDivElement >( null );
	// Tile bounding rect at the first resize frame. The cursor `delta`
	// from the handle is anchored to the gesture start, but the
	// overlay needs to track the cursor against the *current* tile
	// edge — which has shifted whenever the width/height stepped a
	// column/row. Re-anchor locally by subtracting the tile growth.
	const initialResizeRectRef = useRef< DOMRect | null >( null );
	// Latest cursor delta from the resize handle. Reading this in a
	// `useLayoutEffect` lets the overlay re-measure the tile rect
	// *after* React commits a width step but before paint, so the
	// frame that follows a column step never renders the overlay
	// at the pre-step offset.
	const lastResizeDeltaRef = useRef< {
		width: number;
		height: number;
	} | null >( null );
	const { attributes, listeners, setNodeRef, isDragging } = useSortable( {
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

		// Suppress the grab hint while any gesture is active so the
		// inline `cursor` on the tile doesn't override the gesture's
		// document-level cursor (e.g. the resize lock). Setting
		// `undefined` leaves the property off the DOM.
		cursor: getItemCursor( disabled, interacting ),
	};

	const itemClassName = clsx(
		styles.item,
		isDragging && styles[ 'is-dragging' ]
	);

	const handleResize = ( delta: { width: number; height: number } ) => {
		const clamped = {
			width: delta.width,
			height: verticalResizable ? delta.height : 0,
		};
		const node = itemRef.current;
		if ( node && ! initialResizeRectRef.current ) {
			initialResizeRectRef.current = node.getBoundingClientRect();
		}
		lastResizeDeltaRef.current = clamped;
		onResize( item.key, clamped );
		// Provisional preview against the pre-commit rect; the
		// `useLayoutEffect` below refines it once React commits the
		// new tile size so a column step never paints with the
		// stale offset.
		if ( node && initialResizeRectRef.current ) {
			const currentRect = node.getBoundingClientRect();
			const offsetX =
				currentRect.right - initialResizeRectRef.current.right;
			const offsetY =
				currentRect.bottom - initialResizeRectRef.current.bottom;
			setPreviewDelta( {
				width: clamped.width - offsetX,
				height: clamped.height - ( verticalResizable ? offsetY : 0 ),
			} );
		}
	};

	useLayoutEffect( () => {
		const lastDelta = lastResizeDeltaRef.current;
		const initialRect = initialResizeRectRef.current;
		const node = itemRef.current;
		if ( ! lastDelta || ! initialRect || ! node ) {
			return;
		}
		const currentRect = node.getBoundingClientRect();
		const offsetX = currentRect.right - initialRect.right;
		const offsetY = currentRect.bottom - initialRect.bottom;
		const next = {
			width: lastDelta.width - offsetX,
			height: lastDelta.height - ( verticalResizable ? offsetY : 0 ),
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
		<div
			ref={ mergedRef }
			className={ itemClassName }
			style={ style }
			{ ...attributes }
		>
			{ actionableArea ? (
				<div
					style={ { display: 'contents' } }
					{ ...( interacting ? { inert: '' } : {} ) }
				>
					{ actionableArea }
				</div>
			) : null }

			<div { ...listeners } style={ { height: '100%' } }>
				<div className={ styles[ 'item-content' ] }>
					{ children }
					<ResizeHandle
						disabled={ disabled }
						itemId={ item.key }
						verticalResizable={ verticalResizable }
						onResize={ handleResize }
						onResizeEnd={ handleResizeEnd }
					/>
				</div>
				{ previewOverlay }
			</div>
		</div>
	);
}
