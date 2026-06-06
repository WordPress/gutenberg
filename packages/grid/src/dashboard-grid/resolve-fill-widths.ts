/**
 * Internal dependencies
 */
import type { DashboardGridLayoutItem } from './types';

/**
 * Resolves items with `width: 'fill'` by computing how many columns they
 * should span. Simulates CSS Grid's row-sparse auto-flow placement so the
 * resolved span matches the free run that CSS Grid will actually use.
 *
 * Two paths:
 * - Fast path (no `height > 1` items): single-row column tracker, O(n).
 *   Each fixed item between two fills is visited at most once by a fill's
 *   look-ahead.
 * - Multi-row path (any item with `height > 1`): per-column skyline that
 *   tracks shadow occupation of tall tiles. Placement scans rows in
 *   row-major order, so worst-case cost depends on both columns and rows
 *   scanned (rows bounded by the sum of item heights), not only on
 *   `maxColumns`.
 *
 * @param sortedKeys - Item keys in display order.
 * @param layoutMap  - Map of key to DashboardGridLayoutItem.
 * @param maxColumns - Total columns in the grid.
 * @return Map of fill item keys to their resolved column spans.
 */
export function resolveFillWidths(
	sortedKeys: string[],
	layoutMap: Map< string, DashboardGridLayoutItem >,
	maxColumns: number
): Map< string, number > {
	const resolved = new Map< string, number >();
	const n = sortedKeys.length;

	// Pre-extract items, clamp widths and heights, detect which path to take.
	const items = new Array< DashboardGridLayoutItem | undefined >( n );
	const widths = new Array< number >( n );
	const heights = new Array< number >( n );
	let hasFill = false;
	let hasMultiRow = false;
	let totalRows = 0;

	for ( let i = 0; i < n; i++ ) {
		const item = layoutMap.get( sortedKeys[ i ] );
		items[ i ] = item;
		widths[ i ] =
			item && typeof item.width === 'number'
				? Math.min( item.width, maxColumns )
				: 1;
		// Clamp to a positive integer so `0`, fractional, or negative
		// values match the `|| 1` defaulting used in GridItem styles.
		const h = Math.max( 1, Math.floor( item?.height ?? 1 ) );
		heights[ i ] = h;
		if ( item?.width === 'fill' ) {
			hasFill = true;
		}
		if ( h > 1 ) {
			hasMultiRow = true;
		}
		totalRows += h;
	}

	if ( ! hasFill ) {
		return resolved;
	}

	if ( ! hasMultiRow ) {
		let currentCol = 0;

		for ( let i = 0; i < n; i++ ) {
			const item = items[ i ];
			if ( ! item ) {
				continue;
			}

			if ( item.width === 'full' ) {
				currentCol = 0;
				continue;
			}

			if ( item.width === 'fill' ) {
				let reserved = 0;
				for ( let j = i + 1; j < n; j++ ) {
					const next = items[ j ];
					if (
						! next ||
						next.width === 'full' ||
						next.width === 'fill'
					) {
						break;
					}
					const nextW = widths[ j ];
					if ( currentCol + 1 + reserved + nextW <= maxColumns ) {
						reserved += nextW;
					} else {
						break;
					}
				}
				const fillCols = Math.max(
					1,
					maxColumns - currentCol - reserved
				);
				resolved.set( item.key, fillCols );
				currentCol += fillCols;
			} else {
				const w = widths[ i ];
				if ( currentCol + w > maxColumns ) {
					currentCol = 0;
				}
				currentCol += w;
			}

			if ( currentCol >= maxColumns ) {
				currentCol = 0;
			}
		}

		return resolved;
	}

	// `rowOccupancy[ col ]` is the index of the next free row at that
	// column; rows below it are taken by previously placed items. This
	// captures the "shadow" of tall tiles into the rows they span.
	const rowOccupancy = new Array< number >( maxColumns ).fill( 0 );
	let cursorRow = 0;
	let cursorCol = 0;

	for ( let i = 0; i < n; i++ ) {
		const item = items[ i ];
		if ( ! item ) {
			continue;
		}

		const h = heights[ i ];

		if ( item.width === 'full' ) {
			let r = cursorRow;
			for ( let c = 0; c < maxColumns; c++ ) {
				if ( rowOccupancy[ c ] > r ) {
					r = rowOccupancy[ c ];
				}
			}
			for ( let c = 0; c < maxColumns; c++ ) {
				rowOccupancy[ c ] = r + h;
			}
			cursorRow = r + h;
			cursorCol = 0;
			continue;
		}

		if ( item.width === 'fill' ) {
			let r = cursorRow;
			let c = cursorCol;
			scan: for ( ; r <= totalRows; r++ ) {
				const start = r === cursorRow ? cursorCol : 0;
				for ( c = start; c < maxColumns; c++ ) {
					if ( rowOccupancy[ c ] <= r ) {
						break scan;
					}
				}
			}
			const fillStartRow = r;
			const fillStartCol = c;
			let runLength = 0;
			while (
				fillStartCol + runLength < maxColumns &&
				rowOccupancy[ fillStartCol + runLength ] <= fillStartRow
			) {
				runLength++;
			}
			let reserved = 0;
			for ( let j = i + 1; j < n; j++ ) {
				const next = items[ j ];
				if (
					! next ||
					next.width === 'full' ||
					next.width === 'fill'
				) {
					break;
				}
				const nextW = widths[ j ];
				if ( 1 + reserved + nextW <= runLength ) {
					reserved += nextW;
				} else {
					break;
				}
			}
			const fillCols = Math.max( 1, runLength - reserved );
			resolved.set( item.key, fillCols );
			for ( let k = 0; k < fillCols; k++ ) {
				rowOccupancy[ fillStartCol + k ] = fillStartRow + h;
			}
			cursorRow = fillStartRow;
			cursorCol = fillStartCol + fillCols;
			continue;
		}

		const w = widths[ i ];
		let r = cursorRow;
		let c = cursorCol;
		place: for ( ; r <= totalRows; r++ ) {
			c = r === cursorRow ? cursorCol : 0;
			while ( c + w <= maxColumns ) {
				let blocked = -1;
				for ( let k = 0; k < w; k++ ) {
					if ( rowOccupancy[ c + k ] > r ) {
						blocked = c + k;
						break;
					}
				}
				if ( blocked === -1 ) {
					break place;
				}
				c = blocked + 1;
			}
		}
		for ( let k = 0; k < w; k++ ) {
			rowOccupancy[ c + k ] = r + h;
		}
		cursorRow = r;
		cursorCol = c + w;
	}

	return resolved;
}
