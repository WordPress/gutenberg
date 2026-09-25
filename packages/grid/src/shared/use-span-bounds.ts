import { useMemo } from '@wordpress/element';
import {
	pixelLimitsToSpanBounds,
	spanBoundsToPixelLimits,
} from './resize-snap';
import type { ResizePixelLimits, SpanBounds } from './resize-snap';
import type { GridItemLimits } from './types';

const NO_BOUNDS: ReadonlyMap< string, SpanBounds > = new Map();
const NO_LIMITS: ReadonlyMap< string, ResizePixelLimits > = new Map();

/**
 * Quantizes per-item pixel limits to span bounds for the current
 * geometry. The map keeps its identity while every bound is unchanged,
 * so container width ticks and fresh `itemLimits` objects do not
 * invalidate the layout memos or the sortable context downstream.
 *
 * @param itemLimits  Per-item pixel limits, keyed by layout item key.
 * @param columnWidth Width of one column track in pixels.
 * @param gapPx       Gap between tracks in pixels.
 * @param rowHeightPx Row track height in pixels, or `null` when rows
 *                    are content-sized.
 * @param maxColumns  Number of column tracks in the surface.
 */
export function useSpanBounds(
	itemLimits: Record< string, GridItemLimits > | undefined,
	columnWidth: number,
	gapPx: number,
	rowHeightPx: number | null,
	maxColumns: number
): ReadonlyMap< string, SpanBounds > {
	const computed = useMemo( () => {
		if ( ! itemLimits ) {
			return NO_BOUNDS;
		}
		const map = new Map< string, SpanBounds >();
		for ( const [ key, limits ] of Object.entries( itemLimits ) ) {
			map.set(
				key,
				pixelLimitsToSpanBounds(
					limits,
					columnWidth,
					gapPx,
					rowHeightPx,
					maxColumns
				)
			);
		}
		return map;
	}, [ itemLimits, columnWidth, gapPx, rowHeightPx, maxColumns ] );

	const signature = useMemo( () => {
		let value = '';
		for ( const [ key, bounds ] of computed ) {
			value += `${ key }:${ bounds.minWidth }:${ bounds.minHeight }:${ bounds.maxWidth }:${ bounds.maxHeight }|`;
		}
		return value;
	}, [ computed ] );

	// eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` encodes every bound; `computed` changes identity on geometry ticks that leave the bounds unchanged.
	return useMemo( () => computed, [ signature ] );
}

/**
 * Pixel limits for the resize gesture of every bounded item. Tracks
 * the continuous geometry, but only recomputes when it changes, not on
 * every gesture frame.
 *
 * @param spanBounds  Span bounds per item key.
 * @param columnWidth Width of one column track in pixels.
 * @param gapPx       Gap between tracks in pixels.
 * @param rowHeightPx Row track height in pixels, or `null` when rows
 *                    are content-sized.
 */
export function useResizePixelLimits(
	spanBounds: ReadonlyMap< string, SpanBounds >,
	columnWidth: number,
	gapPx: number,
	rowHeightPx: number | null
): ReadonlyMap< string, ResizePixelLimits > {
	return useMemo( () => {
		if ( spanBounds.size === 0 ) {
			return NO_LIMITS;
		}
		const map = new Map< string, ResizePixelLimits >();
		for ( const [ key, bounds ] of spanBounds ) {
			map.set(
				key,
				spanBoundsToPixelLimits(
					bounds,
					columnWidth,
					gapPx,
					rowHeightPx
				)
			);
		}
		return map;
	}, [ spanBounds, columnWidth, gapPx, rowHeightPx ] );
}
