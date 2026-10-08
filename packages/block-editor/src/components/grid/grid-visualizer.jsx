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
	getGridTrackPositions,
	getGridItemPixelRect,
	getGridRectFromPixelRect,
} from './utils';
import {
	getGridDropTarget,
	getPixelRectFromGridRect,
} from './get-grid-drop-target';
import { getAlignmentGuides } from './get-alignment-guides';
import {
	getUnstackedMobileUpdates,
	isGridStackedOnMobile,
} from './mobile-stacking';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import ButtonBlockAppender from '../button-block-appender';
import { unlock } from '../../lock-unlock';
import { useUpdateGridChildLayout } from './use-update-grid-child-layout';

export function GridVisualizer( {
	clientId,
	contentRef,
	parentLayout,
	childGridClientId,
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
		window.__experimentalEnableGridInteractivity;
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

	const { gridItemStyles, gridAttributes, viewport } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockStyles,
				getBlockAttributes,
				getSelectedBlockStyleState,
			} = unlock( select( blockEditorStore ) );
			const blockOrder = getBlockOrder( gridClientId );
			return {
				gridItemStyles: getBlockStyles( blockOrder ),
				gridAttributes: getBlockAttributes( gridClientId ),
				viewport: getSelectedBlockStyleState()?.viewport,
			};
		},
		[ gridClientId ]
	);
	const occupiedRects = useMemo( () => {
		// Use the placement shown in the selected viewport: the stack when
		// the grid is stacked on mobile, otherwise any viewport overrides.
		let layouts;
		if (
			viewport === '@mobile' &&
			isGridStackedOnMobile(
				gridAttributes?.layout,
				gridAttributes?.style
			)
		) {
			const updates = getUnstackedMobileUpdates( {
				gridClientId,
				gridAttributes,
				children: Object.entries( gridItemStyles ).map(
					( [ clientId, style ] ) => ( {
						clientId,
						attributes: { style },
					} )
				),
			} );
			layouts = Object.keys( gridItemStyles ).map(
				( clientId ) => updates[ clientId ].style[ '@mobile' ].layout
			);
		} else {
			layouts = Object.values( gridItemStyles ).map( ( style ) => ( {
				...style?.layout,
				...( viewport && viewport !== 'default'
					? style?.[ viewport ]?.layout
					: undefined ),
			} ) );
		}
		const rects = [];
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
	}, [ gridItemStyles, gridAttributes, viewport, gridClientId ] );

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
	const lastTargetRef = useRef( null );
	const {
		getBlockAttributes,
		getBlockRootClientId,
		getBlockName,
		canInsertBlockType,
		getDraggedBlockClientIds,
	} = useSelect( blockEditorStore );
	const { moveBlocksToPosition, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const updateGridChildLayout = useUpdateGridChildLayout();
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

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
		let srcPixelRect = null;
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
				srcPixelRect = pixelRect;
				continue;
			}
			siblings.push( { pixelRect, rect } );
		}
		const srcLayout = getBlockAttributes( srcClientId )?.style?.layout;
		const columnSpan = srcSpan?.columnSpan ?? srcLayout?.columnSpan ?? 1;
		const rowSpan = srcSpan?.rowSpan ?? srcLayout?.rowSpan ?? 1;

		const layerRect = layer.getBoundingClientRect();
		const scale = layer.offsetWidth / layerRect.width || 1;
		// The pointer is the centre of the block. Its size is measured
		// without rotation, so a rotated block lands by the cells it takes up.
		// Blocks dragged in from elsewhere are the size of the cells they span.
		const landing = getGridDropTarget( {
			x: ( event.clientX - layerRect.left ) * scale,
			y: ( event.clientY - layerRect.top ) * scale,
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
			updateGridChildLayout(
				srcClientId,
				{ columnStart, rowStart },
				gridClientId
			);
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

function GridVisualizerAppender( {
	column,
	row,
	columnSpan = 1,
	rowSpan = 1,
	gridClientId,
	gridInfo,
	isInitiallyOpen = false,
	onClose,
} ) {
	const appenderRef = useRef();
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

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
				updateBlockAttributes( block.clientId, {
					style: {
						layout: {
							columnStart: column,
							rowStart: row,
							...( columnSpan > 1 && { columnSpan } ),
							...( rowSpan > 1 && { rowSpan } ),
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
 * @param {Object}      props
 * @param {string}      props.gridClientId Client ID of the grid block.
 * @param {HTMLElement} props.gridElement  The grid element in the canvas.
 * @param {Object}      props.gridInfo     Grid info, from `getGridInfo`.
 */
function GridVisualizerMarquee( { gridClientId, gridElement, gridInfo } ) {
	const anchorRef = useRef();
	const [ marquee, setMarquee ] = useState( null );

	useEffect( () => {
		// The visualizer grid that the cells are drawn in.
		const container = anchorRef.current?.parentElement;
		if ( ! container ) {
			return;
		}
		let drag = null;
		let shouldIgnoreClick = false;

		function getCell( event ) {
			const { columnTracks, rowTracks } =
				getGridTrackPositions( gridElement );
			if ( ! columnTracks.length || ! rowTracks.length ) {
				return null;
			}
			const rect = container.getBoundingClientRect();
			const scale = container.offsetWidth / rect.width || 1;
			return getGridDropTarget( {
				x: ( event.clientX - rect.left ) * scale,
				y: ( event.clientY - rect.top ) * scale,
				columnTracks,
				rowTracks,
			} );
		}

		function onPointerDown( event ) {
			shouldIgnoreClick = false;
			if (
				event.button !== 0 ||
				! event.target.closest?.(
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
			event.target.setPointerCapture( event.pointerId );
		}

		function onPointerMove( event ) {
			if ( ! drag || event.pointerId !== drag.pointerId ) {
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
			drag.isMoving = true;
			setMarquee( {
				rect: new GridRect( {
					columnStart: Math.min(
						start.columnStart,
						cell.columnStart
					),
					rowStart: Math.min( start.rowStart, cell.rowStart ),
					columnEnd: Math.max( start.columnStart, cell.columnStart ),
					rowEnd: Math.max( start.rowStart, cell.rowStart ),
				} ),
				isInserting: false,
			} );
		}

		function onPointerUp( event ) {
			if ( ! drag || event.pointerId !== drag.pointerId ) {
				return;
			}
			if ( drag.isMoving ) {
				// The press started on a cell's own appender, which would
				// open on the click that follows.
				shouldIgnoreClick = true;
				setMarquee( ( current ) =>
					current ? { ...current, isInserting: true } : current
				);
			}
			drag = null;
		}

		function onPointerCancel() {
			drag = null;
			setMarquee( null );
		}

		function onClick( event ) {
			if (
				shouldIgnoreClick &&
				! event.target.closest?.(
					'.block-editor-grid-visualizer__marquee'
				)
			) {
				shouldIgnoreClick = false;
				event.preventDefault();
				event.stopPropagation();
			}
		}

		container.addEventListener( 'pointerdown', onPointerDown );
		container.addEventListener( 'pointermove', onPointerMove );
		container.addEventListener( 'pointerup', onPointerUp );
		container.addEventListener( 'pointercancel', onPointerCancel );
		container.addEventListener( 'click', onClick, true );
		return () => {
			container.removeEventListener( 'pointerdown', onPointerDown );
			container.removeEventListener( 'pointermove', onPointerMove );
			container.removeEventListener( 'pointerup', onPointerUp );
			container.removeEventListener( 'pointercancel', onPointerCancel );
			container.removeEventListener( 'click', onClick, true );
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
