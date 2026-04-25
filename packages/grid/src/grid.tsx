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
import { resolveFillWidths } from './resolve-fill-widths';
import type { DashboardGridLayoutItem, DashboardGridProps } from './types';
import styles from './grid.module.css';

/**
 * 2D packed dashboard grid with drag-to-reorder and resize handles.
 * Each child's `key` must match an entry in the `layout` array;
 * children without a match are rendered outside the grid.
 *
 * @param props Component props.
 */
export function DashboardGrid( props: DashboardGridProps ) {
	const {
		layout,
		columns = 6,
		children,
		className,
		spacing = 2,
		rowHeight = 'auto',
		minColumnWidth,
		editMode = false,
		onChangeLayout,
		onPreviewLayout,
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
	const latestLayoutRef = useRef< DashboardGridLayoutItem[] | undefined >();
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
	const resizeObserverRef = useResizeObserver( ( [ { contentRect } ] ) => {
		setContainerWidth( contentRect.width );
	} );
	const mergedGridRef = useMergeRefs( [ rootRef, resizeObserverRef ] );

	// Measure before paint to avoid a single-column flash in
	// responsive mode; `useResizeObserver` delivers async.
	useLayoutEffect( () => {
		if ( rootRef.current ) {
			const { width } = rootRef.current.getBoundingClientRect();
			if ( width > 0 ) {
				setContainerWidth( width );
			}
		}
	}, [] );
	const gapPx = spacing * 4;
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

	const items = useMemo(
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
			if ( key && layoutMap.has( key ) ) {
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
	}, [ children, layoutMap ] );

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
	function persistTemporaryLayout() {
		const latest = latestLayoutRef.current;
		latestLayoutRef.current = undefined;
		resizeBaselineRef.current = null;
		setIsResizing( false );

		if ( ! onChangeLayout || ! latest ) {
			return;
		}

		onChangeLayout( latest );
		setTemporaryLayout( undefined );
	}

	function handleResize(
		id: string,
		delta: { width: number; height: number }
	) {
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

		if ( relativeDelta.width !== 0 || relativeDelta.height !== 0 ) {
			// Snapshot baseline on the first meaningful frame and read
			// from it on every frame after — `delta` is absolute from
			// the gesture start, so summing it with the live (already
			// mutated) `activeLayout` width compounds and oscillates,
			// which thrashes any adjacent `fill` tile.
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
			const updatedLayout = activeLayout.map( ( item ) => {
				if ( item.key === id ) {
					return {
						...item,
						width: Math.max(
							1,
							Math.min(
								baseline.width + relativeDelta.width,
								effectiveColumns
							)
						),
						height: Math.max(
							1,
							baseline.height + relativeDelta.height
						),
					};
				}
				return item;
			} );

			latestLayoutRef.current = updatedLayout;
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		}
	}

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
			<SortableContext items={ items } strategy={ () => null }>
				<div
					ref={ mergedGridRef }
					className={ clsx( styles.grid, className ) }
					style={ {
						gridTemplateColumns: `repeat(${ effectiveColumns }, minmax(0, 1fr))`,
						gridAutoRows: rowHeight,
						gap: gapPx,
					} }
				>
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
							onResize={ ( delta ) => handleResize( id, delta ) }
							onResizeEnd={ persistTemporaryLayout }
							actionableArea={ actionableAreaMap.get( id ) }
						>
							{ childrenMap.get( id ) }
						</GridItem>
					) ) }
					{ remaining }
				</div>
			</SortableContext>
			<DragOverlay>
				{ activeId && childrenMap.get( activeId ) ? (
					<div className={ styles[ 'drag-preview' ] }>
						{ childrenMap.get( activeId ) }
					</div>
				) : null }
			</DragOverlay>
		</DndContext>
	);
}
