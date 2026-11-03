import clsx from 'clsx';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import type { ForwardedRef } from 'react';
import type { Block } from '@wordpress/blocks';
import {
	useState,
	useEffect,
	useRef,
	forwardRef,
	memo,
	useMemo,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import type { CurriedSelectorsOf } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import {
	__experimentalUseDropZone as useDropZone,
	useEvent,
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
	getGridItemMeasurements,
	getGridRectFromPixelRect,
	getComputedCSS,
	getGridTracks,
	getInserterDragBlockNames,
} from './utils';
import { getRotatedBoundingRect } from '../../utils/rotation';
import { useInserterDragBlockNames } from './use-inserter-drag-block-names';
import { parseDropEvent } from '../use-on-block-drop';
import {
	getFreeGridDropTarget,
	getGrabPoint,
	getGridDropTarget,
	getPixelRectFromGridRect,
} from './get-grid-drop-target';
import { getGridPlacementFromPixelRect } from './free-placement';
import type { GridPlacement } from './free-placement';
import {
	isGridItemHandleDrag,
	subscribeToGridItemPointerDrag,
} from './start-grid-item-drag';
import type { GridItemPointerDragEvent } from './start-grid-item-drag';
import { getAlignmentGuides } from './get-alignment-guides';
import type { GridBlockStyle } from './mobile-stacking';
import { getInsertedChildLayoutStyle } from './get-inserted-child-layout-style';
import { getGridCellTilesImage } from './get-grid-cell-tiles-image';
import {
	getInsertedBlockRect,
	getInsertionSize,
} from './get-inserted-block-rect';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import { useStyleOverride } from '../../hooks/utils';
import { useUpdateGridChildLayout } from './use-update-grid-child-layout';
import type {
	AutoGridVisualizerProps,
	GridDragGrab,
	GridDropIndicatorProps,
	GridDropLayerMove,
	GridDropTarget,
	GridCellTilesOptions,
	GridInfo,
	GridItemAttributes,
	GridItemMeasurements,
	GridPixelRect,
	GridVisualizerCellProps,
	GridVisualizerDropLayerProps,
	GridVisualizerGridProps,
	GridVisualizerProps,
	InserterBlockSelectors,
	ManualGridVisualizerProps,
} from './types';

function GridVisualizerPure( {
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

// Memoized, as it does work for every cell and grid item on each render,
// while the grid item tools around it re-render often, for example for each
// degree of a rotation preview.
export const GridVisualizer = memo( GridVisualizerPure );

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
		const isDroppingAllowed = useSelect(
			( select ) => {
				const selectors = select( blockEditorStore );
				if ( selectors.isDraggingBlocks() ) {
					return !! getBlockToPlaceInGrid( selectors, gridClientId );
				}
				return canInsertBlockNamesInGrid(
					selectors,
					inserterBlockNames,
					gridClientId
				);
			},
			[ gridClientId, inserterBlockNames ]
		);

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
					className="block-editor-grid-visualizer__grid"
					style={ gridInfo.style }
				>
					{ isManualGrid ? (
						<ManualGridVisualizer
							gridClientId={ gridClientId }
							gridElement={ gridElement }
							gridInfo={ gridInfo }
							isDroppingAllowed={ isDroppingAllowed }
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
	isDroppingAllowed,
}: ManualGridVisualizerProps ) {
	useGridCellTiles( {
		gridClientId,
		gridElement,
		gridInfo,
		isShown: isDroppingAllowed,
	} );

	return (
		<GridVisualizerDropLayer
			gridClientId={ gridClientId }
			gridElement={ gridElement }
			gridInfo={ gridInfo }
		/>
	);
}

/**
 * Shows the cells of a manual grid while a block that can land in it is
 * dragged. The cells are drawn in the canvas, behind the grid's blocks, rather
 * than over them in the visualizer.
 *
 * @param options
 * @param options.gridClientId Client ID of the grid block.
 * @param options.gridElement  The grid element in the canvas.
 * @param options.gridInfo     Grid info, from `getGridInfo`, so that the cells are drawn again when the grid changes size.
 * @param options.isShown      Whether the cells are shown.
 */
function useGridCellTiles( {
	gridClientId,
	gridElement,
	gridInfo,
	isShown,
}: GridCellTilesOptions ) {
	const css = useMemo( () => {
		if ( ! isShown ) {
			return '';
		}
		// The tracks shown in the visualizer, which are measured again when
		// the grid changes size. `getGridInfo()` sets both templates from
		// the grid's computed style.
		const columnTracks = getGridTracks(
			String( gridInfo.style.gridTemplateColumns ?? '' ),
			parseFloat( getComputedCSS( gridElement, 'column-gap' ) ) || 0
		);
		const rowTracks = getGridTracks(
			String( gridInfo.style.gridTemplateRows ?? '' ),
			parseFloat( getComputedCSS( gridElement, 'row-gap' ) ) || 0
		);
		if ( ! columnTracks.length || ! rowTracks.length ) {
			return '';
		}
		const image = encodeURIComponent(
			getGridCellTilesImage( columnTracks, rowTracks )
		);
		const selector = `[data-block="${ gridClientId }"]`;
		// The tiles are placed in the grid's content box, where its tracks
		// are measured from. A grid that is already positioned, such as a
		// sticky one, keeps its position.
		const position = getComputedCSS( gridElement, 'position' );
		const isPositioned = position !== 'static' && position !== 'relative';
		return `
			${ selector } {
				${ isPositioned ? '' : 'position: relative;' }
				isolation: isolate;
			}
			${ selector }::before {
				content: "";
				position: absolute;
				top: ${ getComputedCSS( gridElement, 'padding-top' ) };
				left: ${ getComputedCSS( gridElement, 'padding-left' ) };
				width: ${ columnTracks[ columnTracks.length - 1 ].end }px;
				height: ${ rowTracks[ rowTracks.length - 1 ].end }px;
				z-index: -1;
				background: url("data:image/svg+xml,${ image }") no-repeat;
				pointer-events: none;
			}
			@media not (prefers-reduced-motion) {
				${ selector }::before {
					animation: block-editor-grid-cell-tiles-appear 0.16s cubic-bezier(0.2, 0, 0, 1) both;
				}
			}
			@keyframes block-editor-grid-cell-tiles-appear {
				from { opacity: 0; }
			}
		`;
	}, [ isShown, gridClientId, gridElement, gridInfo ] );
	useStyleOverride( { css } );
}

/**
 * A cell of the grid visualizer.
 *
 * @param props
 * @param props.color The color of the cell's lines.
 */
function GridVisualizerCell( { color }: GridVisualizerCellProps ) {
	return (
		<div
			className="block-editor-grid-visualizer__cell"
			style={ {
				boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${ color } 20%, #0000)`,
				color,
			} }
		/>
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
 * Moves an element to a rectangle in pixels, as `getPixelRectStyle` places it
 * when it renders.
 *
 * @param element The element.
 * @param rect    The rectangle.
 */
function setPixelRectStyle( element: HTMLElement, rect: GridPixelRect ) {
	const { left, top, width, height } = getPixelRectStyle( rect );
	element.style.left = `${ left }px`;
	element.style.top = `${ top }px`;
	element.style.width = `${ width }px`;
	element.style.height = `${ height }px`;
}

/**
 * Whether two drop targets show the same cells, overlaps and guides, so that
 * only the landing preview's position differs between them.
 *
 * @param a A drop target.
 * @param b Another drop target.
 *
 * @return Whether they only differ in where the block lands in its cells.
 */
function isSameDropTargetCells( a: GridDropTarget, b: GridDropTarget ) {
	return (
		a.srcClientId === b.srcClientId &&
		a.isInserterDrag === b.isInserterDrag &&
		fastDeepEqual( a.landing, b.landing ) &&
		fastDeepEqual( a.overlaps, b.overlaps ) &&
		fastDeepEqual( a.guides, b.guides )
	);
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
 * The pointer is followed once per animation frame. A block placed freely
 * lands somewhere new on almost every move, so while its cells, overlaps and
 * guides stay the same, only the landing preview is moved, without
 * rendering.
 *
 * @param props
 * @param props.gridClientId Client ID of the grid block.
 * @param props.gridElement  The grid element in the canvas.
 * @param props.gridInfo     Grid info, from `getGridInfo`.
 */
function GridVisualizerDropLayer( {
	gridClientId,
	gridElement,
	gridInfo,
}: GridVisualizerDropLayerProps ) {
	const layerRef = useRef< HTMLDivElement >( null );
	const landingRef = useRef< HTMLDivElement >( null );
	const [ dropTarget, setDropTarget ] = useState< GridDropTarget | null >(
		null
	);
	const lastTargetRef = useRef< GridDropTarget | null >( null );
	// The latest move over the grid, handled in the next animation frame.
	const pendingMoveRef = useRef< GridDropLayerMove | null >( null );
	const frameRef = useRef< number | null >( null );
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

	function cancelPendingMove() {
		pendingMoveRef.current = null;
		if ( frameRef.current !== null ) {
			window.cancelAnimationFrame( frameRef.current );
			frameRef.current = null;
		}
	}

	function clearDropTarget() {
		cancelPendingMove();
		lastTargetRef.current = null;
		measurementsRef.current = null;
		setDropTarget( null );
	}

	/**
	 * Handles a move over the grid in the next animation frame, where the
	 * layout read for it doesn't follow a write. Later moves in the same
	 * frame replace it.
	 *
	 * @param move The move.
	 */
	function scheduleMove( move: GridDropLayerMove ) {
		// The first move over the grid finds where the block was grabbed, so
		// it can't wait for the pointer to move on.
		if ( grabRef.current?.srcClientId !== move.srcClientId ) {
			cancelPendingMove();
			updateDropTarget( move );
			return;
		}
		pendingMoveRef.current = move;
		if ( frameRef.current === null ) {
			frameRef.current = window.requestAnimationFrame( flushPendingMove );
		}
	}

	/**
	 * Handles the move waiting for an animation frame now, so that a drop
	 * lands where the pointer last was.
	 */
	function flushPendingMove() {
		const move = pendingMoveRef.current;
		cancelPendingMove();
		if ( move ) {
			updateDropTarget( move );
		}
	}

	useEffect( () => cancelPendingMove, [] );

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
	 * Gets a move over the grid from a drag event, or a touch drag's position.
	 * The drag's data can only be read while its event is handled, so what
	 * it says is read here.
	 *
	 * @param event        A drag event, or a touch drag's position.
	 * @param isHandleDrag Whether the block is dragged by a drag handle.
	 *
	 * @return The move.
	 */
	function getMove(
		// A touch drag has no modifier keys and no drag data.
		event: Pick< DragEvent, 'clientX' | 'clientY' > &
			Partial< Pick< DragEvent, 'shiftKey' | 'dataTransfer' > >,
		isHandleDrag: boolean
	): GridDropLayerMove {
		const srcClientId = getDraggedBlock();
		return {
			clientX: event.clientX,
			clientY: event.clientY,
			shiftKey: !! event.shiftKey,
			isHandleDrag,
			srcClientId,
			isInserterDrag: ! srcClientId && isInserterDragToGrid( event ),
		};
	}

	/**
	 * Whether the drag is of blocks from an inserter, which haven't been
	 * inserted yet, that can all be inserted into the grid.
	 *
	 * @param event              A drag event, or a touch drag's position.
	 * @param event.dataTransfer The drag's data, which a touch drag doesn't have.
	 *
	 * @return Whether they can be dropped in the grid.
	 */
	function isInserterDragToGrid( event: {
		dataTransfer?: DragEvent[ 'dataTransfer' ];
	} ) {
		return canInsertBlockNamesInGrid(
			blockEditorSelectors,
			getInserterDragBlockNames( event.dataTransfer ),
			gridClientId
		);
	}

	function updateDropTarget( {
		clientX,
		clientY,
		shiftKey,
		isHandleDrag,
		srcClientId,
		isInserterDrag,
	}: GridDropLayerMove ) {
		const layer = layerRef.current;
		if ( ( ! srcClientId && ! isInserterDrag ) || ! layer ) {
			clearDropTarget();
			return;
		}

		const { columnTracks, rowTracks, siblings, src, hasFixedCells } =
			getMeasurements( srcClientId );
		if ( ! columnTracks.length || ! rowTracks.length ) {
			clearDropTarget();
			return;
		}
		const srcSpan = src?.rect ?? null;
		const srcPixelRect = src?.pixelRect ?? null;
		const srcAngle = src?.angle ?? 0;
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
		const x = ( clientX - layerRect.left ) * scale;
		const y = ( clientY - layerRect.top ) * scale;

		// The first move over the grid finds where the block was grabbed.
		if ( grabRef.current?.srcClientId !== srcClientId ) {
			grabRef.current = {
				srcClientId,
				grab: getGrabPoint( {
					x,
					y,
					pixelRect: srcPixelRect,
					isHandleDrag,
				} ),
			};
		}

		// The block is measured by the area it takes up in the grid, without
		// its rotation, so a rotated block lands by the cells it takes up.
		// Blocks dragged in from elsewhere are the size of the cells they
		// span, up to the size of the grid.
		const dropTargetOptions = {
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
		};
		// Where the grid's cells have a fixed size, a block lands exactly
		// where it is let go, and Shift snaps its corner to the grid lines.
		// Touch drags have no Shift, so they are always free.
		const freeTarget = hasFixedCells
			? getFreeGridDropTarget( {
					...dropTargetOptions,
					angle: srcAngle,
					snap: shiftKey,
				} )
			: null;
		const placement = freeTarget?.placement ?? null;
		const landing = placement
			? new GridRect( placement )
			: getGridDropTarget( dropTargetOptions );

		const lastTarget = lastTargetRef.current;
		if (
			lastTarget?.srcClientId === srcClientId &&
			lastTarget.isInserterDrag === isInserterDrag &&
			lastTarget.landing.columnStart === landing.columnStart &&
			lastTarget.landing.rowStart === landing.rowStart &&
			lastTarget.landing.columnSpan === landing.columnSpan &&
			lastTarget.landing.rowSpan === landing.rowSpan &&
			fastDeepEqual( lastTarget.placement, placement )
		) {
			return;
		}

		const landingCellsPixelRect = getPixelRectFromGridRect(
			landing,
			columnTracks,
			rowTracks
		);
		if ( ! landingCellsPixelRect ) {
			clearDropTarget();
			return;
		}

		// The block lands by its cells, but the cells shown are the ones it
		// reaches with its rotation, around the same center. A block placed
		// freely shows exactly where it lands, with its rotation, and its
		// footprint is the cells that contain that.
		let footprint = landing;
		let landingPixelRect = landingCellsPixelRect;
		if ( freeTarget ) {
			landingPixelRect = getRotatedBoundingRect(
				freeTarget.pixelRect,
				srcAngle
			);
			footprint = new GridRect(
				getGridPlacementFromPixelRect(
					landingPixelRect,
					columnTracks,
					rowTracks
				)
			);
		} else if ( srcAngle ) {
			footprint = getGridRectFromPixelRect(
				getRotatedBoundingRect( landingCellsPixelRect, srcAngle ),
				columnTracks,
				rowTracks
			);
			// The footprint is snapped to the grid's tracks, so it is inside
			// them.
			landingPixelRect =
				getPixelRectFromGridRect(
					footprint,
					columnTracks,
					rowTracks
				) ?? landingCellsPixelRect;
		}

		const overlaps = siblings
			.filter( ( sibling ) => sibling.rect.intersectsRect( footprint ) )
			.map( ( sibling ) =>
				getPixelRectFromGridRect(
					new GridRect( {
						columnStart: Math.max(
							sibling.rect.columnStart,
							footprint.columnStart
						),
						columnEnd: Math.min(
							sibling.rect.columnEnd,
							footprint.columnEnd
						),
						rowStart: Math.max(
							sibling.rect.rowStart,
							footprint.rowStart
						),
						rowEnd: Math.min(
							sibling.rect.rowEnd,
							footprint.rowEnd
						),
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
			placement,
			landingPixelRect,
			overlaps,
			guides,
		};
		lastTargetRef.current = target;
		// The drop uses the latest target, but only a change to what is shown
		// besides the preview's position needs a render.
		if (
			lastTarget &&
			landingRef.current &&
			isSameDropTargetCells( lastTarget, target )
		) {
			setPixelRectStyle( landingRef.current, landingPixelRect );
			return;
		}
		setDropTarget( target );
	}

	/**
	 * Drops the dragged blocks on the drop target.
	 *
	 * @param event The `drop` event, which a touch drag from a drag handle
	 *              doesn't have.
	 */
	function dropOnTarget( event?: DragEvent ) {
		flushPendingMove();
		const target = lastTargetRef.current;
		clearDropTarget();
		if ( target?.isInserterDrag ) {
			// The blocks dragged from an inserter are in the drop's data.
			const { type, blocks } = event
				? parseDropEvent( event )
				: { type: null, blocks: null };
			if (
				type === 'inserter' &&
				blocks?.length &&
				canInsertBlockNamesInGrid(
					blockEditorSelectors,
					blocks.map( ( block ) => block.name ),
					gridClientId
				)
			) {
				insertInserterBlocks(
					blocks,
					target.landing,
					target.placement
				);
			}
			return;
		}
		const srcClientId = getDraggedBlock();
		if ( ! target || ! srcClientId || target.srcClientId !== srcClientId ) {
			return;
		}
		const { landing, span, placement } = target;
		const { columnStart, rowStart } = landing;
		// A block placed freely gets its whole place, and loses any box it
		// had when it fills its cells. Otherwise a block bigger than the grid
		// is shrunk to fit, as shown by the landing cells.
		const layout = placement
			? { ...placement, box: placement.box }
			: {
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
	}

	/**
	 * Inserts blocks dragged from an inserter where they were dropped. The
	 * first block takes the landing cells, or its exact place when it was
	 * placed freely, and any others, such as the rest of a pattern, go one
	 * after the other next to it.
	 *
	 * @param blocks    The dragged blocks.
	 * @param landing   The cells the first block lands in.
	 * @param placement The first block's place, when placed freely.
	 */
	function insertInserterBlocks(
		blocks: Block[],
		landing: GridRect,
		placement: GridPlacement | null
	) {
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
			if ( index === 0 && placement ) {
				updateGridChildLayout(
					block.clientId,
					{ ...placement, box: placement.box },
					gridClientId
				);
				return;
			}
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
		onDragOver: ( event ) =>
			scheduleMove( getMove( event, isGridItemHandleDrag( event ) ) ),
		onDragLeave: clearDropTarget,
		onDragEnd: clearDropTarget,
		onDrop: dropOnTarget,
	} );

	// A touch drag from a drag handle doesn't use the browser's drag and
	// drop, so it is followed here. The layer of the innermost grid under the
	// touch takes it, as a drop zone would.
	const onPointerDrag = useEvent(
		( { type, clientX, clientY, dropLayer }: GridItemPointerDragEvent ) => {
			const isOverLayer =
				!! layerRef.current && dropLayer === layerRef.current;
			if ( type === 'move' && isOverLayer ) {
				scheduleMove( getMove( { clientX, clientY }, true ) );
			} else if ( type === 'drop' && isOverLayer ) {
				dropOnTarget();
			} else {
				clearDropTarget();
			}
		}
	);
	useEffect(
		() => subscribeToGridItemPointerDrag( onPointerDrag ),
		[ onPointerDrag ]
	);

	return (
		<>
			<div
				ref={ useMergeRefs( [ layerRef, dropZoneRef ] ) }
				className="block-editor-grid-visualizer__drop-layer"
			/>
			{ dropTarget && (
				<GridDropIndicator
					dropTarget={ dropTarget }
					landingRef={ landingRef }
				/>
			) }
		</>
	);
}

function GridDropIndicator( {
	dropTarget,
	landingRef,
}: GridDropIndicatorProps ) {
	const { landingPixelRect, overlaps, guides } = dropTarget;
	return (
		<div
			className="block-editor-grid-visualizer__drop-indicator"
			aria-hidden="true"
		>
			<div
				ref={ landingRef }
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
