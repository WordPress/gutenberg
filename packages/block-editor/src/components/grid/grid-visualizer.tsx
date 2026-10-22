import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useMemo,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import type { CurriedSelectorsOf } from '@wordpress/data';
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
	getGridItemMeasurements,
} from './utils';
import {
	getGridDropTarget,
	getPixelRectFromGridRect,
} from './get-grid-drop-target';
import { getAlignmentGuides } from './get-alignment-guides';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import ButtonBlockAppender from '../button-block-appender';
import { unlock } from '../../lock-unlock';
import { getUpdatedChildLayoutStyle } from '../../hooks/block-style-state';
import type { ChildLayoutBlockStyle } from '../../hooks/types';
import type {
	AutoGridVisualizerProps,
	GridDragGrab,
	GridDropIndicatorProps,
	GridDropTarget,
	GridInfo,
	GridItemAttributes,
	GridItemMeasurements,
	GridPixelRect,
	GridVisualizerCellProps,
	GridVisualizerCellPosition,
	GridVisualizerDropLayerProps,
	GridVisualizerGridProps,
	GridVisualizerProps,
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
		const isDroppingAllowed = useSelect(
			( select ) =>
				select( blockEditorStore ).isDraggingBlocks() &&
				!! getBlockToPlaceInGrid(
					select( blockEditorStore ),
					gridClientId
				),
			[ gridClientId ]
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

	const gridItemStyles = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockStyles } = unlock(
				select( blockEditorStore )
			);
			const blockOrder = getBlockOrder( gridClientId );
			return getBlockStyles( blockOrder );
		},
		[ gridClientId ]
	);
	const occupiedRects = useMemo( () => {
		const rects: GridRect[] = [];
		for ( const style of Object.values( gridItemStyles ) ) {
			const {
				columnStart,
				rowStart,
				columnSpan = 1,
				rowSpan = 1,
				// The style attribute is an object when set.
			} = ( style as GridItemAttributes[ 'style' ] )?.layout ?? {};
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
	}, [ gridItemStyles ] );

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
									gridInfo={ gridInfo }
								/>
							) }
						</GridVisualizerCell>
					);
				} )
			) }
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
 * @param props.lineStyle Lines in the grid's text color, a square that stands out on any background while a block is dragged into the grid, or no lines.
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
		srcClientId: string;
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
	const {
		getBlockAttributes,
		getBlockRootClientId,
		getSelectedBlockStyleState,
	} = blockEditorSelectors;
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	function clearDropTarget() {
		lastTargetRef.current = null;
		measurementsRef.current = null;
		setDropTarget( null );
	}

	function getMeasurements( srcClientId: string ) {
		const cached = measurementsRef.current;
		if (
			cached?.srcClientId === srcClientId &&
			cached.gridInfo === gridInfo
		) {
			return cached.measurements;
		}
		const measurements = getGridItemMeasurements(
			gridElement,
			srcClientId
		);
		measurementsRef.current = { srcClientId, gridInfo, measurements };
		return measurements;
	}

	function getDraggedBlock() {
		return getBlockToPlaceInGrid( blockEditorSelectors, gridClientId );
	}

	function updateDropTarget( event: DragEvent ) {
		const srcClientId = getDraggedBlock();
		const layer = layerRef.current;
		if ( ! srcClientId || ! layer ) {
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
		// The dragged block exists.
		const srcLayout = (
			getBlockAttributes( srcClientId ) as GridItemAttributes | null
		 )?.style?.layout;
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
			span: { columnSpan, rowSpan },
			landing,
			landingPixelRect,
			overlaps,
			guides,
		};
		lastTargetRef.current = target;
		setDropTarget( target );
	}

	const dropZoneRef = useDropZone( {
		onDragOver: updateDropTarget,
		onDragLeave: clearDropTarget,
		onDragEnd: clearDropTarget,
		onDrop() {
			const target = lastTargetRef.current;
			clearDropTarget();
			const srcClientId = getDraggedBlock();
			if ( ! target || target.srcClientId !== srcClientId ) {
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
			// The dragged block exists, and its style attribute is an object
			// when set.
			const { style } = getBlockAttributes( srcClientId ) as {
				style?: ChildLayoutBlockStyle;
			};
			updateBlockAttributes( srcClientId, {
				style: getUpdatedChildLayoutStyle(
					style,
					layout,
					getSelectedBlockStyleState( srcClientId )
				),
			} );
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

function GridVisualizerAppender( {
	column,
	row,
	gridClientId,
	gridInfo,
}: GridVisualizerCellPosition ) {
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	return (
		<ButtonBlockAppender
			rootClientId={ gridClientId }
			className="block-editor-grid-visualizer__appender"
			// @ts-expect-error The appender ignores `style`.
			style={ {
				color: gridInfo.currentColor,
			} }
			onSelect={ ( block ) => {
				if ( ! block ) {
					return;
				}
				updateBlockAttributes( block.clientId, {
					style: {
						layout: {
							columnStart: column,
							rowStart: row,
						},
					},
				} );
				__unstableMarkNextChangeAsNotPersistent();
				moveBlocksToPosition(
					[ block.clientId ],
					gridClientId,
					gridClientId,
					getNumberOfBlocksBeforeCell( column, row )
				);
			} }
		/>
	);
}
