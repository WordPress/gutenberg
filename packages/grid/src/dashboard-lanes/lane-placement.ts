/**
 * Lane placement algorithm for `display: grid-lanes` polyfill.
 *
 * Implements the source-ordered, shortest-lane placement described in
 * https://webkit.org/blog/17660/introducing-css-grid-lanes/.
 *
 * The skyline + tolerance core is adapted from the CSS Grid Lanes
 * Polyfill by Simon Willison (MIT,
 * https://tools.simonwillison.net/grid-lanes-polyfill.js). The rest
 * of this module is a pure function suitable for unit testing in
 * isolation from any DOM.
 *
 * Concepts:
 * - "Lane" is the cross-axis track: a column in waterfall mode, a row
 *   in brick mode. The algorithm is axis-agnostic; the renderer maps
 *   the chosen lane index plus offset to `grid-column-start` /
 *   `grid-row-start` (or vice versa).
 * - Items are placed in source order. Explicit-lane items are placed
 *   first so auto-placed items can flow around them.
 * - `flowTolerance` is a length: when two candidate lanes differ in
 *   baseline by no more than this, the earlier lane wins (preserves
 *   reading order).
 */

/**
 * A single item to place. Heights are pre-measured by the caller.
 */
export type LanePlacementItem = {
	/**
	 * Stable identity. Returned in the result map.
	 */
	key: string;

	/**
	 * Number of contiguous lanes this item occupies. Clamped to
	 * `[ 1, lanes ]` by the algorithm.
	 */
	span: number;

	/**
	 * Measured cross-axis size (typically pixels). The algorithm only
	 * adds and compares heights; the unit is whatever the caller uses,
	 * as long as `gap` and `flowTolerance` use the same one.
	 */
	height: number;

	/**
	 * Explicit 0-indexed starting lane. When set, the item bypasses
	 * the skyline lookup and is placed at this lane regardless of
	 * source order. Out-of-range values are clamped.
	 */
	lane?: number;
};

/**
 * Algorithm input.
 */
export type LanePlacementInput = {
	/**
	 * Items in source order.
	 */
	items: ReadonlyArray< LanePlacementItem >;

	/**
	 * Total number of lanes. Clamped to `>= 1`.
	 */
	lanes: number;

	/**
	 * Gap between items in the same lane. Same unit as `height`.
	 */
	gap: number;

	/**
	 * Tolerance for source-order tiebreaking. When two candidate
	 * lanes have baselines within this amount, the earlier lane wins.
	 * Defaults to `0` if a negative value is passed.
	 */
	flowTolerance: number;
};

/**
 * Resolved position for a single item.
 */
export type LanePlacement = {
	/**
	 * Mirrors the input key.
	 */
	key: string;

	/**
	 * 0-indexed starting lane. The renderer adds 1 for
	 * `grid-column-start`.
	 */
	lane: number;

	/**
	 * Cross-axis offset from the container's start edge, in the same
	 * unit as the input heights. Use as the item's start position
	 * (e.g. `top`, or `grid-row-start` after dividing by a row unit).
	 */
	top: number;

	/**
	 * Effective span after clamping. Useful for the renderer when the
	 * input span exceeded the lane count.
	 */
	span: number;
};

/**
 * Algorithm output.
 */
export type LanePlacementResult = {
	/**
	 * Per-key placement. Insertion-ordered: the first iteration yields
	 * the explicit items in source order, then the auto items in
	 * source order.
	 */
	placements: Map< string, LanePlacement >;

	/**
	 * Sum of the tallest lane after all items are placed. The renderer
	 * applies this as the container's intrinsic height.
	 */
	totalHeight: number;
};

function clampSpan( span: number, lanes: number ): number {
	if ( ! Number.isFinite( span ) ) {
		return 1;
	}
	return Math.max( 1, Math.min( Math.floor( span ), lanes ) );
}

function clampLane( lane: number, span: number, lanes: number ): number {
	if ( ! Number.isFinite( lane ) ) {
		return 0;
	}
	return Math.max( 0, Math.min( Math.floor( lane ), lanes - span ) );
}

function maxBaselineAcross(
	laneBottoms: ReadonlyArray< number >,
	startLane: number,
	span: number
): number {
	let maxBaseline = 0;
	for ( let i = startLane; i < startLane + span; i++ ) {
		if ( laneBottoms[ i ] > maxBaseline ) {
			maxBaseline = laneBottoms[ i ];
		}
	}
	return maxBaseline;
}

/**
 * Places all items into a fixed lane count using the grid-lanes
 * algorithm: explicit items first, then auto items chosen by the
 * shortest-lane skyline with a tolerance for source order.
 *
 * Pure: no DOM access, no mutation of inputs. Safe to call from a
 * worker or during SSR.
 *
 * @param input Items, lane count, gap, and tolerance.
 * @return Per-key placements plus the resulting total height.
 */
export function computeLanePlacements(
	input: LanePlacementInput
): LanePlacementResult {
	const lanes = Math.max( 1, Math.floor( input.lanes ) );
	const gap = Math.max( 0, input.gap );
	const tolerance = Math.max( 0, input.flowTolerance );

	const laneBottoms = new Array< number >( lanes ).fill( 0 );
	const placements = new Map< string, LanePlacement >();

	const explicitItems: LanePlacementItem[] = [];
	const autoItems: LanePlacementItem[] = [];
	for ( const item of input.items ) {
		if ( item.lane !== undefined ) {
			explicitItems.push( item );
		} else {
			autoItems.push( item );
		}
	}

	for ( const item of explicitItems ) {
		const span = clampSpan( item.span, lanes );
		const lane = clampLane( item.lane as number, span, lanes );
		const baseline = maxBaselineAcross( laneBottoms, lane, span );
		const top = baseline === 0 ? 0 : baseline + gap;
		const height = Math.max( 0, item.height );

		placements.set( item.key, { key: item.key, lane, top, span } );

		const newBottom = top + height;
		for ( let i = lane; i < lane + span; i++ ) {
			laneBottoms[ i ] = newBottom;
		}
	}

	for ( const item of autoItems ) {
		const span = clampSpan( item.span, lanes );
		let bestLane = 0;
		let bestBaseline = Infinity;

		for ( let candidate = 0; candidate <= lanes - span; candidate++ ) {
			const baseline = maxBaselineAcross( laneBottoms, candidate, span );

			// Only take a lane that is strictly shorter beyond
			// tolerance. Within-tolerance ties keep the earlier lane
			// because candidates iterate in lane order, so the first
			// acceptable baseline wins.
			if ( bestBaseline - baseline > tolerance ) {
				bestBaseline = baseline;
				bestLane = candidate;
			}
		}

		const top = bestBaseline === 0 ? 0 : bestBaseline + gap;
		const height = Math.max( 0, item.height );

		placements.set( item.key, {
			key: item.key,
			lane: bestLane,
			top,
			span,
		} );

		const newBottom = top + height;
		for ( let i = bestLane; i < bestLane + span; i++ ) {
			laneBottoms[ i ] = newBottom;
		}
	}

	let totalHeight = 0;
	for ( const bottom of laneBottoms ) {
		if ( bottom > totalHeight ) {
			totalHeight = bottom;
		}
	}

	return { placements, totalHeight };
}
