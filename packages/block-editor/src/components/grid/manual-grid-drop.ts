import { isPlainObject } from '../../utils/object';
import { getGridMeasurement, GridRect } from './utils';
import { getGridSpan, measureGridItemAtWidth } from './grid-item-size';

function isPositiveInteger( value: unknown ): value is number {
	return typeof value === 'number' && Number.isInteger( value ) && value > 0;
}

function getSpan( value: unknown ): number {
	return isPositiveInteger( value ) ? value : 1;
}

/**
 * Gets a drop placement within the grid's columns, allowing additional rows.
 * Find a compact width without changing the block's rendered height or
 * introducing overflow. Temporary styles are restored before painting.
 *
 * @param gridElement  Destination grid.
 * @param blockElement Dragged block's element, if rendered.
 * @param layout       Dragged block's resolved layout style.
 * @param column       Hovered column.
 * @param row          Hovered row.
 * @param columnCount  Number of destination columns.
 * @return Drop placement, including the block's spans.
 */
export function getManualGridDropRect(
	gridElement: Element,
	blockElement: Element | null | undefined,
	layout: unknown,
	column: number,
	row: number,
	columnCount: number
): GridRect {
	const itemLayout = isPlainObject( layout ) ? layout : {};
	let columnSpan = Math.min( getSpan( itemLayout.columnSpan ), columnCount );
	let rowSpan = getSpan( itemLayout.rowSpan );
	const getRect = () =>
		new GridRect( {
			columnStart: Math.min( column, columnCount - columnSpan + 1 ),
			rowStart: row,
			columnSpan,
			rowSpan,
		} );
	// Items already in this grid retain their size, including user overrides.
	if ( ! blockElement || blockElement.parentElement === gridElement ) {
		return getRect();
	}
	const view = gridElement.ownerDocument.defaultView;
	const sourceView = blockElement.ownerDocument.defaultView;
	if (
		! view ||
		! ( gridElement instanceof view.HTMLElement ) ||
		! sourceView ||
		! ( blockElement instanceof sourceView.HTMLElement )
	) {
		return getRect();
	}
	const measurement = getGridMeasurement( gridElement );
	const columnWidth = measurement
		? measurement.columns[ 0 ]?.end - measurement.columns[ 0 ]?.start
		: 0;
	const rowHeight = measurement
		? measurement.rows[ 0 ]?.end - measurement.rows[ 0 ]?.start
		: 0;
	const renderedWidth = blockElement.offsetWidth;
	const renderedHeight = blockElement.offsetHeight;
	if (
		! Number.isFinite( columnWidth ) ||
		! Number.isFinite( rowHeight ) ||
		columnWidth <= 0 ||
		rowHeight <= 0 ||
		renderedWidth <= 0
	) {
		return getRect();
	}
	const computedStyle = view.getComputedStyle( gridElement );
	const columnGap =
		measurement?.columns[ 1 ] !== undefined
			? measurement.columns[ 1 ].start - columnWidth
			: parseFloat( computedStyle.columnGap ) || 0;
	const rowGap =
		measurement?.rows[ 1 ] !== undefined
			? measurement.rows[ 1 ].start - rowHeight
			: parseFloat( computedStyle.rowGap ) || 0;
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
		} else {
			minimumSpan = candidateSpan + 1;
		}
	}
	columnSpan = minimumSpan;
	const dimensions = measureGridItemAtWidth(
		blockElement,
		getWidth( columnSpan )
	);
	rowSpan = Math.max(
		rowSpan,
		getGridSpan(
			Math.max( dimensions.offsetHeight, dimensions.scrollHeight ),
			rowHeight,
			rowGap
		)
	);
	return getRect();
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
	items: { rect: GridRect; layout: unknown }[],
	column: number,
	row: number,
	columnCount: number,
	preserveRelativePositions: boolean
): GridRect[] {
	if ( ! items.length ) {
		return [];
	}

	if ( preserveRelativePositions ) {
		const sourceRects = items.map( ( { rect, layout } ) => {
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
				columnSpan: rect.columnSpan,
				rowSpan: rect.rowSpan,
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
		columnCount - items[ 0 ].rect.columnSpan + 1
	);
	let nextRow = row;
	let rowSpan = 0;
	return items.map( ( { rect } ) => {
		if ( nextColumn + rect.columnSpan - 1 > columnCount ) {
			nextColumn = 1;
			nextRow += rowSpan;
			rowSpan = 0;
		}
		const placement = new GridRect( {
			columnStart: nextColumn,
			rowStart: nextRow,
			columnSpan: rect.columnSpan,
			rowSpan: rect.rowSpan,
		} );
		nextColumn += rect.columnSpan;
		rowSpan = Math.max( rowSpan, rect.rowSpan );
		return placement;
	} );
}
