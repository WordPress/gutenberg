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
import type { DashboardLanesLayoutItem, DashboardLanesProps } from './types';
import type { ResizeDelta } from '../shared/types';
import styles from './lanes.module.css';

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
 */
export const DashboardLanes = forwardRef< HTMLDivElement, DashboardLanesProps >(
	function DashboardLanes( props, ref ) {
		const {
			layout,
			columns = 6,
			children,
			className,
			style,
			spacing = 2,
			flowTolerance = 16,
			rowUnit = 4,
			minColumnWidth,
			editMode = false,
			onChangeLayout,
			onPreviewLayout,
			renderResizeHandle,
			...divProps
		} = props;

		const [ temporaryLayout, setTemporaryLayout ] = useState<
			DashboardLanesLayoutItem[] | undefined
		>();
		const [ activeId, setActiveId ] = useState< string | null >( null );
		const [ isResizing, setIsResizing ] = useState( false );
		const latestLayoutRef = useRef<
			DashboardLanesLayoutItem[] | undefined
		>();
		const lastReorderCursorRef = useRef< {
			x: number;
			y: number;
		} | null >( null );
		const resizeBaselineRef = useRef< number | null >( null );
		const activeLayout = temporaryLayout ?? layout;

		const [ container, setContainer ] = useState< HTMLDivElement | null >(
			null
		);
		const [ containerWidth, setContainerWidth ] = useState( 0 );
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

		useLayoutEffect( () => {
			if ( container ) {
				const { width } = container.getBoundingClientRect();
				if ( width > 0 ) {
					setContainerWidth( width );
				}
			}
		}, [ container ] );

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
			const map = new Map< string, DashboardLanesLayoutItem >();
			activeLayout.forEach( ( item ) => map.set( item.key, item ) );
			return map;
		}, [ activeLayout ] );

		// Stable-identity key set for the children walk (see grid.tsx).
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

		// Sorted item keys, identity-stable when the resulting sequence
		// is unchanged (avoids invalidating SortableContext).
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

		// Placement input for the hook: each item with its clamped span
		// in source (sorted) order.
		const placementItems = useMemo( () => {
			return items.map( ( key ) => {
				const item = layoutMap.get( key );
				const width = item?.width;
				const span =
					typeof width === 'number'
						? Math.max( 1, Math.min( width, effectiveColumns ) )
						: 1;
				return { key, span };
			} );
		}, [ items, layoutMap, effectiveColumns ] );

		const { itemStyles, isPolyfilled } = useLanePlacement( container, {
			items: placementItems,
			lanes: effectiveColumns,
			gap: gapPx,
			flowTolerance,
			rowUnit,
		} );

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
					const { actionableArea } = child.props as {
						actionableArea?: React.ReactNode;
					};
					if ( actionableArea !== undefined ) {
						actionableMap.set( key, actionableArea );
						childMap.set(
							key,
							cloneElement(
								child as React.ReactElement< {
									actionableArea?: React.ReactNode;
								} >,
								{ actionableArea: undefined }
							)
						);
					} else {
						childMap.set( key, child as React.ReactElement );
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

		const persistTemporaryLayout = useEvent( () => {
			const latest = latestLayoutRef.current;
			latestLayoutRef.current = undefined;
			resizeBaselineRef.current = null;
			setIsResizing( false );

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
				const baseItem = activeLayout.find(
					( item ) => item.key === id
				);
				const baseWidth =
					typeof baseItem?.width === 'number' ? baseItem.width : 1;
				resizeBaselineRef.current = baseWidth;
			}
			const baseline = resizeBaselineRef.current;
			const newWidth = Math.max(
				1,
				Math.min( baseline + relativeDelta, effectiveColumns )
			);

			const currentItem = activeLayout.find(
				( item ) => item.key === id
			);
			if ( currentItem && currentItem.width === newWidth ) {
				return;
			}

			const updatedLayout = activeLayout.map( ( item ) =>
				item.key === id ? { ...item, width: newWidth } : item
			);

			latestLayoutRef.current = updatedLayout;
			setTemporaryLayout( updatedLayout );
			onPreviewLayout?.( updatedLayout );
		} );

		const interacting = activeId !== null || isResizing;

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
				<SortableContext items={ items } strategy={ NO_SORT_STRATEGY }>
					<div
						{ ...divProps }
						ref={ mergedRootRef }
						className={ clsx( styles.lanes, className ) }
						style={
							{
								...style,
								gridTemplateColumns: `repeat(${ effectiveColumns }, minmax(0, 1fr))`,
								columnGap: gapPx,
								'--wp-grid-lane-row-unit': `${ Math.max(
									1,
									rowUnit
								) }px`,
								// Polyfill mode: the algorithm already builds
								// inter-item vertical spacing into each tile's
								// `top` (skyline + gap), and the row math maps
								// 1px → 1/rowUnit grid lines. A non-zero
								// `row-gap` would compound on top of that and
								// push tiles off their computed positions.
								// Native lanes does its own packing, so the
								// user's gap applies to both axes.
								rowGap: isPolyfilled ? 0 : gapPx,
							} as React.CSSProperties
						}
					>
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
									onResize={ handleResize }
									onResizeEnd={ persistTemporaryLayout }
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
);
