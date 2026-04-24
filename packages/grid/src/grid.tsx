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
	/*
	 * Temporary layout holds pending changes during drag/resize
	 * to show preview without triggering parent re-renders.
	 */
	const [ temporaryLayout, setTemporaryLayout ] = useState<
		DashboardGridLayoutItem[] | undefined
	>();
	/*
	 * Identifies the item currently being dragged. Drives the
	 * `<DragOverlay>` content: the original tile stays in its grid
	 * cell as a placeholder (with reduced opacity), while a clone
	 * inside the overlay follows the cursor.
	 */
	const [ activeId, setActiveId ] = useState< string | null >( null );
	/*
	 * Mirror of `temporaryLayout` for synchronous reads from
	 * `persistTemporaryLayout` on drag end: a state update queued
	 * inside `handleDragMove` is batched by React and would still
	 * be stale when read from `persistTemporaryLayout`.
	 */
	const latestLayoutRef = useRef< DashboardGridLayoutItem[] | undefined >();
	const activeLayout = temporaryLayout ?? layout;

	const rootRef = useRef< HTMLDivElement >( null );
	const [ containerWidth, setContainerWidth ] = useState( 0 );
	const resizeObserverRef = useResizeObserver( ( [ { contentRect } ] ) => {
		setContainerWidth( contentRect.width );
	} );
	const mergedGridRef = useMergeRefs( [ rootRef, resizeObserverRef ] );

	/*
	 * Measure synchronously before paint so responsive mode does not
	 * flash a single-column layout on first render: `useResizeObserver`
	 * delivers its first entry asynchronously after mount, by which
	 * point the user has already seen the uninitialized width.
	 */
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
				/*
				 * Extract `actionableArea` as a grid-level slot and strip
				 * it from the child so the prop does not leak onto DOM
				 * elements when consumers pass plain tags as children.
				 */
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
	} );

	const handleDragCancel = useEvent( () => {
		setActiveId( null );
		latestLayoutRef.current = undefined;
		setTemporaryLayout( undefined );
	} );

	/*
	 * Decide reorder from the pointer position relative to the over
	 * tile's center, not just from `over.id` changing. dnd-kit only
	 * fires `onDragOver` when `over` changes, which misses the
	 * "swap back" case where the cursor stays over the same tile
	 * (common after a reorder that resized or moved a wide
	 * neighbor). `onDragMove` fires on every pointer move, letting
	 * us re-evaluate the insertion slot continuously.
	 */
	const handleDragMove = useEvent( ( event: DragMoveEvent ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}

		const activeRect = active.rect.current.translated;
		if ( ! activeRect ) {
			return;
		}

		const overCenterX = over.rect.left + over.rect.width / 2;
		const activeCenterX = activeRect.left + activeRect.width / 2;
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

		latestLayoutRef.current = updatedLayout;
		setTemporaryLayout( updatedLayout );
		onPreviewLayout?.( updatedLayout );
	} );

	/*
	 * Commit temporary changes to parent and clear local state.
	 * Called when user finishes drag/resize on mouse up. Reads from
	 * `latestLayoutRef` rather than `temporaryLayout` so that a
	 * just-flushed debounced update is observed synchronously.
	 */
	function persistTemporaryLayout() {
		const latest = latestLayoutRef.current;
		latestLayoutRef.current = undefined;

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

		const relativeDelta = {
			width: Math.round( delta.width / ( columnWidth + gapPx ) ),
			height:
				rowHeight === 'auto'
					? 0
					: Math.round( delta.height / ( rowHeight + gapPx ) ),
		};

		if ( relativeDelta.width !== 0 || relativeDelta.height !== 0 ) {
			const updatedLayout = activeLayout.map( ( item ) => {
				if ( item.key === id ) {
					const resolvedItem = resolvedItemMap.get( id );
					/*
					 * When the tile uses `'fill'` or `'full'`, resize
					 * starts from the currently rendered column span
					 * and converts to a concrete numeric width.
					 */
					let baseWidth: number;
					if ( item.width === 'full' ) {
						baseWidth = effectiveColumns;
					} else if ( item.width === 'fill' ) {
						baseWidth =
							typeof resolvedItem?.width === 'number'
								? resolvedItem.width
								: 1;
					} else {
						baseWidth = item.width ?? 1;
					}
					return {
						...item,
						width: Math.max(
							1,
							Math.min(
								baseWidth + relativeDelta.width,
								effectiveColumns
							)
						),
						height: Math.max(
							1,
							( item.height ?? 1 ) + relativeDelta.height
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
			} }
		>
			{ /*
			 * Strategy is intentionally a no-op: the visual reorder is
			 * driven by `temporaryLayout` + CSS Grid re-render, not by
			 * dnd-kit's built-in transforms. This keeps resize, reorder,
			 * and fill resolution on a single code path.
			 */ }
			<SortableContext items={ items } strategy={ () => null }>
				<div
					ref={ mergedGridRef }
					className={ clsx( styles.grid, className ) }
					style={ {
						gridTemplateColumns: `repeat(${ effectiveColumns }, 1fr)`,
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
