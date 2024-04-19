/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalUseDropZone as useDropZone } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getComputedCSS, range, GridRect, getGridItemRect } from './utils';
import { store as blockEditorStore } from '../../store';

export function GridVisualizer( { clientId } ) {
	const gridElement = useBlockElement( clientId );
	if ( ! gridElement ) {
		return null;
	}
	return (
		<GridVisualizerGrid
			gridClientId={ clientId }
			gridElement={ gridElement }
		/>
	);
}

function getGridInfo( gridElement ) {
	const gridTemplateColumns = getComputedCSS(
		gridElement,
		'grid-template-columns'
	);
	const gridTemplateRows = getComputedCSS(
		gridElement,
		'grid-template-rows'
	);
	const numColumns = gridTemplateColumns.split( ' ' ).length;
	const numRows = gridTemplateRows.split( ' ' ).length;
	const numItems = numColumns * numRows;
	return {
		numColumns,
		numRows,
		numItems,
		style: {
			gridTemplateColumns,
			gridTemplateRows,
			gap: getComputedCSS( gridElement, 'gap' ),
			padding: getComputedCSS( gridElement, 'padding' ),
		},
	};
}

// TODO: clean up these two funcs
// TODO: these two funcs don't properly handle the case where an item only has a row or a column set
// what we're supposed to do in that case is quite complicated: https://www.w3.org/TR/css-grid-1/#auto-placement-algo

function getNaturalPosition( {
	rects,
	numColumns,
	numRows,
	columnStart, // if specified, constrain to this column
	rowStart, // if specified, constrain to this row
	columnSpan = 1,
	rowSpan = 1,
} ) {
	for ( let row = 1; row <= numRows; row++ ) {
		for ( let column = 1; column <= numColumns; column++ ) {
			const rect = new GridRect( {
				columnStart: columnStart ?? column,
				rowStart: rowStart ?? row,
				columnSpan,
				rowSpan,
			} );
			if (
				! rects.some( ( otherRect ) =>
					rect.intersectsRect( otherRect )
				)
			) {
				return { column, row };
			}
		}
	}
	return null;
}

function getRects( { innerBlocks, numColumns, numRows } ) {
	const rects = [];

	for ( const block of innerBlocks ) {
		const layout = block.attributes.style?.layout;
		if ( layout.columnStart && layout.rowStart ) {
			const rect = new GridRect( {
				columnStart: layout.columnStart,
				rowStart: layout.rowStart,
				columnSpan: layout.columnSpan ?? 1,
				rowSpan: layout.rowSpan ?? 1,
			} );
			rects.push( rect );
		}
	}

	for ( const block of innerBlocks ) {
		const layout = block.attributes.style?.layout;
		if ( ! layout.columnStart || ! layout.rowStart ) {
			const naturalPosition = getNaturalPosition( {
				rects,
				numColumns,
				numRows,
				columnStart: layout.columnStart,
				rowStart: layout.rowStart,
				columnSpan: layout.columnSpan ?? 1,
				rowSpan: layout.rowSpan ?? 1,
			} );
			const rect = new GridRect( {
				columnStart: naturalPosition.column,
				rowStart: naturalPosition.row,
				columnSpan: layout.columnSpan ?? 1,
				rowSpan: layout.rowSpan ?? 1,
			} );
			rects.push( rect );
		}
	}

	return rects;
}

function GridVisualizerGrid( { gridClientId, gridElement } ) {
	const [ gridInfo, setGridInfo ] = useState( () =>
		getGridInfo( gridElement )
	);
	const [ isDroppingAllowed, setIsDroppingAllowed ] = useState( false );
	const [ highlightedRect, setHighlightedRect ] = useState( null );

	const { getBlockAttributes, getBlocks } = useSelect( blockEditorStore );
	const { updateBlockAttributes, moveBlockToPosition } =
		useDispatch( blockEditorStore );

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
			className={ classnames( 'block-editor-grid-visualizer', {
				'is-dropping-allowed': isDroppingAllowed,
			} ) }
			clientId={ gridClientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<div
				className="block-editor-grid-visualizer__grid"
				style={ gridInfo.style }
			>
				{ range( 1, gridInfo.numRows ).map( ( row ) =>
					range( 1, gridInfo.numColumns ).map( ( column ) => (
						<GridVisualizerCell
							key={ `${ row }-${ column }` }
							isHighlighted={
								highlightedRect?.contains( column, row ) ??
								false
							}
							validateDrag={ ( srcClientId ) => {
								const attributes =
									getBlockAttributes( srcClientId );
								const rect = new GridRect( {
									columnStart: column,
									rowStart: row,
									columnSpan:
										attributes.style?.layout?.columnSpan,
									rowSpan: attributes.style?.layout?.rowSpan,
								} );

								const isInBounds = new GridRect( {
									columnSpan: gridInfo.numColumns,
									rowSpan: gridInfo.numRows,
								} ).containsRect( rect );
								if ( ! isInBounds ) {
									return false;
								}

								const isOverlapping = Array.from(
									gridElement.children
								).some(
									( child ) =>
										child.dataset.block !== srcClientId &&
										rect.intersectsRect(
											getGridItemRect( child )
										)
								);
								if ( isOverlapping ) {
									return false;
								}

								return true;
							} }
							onDragEnter={ ( srcClientId ) => {
								const attributes =
									getBlockAttributes( srcClientId );
								setHighlightedRect(
									new GridRect( {
										columnStart: column,
										rowStart: row,
										columnSpan:
											attributes.style?.layout
												?.columnSpan,
										rowSpan:
											attributes.style?.layout?.rowSpan,
									} )
								);
							} }
							onDragLeave={ () => {
								// onDragEnter can be called before onDragLeave if the user moves
								// their mouse quickly, so only clear the highlight if it was set
								// by this cell.
								setHighlightedRect( ( prevHighlightedRect ) =>
									prevHighlightedRect?.columnStart ===
										column &&
									prevHighlightedRect?.rowStart === row
										? null
										: prevHighlightedRect
								);
							} }
							onDrop={ ( srcClientId ) => {
								// TODO: this is messy

								const attributes =
									getBlockAttributes( srcClientId );

								const blocks = getBlocks( gridClientId ).filter(
									( { clientId } ) => clientId !== srcClientId
								);
								const rects = getRects( {
									innerBlocks: blocks,
									numColumns: gridInfo.numColumns,
									numRows: gridInfo.numRows,
								} );
								console.log( 'rects', rects );
								const naturalPosition = getNaturalPosition( {
									rects,
									numColumns: gridInfo.numColumns,
									numRows: gridInfo.numRows,
									columnSpan:
										attributes.style?.layout?.columnSpan,
									rowSpan: attributes.style?.layout?.rowSpan,
								} );
								console.log(
									'naturalPosition',
									naturalPosition
								);

								if (
									column === naturalPosition?.column &&
									row === naturalPosition?.row
								) {
									console.log(
										'moveBlockToPosition',
										blocks.length
									);
									moveBlockToPosition(
										srcClientId,
										gridClientId,
										gridClientId,
										blocks.length
									);
									if (
										attributes.style?.layout?.columnStart ||
										attributes.style?.layout?.rowStart
									) {
										const {
											columnStart,
											rowStart,
											...layout
										} = attributes.style.layout;
										updateBlockAttributes( srcClientId, {
											style: {
												...attributes.style,
												layout,
											},
										} );
									}
								} else {
									console.log(
										'updateBlockAttributes',
										column,
										row
									);
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
								}

								setHighlightedRect( null );
							} }
						/>
					) )
				) }
			</div>
		</BlockPopoverCover>
	);
}

function GridVisualizerCell( {
	isHighlighted,
	validateDrag,
	onDragEnter,
	onDragLeave,
	onDrop,
} ) {
	const { getDraggedBlockClientIds } = useSelect( blockEditorStore );

	const ref = useDropZone( {
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

	return (
		<div className="block-editor-grid-visualizer__cell">
			<div
				ref={ ref }
				className={ classnames(
					'block-editor-grid-visualizer__drop-zone',
					{
						'is-highlighted': isHighlighted,
					}
				) }
			/>
		</div>
	);
}
