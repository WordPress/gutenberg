import type { HorizontalStep, Rect, Rows } from './types';

/**
 * Column counts a canvas can get. 12 represents halves, thirds, quarters and
 * sixths, and is what a new Canvas has. 14 and 16 can put the wide edges of a
 * full width section on lines where 12 can't.
 */
export const COLUMN_COUNTS = [ 12, 14, 16 ];

/**
 * How much less snapping error, in pixels, another column count needs than
 * 12 to be chosen.
 */
const COLUMN_COUNT_PREFERENCE = 8;

// Rows end at the first line below the content, with this much tolerance.
const ROW_TOLERANCE = 2;

/**
 * The first and last column of an item.
 */
export interface Columns {
	columnStart: number;
	columnEnd: number;
}

type TrackHeight = ( rowCount: number ) => number;

interface PlacedItem extends Columns {
	index: number;
	rowStart: number;
	rowEnd: number;
}

function clamp( value: number, min: number, max: number ) {
	return Math.min( max, Math.max( min, value ) );
}

// How far a position in columns is from the nearest line, in pixels.
function getSnapError( position: number, pitch: number ) {
	return Math.abs( position - Math.round( position ) ) * pitch;
}

/**
 * Resolves an item's horizontal steps to the columns it takes on a grid.
 *
 * Steps are snapped one after another, each inside the columns the previous
 * ones left, so that Columns split their columns exactly and centered blocks
 * stay centered.
 *
 * @param steps       The steps.
 * @param columnCount The grid's column count.
 * @param pitch       Width of a column and a gap, in pixels.
 * @return The first and last column, and how far, in pixels, the item's edges moved.
 */
export function resolveColumns(
	steps: HorizontalStep[],
	columnCount: number,
	pitch: number
): Columns & { error: number } {
	let first = 1;
	let last = columnCount;
	let error = 0;
	for ( const step of steps ) {
		const count = last - first + 1;
		if ( step.type === 'measured' ) {
			const start = step.start * columnCount;
			const end = step.end * columnCount;
			first = clamp( Math.round( start ) + 1, 1, columnCount );
			last = clamp( Math.round( end ), first, columnCount );
			error += getSnapError( start, pitch ) + getSnapError( end, pitch );
		} else if ( step.type === 'split' ) {
			const start = step.start * count;
			const end = step.end * count;
			const nextFirst =
				first + clamp( Math.round( start ), 0, count - 1 );
			last = clamp( first + Math.round( end ) - 1, nextFirst, last );
			first = nextFirst;
			error += getSnapError( start, pitch ) + getSnapError( end, pitch );
		} else {
			const ideal = step.size * count;
			let span = clamp( Math.round( ideal ), 1, count );
			// A centered span leaves the same number of columns on each side.
			if ( step.type === 'center' && ( count - span ) % 2 ) {
				span = [ span + 1, span - 1 ]
					.filter(
						( candidate ) => candidate >= 1 && candidate <= count
					)
					.reduce( ( best, candidate ) =>
						Math.abs( candidate - ideal ) < Math.abs( best - ideal )
							? candidate
							: best
					);
			}
			error += Math.abs( ideal - span ) * pitch;
			if ( step.type === 'start' ) {
				last = first + span - 1;
			} else if ( step.type === 'end' ) {
				first = last - span + 1;
			} else {
				first += ( count - span ) / 2;
				last = first + span - 1;
			}
		}
	}
	return { columnStart: first, columnEnd: last, error };
}

/**
 * Chooses the column count that puts the items' edges closest to lines,
 * preferring 12.
 *
 * @param itemSteps      Each item's steps.
 * @param geometry
 * @param geometry.width Width of the canvas's content box.
 * @param geometry.gap   The canvas's column gap.
 * @return The column count.
 */
export function chooseColumnCount(
	itemSteps: HorizontalStep[][],
	{ width, gap }: { width: number; gap: number }
): number {
	const scores = COLUMN_COUNTS.map( ( columnCount, index ) => {
		const pitch = ( width + gap ) / columnCount;
		const error = itemSteps.reduce(
			( sum, steps ) =>
				sum + resolveColumns( steps, columnCount, pitch ).error,
			0
		);
		return {
			columnCount,
			score: error + ( index === 0 ? 0 : COLUMN_COUNT_PREFERENCE ),
		};
	} );
	return scores.reduce( ( best, score ) =>
		score.score < best.score ? score : best
	).columnCount;
}

/**
 * Sizes of a grid whose cells take their size from its width.
 */
export interface TrackGeometry {
	/** The grid's column count. */
	columnCount: number;
	/** Width of the grid's content box. */
	width: number;
	/** Width of the grid's border box. */
	borderWidth: number;
	/** Vertical padding and borders, together. */
	blockInset: number;
	/** Whether the grid uses `box-sizing: border-box`. */
	isBorderBox: boolean;
	/** The grid's row gap. */
	rowGap: number;
}

/**
 * Gets the height of a row of a grid whose cells take their size from its
 * width: the grid has `aspect-ratio: columns / rows`, which sizes its border
 * box when it uses `box-sizing: border-box`.
 *
 * @param rowCount The grid's row count.
 * @param geometry The grid's sizes.
 * @return The row height.
 */
export function getTrackHeight(
	rowCount: number,
	geometry: TrackGeometry
): number {
	const { columnCount, width, borderWidth, blockInset, isBorderBox, rowGap } =
		geometry;
	const boxHeight =
		( ( isBorderBox ? borderWidth : width ) * rowCount ) / columnCount;
	const contentHeight = boxHeight - ( isBorderBox ? blockInset : 0 );
	return ( contentHeight - ( rowCount - 1 ) * rowGap ) / rowCount;
}

// Padding can leave no room for rows when there are few of them; a tiny pitch
// then asks for more rows.
function getPitch(
	trackHeight: TrackHeight,
	rowCount: number,
	rowGap: number
) {
	return Math.max( 1, trackHeight( rowCount ) + rowGap );
}

function getRowSpanForHeight( height: number, pitch: number, rowGap: number ) {
	return Math.max(
		1,
		Math.ceil( ( height + rowGap - ROW_TOLERANCE ) / pitch )
	);
}

function intersects(
	a: Columns & { rowStart: number; rowEnd: number },
	b: Columns & { rowStart: number; rowEnd: number }
) {
	return (
		a.columnStart <= b.columnEnd &&
		a.columnEnd >= b.columnStart &&
		a.rowStart <= b.rowEnd &&
		a.rowEnd >= b.rowStart
	);
}

/**
 * Moves an item below the items it now overlaps, but didn't overlap before,
 * until it overlaps none of them.
 *
 * @param item           The item, with its columns and rows.
 * @param placed         Items placed so far.
 * @param overlapsBefore Whether the item overlapped another before.
 */
function pushDown(
	item: PlacedItem,
	placed: PlacedItem[],
	overlapsBefore: ( other: PlacedItem ) => boolean
) {
	const span = item.rowEnd - item.rowStart;
	let isMoved = true;
	while ( isMoved ) {
		isMoved = false;
		for ( const other of placed ) {
			if ( intersects( item, other ) && ! overlapsBefore( other ) ) {
				item.rowStart = other.rowEnd + 1;
				item.rowEnd = item.rowStart + span;
				isMoved = true;
			}
		}
	}
}

/**
 * Finds the smallest row count whose rows hold every item. Row heights
 * depend on the row count, so it is found by iteration, and the items' rows
 * are returned in the order the items were given.
 *
 * @param place           Places the items with a row count.
 * @param initialRowCount Row count to start from.
 * @return Each item's rows, and the row count.
 */
function fitRowCount(
	place: ( rowCount: number ) => PlacedItem[],
	initialRowCount: number
): { rows: Rows[]; rowCount: number } {
	let rowCount = Math.max( 1, initialRowCount );
	const tried = new Set< number >();
	let placed = place( rowCount );
	for ( let i = 0; i < 50; i++ ) {
		const needed = Math.max( 1, ...placed.map( ( item ) => item.rowEnd ) );
		if ( needed === rowCount ) {
			break;
		}
		tried.add( rowCount );
		if ( tried.has( needed ) ) {
			// Settle between two counts on the larger one, which holds both.
			rowCount = Math.max( rowCount, needed );
			placed = place( rowCount );
			break;
		}
		rowCount = needed;
		placed = place( rowCount );
	}
	const rows: Rows[] = [];
	for ( const item of placed ) {
		rows[ item.index ] = {
			rowStart: item.rowStart,
			rowSpan: item.rowEnd - item.rowStart + 1,
		};
	}
	return { rows, rowCount };
}

/**
 * Places items on the rows of a grid, where they were on screen.
 *
 * Each item starts at the line nearest its top and ends at the first line
 * below its content, so content is never cut short. Items that didn't overlap
 * before are moved down until they don't overlap after; items that did, keep
 * overlapping, which the canvas allows.
 *
 * @param boxes               Items with their rectangle on screen, relative to the canvas's content box, and their columns.
 * @param options
 * @param options.trackHeight Row height for a row count.
 * @param options.rowGap      The grid's row gap.
 * @return Each item's rows, in the order given, and the grid's row count.
 */
export function placeRows(
	boxes: Array< Rect & Columns >,
	{ trackHeight, rowGap }: { trackHeight: TrackHeight; rowGap: number }
): { rows: Rows[]; rowCount: number } {
	const bottom = Math.max( 0, ...boxes.map( ( box ) => box.bottom ) );
	// With many rows, padding hardly changes the row height.
	const estimate = Math.ceil(
		( bottom + rowGap ) / getPitch( trackHeight, 1000, rowGap )
	);
	const order = boxes
		.map( ( box, index ) => index )
		.sort( ( a, b ) => boxes[ a ].top - boxes[ b ].top || a - b );
	const overlappedBefore = ( a: Rect, b: Rect ) =>
		a.left < b.right - 1 &&
		a.right > b.left + 1 &&
		a.top < b.bottom - 1 &&
		a.bottom > b.top + 1;

	return fitRowCount( ( rowCount ) => {
		const pitch = getPitch( trackHeight, rowCount, rowGap );
		const placed: PlacedItem[] = [];
		for ( const index of order ) {
			const box = boxes[ index ];
			const rowStart = Math.max( 1, Math.round( box.top / pitch ) + 1 );
			const rowEnd = Math.max(
				rowStart +
					getRowSpanForHeight( box.bottom - box.top, pitch, rowGap ) -
					1,
				Math.ceil( ( box.bottom + rowGap - ROW_TOLERANCE ) / pitch )
			);
			const item = {
				index,
				columnStart: box.columnStart,
				columnEnd: box.columnEnd,
				rowStart,
				rowEnd,
			};
			pushDown( item, placed, ( other ) =>
				overlappedBefore( box, boxes[ other.index ] )
			);
			placed.push( item );
		}
		return placed;
	}, estimate );
}

/**
 * Places items on the rows of a grid at a narrower width, where text needs
 * more rows than it did in the original layout.
 *
 * Items keep their columns. An item with a content height takes as many rows
 * as it needs and at least as many as before; any other item keeps its row
 * span. Items move down by as many rows as the items fully above them grew,
 * so rows stay lined up across the grid, and items that didn't overlap before
 * are moved down until they don't overlap after.
 *
 * @param items               Items with their columns and rows in the original layout, and optionally the `height` their content needs.
 * @param options
 * @param options.trackHeight Row height for a row count.
 * @param options.rowGap      The grid's row gap.
 * @param options.rowCount    The original row count.
 * @return Each item's rows, in the order given, and the grid's row count.
 */
export function placeTabletRows(
	items: Array< Columns & Rows & { height?: number } >,
	{
		trackHeight,
		rowGap,
		rowCount,
	}: { trackHeight: TrackHeight; rowGap: number; rowCount: number }
): { rows: Rows[]; rowCount: number } {
	const original = items.map( ( item ) => ( {
		columnStart: item.columnStart,
		columnEnd: item.columnEnd,
		rowStart: item.rowStart,
		rowEnd: item.rowStart + item.rowSpan - 1,
	} ) );
	const order = items
		.map( ( item, index ) => index )
		.sort(
			( a, b ) =>
				items[ a ].rowStart - items[ b ].rowStart ||
				items[ a ].columnStart - items[ b ].columnStart ||
				a - b
		);

	return fitRowCount( ( count ) => {
		const pitch = getPitch( trackHeight, count, rowGap );
		const placed: PlacedItem[] = [];
		for ( const index of order ) {
			const before = original[ index ];
			const { height, rowSpan } = items[ index ];
			const span =
				height === undefined
					? rowSpan
					: Math.max(
							rowSpan,
							getRowSpanForHeight( height, pitch, rowGap )
						);
			const shift = Math.max(
				0,
				...placed
					.filter(
						( other ) =>
							original[ other.index ].rowEnd < before.rowStart
					)
					.map(
						( other ) =>
							other.rowEnd - original[ other.index ].rowEnd
					)
			);
			const item = {
				index,
				columnStart: before.columnStart,
				columnEnd: before.columnEnd,
				rowStart: before.rowStart + shift,
				rowEnd: before.rowStart + shift + span - 1,
			};
			pushDown( item, placed, ( other ) =>
				intersects( before, original[ other.index ] )
			);
			placed.push( item );
		}
		return placed;
	}, rowCount );
}
