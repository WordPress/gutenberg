/**
 * Internal dependencies
 */
import type { DashboardGridLayoutItem } from './types';

/**
 * Resolves items with `width: 'fill'` by computing how many columns they
 * should span. Simulates CSS Grid row packing to determine remaining space
 * in each row, then assigns that space to fill items.
 *
 * Complexity: O(n). The inner look-ahead breaks at the next fill or full
 * item, so the fixed items between two fills are scanned exactly once —
 * each fixed item is visited by at most one fill's look-ahead.
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

	// Pre-extract items into a flat array and pre-compute clamped widths.
	// This avoids repeated Map.get() and Math.min() calls in the hot loops.
	const items = new Array< DashboardGridLayoutItem | undefined >( n );
	const widths = new Array< number >( n );
	let hasFill = false;

	for ( let i = 0; i < n; i++ ) {
		const item = layoutMap.get( sortedKeys[ i ] );
		items[ i ] = item;
		widths[ i ] =
			item && typeof item.width === 'number'
				? Math.min( item.width, maxColumns )
				: 1;
		if ( item?.width === 'fill' ) {
			hasFill = true;
		}
	}

	if ( ! hasFill ) {
		return resolved;
	}

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
			// Look ahead: reserve columns for subsequent
			// non-fill items that fit in this row.
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
				// 1 = minimum span for the fill item itself
				if ( currentCol + 1 + reserved + nextW <= maxColumns ) {
					reserved += nextW;
				} else {
					break;
				}
			}

			const fillCols = Math.max( 1, maxColumns - currentCol - reserved );
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
