import { isPlainObject } from '../../utils/object';
import { getGridMeasurement, GridRect } from './utils';
import { getGridSpan, measureGridItemAtWidth } from './grid-item-size';
import type { GridItemDimensions } from './types';

export interface GridDropTrackSizes {
	columnWidth: number;
	columnGap: number;
	rowHeight: number;
	rowGap: number;
}

export interface GridDropSpans {
	columnSpan: number;
	rowSpan: number;
}

function isPositiveInteger( value: unknown ): value is number {
	return typeof value === 'number' && Number.isInteger( value ) && value > 0;
}

function getSpan( value: unknown ): number {
	return isPositiveInteger( value ) ? value : 1;
}

/**
 * Reads the destination track sizes and gaps shared by incoming blocks.
 *
 * @param gridElement Destination grid.
 * @return Track sizes and gaps, or null if the grid can't be measured.
 */
export function getManualGridDropTrackSizes(
	gridElement: Element
): GridDropTrackSizes | null {
	const view = gridElement.ownerDocument.defaultView;
	if ( ! view || ! ( gridElement instanceof view.HTMLElement ) ) {
		return null;
	}
	const computedStyle = view.getComputedStyle( gridElement );
	const measurement = getGridMeasurement( gridElement, false, computedStyle );
	if ( ! measurement ) {
		return null;
	}
	const { columns, rows } = measurement;
	const columnWidth = columns[ 0 ]?.end - columns[ 0 ]?.start;
	const rowHeight = rows[ 0 ]?.end - rows[ 0 ]?.start;
	if (
		! Number.isFinite( columnWidth ) ||
		! Number.isFinite( rowHeight ) ||
		columnWidth <= 0 ||
		rowHeight <= 0
	) {
		return null;
	}
	return {
		columnWidth,
		rowHeight,
		columnGap: columns[ 1 ]
			? columns[ 1 ].start - columnWidth
			: parseFloat( computedStyle.columnGap ) || 0,
		rowGap: rows[ 1 ]
			? rows[ 1 ].start - rowHeight
			: parseFloat( computedStyle.rowGap ) || 0,
	};
}

/**
 * Finds a compact width for an incoming block without changing its rendered
 * height or introducing overflow. Temporary styles are restored before painting.
 *
 * @param blockElement Incoming block's element, if it can be measured.
 * @param layout       Dragged block's resolved layout style.
 * @param columnCount  Number of destination columns.
 * @param trackSizes   Measured destination track sizes and gaps.
 * @return Column and row spans for the dragged block.
 */
export function getManualGridDropSpans(
	blockElement: Element | null | undefined,
	layout: unknown,
	columnCount: number,
	trackSizes: GridDropTrackSizes | null | undefined
): GridDropSpans {
	const itemLayout = isPlainObject( layout ) ? layout : {};
	const columnSpan = Math.min(
		getSpan( itemLayout.columnSpan ),
		columnCount
	);
	const rowSpan = getSpan( itemLayout.rowSpan );
	const sourceView = blockElement?.ownerDocument.defaultView;
	if (
		! trackSizes ||
		! sourceView ||
		! ( blockElement instanceof sourceView.HTMLElement )
	) {
		return { columnSpan, rowSpan };
	}
	const renderedWidth = blockElement.offsetWidth;
	if ( renderedWidth <= 0 ) {
		return { columnSpan, rowSpan };
	}
	const { columnWidth, columnGap, rowHeight, rowGap } = trackSizes;
	const renderedHeight = blockElement.offsetHeight;
	const renderedContentHeight = Math.max(
		renderedHeight,
		blockElement.scrollHeight
	);
	const getWidth = ( span: number ) =>
		span * ( columnWidth + columnGap ) - columnGap;

	let minimumSpan = columnSpan;
	let maximumSpan = Math.min(
		columnCount,
		Math.max(
			columnSpan,
			getGridSpan( renderedWidth, columnWidth, columnGap )
		)
	);
	// Narrow content can have a full-width wrapper. Search by layout rather
	// than markup or intrinsic width, which can depend on percentage sizing.
	// A binary search bounds layout work as the number of columns grows.
	let fittingMeasurement:
		{ width: number; dimensions: GridItemDimensions } | undefined;
	while ( minimumSpan < maximumSpan ) {
		const candidateSpan = Math.floor( ( minimumSpan + maximumSpan ) / 2 );
		const width = Math.min( renderedWidth, getWidth( candidateSpan ) );
		const dimensions = measureGridItemAtWidth( blockElement, width );
		const fits =
			Math.abs( dimensions.offsetHeight - renderedHeight ) <= 1 &&
			dimensions.offsetWidth <= width + 1 &&
			dimensions.scrollWidth <= width + 1 &&
			dimensions.scrollHeight <= renderedContentHeight + 1;
		if ( fits ) {
			maximumSpan = candidateSpan;
			fittingMeasurement = { width, dimensions };
		} else {
			minimumSpan = candidateSpan + 1;
		}
	}
	const width = getWidth( minimumSpan );
	const dimensions =
		fittingMeasurement?.width === width
			? fittingMeasurement.dimensions
			: measureGridItemAtWidth( blockElement, width );
	return {
		columnSpan: minimumSpan,
		rowSpan: Math.max(
			rowSpan,
			getGridSpan(
				Math.max( dimensions.offsetHeight, dimensions.scrollHeight ),
				rowHeight,
				rowGap
			)
		),
	};
}

/**
 * Places a selection within the grid's columns, allowing additional rows.
 * Existing manual placements move together; other selections fill rows in order.
 *
 * @param items                     Measured footprints and source layouts.
 * @param column                    Hovered column.
 * @param row                       Hovered row.
 * @param columnCount               Number of destination columns.
 * @param preserveRelativePositions Whether the source uses manual placement.
 * @return A placement for every dragged block, in selection order.
 */
export function getManualGridDropRects(
	items: { spans: GridDropSpans; layout: unknown }[],
	column: number,
	row: number,
	columnCount: number,
	preserveRelativePositions: boolean
): GridRect[] {
	if ( ! items.length ) {
		return [];
	}

	if ( preserveRelativePositions ) {
		const sourceRects = items.map( ( { spans, layout } ) => {
			if (
				! isPlainObject( layout ) ||
				! isPositiveInteger( layout.columnStart ) ||
				! isPositiveInteger( layout.rowStart )
			) {
				return null;
			}
			return new GridRect( {
				columnStart: layout.columnStart,
				rowStart: layout.rowStart,
				...spans,
			} );
		} );
		if ( sourceRects.every( ( rect ) => rect !== null ) ) {
			let left = Infinity;
			let top = Infinity;
			let right = 0;
			for ( const rect of sourceRects ) {
				left = Math.min( left, rect.columnStart );
				top = Math.min( top, rect.rowStart );
				right = Math.max( right, rect.columnEnd );
			}
			const width = right - left + 1;
			if ( width <= columnCount ) {
				const columnOffset =
					Math.min( column, columnCount - width + 1 ) - left;
				return sourceRects.map(
					( rect ) =>
						new GridRect( {
							columnStart: rect.columnStart + columnOffset,
							rowStart: rect.rowStart + row - top,
							columnSpan: rect.columnSpan,
							rowSpan: rect.rowSpan,
						} )
				);
			}
		}
	}

	let nextColumn = Math.min(
		column,
		columnCount - items[ 0 ].spans.columnSpan + 1
	);
	let nextRow = row;
	let rowSpan = 0;
	return items.map( ( { spans } ) => {
		if ( nextColumn + spans.columnSpan - 1 > columnCount ) {
			nextColumn = 1;
			nextRow += rowSpan;
			rowSpan = 0;
		}
		const placement = new GridRect( {
			columnStart: nextColumn,
			rowStart: nextRow,
			...spans,
		} );
		nextColumn += spans.columnSpan;
		rowSpan = Math.max( rowSpan, spans.rowSpan );
		return placement;
	} );
}
