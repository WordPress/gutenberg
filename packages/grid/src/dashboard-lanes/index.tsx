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
import { LanesItem } from './lanes-item';
import { useLanePlacement } from './use-lane-placement';
import { GridOverlay } from '../shared/grid-overlay';
import { gridSpanToPixelSize } from '../shared/resize-snap';
import layoutAnimationStyles from '../shared/layout-shift-animation.module.css';
import { ItemExitOverlay } from '../shared/item-exit-overlay';
import {
	getLayoutFingerprint,
	getPlacementFingerprint,
	useLayoutShiftAnimation,
} from '../shared/use-layout-shift-animation';
import { useItemExitAnimation } from '../shared/use-item-exit-animation';
import type { DashboardLanesLayoutItem, DashboardLanesProps } from './types';
import type { ResizeSnapSize } from '../shared/resize-snap';
import type { ResizeDelta } from '../shared/types';
import { createDashboardDragDropAnimation } from '../shared/drag-overlay-drop-animation';
import styles from './lanes.module.css';

const dashboardDragDropAnimation = createDashboardDragDropAnimation(
	styles[ 'drag-preview-frame' ],
	styles.dragPreviewFrameExiting
);

// Fallback gap in pixels for math that runs before the computed gap
// can be read from the DOM. Matches the `'xl'` step the surface
// resolves to in CSS (`--wpds-dimension-gap-xl`); the next layout
// effect overwrites this with the actual computed value.
const FALLBACK_GAP_PX = 24;

// Default lane cap when no explicit `columns` or `minColumnWidth` is
// supplied. Layered semantics: `columns` acts as a cap and
// `minColumnWidth` as a per-tile floor; if neither is set we still
// need a finite count to render against.
const DEFAULT_COLUMNS = 6;

const NO_SORT_STRATEGY = () => null;

/**
 * Masonry-style surface aligned with `display: grid-lanes`. Items
 * declare a column span; heights are driven by content; placement
 * follows the source-ordered, shortest-lane algorithm with
 * `flow-tolerance` tiebreaking.
 *
 * On browsers that support `display: grid-lanes` natively, the
 * component emits the spec's CSS and lets the engine handle layout.
 * Otherwise, `useLanePlacement` measures item heights and assigns
 * explicit `grid-column-start` / `grid-row-start` values that
 * approximate the same result inside CSS Grid.
 *
 * Each child's `key` must match an entry in the `layout` array;
 * children without a match render at the end of the surface without
 * explicit placement and fall through the lanes auto-flow.
 *
 * @example
 * ```jsx
 * <DashboardLanes
 *     layout={ [
 *         { key: 'a' },
 *         { key: 'b', width: 2 },
 *         { key: 'c' },
 *     ] }
 *     columns={ 3 }
 *     editMode
 *     onChangeLayout={ setLayout }
 * >
 *     <Tile key="a">A</Tile>
 *     <Tile key="b">B</Tile>
 *     <Tile key="c">C</Tile>
 * </DashboardLanes>
 * ```
 *
 * @param props Component props.
 * @param ref   Forwarded to the surface's root `<div>`.
 */
export const DashboardLanes = forwardRef< HTMLDivElement, DashboardLanesProps >(
	function DashboardLanes( props, ref ) {
		const {
			layout,
			columns,
			children,
			className,
			style,
			flowTolerance = 16,
			rowUnit = 4,
			minColumnWidth,
			editMode = false,
			onChangeLayout,
			onPreviewLayout,
			renderResizeHandle,
			renderDragPreview,
			renderGridOverlay,
			...divProps
		} = props;

		const [ temporaryLayout, setTemporaryLayout ] = useState<
			DashboardLanesLayoutItem[] | undefined
		>();
		const [ activeId, setActiveId ] = useState< string | null >( null );
		const [ isResizing, setIsResizing ] = useState( false );
		const [ resizeSnapPreview, setResizeSnapPreview ] = useState< {
			id: string;
			snap: ResizeSnapSize;
		} | null >( null );
		const latestLayoutRef = useRef<
			DashboardLanesLayoutItem[] | undefined
		>();
		const lastReorderCursorRef = useRef< {
			x: number;
			y: number;
		} | null >( null );
		const resizeBaselineRef = useRef< number | null >( null );
		const captureLayoutSnapshotRef = useRef< () => void >( () => {} );
		const childrenCacheRef = useRef< Map< string, React.ReactElement > >(
			new Map()
		);
		const activeLayout = temporaryLayout ?? layout;

		const [ container, setContainer ] = useState< HTMLDivElement | null >(
			null
		);
		const [ containerWidth, setContainerWidth ] = useState( 0 );
		const [ gapPx, setGapPx ] = useState( FALLBACK_GAP_PX );
		const resizeObserverRef = useResizeObserver(
			( [ { contentRect } ] ) => {
				setContainerWidth( contentRect.width );
			}
		);
		const mergedRootRef = useMergeRefs( [
			setContainer,
			resizeObserverRef,
			ref,
		] );

		// Measure synchronously before paint and snapshot the computed
		// `column-gap` so the placement math tracks the design-system
		// token under any density.
		useLayoutEffect( () => {
			if ( ! container ) {
				return;
			}
			const { width } = container.getBoundingClientRect();
			if ( width > 0 ) {
				setContainerWidth( width );
			}
			const parsed = Number.parseFloat(
				window.getComputedStyle( container ).columnGap
			);
			if ( Number.isFinite( parsed ) && parsed > 0 ) {
				setGapPx( parsed );
			}
		}, [ container ] );
		const effectiveColumns = useMemo( () => {
			if ( ! minColumnWidth ) {
				return columns ?? DEFAULT_COLUMNS;
			}
			const totalWidthPerColumn = minColumnWidth + gapPx;
			const maxFit = Math.max(
				1,
				Math.floor( ( containerWidth + gapPx ) / totalWidthPerColumn )
			);
			return columns !== undefined ? Math.min( columns, maxFit ) : maxFit;
		}, [ minColumnWidth, gapPx, containerWidth, columns ] );
		const columnWidth =
			( containerWidth - ( effectiveColumns - 1 ) * gapPx ) /
			effectiveColumns;
		const minResizeWidthPx = gridSpanToPixelSize(
			1,
			1,
			columnWidth,
			gapPx,
			null
		).widthPx;

		const layoutMap = useMemo( () => {
			const map = new Map< string, DashboardLanesLayoutItem >();
			activeLayout.forEach( ( item ) => map.set( item.key, item ) );
			return map;
		}, [ activeLayout ] );

		// Stable-identity key set for the children walk (see grid.tsx).
		const layoutKeys = useMemo(
			() => new Set( layout.map( ( item ) => item.key ) ),
			[ layout ]
		);

		// Sorted item keys, identity-stable when the resulting sequence
		// is unchanged (avoids invalidating SortableContext).
		const sortedItems = useMemo(
			() =>
				activeLayout
					.map( ( item, index ) => ( { item, index } ) )
					.sort(
						( a, b ) =>
							( a.item.order ?? a.index ) -
							( b.item.order ?? b.index )
					)
					.map( ( { item } ) => item.key ),
			[ activeLayout ]
		);
		const items = sortedItems;

		// Placement input for the hook: each item with its clamped span
		// in source (sorted) order. `lane` forwards the optional explicit
		// pin from the layout item; the algorithm clamps out-of-range
		// values, so no surface-level guard is needed.
		const placementItems = useMemo( () => {
			return items.map( ( key ) => {
				const item = layoutMap.get( key );
				const width = item?.width;
				const span =
					typeof width === 'number'
						? Math.max( 1, Math.min( width, effectiveColumns ) )
						: 1;
				return { key, span, lane: item?.lane };
			} );
		}, [ items, layoutMap, effectiveColumns ] );

		const { itemStyles } = useLanePlacement( container, {
			items: placementItems,
			lanes: effectiveColumns,
			gap: gapPx,
			flowTolerance,
			rowUnit,
		} );

		const [ childrenMap, actionableAreaMap, remaining, renderedByKey ] =
			useMemo( () => {
				const childMap = new Map< string, React.ReactElement >();
				const actionableMap = new Map< string, React.ReactNode >();
				const rest: React.ReactNode[] = [];
				const byKey = new Map< string, React.ReactElement >();

				Children.forEach( children, ( child ) => {
					if ( ! isValidElement( child ) ) {
						rest.push( child );
						return;
					}
					const key = child.key?.toString();
					if ( ! key ) {
						rest.push( child );
						return;
					}

					// Strip `actionableArea` so it does not leak to the DOM;
					// the grid lifts it to a slot separately.
					const { actionableArea } = child.props as {
						actionableArea?: React.ReactNode;
					};
					const stripped =
						actionableArea !== undefined
							? cloneElement(
									child as React.ReactElement< {
										actionableArea?: React.ReactNode;
									} >,
									{ actionableArea: undefined }
							  )
							: ( child as React.ReactElement );

					byKey.set( key, stripped );

					if ( layoutKeys.has( key ) ) {
						if ( actionableArea !== undefined ) {
							actionableMap.set( key, actionableArea );
						}
						childMap.set( key, stripped );
					} else {
						rest.push( child );
					}
				} );

				return [ childMap, actionableMap, rest, byKey ];
			}, [ children, layoutKeys ] );

		// Persist the latest rendered children so a removed tile's content
		// is still available for its exit overlay. Filled from an effect so a
		// discarded render never writes to the cache.
		useLayoutEffect( () => {
			for ( const [ key, child ] of renderedByKey ) {
				childrenCacheRef.current.set( key, child );
			}
		}, [ renderedByKey ] );

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
			setResizeSnapPreview( null );
			setTemporaryLayout( undefined );
		} );

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
			// Build a key→index lookup so the .map below is O(n)
			// instead of O(n²) from per-item `indexOf` calls.
			const orderByKey = new Map< string, number >();
			updatedItems.forEach( ( key, index ) => {
				orderByKey.set( key, index );
			} );
			const updatedLayout = activeLayout.map( ( item ) => ( {
				...item,
				order: orderByKey.get( item.key ) ?? 0,
			} ) );

			lastReorderCursorRef.current = {
				x: activeCenterX,
				y: activeCenterY,
			};
			latestLayoutRef.current = updatedLayout;
			captureLayoutSnapshotRef.current();
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		} );

		const persistTemporaryLayout = useEvent( () => {
			const latest = latestLayoutRef.current;
			latestLayoutRef.current = undefined;
			resizeBaselineRef.current = null;
			setIsResizing( false );
			setResizeSnapPreview( null );
			if ( ! onChangeLayout || ! latest ) {
				setTemporaryLayout( undefined );
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

			const relativeDelta = Math.round(
				delta.width / ( columnWidth + gapPx )
			);

			if ( resizeBaselineRef.current === null ) {
				const baseItem = layoutMap.get( id );
				const baseWidth =
					typeof baseItem?.width === 'number' ? baseItem.width : 1;
				resizeBaselineRef.current = baseWidth;
			}
			const baseline = resizeBaselineRef.current;
			const newWidth = Math.max(
				1,
				Math.min( baseline + relativeDelta, effectiveColumns )
			);

			setResizeSnapPreview( {
				id,
				snap: gridSpanToPixelSize(
					newWidth,
					1,
					columnWidth,
					gapPx,
					null
				),
			} );

			const pendingItem = latestLayoutRef.current?.find(
				( item ) => item.key === id
			);
			const currentItem = pendingItem ?? layoutMap.get( id );
			if ( currentItem && currentItem.width === newWidth ) {
				return;
			}

			const updatedLayout = activeLayout.map( ( item ) =>
				item.key === id ? { ...item, width: newWidth } : item
			);

			latestLayoutRef.current = updatedLayout;
			captureLayoutSnapshotRef.current();
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		} );

		const interacting = activeId !== null || isResizing;

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
					<div className={ styles[ 'drag-preview-frame__lift' ] }>
						{ DragPreview ? (
							<DragPreview itemId={ activeId }>
								{ activeClone }
							</DragPreview>
						) : (
							activeClone
						) }
					</div>
				</div>
			) : null;

		// Edit-mode background visual. Lanes are content-driven
		// vertically, so the overlay only mirrors columns; the default
		// can be replaced wholesale via `renderGridOverlay`. Rendered
		// unconditionally so the overlay can cross-fade on edit-mode
		// toggles; `isActive` drives the opacity transition inside the
		// overlay. Memoized so drag/resize re-renders skip
		// reconciliation while inputs are stable.
		const Overlay = renderGridOverlay ?? GridOverlay;
		const gridOverlay = useMemo(
			() => (
				<Overlay columns={ effectiveColumns } isActive={ editMode } />
			),
			[ Overlay, editMode, effectiveColumns ]
		);

		const layoutFingerprint = useMemo( () => {
			const layoutSig = getLayoutFingerprint( activeLayout );
			const placementSig = getPlacementFingerprint( itemStyles );
			return `${ layoutSig }\0${ placementSig }`;
		}, [ activeLayout, itemStyles ] );
		const excludeLayoutAnimationKey =
			activeId ?? ( isResizing ? resizeSnapPreview?.id : null );
		const { captureLayoutSnapshot, getPositionsBeforeLastChange } =
			useLayoutShiftAnimation( {
				container,
				enabled: editMode,
				layoutFingerprint,
				excludeItemKey: excludeLayoutAnimationKey,
			} );
		const { exitingItems, clearExitingItem } = useItemExitAnimation( {
			container,
			enabled: editMode,
			layoutKeys,
			getPositionsBeforeLastChange,
			childrenCacheRef,
		} );
		const layoutAnimating = editMode;
		useLayoutEffect( () => {
			captureLayoutSnapshotRef.current = captureLayoutSnapshot;
		}, [ captureLayoutSnapshot ] );

		return (
			<DndContext
				sensors={ sensors }
				onDragStart={ handleDragStart }
				onDragCancel={ handleDragCancel }
				onDragMove={ handleDragMove }
				onDragEnd={ () => {
					persistTemporaryLayout();
					lastReorderCursorRef.current = null;
					setActiveId( null );
				} }
			>
				<SortableContext items={ items } strategy={ NO_SORT_STRATEGY }>
					<div
						{ ...divProps }
						ref={ mergedRootRef }
						className={ clsx(
							styles.lanes,
							layoutAnimating &&
								layoutAnimationStyles[ 'layout-animating' ],
							className
						) }
						data-wp-grid-dragging={ activeId || undefined }
						data-wp-grid-resizing={ isResizing || undefined }
						style={
							{
								...style,
								gridTemplateColumns: `repeat(${ effectiveColumns }, minmax(0, 1fr))`,
								// `column-gap` and `row-gap` are set in
								// `lanes.module.css` from the
								// design-system gap token, with an
								// `@supports` block that zeroes `row-gap`
								// in polyfill mode (the skyline already
								// encodes vertical spacing in each tile's
								// `top`). Driving the toggle from CSS
								// keeps SSR and client output identical
								// regardless of native support.
								'--wp-grid-lane-row-unit': `${ Math.max(
									1,
									rowUnit
								) }px`,
							} as React.CSSProperties
						}
					>
						{ gridOverlay }
						{ items.map( ( id ) => {
							const child = childrenMap.get( id );
							if ( ! child ) {
								return null;
							}
							return (
								<LanesItem
									key={ id }
									itemKey={ id }
									placementStyle={
										itemStyles.get( id ) ?? {}
									}
									disabled={ ! editMode }
									interacting={ interacting }
									dragging={ activeId !== null }
									onResize={ handleResize }
									onResizeEnd={ persistTemporaryLayout }
									resizeSnapPreview={
										resizeSnapPreview?.id === id
											? resizeSnapPreview.snap
											: null
									}
									minResizeWidthPx={ minResizeWidthPx }
									actionableArea={ actionableAreaMap.get(
										id
									) }
									renderResizeHandle={ renderResizeHandle }
								>
									{ child }
								</LanesItem>
							);
						} ) }
						{ remaining }
						{ exitingItems.map( ( { key, rect, child } ) => (
							<ItemExitOverlay
								key={ `exiting-${ key }` }
								itemKey={ key }
								rect={ rect }
								onAnimationEnd={ () => clearExitingItem( key ) }
							>
								{ child }
							</ItemExitOverlay>
						) ) }
					</div>
				</SortableContext>
				<DragOverlay dropAnimation={ dashboardDragDropAnimation }>
					{ dragOverlayContent }
				</DragOverlay>
			</DndContext>
		);
	}
);
