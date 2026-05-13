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
import { LANES_DATA_KEY } from './use-lane-placement';
import type { ResizeDelta, ResizeHandleRenderProps } from '../shared/types';
import styles from './lanes-item.module.css';

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

/**
 * Props for the internal `<LanesItem />` wrapper.
 */
export type LanesItemProps = {
	/**
	 * Item key. Forwarded to dnd-kit and emitted as the
	 * `data-lanes-key` attribute the hook reads to map measured DOM
	 * nodes back to logical items.
	 */
	itemKey: string;

	/**
	 * Inline placement style produced by `useLanePlacement`. On native
	 * (`display: grid-lanes`), only `gridColumn: span N`. While
	 * polyfilling, also `gridColumnStart` / `gridRowStart` /
	 * `gridRowEnd: span N`.
	 */
	placementStyle: React.CSSProperties;

	/**
	 * Whether drag and resize interactions are disabled.
	 */
	disabled?: boolean;

	/**
	 * Whether any tile in the surface is currently being dragged or
	 * resized. Used to mute `actionableArea` content with `inert`.
	 */
	interacting?: boolean;

	children: React.ReactNode;

	actionableArea?: React.ReactNode;

	onResize: ( id: string, delta: ResizeDelta ) => void;

	onResizeEnd: () => void;

	renderResizeHandle?: React.ComponentType< ResizeHandleRenderProps >;
};

export function LanesItem( {
	itemKey,
	placementStyle,
	disabled = false,
	interacting = false,
	children,
	actionableArea = null,
	onResize,
	onResizeEnd,
	renderResizeHandle,
}: LanesItemProps ) {
	const [ previewDelta, setPreviewDelta ] = useState< ResizeDelta | null >(
		null
	);
	const itemRef = useRef< HTMLDivElement >( null );
	// See `grid-item.tsx` for the rationale behind these refs: the
	// resize handle reports cursor delta against the gesture start, so
	// the overlay must re-anchor to the live tile rect to track the
	// cursor through column steps and auto-scroll.
	const initialResizeRectRef = useRef< DOMRect | null >( null );
	const initialResizeScrollRef = useRef< {
		x: number;
		y: number;
	} | null >( null );
	const lastResizeDeltaRef = useRef< ResizeDelta | null >( null );

	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		isDragging,
	} = useSortable( {
		id: itemKey,
		disabled,
	} );
	const mergedRef = useMergeRefs( [ itemRef, setNodeRef ] );

	const style: React.CSSProperties = {
		...placementStyle,
		// Without this, the item is stretched to its grid track
		// (4px when no row span has been computed yet) and
		// `getBoundingClientRect` reports the track size, not the
		// content size. The hook would then place every tile at row
		// 1 and they would all overlap. `start` lets the item size
		// to its content for measurement, and stays a no-op once
		// the hook has applied an explicit `grid-row-end: span N`
		// that already matches the content height.
		alignSelf: 'start',
	};

	const itemClassName = clsx(
		styles.item,
		isDragging && styles[ 'is-dragging' ]
	);

	const handleResize = ( delta: ResizeDelta ) => {
		// Lanes are horizontal-only: height is driven by content.
		const clamped = { width: delta.width, height: 0 };
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
		onResize( itemKey, clamped );
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
			setPreviewDelta( {
				width: clamped.width - offsetX - scrollDelta.x,
				height: 0,
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
		const next = {
			width: lastDelta.width - offsetX - scrollDelta.x,
			height: 0,
		};
		setPreviewDelta( ( prev ) =>
			next.width === prev?.width && next.height === prev?.height
				? prev
				: next
		);
	}, [ placementStyle ] );

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
				bottom: 0,
			} }
		/>
	) : null;

	return (
		<div
			ref={ mergedRef }
			className={ itemClassName }
			style={ style }
			{ ...{ [ LANES_DATA_KEY ]: itemKey } }
		>
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
							itemId={ itemKey }
							verticalResizable={ false }
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
