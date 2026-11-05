import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import type { Block } from '@wordpress/blocks';
import {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useMemo,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import type { CurriedSelectorsOf } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import {
	__experimentalUseDropZone as useDropZone,
	useMergeRefs,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import {
	range,
	GridRect,
	getGridInfo,
	getGridItemRect,
	getBoundingGridRect,
	getGridItemMeasurements,
	getGridTrackPositions,
	getInserterDragBlockNames,
} from './utils';
import { useInserterDragBlockNames } from './use-inserter-drag-block-names';
import { parseDropEvent } from '../use-on-block-drop';
import {
	getGridDropTarget,
	getPixelRectFromGridRect,
} from './get-grid-drop-target';
import { getAlignmentGuides } from './get-alignment-guides';
import type { GridBlockStyle, GridStyleLayout } from './mobile-stacking';
import { getInsertedChildLayoutStyle } from './get-inserted-child-layout-style';
import { getMinimumInsertionRect } from './get-minimum-insertion-rect';
import {
	getInsertedBlockRect,
	getInsertionSize,
} from './get-inserted-block-rect';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import ButtonBlockAppender from '../button-block-appender';
import { unlock } from '../../lock-unlock';
import { hasViewportBlockStyleState } from '../../hooks/block-style-state';
import { useUpdateGridChildLayout } from './use-update-grid-child-layout';
import type {
	AutoGridVisualizerProps,
	GridDragGrab,
	GridDropIndicatorProps,
	GridDropTarget,
	GridInfo,
	GridItemAttributes,
	GridItemMeasurements,
	GridMarquee,
	GridMarqueeDrag,
	GridPixelRect,
	GridVisualizerAppenderProps,
	GridVisualizerCellProps,
	GridVisualizerDropLayerProps,
	GridVisualizerGridProps,
	GridVisualizerMarqueeProps,
	GridVisualizerProps,
	InserterBlockSelectors,
	ManualGridVisualizerProps,
} from './types';

export function GridVisualizer( {
	clientId,
	contentRef,
	parentLayout,
	childGridClientId,
}: GridVisualizerProps ) {
	const isDistractionFree = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().isDistractionFree,
		[]
	);
	const gridElement = useBlockElement( clientId );

	if ( isDistractionFree || ! gridElement ) {
		return null;
	}

	const isManualGrid =
		parentLayout?.isManualPlacement &&
		// The experiment sets this global.
		(
			window as Window & {
				__experimentalEnableGridInteractivity?: boolean;
			}
		 ).__experimentalEnableGridInteractivity;
	return (
		<GridVisualizerGrid
			gridClientId={ clientId }
			gridElement={ gridElement }
			isManualGrid={ isManualGrid }
			ref={ contentRef }
			childGridClientId={ childGridClientId }
		/>
	);
}

const GridVisualizerGrid = forwardRef(
	(
		{
			gridClientId,
			gridElement,
			isManualGrid,
			childGridClientId,
		}: GridVisualizerGridProps,
		ref: ForwardedRef< HTMLDivElement >
	) => {
		const [ gridInfo, setGridInfo ] = useState( () =>
			getGridInfo( gridElement )
		);
		// Blocks dragged from an inserter can be dropped in a manual grid,
		// with grid interactivity.
		const inserterBlockNames = useInserterDragBlockNames(
			isManualGrid && window.__experimentalEnableGridInteractivity
				? gridElement
				: null
		);
		const { isDragging, isDroppingAllowed } = useSelect(
			( select ) => {
				const selectors = select( blockEditorStore );
				if ( selectors.isDraggingBlocks() ) {
					return {
						isDragging: true,
						isDroppingAllowed: !! getBlockToPlaceInGrid(
							selectors,
							gridClientId
						),
					};
				}
				if ( inserterBlockNames.length ) {
					return {
						isDragging: true,
						isDroppingAllowed: canInsertBlockNamesInGrid(
							selectors,
							inserterBlockNames,
							gridClientId
						),
					};
				}
				return { isDragging: false, isDroppingAllowed: false };
			},
			[ gridClientId, inserterBlockNames ]
		);

		// When a drag ends, Safari moves the hover to where the pointer was
		// when the drag started, without the pointer moving, so the cell that
		// was under it looks hovered. Cells only show they're hovered once
		// the pointer has moved over the grid since the last drag.
		const [ isHoverPending, setIsHoverPending ] = useState( true );
		useEffect( () => {
			setIsHoverPending( true );
		}, [ isDragging ] );

		// Get the element for the child grid block so we can
		// compute its position and hide overlapping visualizer cells.
		// A missing client ID has no element.
		const childGridElement = useBlockElement( childGridClientId as string );

		// Compute the child grid block's rect from its position in the grid.
		// This works for both manual and non-manual grids.
		const childGridRect = useMemo( () => {
			if ( ! childGridElement ) {
				return null;
			}
			// Block elements are HTML elements.
			return getGridItemRect( childGridElement as HTMLElement );
		}, [ childGridElement ] );

		useEffect( () => {
			const resizeCallback = () =>
				setGridInfo( getGridInfo( gridElement ) );
			// Both border-box and content-box are observed as they may change
			// independently. This requires two observers because a single one
			// can’t be made to monitor both on the same element.
			const borderBoxSpy = new window.ResizeObserver( resizeCallback );
			borderBoxSpy.observe( gridElement, { box: 'border-box' } );
			const contentBoxSpy = new window.ResizeObserver( resizeCallback );
			contentBoxSpy.observe( gridElement );
			for ( const element of gridElement.children ) {
				contentBoxSpy.observe( element );
			}
			return () => {
				borderBoxSpy.disconnect();
				contentBoxSpy.disconnect();
			};
		}, [ gridElement ] );

		return (
			<BlockPopoverCover
				className={ clsx( 'block-editor-grid-visualizer', {
					'is-dropping-allowed': isDroppingAllowed,
					// Popovers in the block tools slots are hidden once a drag
					// has been over the block flow. A manual grid's stays, so
					// that its drop layer can take blocks from the block flow
					// and give them back.
					'is-shown-while-dragging': isManualGrid,
				} ) }
				clientId={ gridClientId }
				__unstablePopoverSlot="__unstable-block-tools-after"
			>
				<div
					ref={ ref }
					className={ clsx( 'block-editor-grid-visualizer__grid', {
						'is-hover-pending': isHoverPending,
					} ) }
					style={ gridInfo.style }
					onPointerMove={
						isHoverPending
							? () => setIsHoverPending( false )
							: undefined
					}
				>
					{ isManualGrid ? (
						<ManualGridVisualizer
							gridClientId={ gridClientId }
							gridElement={ gridElement }
							gridInfo={ gridInfo }
							childGridRect={ childGridRect }
						/>
					) : (
						<AutoGridVisualizer
							gridInfo={ gridInfo }
							childGridRect={ childGridRect }
						/>
					) }
				</div>
			</BlockPopoverCover>
		);
	}
);

function AutoGridVisualizer( {
	gridInfo,
	childGridRect,
}: AutoGridVisualizerProps ) {
	return range( 1, gridInfo.numRows ).map( ( row ) =>
		range( 1, gridInfo.numColumns ).map( ( column ) => {
			// Don't render visualizer cells for a selected child block
			// that is itself a grid, so that only the child's grid
			// visualizer is visible.
			let color = gridInfo.currentColor;
			if ( childGridRect?.contains( column, row ) ) {
				color = 'transparent';
			}
			return (
				<GridVisualizerCell
					key={ `${ row }-${ column }` }
					color={ color }
				/>
			);
		} )
	);
}

function ManualGridVisualizer( {
	gridClientId,
	gridElement,
	gridInfo,
	childGridRect,
}: ManualGridVisualizerProps ) {
	const [ dropTarget, setDropTarget ] = useState< GridDropTarget | null >(
		null
	);

	const { gridItemStyles, viewport, stackedLayouts } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockStyles,
				getSelectedBlockStyleState,
				getStackedGridLayouts,
			} = unlock( select( blockEditorStore ) );
			return {
				gridItemStyles: getBlockStyles( getBlockOrder( gridClientId ) ),
				// The viewport is the same for every block.
				viewport: getSelectedBlockStyleState( gridClientId )?.viewport,
				stackedLayouts: getStackedGridLayouts( gridClientId ),
			};
		},
		[ gridClientId ]
	);
	const occupiedRects = useMemo( () => {
		// Use the placement shown in the selected viewport: the stack when
		// the grid is stacked on mobile, otherwise any viewport overrides.
		let layouts: GridStyleLayout[];
		if ( stackedLayouts ) {
			layouts = Object.values( stackedLayouts.children );
		} else {
			// The style attribute, and the viewport states in it, are objects
			// when set.
			const styles = Object.values( gridItemStyles ) as Array<
				GridBlockStyle | undefined
			>;
			layouts = styles.map( ( style ) => ( {
				...style?.layout,
				...( hasViewportBlockStyleState( { viewport } )
					? ( style?.[ viewport ] as GridBlockStyle | undefined )
							?.layout
					: undefined ),
			} ) );
		}
		const rects: GridRect[] = [];
		for ( const layout of layouts ) {
			const {
				columnStart,
				rowStart,
				columnSpan = 1,
				rowSpan = 1,
			} = layout;
			if ( ! columnStart || ! rowStart ) {
				continue;
			}
			rects.push(
				new GridRect( {
					columnStart,
					rowStart,
					columnSpan,
					rowSpan,
				} )
			);
		}
		return rects;
	}, [ gridItemStyles, viewport, stackedLayouts ] );

	return (
		<>
			{ range( 1, gridInfo.numRows ).map( ( row ) =>
				range( 1, gridInfo.numColumns ).map( ( column ) => {
					// Don't render visualizer cells for a selected child block
					// that is itself a grid, so that only the child's grid
					// visualizer is visible.
					const isChildGridCell = childGridRect?.contains(
						column,
						row
					);
					const isCellOccupied = occupiedRects.some( ( rect ) =>
						rect.contains( column, row )
					);
					return (
						<GridVisualizerCell
							key={ `${ row }-${ column }` }
							color={ gridInfo.currentColor }
							lineStyle={
								isChildGridCell ? 'none' : 'contrasting'
							}
						>
							{ ! isCellOccupied && ! isChildGridCell && (
								<GridVisualizerAppender
									column={ column }
									row={ row }
									gridClientId={ gridClientId }
									gridElement={ gridElement }
									gridInfo={ gridInfo }
								/>
							) }
						</GridVisualizerCell>
					);
				} )
			) }
			<GridVisualizerMarquee
				gridClientId={ gridClientId }
				gridElement={ gridElement }
				gridInfo={ gridInfo }
			/>
			<GridVisualizerDropLayer
				gridClientId={ gridClientId }
				gridElement={ gridElement }
				gridInfo={ gridInfo }
				setDropTarget={ setDropTarget }
			/>
			{ dropTarget && <GridDropIndicator dropTarget={ dropTarget } /> }
		</>
	);
}

/**
 * A cell of the grid visualizer.
 *
 * @param props
 * @param props.color     The grid's text color.
 * @param props.lineStyle Lines in the grid's text color, a square that stands out on any background while a block is dragged into the grid or cells are selected in it, or no lines.
 * @param props.children  The cell's content.
 */
function GridVisualizerCell( {
	color,
	lineStyle = 'color',
	children,
}: GridVisualizerCellProps ) {
	return (
		<div
			className={ clsx( 'block-editor-grid-visualizer__cell', {
				'has-contrasting-lines': lineStyle === 'contrasting',
			} ) }
			style={ {
				boxShadow:
					lineStyle === 'color'
						? `inset 0 0 0 1px color-mix(in srgb, ${ color } 20%, #0000)`
						: undefined,
				color,
			} }
		>
			{ children }
		</div>
	);
}

function getPixelRectStyle( rect: GridPixelRect ) {
	return {
		left: rect.left,
		top: rect.top,
		width: rect.right - rect.left,
		height: rect.bottom - rect.top,
	};
}

/**
 * Gets the block being dragged, if it can be placed in the grid's cells.
 *
 * Only single blocks are placed in cells. Other drags, and blocks that can't
 * be moved into the grid, leave the grid's drop layer inert, so they fall
 * through to the block flow's drop zones.
 *
 * @param selectors    Block editor store selectors.
 * @param gridClientId Client ID of the grid block.
 *
 * @return The client ID of the dragged block, or null.
 */
function getBlockToPlaceInGrid(
	selectors: CurriedSelectorsOf< typeof blockEditorStore >,
	gridClientId: string
): string | null {
	const {
		getDraggedBlockClientIds,
		getBlockParents,
		getBlockRootClientId,
		canMoveBlocks,
		canRemoveBlocks,
		canInsertBlocks,
	} = selectors;
	const clientIds = getDraggedBlockClientIds();
	if ( clientIds.length !== 1 ) {
		return null;
	}
	const [ clientId ] = clientIds;
	// A grid can't be dropped into itself or into a grid inside it.
	if (
		clientId === gridClientId ||
		getBlockParents( gridClientId ).includes( clientId )
	) {
		return null;
	}
	// The same checks as `moveBlocksToPosition`, so that a drop it would
	// refuse doesn't change the block's placement either.
	if ( ! canMoveBlocks( clientIds ) ) {
		return null;
	}
	if (
		getBlockRootClientId( clientId ) !== gridClientId &&
		( ! canRemoveBlocks( clientIds ) ||
			! canInsertBlocks( clientIds, gridClientId ) )
	) {
		return null;
	}
	return clientId;
}

/**
 * Whether blocks dragged from an inserter can all be inserted into the grid.
 *
 * @param selectors    Block editor store selectors.
 * @param blockNames   Names of the dragged blocks.
 * @param gridClientId Client ID of the grid block.
 *
 * @return Whether they can be dropped in the grid.
 */
function canInsertBlockNamesInGrid(
	selectors: InserterBlockSelectors,
	blockNames: string[],
	gridClientId: string
): boolean {
	return (
		blockNames.length > 0 &&
		blockNames.every( ( name ) =>
			selectors.canInsertBlockType( name, gridClientId )
		)
	);
}

/**
 * A drop zone covering the whole grid. While a block is dragged over it, it
 * works out which cells the block would land in, which other blocks those
 * cells overlap, and which alignment guides to show.
 *
 * @param props
 * @param props.gridClientId  Client ID of the grid block.
 * @param props.gridElement   The grid element in the canvas.
 * @param props.gridInfo      Grid info, from `getGridInfo`.
 * @param props.setDropTarget Called with the drop target, or null.
 */
function GridVisualizerDropLayer( {
	gridClientId,
	gridElement,
	gridInfo,
	setDropTarget,
}: GridVisualizerDropLayerProps ) {
	const layerRef = useRef< HTMLDivElement >( null );
	const lastTargetRef = useRef< GridDropTarget | null >( null );
	// Where the dragged block was grabbed, for the length of the drag.
	const grabRef = useRef< GridDragGrab | null >( null );
	// The grid measured when the drag started over it. Blocks don't move
	// until the drop, so it is measured again only when the grid resizes.
	const measurementsRef = useRef< {
		key: string;
		gridInfo: GridInfo;
		measurements: GridItemMeasurements;
	} | null >( null );
	const isDragging = useSelect(
		( select ) => select( blockEditorStore ).isDraggingBlocks(),
		[]
	);
	useEffect( () => {
		if ( ! isDragging ) {
			grabRef.current = null;
			measurementsRef.current = null;
		}
	}, [ isDragging ] );
	const blockEditorSelectors = useSelect( blockEditorStore );
	const { getBlockAttributes, getBlockOrder, getBlockRootClientId } =
		blockEditorSelectors;
	const {
		moveBlocksToPosition,
		insertBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const updateGridChildLayout = useUpdateGridChildLayout();
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	function clearDropTarget() {
		lastTargetRef.current = null;
		measurementsRef.current = null;
		setDropTarget( null );
	}

	function getMeasurements( srcClientId: string | null ) {
		// Blocks dragged from an inserter aren't in the grid.
		const key = srcClientId ?? 'inserter';
		const cached = measurementsRef.current;
		if ( cached?.key === key && cached.gridInfo === gridInfo ) {
			return cached.measurements;
		}
		const measurements = getGridItemMeasurements(
			gridElement,
			srcClientId
		);
		measurementsRef.current = { key, gridInfo, measurements };
		return measurements;
	}

	function getDraggedBlock() {
		return getBlockToPlaceInGrid( blockEditorSelectors, gridClientId );
	}

	/**
	 * Whether the drag is of blocks from an inserter, which haven't been
	 * inserted yet, that can all be inserted into the grid.
	 *
	 * @param event A drag event.
	 *
	 * @return Whether they can be dropped in the grid.
	 */
	function isInserterDragToGrid( event: DragEvent ) {
		return canInsertBlockNamesInGrid(
			blockEditorSelectors,
			getInserterDragBlockNames( event.dataTransfer ),
			gridClientId
		);
	}

	function updateDropTarget( event: DragEvent ) {
		const srcClientId = getDraggedBlock();
		const isInserterDrag = ! srcClientId && isInserterDragToGrid( event );
		const layer = layerRef.current;
		if ( ( ! srcClientId && ! isInserterDrag ) || ! layer ) {
			clearDropTarget();
			return;
		}

		const { columnTracks, rowTracks, siblings, src } =
			getMeasurements( srcClientId );
		if ( ! columnTracks.length || ! rowTracks.length ) {
			clearDropTarget();
			return;
		}
		const srcSpan = src?.rect ?? null;
		const srcPixelRect = src?.pixelRect ?? null;
		// Blocks from an inserter get the size of a block inserted into
		// the grid, as do blocks inserted any other way.
		const srcLayout = srcClientId
			? // The dragged block exists.
				(
					getBlockAttributes(
						srcClientId
					) as GridItemAttributes | null
				 )?.style?.layout
			: getInsertionSize( { columnTracks, rowTracks } );
		const columnSpan = srcSpan?.columnSpan ?? srcLayout?.columnSpan ?? 1;
		const rowSpan = srcSpan?.rowSpan ?? srcLayout?.rowSpan ?? 1;

		const layerRect = layer.getBoundingClientRect();
		const scale = layer.offsetWidth / layerRect.width || 1;
		const x = ( event.clientX - layerRect.left ) * scale;
		const y = ( event.clientY - layerRect.top ) * scale;

		// A block dragged by its body keeps the point it was grabbed at
		// under the pointer, which the first move over the grid finds inside
		// it. A block dragged by its handle, or from outside the grid, is
		// centered on the pointer.
		if ( grabRef.current?.srcClientId !== srcClientId ) {
			const isGrabbed =
				srcPixelRect &&
				x >= srcPixelRect.left &&
				x <= srcPixelRect.right &&
				y >= srcPixelRect.top &&
				y <= srcPixelRect.bottom;
			grabRef.current = {
				srcClientId,
				grab:
					isGrabbed && srcPixelRect
						? {
								grabX: x - srcPixelRect.left,
								grabY: y - srcPixelRect.top,
							}
						: {},
			};
		}

		// The block is measured by the area it takes up in the grid. Blocks
		// dragged in from elsewhere are the size of the cells they span, up
		// to the size of the grid.
		const landing = getGridDropTarget( {
			x,
			y,
			...grabRef.current.grab,
			columnTracks,
			rowTracks,
			columnSpan,
			rowSpan,
			width: srcPixelRect
				? srcPixelRect.right - srcPixelRect.left
				: undefined,
			height: srcPixelRect
				? srcPixelRect.bottom - srcPixelRect.top
				: undefined,
		} );

		const lastTarget = lastTargetRef.current;
		if (
			lastTarget?.srcClientId === srcClientId &&
			lastTarget.isInserterDrag === isInserterDrag &&
			lastTarget.landing.columnStart === landing.columnStart &&
			lastTarget.landing.rowStart === landing.rowStart &&
			lastTarget.landing.columnSpan === landing.columnSpan &&
			lastTarget.landing.rowSpan === landing.rowSpan
		) {
			return;
		}

		const landingPixelRect = getPixelRectFromGridRect(
			landing,
			columnTracks,
			rowTracks
		);
		if ( ! landingPixelRect ) {
			clearDropTarget();
			return;
		}

		const overlaps = siblings
			.filter( ( sibling ) => sibling.rect.intersectsRect( landing ) )
			.map( ( sibling ) =>
				getPixelRectFromGridRect(
					new GridRect( {
						columnStart: Math.max(
							sibling.rect.columnStart,
							landing.columnStart
						),
						columnEnd: Math.min(
							sibling.rect.columnEnd,
							landing.columnEnd
						),
						rowStart: Math.max(
							sibling.rect.rowStart,
							landing.rowStart
						),
						rowEnd: Math.min( sibling.rect.rowEnd, landing.rowEnd ),
					} ),
					columnTracks,
					rowTracks
				)
			)
			.filter( ( rect ): rect is GridPixelRect => !! rect );

		const guides = getAlignmentGuides( {
			target: landingPixelRect,
			siblings: siblings.map( ( sibling ) => sibling.pixelRect ),
			container: {
				left: 0,
				top: 0,
				right: columnTracks[ columnTracks.length - 1 ].end,
				bottom: rowTracks[ rowTracks.length - 1 ].end,
			},
		} );

		const target: GridDropTarget = {
			srcClientId,
			isInserterDrag,
			span: { columnSpan, rowSpan },
			landing,
			landingPixelRect,
			overlaps,
			guides,
		};
		lastTargetRef.current = target;
		setDropTarget( target );
	}

	/**
	 * Inserts blocks dragged from an inserter where they were dropped. The
	 * first block takes the landing cells, and any others, such as the rest
	 * of a pattern, go one after the other next to it.
	 *
	 * @param blocks  The dragged blocks.
	 * @param landing The cells the first block lands in.
	 */
	function insertInserterBlocks( blocks: Block[], landing: GridRect ) {
		const occupiedRects = getBlockOrder( gridClientId ).flatMap(
			( clientId ) => {
				const {
					columnStart,
					rowStart,
					columnSpan = 1,
					rowSpan = 1,
				} = (
					getBlockAttributes( clientId ) as GridItemAttributes | null
				 )?.style?.layout ?? {};
				return columnStart && rowStart
					? [
							new GridRect( {
								columnStart,
								rowStart,
								columnSpan,
								rowSpan,
							} ),
						]
					: [];
			}
		);
		let reference: GridRect | null = null;
		const rects = blocks.map( () => {
			const rect: GridRect = reference
				? getInsertedBlockRect( {
						placement: 'after',
						reference,
						size: {
							columnSpan: landing.columnSpan,
							rowSpan: landing.rowSpan,
						},
						columnCount: gridInfo.numColumns,
						rowCount: gridInfo.numRows,
						occupiedRects,
					} )
				: landing;
			occupiedRects.push( rect );
			reference = rect;
			return rect;
		} );
		const blocksToInsert = blocks.map( ( block ) => cloneBlock( block ) );
		insertBlocks(
			blocksToInsert,
			getNumberOfBlocksBeforeCell(
				landing.columnStart,
				landing.rowStart
			),
			gridClientId
		);
		blocksToInsert.forEach( ( block, index ) => {
			__unstableMarkNextChangeAsNotPersistent();
			updateGridChildLayout(
				block.clientId,
				( style, selectedState, gridAttributes ) =>
					// The style places the block, so it is set, with the
					// placement in its layout.
					getInsertedChildLayoutStyle(
						style,
						rects[ index ],
						selectedState,
						// Rows are added for blocks below the grid, instead
						// of moving them into it.
						{ ...gridAttributes?.layout, rowCount: undefined }
					) as GridBlockStyle,
				gridClientId
			);
		} );
	}

	const dropZoneRef = useDropZone( {
		onDragOver: updateDropTarget,
		onDragLeave: clearDropTarget,
		onDragEnd: clearDropTarget,
		onDrop( event: DragEvent ) {
			const target = lastTargetRef.current;
			clearDropTarget();
			if ( target?.isInserterDrag ) {
				// The blocks dragged from an inserter are in the drop's data.
				const { type, blocks } = parseDropEvent( event );
				if (
					type === 'inserter' &&
					blocks?.length &&
					canInsertBlockNamesInGrid(
						blockEditorSelectors,
						blocks.map( ( block ) => block.name ),
						gridClientId
					)
				) {
					insertInserterBlocks( blocks, target.landing );
				}
				return;
			}
			const srcClientId = getDraggedBlock();
			if (
				! target ||
				! srcClientId ||
				target.srcClientId !== srcClientId
			) {
				return;
			}
			const { landing, span } = target;
			const { columnStart, rowStart } = landing;
			// A block bigger than the grid is shrunk to fit, as shown by the
			// landing cells.
			const layout = {
				columnStart,
				rowStart,
				...( landing.columnSpan < span.columnSpan && {
					columnSpan: landing.columnSpan,
				} ),
				...( landing.rowSpan < span.rowSpan && {
					rowSpan: landing.rowSpan,
				} ),
			};
			// The grid is given to the updater because a block dropped in
			// from elsewhere isn't in it yet.
			updateGridChildLayout( srcClientId, layout, gridClientId );
			__unstableMarkNextChangeAsNotPersistent();
			moveBlocksToPosition(
				[ srcClientId ],
				getBlockRootClientId( srcClientId ),
				gridClientId,
				getNumberOfBlocksBeforeCell( columnStart, rowStart )
			);
		},
	} );

	return (
		<div
			ref={ useMergeRefs( [ layerRef, dropZoneRef ] ) }
			className="block-editor-grid-visualizer__drop-layer"
		/>
	);
}

function GridDropIndicator( { dropTarget }: GridDropIndicatorProps ) {
	const { landingPixelRect, overlaps, guides } = dropTarget;
	return (
		<div
			className="block-editor-grid-visualizer__drop-indicator"
			aria-hidden="true"
		>
			<div
				className="block-editor-grid-visualizer__landing"
				style={ getPixelRectStyle( landingPixelRect ) }
			/>
			{ overlaps.map( ( rect, index ) => (
				<div
					key={ `overlap-${ index }` }
					className="block-editor-grid-visualizer__overlap"
					style={ getPixelRectStyle( rect ) }
				/>
			) ) }
			{ guides.map( ( guide, index ) => (
				<div
					key={ `guide-${ index }` }
					className={ clsx(
						'block-editor-grid-visualizer__guide',
						`is-${ guide.orientation }`,
						`is-${ guide.kind }`
					) }
					style={
						guide.orientation === 'vertical'
							? {
									left: guide.position,
									top: guide.start,
									height: guide.end - guide.start,
								}
							: {
									top: guide.position,
									left: guide.start,
									width: guide.end - guide.start,
								}
					}
				>
					{ guide.kind === 'container-center' && (
						<span className="block-editor-grid-visualizer__guide-label">
							{ __( 'Center' ) }
						</span>
					) }
				</div>
			) ) }
		</div>
	);
}

/**
 * Calls back with a block's element once it has rendered in the canvas, for up
 * to a few frames after it was inserted.
 *
 * @param ownerDocument The canvas document.
 * @param clientId      The block's client ID.
 * @param callback      Called with the element.
 */
function whenBlockRenders(
	ownerDocument: Document,
	clientId: string,
	callback: ( element: HTMLElement ) => void
) {
	// The canvas document is rendered in a window.
	const defaultView = ownerDocument.defaultView!;
	let framesLeft = 10;
	function check() {
		const element = ownerDocument.querySelector< HTMLElement >(
			`[data-block="${ clientId }"]`
		);
		if ( element ) {
			callback( element );
		} else if ( --framesLeft > 0 ) {
			defaultView.requestAnimationFrame( check );
		}
	}
	defaultView.requestAnimationFrame( check );
}

function GridVisualizerAppender( {
	column,
	row,
	columnSpan = 1,
	rowSpan = 1,
	gridClientId,
	gridElement,
	gridInfo,
	isInitiallyOpen = false,
	onClose,
}: GridVisualizerAppenderProps ) {
	const appenderRef = useRef< HTMLButtonElement >( null );
	const { moveBlocksToPosition, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const updateGridChildLayout = useUpdateGridChildLayout();

	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	useEffect( () => {
		if ( isInitiallyOpen ) {
			appenderRef.current?.click();
		}
	}, [ isInitiallyOpen ] );

	return (
		<ButtonBlockAppender
			ref={ appenderRef }
			rootClientId={ gridClientId }
			className="block-editor-grid-visualizer__appender"
			// @ts-expect-error The appender ignores `style`.
			style={ {
				color: gridInfo.currentColor,
			} }
			onSelect={ ( block ) => {
				// Called with the inserted block, and with nothing when the
				// inserter closes.
				if ( ! block ) {
					onClose?.();
					return;
				}
				const drawnRect = new GridRect( {
					columnStart: column,
					rowStart: row,
					columnSpan,
					rowSpan,
				} );
				function getGrownRect() {
					return getMinimumInsertionRect( {
						rect: drawnRect,
						...getGridTrackPositions( gridElement ),
					} );
				}
				// The block was inserted.
				const insertedBlock = block;
				function placeBlock( rect: GridRect ) {
					updateGridChildLayout(
						insertedBlock.clientId,
						( style, selectedState, gridAttributes ) =>
							// The style places the block, so it is set, with
							// the placement in its layout.
							getInsertedChildLayoutStyle(
								style,
								rect,
								selectedState,
								gridAttributes?.layout
							) as GridBlockStyle,
						gridClientId
					);
					__unstableMarkNextChangeAsNotPersistent();
					moveBlocksToPosition(
						[ insertedBlock.clientId ],
						gridClientId,
						gridClientId,
						getNumberOfBlocksBeforeCell(
							rect.columnStart,
							rect.rowStart
						)
					);
				}
				// A single cell can be too small for a block's placeholder,
				// so a block inserted into one gets more cells, even if that
				// covers other blocks. A drawn area is the size that was
				// asked for. It only grows if the block shows a placeholder
				// once it renders, and the area is too small for it.
				const isSingleCell = columnSpan === 1 && rowSpan === 1;
				placeBlock( isSingleCell ? getGrownRect() : drawnRect );
				if ( ! isSingleCell ) {
					whenBlockRenders(
						gridElement.ownerDocument,
						block.clientId,
						( blockElement ) => {
							if (
								! blockElement.querySelector(
									'.components-placeholder'
								)
							) {
								return;
							}
							const grownRect = getGrownRect();
							if (
								grownRect.columnStart !==
									drawnRect.columnStart ||
								grownRect.rowStart !== drawnRect.rowStart ||
								grownRect.columnEnd !== drawnRect.columnEnd ||
								grownRect.rowEnd !== drawnRect.rowEnd
							) {
								// Not an undo step of its own.
								__unstableMarkNextChangeAsNotPersistent();
								placeBlock( grownRect );
							}
						}
					);
				}
				onClose?.();
			} }
		/>
	);
}

/**
 * Lets a rectangle of cells be selected by pressing on an empty cell and
 * dragging across the grid. On release, an inserter opens, and the block
 * inserted covers the selected cells. A press without a drag opens the
 * inserter for the one cell, as before.
 *
 * @param props
 * @param props.gridClientId Client ID of the grid block.
 * @param props.gridElement  The grid element in the canvas.
 * @param props.gridInfo     Grid info, from `getGridInfo`.
 */
function GridVisualizerMarquee( {
	gridClientId,
	gridElement,
	gridInfo,
}: GridVisualizerMarqueeProps ) {
	const anchorRef = useRef< HTMLDivElement >( null );
	const [ marquee, setMarquee ] = useState< GridMarquee | null >( null );

	useEffect( () => {
		// The visualizer grid that the cells are drawn in.
		const container = anchorRef.current?.parentElement;
		if ( ! container ) {
			return;
		}
		// The visualizer is rendered in a window.
		const ownerWindow = container.ownerDocument.defaultView!;
		// Escape is pressed in the canvas or in the editor, wherever the
		// focus is.
		const keyDocuments = new Set( [
			container.ownerDocument,
			gridElement.ownerDocument,
		] );
		let drag: GridMarqueeDrag | null = null;
		let shouldIgnoreClick = false;
		let ignoreClickTimeout: number | undefined;
		// A touch opens a cell's inserter in two taps: the first one shows
		// the cell, and a second tap on the same cell opens its inserter.
		let isTouchPress = false;
		let tappedCell: HTMLElement | null = null;

		function clearTappedCell() {
			if ( tappedCell ) {
				delete tappedCell.dataset.isTapped;
				tappedCell = null;
			}
		}

		function getCell( event: PointerEvent ) {
			const { columnTracks, rowTracks } =
				getGridTrackPositions( gridElement );
			if ( ! columnTracks.length || ! rowTracks.length ) {
				return null;
			}
			// `container` is set when the effect starts.
			const rect = container!.getBoundingClientRect();
			const scale = container!.offsetWidth / rect.width || 1;
			return getGridDropTarget( {
				x: ( event.clientX - rect.left ) * scale,
				y: ( event.clientY - rect.top ) * scale,
				columnTracks,
				rowTracks,
			} );
		}

		function onPointerDown( event: PointerEvent ) {
			// Pointer events can target any node, which `closest` and
			// `contains` are optional for.
			const target = event.target as Element | null;
			shouldIgnoreClick = false;
			isTouchPress = event.pointerType === 'touch';
			if ( tappedCell && ! tappedCell.contains( target ) ) {
				clearTappedCell();
			}
			// Drawing is for a mouse or a pen. A touch on a cell scrolls the
			// page, or shows the cell when it is a tap (see `onClick`).
			if (
				event.pointerType === 'touch' ||
				event.button !== 0 ||
				! target?.closest?.(
					'.block-editor-grid-visualizer__cell .block-editor-grid-visualizer__appender'
				)
			) {
				return;
			}
			const cell = getCell( event );
			if ( ! cell ) {
				return;
			}
			drag = { pointerId: event.pointerId, start: cell, isMoving: false };
			// Keeps the drag going over the canvas iframe.
			target.setPointerCapture( event.pointerId );
		}

		function onPointerMove( event: PointerEvent ) {
			// When a pointer is pressed while the browser thinks one of its
			// buttons is already down, the press comes as a move with the
			// button that changed, and not as a `pointerdown`. WebKit does
			// that for the first press after a drag that started outside
			// the canvas, such as from a drag handle.
			if ( ! drag && event.button === 0 && event.buttons === 1 ) {
				onPointerDown( event );
				return;
			}
			if (
				! drag ||
				drag.isCancelled ||
				event.pointerId !== drag.pointerId
			) {
				return;
			}
			const cell = getCell( event );
			if ( ! cell ) {
				return;
			}
			const { start } = drag;
			if (
				! drag.isMoving &&
				cell.columnStart === start.columnStart &&
				cell.rowStart === start.rowStart
			) {
				return;
			}
			if ( ! drag.isMoving ) {
				// Only one inserter is open at a time. A cell's inserter
				// stays open when the drag starts on its own toggle, as
				// the focus doesn't leave it, and the click that would
				// close it is ignored, so it is closed as drawing starts.
				// `container` is set when the effect starts.
				for ( const openAppender of container!.querySelectorAll< HTMLElement >(
					'.block-editor-grid-visualizer__cell .block-editor-grid-visualizer__appender[aria-expanded="true"]'
				) ) {
					openAppender.click();
				}
			}
			drag.isMoving = true;
			setMarquee( {
				rect: getBoundingGridRect( start, cell ),
				isInserting: false,
			} );
		}

		function onPointerUp( event: PointerEvent ) {
			if ( ! drag || event.pointerId !== drag.pointerId ) {
				return;
			}
			if ( drag.isMoving || drag.isCancelled ) {
				// The press started on a cell's own appender, which would
				// open on the click that follows. That click is part of the
				// same press, so it comes before the timeout.
				shouldIgnoreClick = true;
				ownerWindow.clearTimeout( ignoreClickTimeout );
				ignoreClickTimeout = ownerWindow.setTimeout( () => {
					shouldIgnoreClick = false;
				} );
			}
			if ( drag.isMoving && ! drag.isCancelled ) {
				setMarquee( ( current ) =>
					current ? { ...current, isInserting: true } : current
				);
			}
			drag = null;
		}

		function cancelDrag() {
			drag = null;
			setMarquee( null );
		}

		function onLostPointerCapture( event: PointerEvent ) {
			// Capture is also lost after `pointerup`, once the drag is over.
			if ( drag && event.pointerId === drag.pointerId ) {
				cancelDrag();
			}
		}

		function onKeyDown( event: KeyboardEvent ) {
			// A key that opens the inserter isn't a tap.
			isTouchPress = false;
			if ( drag && ! drag.isCancelled && event.key === 'Escape' ) {
				event.preventDefault();
				event.stopPropagation();
				// The press goes on until the pointer is released, so that
				// releasing it doesn't open the inserter.
				drag.isCancelled = true;
				setMarquee( null );
			}
		}

		function onClick( event: MouseEvent ) {
			// Clicks can target any node, which `closest` is optional for.
			const target = event.target as Element | null;
			if (
				shouldIgnoreClick &&
				! target?.closest?.( '.block-editor-grid-visualizer__marquee' )
			) {
				shouldIgnoreClick = false;
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			const appender = target?.closest?.(
				'.block-editor-grid-visualizer__cell .block-editor-grid-visualizer__appender'
			);
			// A tap on an open inserter's toggle closes it.
			if (
				! isTouchPress ||
				! appender ||
				appender.getAttribute( 'aria-expanded' ) === 'true'
			) {
				return;
			}
			const cell = appender.closest< HTMLElement >(
				'.block-editor-grid-visualizer__cell'
			);
			if ( cell === tappedCell ) {
				clearTappedCell();
				return;
			}
			clearTappedCell();
			tappedCell = cell;
			// The appender is inside a cell.
			tappedCell!.dataset.isTapped = 'true';
			event.preventDefault();
			event.stopPropagation();
		}

		container.addEventListener( 'pointerdown', onPointerDown );
		container.addEventListener( 'pointermove', onPointerMove );
		container.addEventListener( 'pointerup', onPointerUp );
		container.addEventListener( 'pointercancel', cancelDrag );
		container.addEventListener(
			'lostpointercapture',
			onLostPointerCapture
		);
		container.addEventListener( 'click', onClick, true );
		for ( const keyDocument of keyDocuments ) {
			keyDocument.addEventListener( 'keydown', onKeyDown, true );
		}
		return () => {
			container.removeEventListener( 'pointerdown', onPointerDown );
			container.removeEventListener( 'pointermove', onPointerMove );
			container.removeEventListener( 'pointerup', onPointerUp );
			container.removeEventListener( 'pointercancel', cancelDrag );
			container.removeEventListener(
				'lostpointercapture',
				onLostPointerCapture
			);
			container.removeEventListener( 'click', onClick, true );
			for ( const keyDocument of keyDocuments ) {
				keyDocument.removeEventListener( 'keydown', onKeyDown, true );
			}
			ownerWindow.clearTimeout( ignoreClickTimeout );
			clearTappedCell();
		};
	}, [ gridElement ] );

	return (
		<>
			<div ref={ anchorRef } hidden />
			{ marquee && (
				<div
					className="block-editor-grid-visualizer__marquee"
					style={ {
						gridColumn: `${ marquee.rect.columnStart } / ${
							marquee.rect.columnEnd + 1
						}`,
						gridRow: `${ marquee.rect.rowStart } / ${
							marquee.rect.rowEnd + 1
						}`,
					} }
				>
					{ marquee.isInserting && (
						<GridVisualizerAppender
							column={ marquee.rect.columnStart }
							row={ marquee.rect.rowStart }
							columnSpan={ marquee.rect.columnSpan }
							rowSpan={ marquee.rect.rowSpan }
							gridClientId={ gridClientId }
							gridElement={ gridElement }
							gridInfo={ gridInfo }
							isInitiallyOpen
							onClose={ () => setMarquee( null ) }
						/>
					) }
				</div>
			) }
		</>
	);
}
