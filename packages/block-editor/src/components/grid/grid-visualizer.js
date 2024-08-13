/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useEffect, forwardRef, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalUseDropZone as useDropZone } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { range, GridRect, getGridInfo } from './utils';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import ButtonBlockAppender from '../button-block-appender';

export function GridVisualizer( { clientId, contentRef, parentLayout } ) {
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
		<GridVisualizerUI
			gridClientId={ clientId }
			gridElement={ gridElement }
			isManualGrid={ isManualGrid }
			ref={ contentRef }
		/>
	);
}

const GridVisualizerUI = forwardRef(
	( { gridClientId, gridElement, isManualGrid }, ref ) => {
		const [ gridInfo, setGridInfo ] = useState( () =>
			getGridInfo( gridElement )
		);

		useEffect( () => {
			const observers = [];
			for ( const element of [ gridElement, ...gridElement.children ] ) {
				const observer = new window.ResizeObserver( () => {
					setGridInfo( getGridInfo( gridElement ) );
				} );
				observer.observe( element );
				observers.push( observer );
			}
			return () => {
				for ( const observer of observers ) {
					observer.disconnect();
				}
			};
		}, [ gridElement ] );

		return (
			<>
				<GridPopunder
					gridClientId={ gridClientId }
					gridInfo={ gridInfo }
					isManualGrid={ isManualGrid }
				/>
				{ isManualGrid && (
					<GridPopover
						ref={ ref }
						gridClientId={ gridClientId }
						gridInfo={ gridInfo }
					/>
				) }
			</>
		);
	}
);

/**
 * A popover component that renders in a slot over the grid block.
 *
 * This provides interactive elements of the grid visualization —
 * block inserters and drop zones.
 *
 * @param {Object} props
 * @param {string} props.gridClientId
 * @param {Object} props.gridInfo
 */
const GridPopover = forwardRef( ( { gridClientId, gridInfo }, ref ) => {
	const [ isDroppingAllowed, setIsDroppingAllowed ] = useState( false );
	const [ highlightedRect, setHighlightedRect ] = useState( null );

	const gridItems = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( gridClientId ),
		[ gridClientId ]
	);

	const occupiedRects = useMemo( () => {
		const rects = [];
		for ( const block of gridItems ) {
			const {
				columnStart,
				rowStart,
				columnSpan = 1,
				rowSpan = 1,
			} = block.attributes.style?.layout || {};
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
	}, [ gridItems ] );

	useEffect( () => {
		function onGlobalDrag() {
			setIsDroppingAllowed( true );
		}
		function onGlobalDragEnd() {
			setIsDroppingAllowed( false );
		}
		document.addEventListener( 'drag', onGlobalDrag );
		document.addEventListener( 'dragend', onGlobalDragEnd );
		return () => {
			document.removeEventListener( 'drag', onGlobalDrag );
			document.removeEventListener( 'dragend', onGlobalDragEnd );
		};
	}, [] );

	return (
		<BlockPopoverCover
			__unstablePopoverSlot="__unstable-block-tools-after"
			className={ clsx( 'block-editor-grid-visualizer-popover', {
				'is-dropping-allowed': isDroppingAllowed,
			} ) }
			clientId={ gridClientId }
		>
			<div ref={ ref } style={ gridInfo.style }>
				{ range( 1, gridInfo.numRows ).map( ( row ) =>
					range( 1, gridInfo.numColumns ).map( ( column ) => {
						const isCellOccupied = occupiedRects.some( ( rect ) =>
							rect.contains( column, row )
						);
						const isHighlighted =
							highlightedRect?.contains( column, row ) ?? false;

						return (
							<div
								key={ `${ row }-${ column }` }
								className={ clsx(
									'block-editor-grid-visualizer-popover__cell',
									{
										'is-highlighted': isHighlighted,
									}
								) }
							>
								{ isCellOccupied ? (
									<GridVisualizerDropZone
										column={ column }
										row={ row }
										gridClientId={ gridClientId }
										gridInfo={ gridInfo }
										setHighlightedRect={
											setHighlightedRect
										}
									/>
								) : (
									<GridVisualizerAppender
										column={ column }
										row={ row }
										gridClientId={ gridClientId }
										gridInfo={ gridInfo }
										setHighlightedRect={
											setHighlightedRect
										}
									/>
								) }
							</div>
						);
					} )
				) }
			</div>
		</BlockPopoverCover>
	);
} );

/**
 * A popover component that renders inline under the grid block.
 *
 * This provides non-interactive elements of the grid visualization and
 * renders under the block so that the background colors are not atop
 * the block content.
 *
 * @param {Object}  props
 * @param {string}  props.gridClientId
 * @param {Object}  props.gridInfo
 * @param {boolean} props.isManualGrid
 */
function GridPopunder( { gridClientId, gridInfo, isManualGrid } ) {
	const color = gridInfo.currentColor;
	const cellStyle = isManualGrid
		? {
				backgroundColor: `rgba(var(--wp-admin-theme-color--rgb), 0.2)`,
				border: `1px dashed rgb(var(--wp-admin-theme-color--rgb))`,
				borderRadius: '2px',
				color,
				opacity: 0.2,
		  }
		: {
				border: `1px dashed ${ color }`,
				borderRadius: '2px',
				color,
				opacity: 0.2,
		  };

	return (
		<BlockPopoverCover
			inline
			clientId={ gridClientId }
			// Override layout margin and popover's zIndex.
			contentStyle={ { margin: 0, zIndex: 0 } }
		>
			<div style={ gridInfo.style }>
				{ Array.from( { length: gridInfo.numItems }, ( _, i ) => (
					<div key={ i } style={ cellStyle } />
				) ) }
			</div>
		</BlockPopoverCover>
	);
}

function useGridVisualizerDropZone(
	column,
	row,
	gridClientId,
	gridInfo,
	setHighlightedRect
) {
	const { getBlockAttributes, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	return useDropZoneWithValidation( {
		validateDrag( srcClientId ) {
			const attributes = getBlockAttributes( srcClientId );
			const rect = new GridRect( {
				columnStart: column,
				rowStart: row,
				columnSpan: attributes.style?.layout?.columnSpan,
				rowSpan: attributes.style?.layout?.rowSpan,
			} );
			const isInBounds = new GridRect( {
				columnSpan: gridInfo.numColumns,
				rowSpan: gridInfo.numRows,
			} ).containsRect( rect );
			return isInBounds;
		},
		onDragEnter( srcClientId ) {
			const attributes = getBlockAttributes( srcClientId );
			setHighlightedRect(
				new GridRect( {
					columnStart: column,
					rowStart: row,
					columnSpan: attributes.style?.layout?.columnSpan,
					rowSpan: attributes.style?.layout?.rowSpan,
				} )
			);
		},
		onDragLeave() {
			// onDragEnter can be called before onDragLeave if the user moves
			// their mouse quickly, so only clear the highlight if it was set
			// by this cell.
			setHighlightedRect( ( prevHighlightedRect ) =>
				prevHighlightedRect?.columnStart === column &&
				prevHighlightedRect?.rowStart === row
					? null
					: prevHighlightedRect
			);
		},
		onDrop( srcClientId ) {
			setHighlightedRect( null );
			const attributes = getBlockAttributes( srcClientId );
			updateBlockAttributes( srcClientId, {
				style: {
					...attributes.style,
					layout: {
						...attributes.style?.layout,
						columnStart: column,
						rowStart: row,
					},
				},
			} );
			__unstableMarkNextChangeAsNotPersistent();
			moveBlocksToPosition(
				[ srcClientId ],
				getBlockRootClientId( srcClientId ),
				gridClientId,
				getNumberOfBlocksBeforeCell( column, row )
			);
		},
	} );
}

function GridVisualizerDropZone( {
	column,
	row,
	gridClientId,
	gridInfo,
	setHighlightedRect,
} ) {
	return (
		<div
			className="block-editor-grid-visualizer__drop-zone"
			ref={ useGridVisualizerDropZone(
				column,
				row,
				gridClientId,
				gridInfo,
				setHighlightedRect
			) }
		/>
	);
}

function GridVisualizerAppender( {
	column,
	row,
	gridClientId,
	gridInfo,
	setHighlightedRect,
} ) {
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
			ref={ useGridVisualizerDropZone(
				column,
				row,
				gridClientId,
				gridInfo,
				setHighlightedRect
			) }
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

function useDropZoneWithValidation( {
	validateDrag,
	onDragEnter,
	onDragLeave,
	onDrop,
} ) {
	const { getDraggedBlockClientIds } = useSelect( blockEditorStore );
	return useDropZone( {
		onDragEnter() {
			const [ srcClientId ] = getDraggedBlockClientIds();
			if ( srcClientId && validateDrag( srcClientId ) ) {
				onDragEnter( srcClientId );
			}
		},
		onDragLeave() {
			onDragLeave();
		},
		onDrop() {
			const [ srcClientId ] = getDraggedBlockClientIds();
			if ( srcClientId && validateDrag( srcClientId ) ) {
				onDrop( srcClientId );
			}
		},
	} );
}
