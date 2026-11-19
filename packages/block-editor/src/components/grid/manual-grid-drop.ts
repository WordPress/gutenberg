import { isPlainObject } from '../../utils/object';
import { getGridMeasurement, GridRect } from './utils';
import {
	getGridItemRowSpan,
	getGridSpan,
	measureGridItemAtRect,
} from './grid-item-size';

function getSpan( value: unknown ): number {
	return typeof value === 'number' && Number.isInteger( value ) && value > 0
		? value
		: 1;
}

/**
 * Gets a drop placement within the grid's columns, allowing additional rows.
 * Incoming content is measured in a hidden copy of the destination grid so
 * that the real blocks and grid remain in place while dragging.
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
	if ( ! view || ! ( gridElement instanceof view.HTMLElement ) ) {
		return getRect();
	}
	const measurement = getGridMeasurement( gridElement );
	const columnWidth = measurement
		? measurement.columns[ 0 ]?.end - measurement.columns[ 0 ]?.start
		: 0;
	const rowHeight = measurement
		? measurement.rows[ 0 ]?.end - measurement.rows[ 0 ]?.start
		: 0;
	if (
		! Number.isFinite( columnWidth ) ||
		! Number.isFinite( rowHeight ) ||
		columnWidth <= 0 ||
		rowHeight <= 0 ||
		! gridElement.parentElement
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
	const probe = gridElement.cloneNode( false ) as HTMLElement;
	const item = blockElement.cloneNode( true ) as HTMLElement;
	probe.appendChild( item );
	for ( const element of [
		probe,
		...probe.querySelectorAll( '[id], [data-block]' ),
	] ) {
		element.removeAttribute( 'id' );
		element.removeAttribute( 'data-block' );
	}
	probe.inert = true;
	probe.setAttribute( 'aria-hidden', 'true' );
	Object.assign( probe.style, {
		position: 'absolute',
		inset: '0 auto auto 0',
		visibility: 'hidden',
		opacity: '0',
		pointerEvents: 'none',
		contain: 'layout',
		boxSizing: 'border-box',
		width: `${ gridElement.offsetWidth }px`,
		minWidth: '0',
		maxWidth: 'none',
		height: 'auto',
		minHeight: '0',
		aspectRatio: 'auto',
		margin: '0',
		gridTemplateColumns: computedStyle.gridTemplateColumns,
	} );
	gridElement.parentElement.appendChild( probe );
	try {
		const oneCell = measureGridItemAtRect(
			item,
			new GridRect(),
			rowHeight
		);
		// Wrapping content can fit a single column by becoming arbitrarily
		// tall. Measure its preferred width across the grid before choosing
		// spans, so text and flexible containers also get horizontal space.
		const previousWidth = item.style.getPropertyValue( 'width' );
		const previousPriority = item.style.getPropertyPriority( 'width' );
		item.style.setProperty( 'width', 'max-content' );
		const preferredSize = measureGridItemAtRect(
			item,
			new GridRect( { columnSpan: columnCount } ),
			rowHeight
		);
		if ( previousWidth ) {
			item.style.setProperty( 'width', previousWidth, previousPriority );
		} else {
			item.style.removeProperty( 'width' );
		}
		columnSpan = Math.min(
			columnCount,
			Math.max(
				columnSpan,
				getGridSpan(
					Math.max(
						oneCell.offsetWidth,
						oneCell.scrollWidth,
						preferredSize.offsetWidth,
						preferredSize.scrollWidth
					),
					columnWidth,
					columnGap
				)
			)
		);
		const widthRect = new GridRect( { ...getRect(), rowSpan: 1 } );
		const dimensions = measureGridItemAtRect( item, widthRect, rowHeight );
		rowSpan = Math.max(
			rowSpan,
			getGridItemRowSpan(
				item,
				widthRect,
				Math.max( dimensions.offsetHeight, dimensions.scrollHeight ),
				rowHeight,
				rowGap
			)
		);
		return getRect();
	} finally {
		probe.remove();
	}
}
