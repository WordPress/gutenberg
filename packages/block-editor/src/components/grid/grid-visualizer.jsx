import clsx from 'clsx';
import {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useMemo,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
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
	getGridTrackPositions,
	getGridItemPixelRect,
	getGridRectFromPixelRect,
	getBoundingGridRect,
} from './utils';
import {
	getGridDropTarget,
	getPixelRectFromGridRect,
} from './get-grid-drop-target';
import { getAlignmentGuides } from './get-alignment-guides';
import { getInsertedChildLayoutStyle } from './get-inserted-child-layout-style';
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
		const { isDragging, isDroppingAllowed } = useSelect(
			( select ) => {
				if ( ! select( blockEditorStore ).isDraggingBlocks() ) {
					return { isDragging: false, isDroppingAllowed: false };
				}
				return {
					isDragging: true,
					isDroppingAllowed: !! getBlockToPlaceInGrid(
						select( blockEditorStore ),
						gridClientId
					),
				};
			},
			[ gridClientId ]
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
				// Popovers in the block tools slots are hidden once a drag
				// has been over the block flow. While blocks are dragged, a
				// manual grid renders in the default popover slot instead, so
				// its drop layer stays and blocks can be moved between the
				// grid and the block flow in both directions.
				__unstablePopoverSlot={
					isManualGrid && isDragging
						? 'Popover'
						: '__unstable-block-tools-after'
				}
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

function GridVisualizerCell( { color, children } ) {
	return (
		<div
			className="block-editor-grid-visualizer__cell"
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
 * Gets the block being dragged, if it can be placed in the grid's cells.
 *
 * Only single blocks are placed in cells. Other drags, and blocks that can't
 * be moved into the grid, leave the grid's drop layer inert, so they fall
 * through to the block flow's drop zones.
 *
 * @param {Object} selectors    Block editor store selectors.
 * @param {string} gridClientId Client ID of the grid block.
 *
 * @return {?string} The client ID of the dragged block, or null.
 */
function getBlockToPlaceInGrid( selectors, gridClientId ) {
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
	const blockEditorSelectors = unlock( useSelect( blockEditorStore ) );
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
		setDropTarget( null );
	}

	function getDraggedBlock() {
		return getBlockToPlaceInGrid( blockEditorSelectors, gridClientId );
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
		// The pointer is the center of the block, measured by the area it
		// takes up in the grid. Blocks dragged in from elsewhere are the size
		// of the cells they span, up to the size of the grid.
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
			const { style } = getBlockAttributes( srcClientId );
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

function GridDropIndicator( { dropTarget } ) {
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
	columnSpan = 1,
	rowSpan = 1,
	gridClientId,
	gridInfo,
	isInitiallyOpen = false,
	onClose,
} ) {
	const appenderRef = useRef();
	const { getBlockAttributes, getSelectedBlockStyleState } = unlock(
		useSelect( blockEditorStore )
	);
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
					style: getInsertedChildLayoutStyle(
						getBlockAttributes( block.clientId )?.style,
						new GridRect( {
							columnStart: column,
							rowStart: row,
							columnSpan,
							rowSpan,
						} ),
						getSelectedBlockStyleState( block.clientId ),
						getBlockAttributes( gridClientId )?.layout
					),
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
		const ownerWindow = container.ownerDocument.defaultView;
		// Escape is pressed in the canvas or in the editor, wherever the
		// focus is.
		const keyDocuments = new Set( [
			container.ownerDocument,
			gridElement.ownerDocument,
		] );
		let drag = null;
		let shouldIgnoreClick = false;
		let ignoreClickTimeout;

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
			// Drawing is for a mouse or a pen. A touch on a cell scrolls the
			// page, or opens the inserter for that cell when it is a tap.
			if (
				event.pointerType === 'touch' ||
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
			drag.isMoving = true;
			setMarquee( {
				rect: getBoundingGridRect( start, cell ),
				isInserting: false,
			} );
		}

		function onPointerUp( event ) {
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

		function onLostPointerCapture( event ) {
			// Capture is also lost after `pointerup`, once the drag is over.
			if ( drag && event.pointerId === drag.pointerId ) {
				cancelDrag();
			}
		}

		function onKeyDown( event ) {
			if ( drag && ! drag.isCancelled && event.key === 'Escape' ) {
				event.preventDefault();
				event.stopPropagation();
				// The press goes on until the pointer is released, so that
				// releasing it doesn't open the inserter.
				drag.isCancelled = true;
				setMarquee( null );
			}
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
