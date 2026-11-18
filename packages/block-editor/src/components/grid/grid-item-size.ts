import { GridRect } from './utils';
import type { GridItemDimensions } from './types';

/**
 * Gets the number of tracks needed by content, allowing for subpixel rounding.
 *
 * @param contentSize Content size in pixels.
 * @param trackSize   Track size in pixels.
 * @param gap         Gap between tracks in pixels.
 * @return Required span.
 */
export function getGridSpan(
	contentSize: number,
	trackSize: number,
	gap: number
): number {
	return contentSize > trackSize + 1
		? Math.ceil( ( contentSize + gap ) / ( trackSize + gap ) )
		: 1;
}

/**
 * Measures a grid item at a given placement. Temporary styles are restored
 * before the browser paints.
 *
 * @param element   Grid item element.
 * @param rect      Placement to measure.
 * @param rowHeight Height of a grid row in pixels.
 * @return Grid item dimensions.
 */
export function measureGridItemAtRect(
	element: HTMLElement,
	rect: GridRect,
	rowHeight: number
): GridItemDimensions {
	const gridStyle = element.parentElement!.style;
	const overrides: [ CSSStyleDeclaration, string, string ][] = [
		[
			element.style,
			'grid-column',
			`${ rect.columnStart } / span ${ rect.columnSpan }`,
		],
		[
			element.style,
			'grid-row',
			`${ rect.rowStart } / span ${ rect.rowSpan }`,
		],
		// Include implicit rows without letting their size change during measurement.
		[
			gridStyle,
			'grid-template-rows',
			`repeat(${ rect.rowEnd }, ${ rowHeight }px)`,
		],
		[ gridStyle, 'grid-auto-rows', `${ rowHeight }px` ],
	];
	const restoreStyles = overrides.map( ( [ style, property, value ] ) => {
		const previousValue = style.getPropertyValue( property );
		const previousPriority = style.getPropertyPriority( property );
		style.setProperty( property, value );
		return () => {
			if ( previousValue ) {
				style.setProperty( property, previousValue, previousPriority );
			} else {
				style.removeProperty( property );
			}
		};
	} );

	let dimensions: GridItemDimensions;
	try {
		dimensions = {
			offsetWidth: element.offsetWidth,
			offsetHeight: element.offsetHeight,
			scrollWidth: element.scrollWidth,
			scrollHeight: element.scrollHeight,
		};
	} finally {
		restoreStyles.forEach( ( restore ) => restore() );
	}
	return dimensions;
}

/**
 * Gets the content's row span, excluding overflow that cannot be resolved by
 * adding rows (for example, percentage heights combined with margins).
 *
 * @param element       Grid item element.
 * @param rect          Placement at which the content height was measured.
 * @param contentHeight Measured content height in pixels.
 * @param rowHeight     Height of a grid row in pixels.
 * @param rowGap        Gap between rows in pixels.
 * @return Required row span.
 */
export function getGridItemRowSpan(
	element: HTMLElement,
	rect: GridRect,
	contentHeight: number,
	rowHeight: number,
	rowGap: number
): number {
	const rowSpan = getGridSpan( contentHeight, rowHeight, rowGap );
	if ( rowSpan === 1 ) {
		return rowSpan;
	}
	const dimensions = measureGridItemAtRect(
		element,
		new GridRect( { ...rect, rowSpan } ),
		rowHeight
	);
	const expandedHeight = Math.max(
		dimensions.offsetHeight,
		dimensions.scrollHeight
	);
	const overflow =
		expandedHeight - ( rowSpan * ( rowHeight + rowGap ) - rowGap );
	return overflow > 1 && overflow >= contentHeight - rowHeight - 1
		? 1
		: rowSpan;
}
