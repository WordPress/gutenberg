/**
 * External dependencies
 */
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useResizeObserver, useEvent, useMergeRefs } from '@wordpress/compose';
import {
	forwardRef,
	useMemo,
	Children,
	cloneElement,
	isValidElement,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GridItem } from './grid-item';
import { GridOverlay } from '../shared/grid-overlay';
import { resolveFillWidths } from './resolve-fill-widths';
import type { DashboardGridLayoutItem, DashboardGridProps } from './types';
import type { ResizeDelta } from '../shared/types';
import styles from './grid.module.css';

// Fallback gap in pixels for math that runs before the computed gap
// can be read from the DOM. Matches the `'md'` step the surface
// resolves to in CSS (`--wpds-dimension-gap-md`); the next layout
// effect overwrites this with the actual computed value.
const FALLBACK_GAP_PX = 12;

// Reorder is driven by `temporaryLayout` + CSS Grid, not by dnd-kit
// transforms. Hoist the no-op strategy outside the component so its
// reference is stable across renders — passing a fresh `() => null`
// to `<SortableContext>` updates its context value and triggers all
// `useSortable` subscribers to re-render every frame.
const NO_SORT_STRATEGY = () => null;

/**
 * 2D packed dashboard grid with drag-to-reorder and resize handles.
 * Supports fixed-column and responsive modes, `number | 'fill' | 'full'`
 * widths, and multi-row tiles.
 *
 * Each child's `key` must match an entry in the `layout` array;
 * children without a match render at the end of the grid without
 * explicit placement and fall through CSS Grid's auto-flow.
 *
 * @example
 * ```jsx
 * const layout = [
 *   { key: 'a', width: 2 },
 *   { key: 'b', width: 'fill' },
 *   { key: 'c', width: 'full' },
 * ];
 *
 * <DashboardGrid
 *   layout={ layout }
 *   columns={ 6 }
 *   editMode
 *   onChangeLayout={ setLayout }
 * >
 *   <div key="a">A</div>
 *   <div key="b">B</div>
 *   <div key="c">C</div>
 * </DashboardGrid>
 * ```
 *
 * @param props Component props.
 * @param ref   Forwarded to the grid's root `<div>`.
 */
export const DashboardGrid = forwardRef< HTMLDivElement, DashboardGridProps >(
	function DashboardGrid( props, ref ) {
		const {
			layout,
			columns = 6,
			children,
			className,
			style,
			rowHeight = 'auto',
			minColumnWidth,
			editMode = false,
			onChangeLayout,
			onPreviewLayout,
			renderResizeHandle,
			renderDragPreview,
			renderGridOverlay,
			...divProps
		} = props;
		// Preview layout applied during drag/resize before committing.
		const [ temporaryLayout, setTemporaryLayout ] = useState<
			DashboardGridLayoutItem[] | undefined
		>();
		// Drives `<DragOverlay>` content while a drag is in progress.
		const [ activeId, setActiveId ] = useState< string | null >( null );
		// True while any tile is being resized. Combined with `activeId`,
		// it drives the grid-wide `inert` flag on actionable areas so
		// hovering over another tile's buttons can't steal the gesture.
		const [ isResizing, setIsResizing ] = useState( false );
		// Mirror of `temporaryLayout` read synchronously on drag end —
		// the state update from `handleDragMove` may still be batched.
		const latestLayoutRef = useRef<
			DashboardGridLayoutItem[] | undefined
		>();
		// Cursor center at the last applied reorder. Used to skip the
		// cascade of re-measured `onDragMove` events after a layout
		// change, when the cursor has not actually moved.
		const lastReorderCursorRef = useRef< {
			x: number;
			y: number;
		} | null >( null );
		// Width/height snapshot at the start of a resize session. The
		// resize handle reports `delta` absolute from the gesture start,
		// so the baseline must stay frozen — reading from the already
		// mutated `activeLayout` would compound the delta each frame.
		const resizeBaselineRef = useRef< {
			width: number;
			height: number;
		} | null >( null );
		const activeLayout = temporaryLayout ?? layout;

		const rootRef = useRef< HTMLDivElement >( null );
		const [ containerWidth, setContainerWidth ] = useState( 0 );
		const [ gapPx, setGapPx ] = useState( FALLBACK_GAP_PX );
		const resizeObserverRef = useResizeObserver(
			( [ { contentRect } ] ) => {
				setContainerWidth( contentRect.width );
			}
		);
		const mergedGridRef = useMergeRefs( [
			rootRef,
			resizeObserverRef,
			ref,
		] );

		// Measure before paint to avoid a single-column flash in
		// responsive mode; `useResizeObserver` delivers async. The
		// computed `column-gap` is read from the resolved CSS so the
		// math tracks the design-system token under any density.
		useLayoutEffect( () => {
			if ( ! rootRef.current ) {
				return;
			}
			const { width } = rootRef.current.getBoundingClientRect();
			if ( width > 0 ) {
				setContainerWidth( width );
			}
			const parsed = Number.parseFloat(
				window.getComputedStyle( rootRef.current ).columnGap
			);
			if ( Number.isFinite( parsed ) && parsed > 0 ) {
				setGapPx( parsed );
			}
		}, [] );
		const effectiveColumns = useMemo( () => {
			if ( ! minColumnWidth ) {
				return columns;
			}

			const totalWidthPerColumn = minColumnWidth + gapPx;
			const maxColumns = Math.floor(
				( containerWidth + gapPx ) / totalWidthPerColumn
			);
			return Math.max( 1, maxColumns );
		}, [ minColumnWidth, gapPx, containerWidth, columns ] );
		const columnWidth =
			( containerWidth - ( effectiveColumns - 1 ) * gapPx ) /
			effectiveColumns;

		const layoutMap = useMemo( () => {
			const map = new Map< string, DashboardGridLayoutItem >();
			activeLayout.forEach( ( item ) => map.set( item.key, item ) );
			return map;
		}, [ activeLayout ] );

		// Stable-identity key set, preserved across renders whenever the
		// *contents* of the key set are unchanged — even if the consumer
		// passes a fresh `layout` array reference (common when `layout`
		// is derived inline from state). Without this, downstream memos
		// would invalidate on every parent re-render and the children
		// walk skip during gestures wouldn't hold.
		const layoutKeysSig = layout.map( ( item ) => item.key ).join( '\0' );
		const layoutKeysRef = useRef< {
			sig: string;
			set: Set< string >;
		} | null >( null );
		if ( layoutKeysRef.current?.sig !== layoutKeysSig ) {
			layoutKeysRef.current = {
				sig: layoutKeysSig,
				set: new Set( layout.map( ( item ) => item.key ) ),
			};
		}
		const layoutKeys = layoutKeysRef.current.set;

		// Sorted item keys, identity-stable when the resulting sequence is
		// unchanged. Avoids producing a fresh `items` array on every parent
		// re-render so `<SortableContext>` doesn't update its context value
		// and notify every `useSortable` subscriber unnecessarily.
		const sortedItems = activeLayout
			.map( ( item, index ) => ( { item, index } ) )
			.sort(
				( a, b ) =>
					( a.item.order ?? a.index ) - ( b.item.order ?? b.index )
			)
			.map( ( { item } ) => item.key );
		const itemsSig = sortedItems.join( '\0' );
		const itemsRef = useRef< {
			sig: string;
			arr: string[];
		} | null >( null );
		if ( itemsRef.current?.sig !== itemsSig ) {
			itemsRef.current = { sig: itemsSig, arr: sortedItems };
		}
		const items = itemsRef.current.arr;

		// Resolve `width: 'fill'` items to concrete column spans.
		const resolvedItemMap = useMemo( () => {
			const fillWidths = resolveFillWidths(
				items,
				layoutMap,
				effectiveColumns
			);
			if ( fillWidths.size === 0 ) {
				return layoutMap;
			}
			const map = new Map< string, DashboardGridLayoutItem >();
			for ( const [ key, item ] of layoutMap ) {
				const fillW = fillWidths.get( key );
				map.set(
					key,
					fillW !== undefined ? { ...item, width: fillW } : item
				);
			}
			return map;
		}, [ items, layoutMap, effectiveColumns ] );

		const [ childrenMap, actionableAreaMap, remaining ] = useMemo( () => {
			const childMap = new Map< string, React.ReactElement >();
			const actionableMap = new Map< string, React.ReactNode >();
			const rest: React.ReactNode[] = [];

			Children.forEach( children, ( child ) => {
				if ( ! isValidElement( child ) ) {
					rest.push( child );
					return;
				}

				const key = child.key?.toString();
				if ( key && layoutKeys.has( key ) ) {
					// Lift `actionableArea` to a grid slot; strip it
					// from the child so it does not leak to the DOM.
					const { actionableArea } = child.props;
					if ( actionableArea !== undefined ) {
						actionableMap.set( key, actionableArea );
						childMap.set(
							key,
							cloneElement( child, { actionableArea: undefined } )
						);
					} else {
						childMap.set( key, child );
					}
				} else {
					rest.push( child );
				}
			} );

			return [ childMap, actionableMap, rest ];
		}, [ children, layoutKeys ] );

		const sensors = useSensors(
			useSensor( PointerSensor ),
			useSensor( KeyboardSensor, {
				coordinateGetter: sortableKeyboardCoordinates,
			} )
		);

		const handleDragStart = useEvent( ( event: DragStartEvent ) => {
			setActiveId( String( event.active.id ) );
			lastReorderCursorRef.current = null;
		} );

		const handleDragCancel = useEvent( () => {
			setActiveId( null );
			latestLayoutRef.current = undefined;
			lastReorderCursorRef.current = null;
			resizeBaselineRef.current = null;
			setIsResizing( false );
			setTemporaryLayout( undefined );
		} );

		// Re-evaluate the insertion slot on every pointer move, not
		// just when `over.id` changes — otherwise a "swap back" with
		// the cursor still on the same tile would never fire.
		const handleDragMove = useEvent( ( event: DragMoveEvent ) => {
			const { active, over } = event;
			if ( ! over || active.id === over.id ) {
				return;
			}

			const activeRect = active.rect.current.translated;
			if ( ! activeRect ) {
				return;
			}

			const activeCenterX = activeRect.left + activeRect.width / 2;
			const activeCenterY = activeRect.top + activeRect.height / 2;

			// Skip re-measured events after a layout change: require
			// meaningful cursor movement between reorders.
			const lastCursor = lastReorderCursorRef.current;
			if ( lastCursor ) {
				const dx = activeCenterX - lastCursor.x;
				const dy = activeCenterY - lastCursor.y;
				if ( dx * dx + dy * dy < 100 ) {
					return;
				}
			}

			const overCenterX = over.rect.left + over.rect.width / 2;
			const insertAfter = activeCenterX > overCenterX;

			const currentIndex = items.indexOf( String( active.id ) );
			const overIndex = items.indexOf( String( over.id ) );
			let newIndex: number;
			if ( insertAfter ) {
				newIndex = currentIndex > overIndex ? overIndex + 1 : overIndex;
			} else {
				newIndex = currentIndex > overIndex ? overIndex : overIndex - 1;
			}
			newIndex = Math.max( 0, Math.min( newIndex, items.length - 1 ) );

			if ( newIndex === currentIndex ) {
				return;
			}

			const updatedItems = arrayMove( items, currentIndex, newIndex );
			const updatedLayout = activeLayout.map( ( item ) => ( {
				...item,
				order: updatedItems.indexOf( item.key ),
			} ) );

			lastReorderCursorRef.current = {
				x: activeCenterX,
				y: activeCenterY,
			};
			latestLayoutRef.current = updatedLayout;
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		} );

		// Commit the latest temporary layout and clear local state.
		// Reads from the ref to bypass React's state batching.
		const persistTemporaryLayout = useEvent( () => {
			const latest = latestLayoutRef.current;
			latestLayoutRef.current = undefined;
			resizeBaselineRef.current = null;
			setIsResizing( false );

			if ( ! onChangeLayout || ! latest ) {
				return;
			}

			onChangeLayout( latest );
			setTemporaryLayout( undefined );
		} );

		const handleResize = useEvent( ( id: string, delta: ResizeDelta ) => {
			if ( ! editMode ) {
				return;
			}

			if ( ! isResizing ) {
				setIsResizing( true );
			}

			const relativeDelta = {
				width: Math.round( delta.width / ( columnWidth + gapPx ) ),
				height:
					rowHeight === 'auto'
						? 0
						: Math.round( delta.height / ( rowHeight + gapPx ) ),
			};

			// Snapshot the baseline once at gesture start. The handle's
			// `delta` is absolute from the gesture start, so summing it
			// with the live (already mutated) `activeLayout` width would
			// compound and oscillate — and stepping back through the
			// zero-delta zone would never restore the original size.
			if ( ! resizeBaselineRef.current ) {
				const baseItem = activeLayout.find(
					( item ) => item.key === id
				);
				const resolvedItem = resolvedItemMap.get( id );
				// `'fill'`/`'full'` resize from the rendered span
				// and convert to a numeric width.
				let baseWidth: number;
				if ( baseItem?.width === 'full' ) {
					baseWidth = effectiveColumns;
				} else if ( baseItem?.width === 'fill' ) {
					baseWidth =
						typeof resolvedItem?.width === 'number'
							? resolvedItem.width
							: 1;
				} else {
					baseWidth = baseItem?.width ?? 1;
				}
				resizeBaselineRef.current = {
					width: baseWidth,
					height: baseItem?.height ?? 1,
				};
			}
			const baseline = resizeBaselineRef.current;
			const newWidth = Math.max(
				1,
				Math.min(
					baseline.width + relativeDelta.width,
					effectiveColumns
				)
			);
			const newHeight = Math.max(
				1,
				baseline.height + relativeDelta.height
			);

			// Bail when the resulting size matches the current preview.
			// Covers both the zero-delta start frame and the case where
			// the cursor returns through the zero-delta zone after a
			// step. A symbolic width (`'fill'`/`'full'`) on the live
			// item never matches a numeric `newWidth`, so the first
			// step still converts it to a numeric span.
			const currentItem = activeLayout.find(
				( item ) => item.key === id
			);
			if (
				currentItem &&
				currentItem.width === newWidth &&
				( currentItem.height ?? 1 ) === newHeight
			) {
				return;
			}

			const updatedLayout = activeLayout.map( ( item ) =>
				item.key === id
					? { ...item, width: newWidth, height: newHeight }
					: item
			);

			latestLayoutRef.current = updatedLayout;
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		} );

		// Drag-overlay clone composition: the surface always wraps with a
		// thin functional frame (lift, cursor, pointer pass-through). When
		// `renderDragPreview` is supplied, the consumer's wrapper sits
		// inside the frame around the cloned children; otherwise the
		// cloned children render directly so any persistent chrome on
		// them carries through unchanged.
		const activeClone = activeId ? childrenMap.get( activeId ) : null;
		const DragPreview = renderDragPreview;
		const dragOverlayContent =
			activeId && activeClone ? (
				<div className={ styles[ 'drag-preview-frame' ] }>
					{ DragPreview ? (
						<DragPreview itemId={ activeId }>
							{ activeClone }
						</DragPreview>
					) : (
						activeClone
					) }
				</div>
			) : null;

		// Edit-mode background visual. Default paints diagonal stripes
		// and dashed track guides; a consumer can replace it via
		// `renderGridOverlay` while reusing the resolved column count,
		// gap, and row height. `'auto'` collapses to `undefined` for
		// the overlay so it falls back to columns-only (row dividers
		// have no anchor when the row height is content-driven).
		// Rendered unconditionally so the overlay can cross-fade on
		// edit-mode toggles; `isActive` drives the opacity transition
		// inside the overlay. Memoized so drag/resize re-renders skip
		// reconciliation while inputs are stable.
		const Overlay = renderGridOverlay ?? GridOverlay;
		const overlayRowHeight =
			typeof rowHeight === 'number' ? rowHeight : undefined;
		const gridOverlay = useMemo(
			() => (
				<Overlay
					columns={ effectiveColumns }
					rowHeight={ overlayRowHeight }
					isActive={ editMode }
				/>
			),
			[ Overlay, editMode, effectiveColumns, overlayRowHeight ]
		);

		return (
			<DndContext
				sensors={ sensors }
				onDragStart={ handleDragStart }
				onDragCancel={ handleDragCancel }
				onDragMove={ handleDragMove }
				onDragEnd={ () => {
					persistTemporaryLayout();
					setActiveId( null );
					lastReorderCursorRef.current = null;
				} }
			>
				{ /* No-op strategy: reorder comes from `temporaryLayout`
				 + CSS Grid, not dnd-kit transforms. */ }
				<SortableContext items={ items } strategy={ NO_SORT_STRATEGY }>
					<div
						{ ...divProps }
						ref={ mergedGridRef }
						className={ clsx( styles.grid, className ) }
						data-wp-dashboard-grid-resizing={
							isResizing || undefined
						}
						style={ {
							...style,
							gridTemplateColumns: `repeat(${ effectiveColumns }, minmax(0, 1fr))`,
							gridAutoRows: rowHeight,
						} }
					>
						{ gridOverlay }
						{ items.map( ( id ) => (
							<GridItem
								key={ id }
								item={
									resolvedItemMap.get(
										id
									) as DashboardGridLayoutItem
								}
								maxColumns={ effectiveColumns }
								disabled={ ! editMode }
								verticalResizable={ rowHeight !== 'auto' }
								interacting={ activeId !== null || isResizing }
								onResize={ handleResize }
								onResizeEnd={ persistTemporaryLayout }
								actionableArea={ actionableAreaMap.get( id ) }
								renderResizeHandle={ renderResizeHandle }
							>
								{ childrenMap.get( id ) }
							</GridItem>
						) ) }
						{ remaining }
					</div>
				</SortableContext>
				<DragOverlay>{ dragOverlayContent }</DragOverlay>
			</DndContext>
		);
	}
);
