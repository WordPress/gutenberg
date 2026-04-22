/**
 * External dependencies
 */
import {
	DndContext,
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
import type { DragOverEvent } from '@dnd-kit/core';

/**
 * WordPress dependencies
 */
import { useResizeObserver, useDebounce, useEvent } from '@wordpress/compose';
import {
	useMemo,
	Children,
	isValidElement,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GridItem } from './grid-item';
import { resolveFillWidths } from './resolve-fill-widths';
import type { DashboardGridLayoutItem, DashboardGridProps } from './types';

/**
 * 2D packed dashboard grid with drag-to-reorder and resize handles.
 * Each item has explicit `(width, height)` spans in column/row units
 * and can span multiple columns **and** multiple rows, unlike masonry
 * or justified-row layouts.
 *
 * Designed for dashboard-style surfaces where users arrange tiles.
 * Each child must have a `key` prop that matches an entry in the
 * `layout` array; children without a matching entry are rendered
 * outside the grid.
 *
 * @param props                 Component props.
 * @param props.layout          Positions and sizes keyed by child `key`.
 * @param props.columns         Total columns in fixed mode.
 * @param props.children        Grid children.
 * @param props.className       Extra class on the grid root.
 * @param props.spacing         Gap multiplier (effective gap = `spacing * 4px`).
 * @param props.rowHeight       Row height in pixels, or `'auto'`.
 * @param props.minColumnWidth  Enables responsive mode using this as the
 *                              per-column lower bound.
 * @param props.editMode        Enables drag-to-reorder and resize.
 * @param props.onChangeLayout  Fired when the user commits a drag or resize.
 * @param props.onPreviewLayout Fired continuously during a drag or resize.
 */
export function DashboardGrid( {
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
}: DashboardGridProps ) {
	/*
	 * Temporary layout holds pending changes during drag/resize
	 * to show preview without triggering parent re-renders.
	 */
	const [ temporaryLayout, setTemporaryLayout ] = useState<
		DashboardGridLayoutItem[] | undefined
	>();
	const activeLayout = temporaryLayout ?? layout;

	const [ containerWidth, setContainerWidth ] = useState( 0 );
	const resizeObserverRef = useResizeObserver( ( [ { contentRect } ] ) => {
		setContainerWidth( contentRect.width );
	} );
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
	const columnWidth = ( containerWidth - gapPx ) / effectiveColumns;

	const layoutMap = useMemo( () => {
		const map = new Map< string, DashboardGridLayoutItem >();
		activeLayout.forEach( ( item ) => map.set( item.key, item ) );
		return map;
	}, [ activeLayout ] );

	const items = useMemo(
		() =>
			[ ...activeLayout ]
				.sort(
					( a, b ) =>
						( a.order ?? Infinity ) - ( b.order ?? Infinity )
				)
				.map( ( item ) => item.key ),
		[ activeLayout ]
	);

	// Resolve fillWidth items to concrete column spans.
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

	const [ childrenMap, remaining ] = useMemo( () => {
		const map = new Map< string, React.ReactElement >();
		const rest: React.ReactNode[] = [];

		Children.forEach( children, ( child ) => {
			if ( ! isValidElement( child ) ) {
				rest.push( child );
				return;
			}

			const key = child.key?.toString();
			if ( key && layoutMap.has( key ) ) {
				map.set( key, child );
			} else {
				rest.push( child );
			}
		} );

		return [ map, rest ];
	}, [ children, layoutMap ] );

	const actionableAreaMap = useMemo( () => {
		const map = new Map< string, React.ReactNode >();
		childrenMap.forEach( ( child, key ) => {
			if ( child?.props.actionableArea ) {
				map.set( key, child.props.actionableArea );
			}
		} );
		return map;
	}, [ childrenMap ] );

	const sensors = useSensors(
		useSensor( PointerSensor ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	const handleDragOver = useEvent( ( event: DragOverEvent ) => {
		const { active, over } = event;

		if ( over && active && active.id !== over.id ) {
			const oldIndex = items.indexOf( String( active.id ) );
			const newIndex = items.indexOf( String( over.id ) );
			const updatedItems = arrayMove( items, oldIndex, newIndex );
			const updatedLayout = layout.map( ( item ) => {
				const newOrder = updatedItems.indexOf( item.key );
				return {
					...item,
					order: newOrder,
				};
			} );
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		}
	} );
	const debouncedHandleDragOver = useDebounce( handleDragOver, 100 );

	/*
	 * Commit temporary changes to parent and clear local state.
	 * Called when user finishes drag/resize on mouse up.
	 */
	function persistTemporaryLayout() {
		if ( ! onChangeLayout || ! temporaryLayout ) {
			return;
		}

		onChangeLayout( temporaryLayout );
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
					 * When the tile uses `fillWidth` or `fullWidth`, the
					 * resize starts from the currently rendered column
					 * span and drops the flag, converting to a concrete
					 * width.
					 */
					let baseWidth: number;
					if ( item.fullWidth ) {
						baseWidth = effectiveColumns;
					} else if ( item.fillWidth ) {
						baseWidth = resolvedItem?.width ?? item.width ?? 1;
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
						fillWidth: undefined,
						fullWidth: undefined,
					} as DashboardGridLayoutItem;
				}
				return item;
			} );
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		}
	}

	return (
		<DndContext
			sensors={ sensors }
			onDragOver={ debouncedHandleDragOver }
			onDragEnd={ () => {
				debouncedHandleDragOver.flush();
				persistTemporaryLayout();
			} }
		>
			{ /*
			 * Strategy is intentionally a no-op: the visual reorder is
			 * driven by `temporaryLayout` + CSS Grid re-render, not by
			 * dnd-kit's built-in transforms. This keeps resize, reorder,
			 * and fillWidth resolution on a single code path.
			 */ }
			<SortableContext items={ items } strategy={ () => null }>
				<div
					ref={ resizeObserverRef }
					className={ className }
					style={ {
						display: 'grid',
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
		</DndContext>
	);
}
