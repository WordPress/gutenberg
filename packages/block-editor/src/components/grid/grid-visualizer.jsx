import clsx from 'clsx';
import {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useMemo,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalUseDropZone as useDropZone } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import {
	range,
	GridRect,
	getGridInfo,
	getGridItemRect,
	getComputedCSS,
	getGridTrackPositions,
	getGridItemPixelRect,
	getGridRectFromPixelRect,
} from './utils';
import {
	getGridDropTarget,
	getPixelRectFromGridRect,
	getTrackIndexAtPosition,
} from './get-grid-drop-target';
import { getAlignmentGuides } from './get-alignment-guides';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import ButtonBlockAppender from '../button-block-appender';
import { unlock } from '../../lock-unlock';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child';

export function GridVisualizer( {
	clientId,
	contentRef,
	parentLayout,
	childGridClientId,
	isStacked = false,
} ) {
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
		window.__experimentalEnableGridInteractivity &&
		! isStacked;
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
	( { gridClientId, gridElement, isManualGrid, childGridClientId }, ref ) => {
		const [ gridInfo, setGridInfo ] = useState( () =>
			getGridInfo( gridElement )
		);
		const isDroppingAllowed = useSelect(
			( select ) => select( blockEditorStore ).isDraggingBlocks(),
			[]
		);

		// Get the element for the child grid block so we can
		// compute its position and hide overlapping visualizer cells.
		const childGridElement = useBlockElement( childGridClientId );

		// Compute the child grid block's rect from its position in the grid.
		// This works for both manual and non-manual grids.
		const childGridRect = useMemo( () => {
			if ( ! childGridElement ) {
				return null;
			}
			return getGridItemRect( childGridElement );
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

function AutoGridVisualizer( { gridInfo, childGridRect } ) {
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
} ) {
	const [ dropTarget, setDropTarget ] = useState( null );

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
		const rects = [];
		for ( const style of Object.values( gridItemStyles ) ) {
			const {
				columnStart,
				rowStart,
				columnSpan = 1,
				rowSpan = 1,
			} = style?.layout ?? {};
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
					let color = gridInfo.currentColor;
					if ( isChildGridCell ) {
						color = 'transparent';
					}
					const isCellOccupied = occupiedRects.some( ( rect ) =>
						rect.contains( column, row )
					);
					return (
						<GridVisualizerCell
							key={ `${ row }-${ column }` }
							color={ color }
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

function GridVisualizerCell( { color, children, className } ) {
	return (
		<div
			className={ clsx(
				'block-editor-grid-visualizer__cell',
				className
			) }
			style={ {
				boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${ color } 20%, #0000)`,
				color,
			} }
		>
			{ children }
		</div>
	);
}

function getPixelRectStyle( rect ) {
	return {
		left: rect.left,
		top: rect.top,
		width: rect.right - rect.left,
		height: rect.bottom - rect.top,
	};
}

/**
 * Works out which cell inside a grid item the pointer is over, as a 0-based
 * offset from the item's first cell.
 *
 * @param {DragEvent}   event           The `dragstart` event.
 * @param {HTMLElement} gridElement     The grid element.
 * @param {HTMLElement} gridItemElement The grid item being dragged.
 *
 * @return {{column: number, row: number}} The offset of the grabbed cell.
 */
function getGrabOffset( event, gridElement, gridItemElement ) {
	const { columnTracks, rowTracks } = getGridTrackPositions( gridElement );
	const gridRect = gridElement.getBoundingClientRect();
	const scale = gridElement.offsetWidth / gridRect.width || 1;
	const contentLeft =
		gridElement.clientLeft +
		( parseFloat( getComputedCSS( gridElement, 'padding-left' ) ) || 0 );
	const contentTop =
		gridElement.clientTop +
		( parseFloat( getComputedCSS( gridElement, 'padding-top' ) ) || 0 );
	const column =
		getTrackIndexAtPosition(
			columnTracks,
			( event.clientX - gridRect.left ) * scale - contentLeft
		) + 1;
	const row =
		getTrackIndexAtPosition(
			rowTracks,
			( event.clientY - gridRect.top ) * scale - contentTop
		) + 1;
	const itemRect = getGridRectFromPixelRect(
		getGridItemPixelRect( gridItemElement ),
		columnTracks,
		rowTracks
	);
	return {
		column: Math.min(
			Math.max( column - itemRect.columnStart, 0 ),
			itemRect.columnSpan - 1
		),
		row: Math.min(
			Math.max( row - itemRect.rowStart, 0 ),
			itemRect.rowSpan - 1
		),
	};
}

/**
 * A drop zone covering the whole grid. While a block is dragged over it, it
 * works out which cells the block would land in, which other blocks those
 * cells overlap, and which alignment guides to show.
 *
 * @param {Object}                    props
 * @param {string}                    props.gridClientId  Client ID of the grid block.
 * @param {HTMLElement}               props.gridElement   The grid element in the canvas.
 * @param {Object}                    props.gridInfo      Grid info, from `getGridInfo`.
 * @param {(target: ?Object) => void} props.setDropTarget Called with the drop target, or null.
 */
function GridVisualizerDropLayer( {
	gridClientId,
	gridElement,
	gridInfo,
	setDropTarget,
} ) {
	const layerRef = useRef();
	const grabRef = useRef( null );
	const lastTargetRef = useRef( null );
	const {
		getBlockAttributes,
		getBlockRootClientId,
		getBlockName,
		canInsertBlockType,
		getDraggedBlockClientIds,
		getSelectedBlockStyleState,
	} = unlock( useSelect( blockEditorStore ) );
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	// Remember which cell of a grid item was grabbed, so that cell stays
	// under the pointer while dragging. Drags that start outside the grid
	// (from the inserter or another container) have no offset.
	useEffect( () => {
		function onDragStart( event ) {
			const gridItemElement = event.target?.closest?.( '[data-block]' );
			if ( gridItemElement?.parentElement !== gridElement ) {
				grabRef.current = null;
				return;
			}
			grabRef.current = {
				clientId: gridItemElement.getAttribute( 'data-block' ),
				...getGrabOffset( event, gridElement, gridItemElement ),
			};
		}
		gridElement.addEventListener( 'dragstart', onDragStart );
		return () => {
			gridElement.removeEventListener( 'dragstart', onDragStart );
		};
	}, [ gridElement ] );

	function clearDropTarget() {
		lastTargetRef.current = null;
		setDropTarget( null );
	}

	function getDraggedBlock() {
		const [ srcClientId ] = getDraggedBlockClientIds();
		if (
			! srcClientId ||
			! canInsertBlockType( getBlockName( srcClientId ), gridClientId )
		) {
			return null;
		}
		return srcClientId;
	}

	function updateDropTarget( event ) {
		const srcClientId = getDraggedBlock();
		const layer = layerRef.current;
		if ( ! srcClientId || ! layer ) {
			clearDropTarget();
			return;
		}

		const { columnTracks, rowTracks } =
			getGridTrackPositions( gridElement );
		if ( ! columnTracks.length || ! rowTracks.length ) {
			clearDropTarget();
			return;
		}

		// Measure the blocks in the grid from the canvas, so that the result
		// matches what is on screen in every viewport.
		const siblings = [];
		let srcSpan = null;
		for ( const child of gridElement.children ) {
			const childClientId = child.getAttribute( 'data-block' );
			if ( ! childClientId || ! child.offsetParent ) {
				continue;
			}
			const pixelRect = getGridItemPixelRect( child );
			const rect = getGridRectFromPixelRect(
				pixelRect,
				columnTracks,
				rowTracks
			);
			if ( childClientId === srcClientId ) {
				srcSpan = rect;
				continue;
			}
			siblings.push( { pixelRect, rect } );
		}
		const srcLayout = getBlockAttributes( srcClientId )?.style?.layout;
		const columnSpan = srcSpan?.columnSpan ?? srcLayout?.columnSpan ?? 1;
		const rowSpan = srcSpan?.rowSpan ?? srcLayout?.rowSpan ?? 1;

		const layerRect = layer.getBoundingClientRect();
		const scale = layer.offsetWidth / layerRect.width || 1;
		const grabOffset =
			grabRef.current?.clientId === srcClientId
				? grabRef.current
				: { column: 0, row: 0 };
		const landing = getGridDropTarget( {
			x: ( event.clientX - layerRect.left ) * scale,
			y: ( event.clientY - layerRect.top ) * scale,
			columnTracks,
			rowTracks,
			columnSpan,
			rowSpan,
			grabOffset,
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
			.filter( Boolean );

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

		const target = {
			srcClientId,
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
			const { columnStart, rowStart } = target.landing;
			const { style } = getBlockAttributes( srcClientId );
			updateBlockAttributes( srcClientId, {
				style: getUpdatedChildLayoutStyle(
					style,
					{ columnStart, rowStart },
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
			ref={ ( node ) => {
				layerRef.current = node;
				dropZoneRef( node );
			} }
			className="block-editor-grid-visualizer__drop-layer"
		/>
	);
}

function GridDropIndicator( { dropTarget } ) {
	const { landingPixelRect, overlaps, guides } = dropTarget;
	return (
		<div className="block-editor-grid-visualizer__drop-indicator">
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
					{ guide.kind === 'container-centre' && (
						<span className="block-editor-grid-visualizer__guide-label">
							{ __( 'Center' ) }
						</span>
					) }
				</div>
			) ) }
		</div>
	);
}

function GridVisualizerAppender( { column, row, gridClientId, gridInfo } ) {
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
