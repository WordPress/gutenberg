import clsx from 'clsx';
import type { Dispatch, ForwardedRef, SetStateAction } from 'react';
import {
	useState,
	useEffect,
	forwardRef,
	useMemo,
	useContext,
	useRef,
} from '@wordpress/element';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import {
	__experimentalUseDropZone as useDropZone,
	useEvent,
} from '@wordpress/compose';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import {
	range,
	GridRect,
	getGridInfo,
	getGridItemRect,
	getGridTracks,
	getClosestTrack,
} from './utils';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import ButtonBlockAppender from '../button-block-appender';
import { unlock } from '../../lock-unlock';
import { BlockRefs } from '../provider/block-refs-provider';
import { blockDragOffsets } from '../block-draggable/drag-offset';
import { getManualGridDropRect } from './manual-grid-drop';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child-utils';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
} from '../../hooks/block-style-state';
import { isPlainObject } from '../../utils/object';
import type { BlockStyleState, ChildLayoutBlockStyle } from '../../hooks/types';
import type {
	AutoGridVisualizerProps,
	GetGridDropRect,
	GridInfo,
	GridItemAttributes,
	GridTrack,
	GridVisualizerCellProps,
	GridVisualizerCellPosition,
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
	const isHidden = useSelect(
		( select ) => {
			const { getSettings, isBlockBeingDragged, isAncestorBeingDragged } =
				select( blockEditorStore );
			return (
				getSettings().isDistractionFree ||
				// A moving grid must not intercept drops intended for its parent.
				isBlockBeingDragged( clientId ) ||
				isAncestorBeingDragged( clientId )
			);
		},
		[ clientId ]
	);
	const gridElement = useBlockElement( clientId );

	if ( isHidden || ! gridElement ) {
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
			( select ) => select( blockEditorStore ).isDraggingBlocks(),
			[]
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
					'is-manual-grid': isManualGrid,
				} ) }
				clientId={ gridClientId }
				__unstablePopoverSlot={
					isManualGrid
						? 'block-editor-grid-visualizer'
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
	const [ highlightedRect, setHighlightedRect ] = useState< GridRect | null >(
		null
	);
	const isDragging = useSelect(
		( select ) => select( blockEditorStore ).isDraggingBlocks(),
		[]
	);
	const getDropRect = useGridDropRect( gridElement, gridInfo, isDragging );
	const dropZoneRef = useGridVisualizerDropZone(
		gridClientId,
		getDropRect,
		gridInfo,
		setHighlightedRect
	);
	useEffect( () => {
		if ( ! isDragging ) {
			setHighlightedRect( null );
		}
	}, [ isDragging ] );

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

	// The cell controls don't change when only the drop preview moves.
	const cells = useMemo(
		() =>
			range( 1, gridInfo.numRows ).map( ( row ) =>
				range( 1, gridInfo.numColumns ).map( ( column ) => {
					// Keep a selected nested grid's own visualizer visible.
					const isChildGridCell = childGridRect?.contains(
						column,
						row
					);
					const isCellOccupied = occupiedRects.some( ( rect ) =>
						rect.contains( column, row )
					);
					const cellProps = {
						column,
						row,
						gridClientId,
						gridInfo,
					};
					return (
						<GridVisualizerCell
							key={ `${ row }-${ column }` }
							column={ column }
							row={ row }
							color={
								isChildGridCell
									? 'transparent'
									: gridInfo.currentColor
							}
						>
							{ ( ! isCellOccupied || isChildGridCell ) && (
								<GridVisualizerAppender { ...cellProps } />
							) }
						</GridVisualizerCell>
					);
				} )
			),
		[ gridInfo, childGridRect, occupiedRects, gridClientId ]
	);

	return (
		<>
			{ cells }
			<div
				className="block-editor-grid-visualizer__drop-zone"
				ref={ dropZoneRef }
			/>
			{ isDragging && highlightedRect && (
				<div
					className="block-editor-grid-visualizer__drop-preview"
					style={ {
						gridColumn: `${ highlightedRect.columnStart } / span ${ highlightedRect.columnSpan }`,
						gridRow: `${ highlightedRect.rowStart } / span ${ highlightedRect.rowSpan }`,
					} }
				/>
			) }
		</>
	);
}

function useGridDropRect(
	gridElement: Element,
	gridInfo: GridInfo,
	isDragging: boolean
): GetGridDropRect {
	const { refsMap } = useContext( BlockRefs );
	const sizeRef = useRef< {
		srcClientId: string;
		attributes: object;
		selectedState: BlockStyleState | undefined;
		gridElement: Element;
		gridInfo: GridInfo;
		rect: GridRect;
		placements: Map< string, GridRect >;
	} | null >( null );

	useEffect( () => {
		if ( ! isDragging ) {
			sizeRef.current = null;
		}
	}, [ isDragging ] );

	return useEvent< GetGridDropRect >(
		( srcClientId, attributes, selectedState, layout, column, row ) => {
			let size = sizeRef.current;
			if (
				! size ||
				size.srcClientId !== srcClientId ||
				size.attributes !== attributes ||
				size.selectedState?.viewport !== selectedState?.viewport ||
				size.selectedState?.pseudo !== selectedState?.pseudo ||
				size.gridElement !== gridElement ||
				size.gridInfo !== gridInfo
			) {
				size = {
					srcClientId,
					attributes,
					selectedState,
					gridElement,
					gridInfo,
					rect: getManualGridDropRect(
						gridElement,
						refsMap.get( srcClientId ),
						layout,
						1,
						1,
						gridInfo.numColumns
					),
					placements: new Map(),
				};
				sizeRef.current = size;
			}
			// Reuse each cell's rectangle so moving within it doesn't rerender
			// the preview or remeasure the dragged block.
			const key = `${ column }-${ row }`;
			let rect = size.placements.get( key );
			if ( ! rect ) {
				rect = new GridRect( {
					columnStart: Math.min(
						column,
						gridInfo.numColumns - size.rect.columnSpan + 1
					),
					rowStart: row,
					columnSpan: size.rect.columnSpan,
					rowSpan: size.rect.rowSpan,
				} );
				size.placements.set( key, rect );
			}
			return rect;
		}
	);
}

function GridVisualizerCell( {
	color,
	column,
	row,
	children,
	className,
}: GridVisualizerCellProps ) {
	return (
		<div
			className={ clsx(
				'block-editor-grid-visualizer__cell',
				className
			) }
			style={ {
				gridColumn: column,
				gridRow: row,
				boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${ color } 20%, #0000)`,
				color,
			} }
		>
			{ children }
		</div>
	);
}

function useGridVisualizerDropZone(
	gridClientId: string,
	getDropRect: GetGridDropRect,
	gridInfo: GridInfo,
	setHighlightedRect: Dispatch< SetStateAction< GridRect | null > >
) {
	const registry = useRegistry();
	const { refsMap } = useContext( BlockRefs );
	const tracksRef = useRef< {
		gridInfo: GridInfo;
		columns: GridTrack[];
		rows: GridTrack[];
		isRightToLeft: boolean;
	} | null >( null );
	const {
		getBlockAttributes,
		getBlockRootClientId,
		canInsertBlockType,
		getBlockName,
		getBlockParents,
		getDraggedBlockClientIds,
		getSelectedBlockStyleState,
	} = unlock( useSelect( blockEditorStore ) );
	const dropRef = useRef< {
		srcClientId: string;
		attributes: NonNullable< ReturnType< typeof getBlockAttributes > >;
		selectedState: ReturnType< typeof getSelectedBlockStyleState >;
		gridInfo: GridInfo;
		column: number;
		row: number;
		rect: GridRect;
	} | null >( null );
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		__unstableMarkLastChangeAsPersistent,
		stopDragging,
		hideInsertionPoint,
	} = unlock( useDispatch( blockEditorStore ) );

	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	function getDrop( event: DragEvent ) {
		const clientIds = getDraggedBlockClientIds();
		const [ srcClientId ] = clientIds;
		if (
			clientIds.length !== 1 ||
			! srcClientId ||
			srcClientId === gridClientId ||
			getBlockParents( gridClientId ).includes( srcClientId ) ||
			! canInsertBlockType( getBlockName( srcClientId ), gridClientId )
		) {
			return;
		}
		const attributes = getBlockAttributes( srcClientId );
		if ( ! attributes ) {
			return;
		}
		// One continuous surface includes the gutters between cells.
		const dropZone = event.currentTarget as HTMLElement;
		const grid = dropZone.parentElement!;
		if ( tracksRef.current?.gridInfo !== gridInfo ) {
			tracksRef.current = {
				gridInfo,
				columns: getGridTracks( grid, 'column' ),
				rows: getGridTracks( grid, 'row' ),
				isRightToLeft:
					grid.ownerDocument.defaultView!.getComputedStyle( grid )
						.direction === 'rtl',
			};
		}
		const { columns, rows, isRightToLeft } = tracksRef.current;
		const bounds = dropZone.getBoundingClientRect();
		const left =
			( ( isRightToLeft
				? bounds.right - event.clientX
				: event.clientX - bounds.left ) *
				dropZone.offsetWidth ) /
			bounds.width;
		const top =
			( ( event.clientY - bounds.top ) * dropZone.offsetHeight ) /
			bounds.height;
		const blockElement = refsMap.get( srcClientId );
		const dragOffset = blockElement
			? blockDragOffsets.get( blockElement )
			: undefined;
		let inlineOffset = 0;
		let topOffset = 0;
		if ( dragOffset && blockElement ) {
			inlineOffset = isRightToLeft ? dragOffset.right : dragOffset.left;
			topOffset = dragOffset.top;
			const frame = blockElement.ownerDocument.defaultView
				?.frameElement as HTMLElement | null;
			if ( frame && frame.ownerDocument === dropZone.ownerDocument ) {
				const frameBounds = frame.getBoundingClientRect();
				inlineOffset *= frameBounds.width / frame.offsetWidth;
				topOffset *= frameBounds.height / frame.offsetHeight;
			}
			inlineOffset *= dropZone.offsetWidth / bounds.width;
			topOffset *= dropZone.offsetHeight / bounds.height;
		}
		// Snap the visual's leading edge, retaining the point where the block
		// was grabbed. Larger blocks then switch halfway between cell starts
		// when moving left or up, just as single-cell blocks do.
		const getTrack = (
			tracks: GridTrack[],
			position: number,
			offset: number
		) =>
			dragOffset
				? getClosestTrack( tracks, position - offset ) + 1
				: tracks.findIndex(
						( track, index ) =>
							position <=
							( track.end +
								( tracks[ index + 1 ]?.start ?? Infinity ) ) /
								2
					) + 1;
		const column = getTrack( columns, left, inlineOffset );
		const row = getTrack( rows, top, topOffset );
		if ( ! column || ! row ) {
			return;
		}
		const selectedState = getSelectedBlockStyleState( srcClientId );
		const previousDrop = dropRef.current;
		if (
			previousDrop &&
			previousDrop.srcClientId === srcClientId &&
			previousDrop.attributes === attributes &&
			previousDrop.selectedState?.viewport === selectedState?.viewport &&
			previousDrop.selectedState?.pseudo === selectedState?.pseudo &&
			previousDrop.gridInfo === gridInfo &&
			previousDrop.column === column &&
			previousDrop.row === row
		) {
			return previousDrop;
		}
		const style = isPlainObject( attributes.style )
			? attributes.style
			: undefined;
		const stateStyle = getStyleForState( style, {
			...selectedState,
			pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
		} );
		dropRef.current = {
			srcClientId,
			attributes,
			selectedState,
			gridInfo,
			column,
			row,
			rect: getDropRect(
				srcClientId,
				attributes,
				selectedState,
				{
					...( isPlainObject( style?.layout ) ? style.layout : {} ),
					...( isPlainObject( stateStyle?.layout )
						? stateStyle.layout
						: {} ),
				},
				column,
				row
			),
		};
		return dropRef.current;
	}

	function highlightDrop( event: DragEvent ) {
		setHighlightedRect( getDrop( event )?.rect ?? null );
	}

	function clearHighlight() {
		setHighlightedRect( null );
		dropRef.current = null;
	}

	return useDropZone( {
		onDragEnter: highlightDrop,
		onDragOver: highlightDrop,
		onDragLeave: clearHighlight,
		onDragEnd() {
			clearHighlight();
			stopDragging();
			hideInsertionPoint();
		},
		onDrop( event ) {
			const drop = getDrop( event );
			setHighlightedRect( null );
			if ( ! drop ) {
				return;
			}
			const { srcClientId, attributes, selectedState, rect } = drop;
			const sourceRootClientId = getBlockRootClientId( srcClientId );
			registry.batch( () => {
				updateBlockAttributes( srcClientId, {
					style: getUpdatedChildLayoutStyle(
						isPlainObject( attributes.style )
							? ( attributes.style as ChildLayoutBlockStyle )
							: undefined,
						{
							columnStart: rect.columnStart,
							rowStart: rect.rowStart,
							columnSpan: rect.columnSpan,
							rowSpan: rect.rowSpan,
						},
						selectedState
					),
				} );
				// Moving in one viewport must not reorder blocks in all viewports.
				if (
					sourceRootClientId !== gridClientId ||
					! hasViewportBlockStyleState( selectedState )
				) {
					moveBlocksToPosition(
						[ srcClientId ],
						sourceRootClientId,
						gridClientId,
						getNumberOfBlocksBeforeCell(
							rect.columnStart,
							rect.rowStart
						)
					);
				}
				// Commit placement and order together, including consecutive drops
				// that update the same style attributes without changing block order.
				__unstableMarkLastChangeAsPersistent();
			} );
		},
	} );
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
