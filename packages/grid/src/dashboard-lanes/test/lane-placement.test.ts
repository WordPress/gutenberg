/**
 * Internal dependencies
 */
import { computeLanePlacements } from '../lane-placement';
import type { LanePlacementItem } from '../lane-placement';

function items(
	defs: Array< {
		key: string;
		span?: number;
		height: number;
		lane?: number;
	} >
): LanePlacementItem[] {
	return defs.map( ( def ) => ( {
		key: def.key,
		span: def.span ?? 1,
		height: def.height,
		...( def.lane !== undefined ? { lane: def.lane } : {} ),
	} ) );
}

describe( 'computeLanePlacements', () => {
	describe( 'empty and trivial inputs', () => {
		it( 'returns an empty map and zero height for no items', () => {
			const result = computeLanePlacements( {
				items: [],
				lanes: 4,
				gap: 16,
				flowTolerance: 0,
			} );
			expect( result.placements.size ).toBe( 0 );
			expect( result.totalHeight ).toBe( 0 );
		} );

		it( 'places a single item at lane 0, top 0', () => {
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', height: 100 } ] ),
				lanes: 4,
				gap: 16,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' ) ).toEqual( {
				key: 'a',
				lane: 0,
				top: 0,
				span: 1,
			} );
			expect( result.totalHeight ).toBe( 100 );
		} );
	} );

	describe( 'shortest-lane skyline', () => {
		it( 'fills empty lanes left to right when all are zero', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 100 },
					{ key: 'b', height: 100 },
					{ key: 'c', height: 100 },
					{ key: 'd', height: 100 },
				] ),
				lanes: 4,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.lane ).toBe( 0 );
			expect( result.placements.get( 'b' )?.lane ).toBe( 1 );
			expect( result.placements.get( 'c' )?.lane ).toBe( 2 );
			expect( result.placements.get( 'd' )?.lane ).toBe( 3 );
			expect( result.totalHeight ).toBe( 100 );
		} );

		it( 'sends the next item to the shortest lane', () => {
			// After placing tall A in lane 0 and short B in lane 1, the
			// next item must land in lane 1 (the shortest).
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 200 },
					{ key: 'b', height: 50 },
					{ key: 'c', height: 80 },
				] ),
				lanes: 2,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.lane ).toBe( 0 );
			expect( result.placements.get( 'b' )?.lane ).toBe( 1 );
			expect( result.placements.get( 'c' )?.lane ).toBe( 1 );
			expect( result.placements.get( 'c' )?.top ).toBe( 50 );
		} );

		it( 'continues to balance lanes across many items', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 100 },
					{ key: 'b', height: 50 },
					{ key: 'c', height: 30 },
					{ key: 'd', height: 30 },
					{ key: 'e', height: 30 },
				] ),
				lanes: 3,
				gap: 0,
				flowTolerance: 0,
			} );
			// Lanes after each step: a → [100, 0, 0]; b → [100, 50, 0];
			// c → [100, 50, 30]; d → [100, 50, 60]; e → [100, 80, 60].
			expect( result.placements.get( 'a' )?.lane ).toBe( 0 );
			expect( result.placements.get( 'b' )?.lane ).toBe( 1 );
			expect( result.placements.get( 'c' )?.lane ).toBe( 2 );
			expect( result.placements.get( 'd' )?.lane ).toBe( 2 );
			expect( result.placements.get( 'e' )?.lane ).toBe( 1 );
			expect( result.totalHeight ).toBe( 100 );
		} );
	} );

	describe( 'gap accounting', () => {
		it( 'does not add a gap before the first item in a lane', () => {
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', height: 100 } ] ),
				lanes: 1,
				gap: 16,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.top ).toBe( 0 );
		} );

		it( 'adds a single gap between stacked items', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 100 },
					{ key: 'b', height: 50 },
				] ),
				lanes: 1,
				gap: 16,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.top ).toBe( 0 );
			expect( result.placements.get( 'b' )?.top ).toBe( 116 );
			expect( result.totalHeight ).toBe( 166 );
		} );

		it( 'tracks gaps independently per lane', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 100 },
					{ key: 'b', height: 100 },
					{ key: 'c', height: 50 },
				] ),
				lanes: 2,
				gap: 8,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.top ).toBe( 0 );
			expect( result.placements.get( 'b' )?.top ).toBe( 0 );
			// c stacks on the shorter lane; both started at 100 so
			// either is acceptable, but with tolerance 0 the lane with
			// the lowest baseline wins (tied → earliest lane keeps).
			expect( result.placements.get( 'c' )?.top ).toBe( 108 );
		} );
	} );

	describe( 'spanning', () => {
		it( 'spans contiguous lanes and uses the tallest one as baseline', () => {
			// A in lane 0 (h=100), B in lane 1 (h=50). C spans 2:
			// must start where lane 0 (100) is clear → top=100+gap.
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 100 },
					{ key: 'b', height: 50 },
					{ key: 'c', span: 2, height: 80 },
				] ),
				lanes: 2,
				gap: 10,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'c' ) ).toEqual( {
				key: 'c',
				lane: 0,
				top: 110,
				span: 2,
			} );
			expect( result.totalHeight ).toBe( 190 );
		} );

		it( 'finds the shortest run when multiple span positions exist', () => {
			// Three lanes, baselines [100, 0, 100] after seeding.
			// A span-2 item should pick lanes 1-2 (max=100) over
			// lanes 0-1 (max=100); ties broken by earliest, so 0-1.
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'seed-l', height: 100 },
					{ key: 'seed-r', lane: 2, height: 100 },
					{ key: 'span', span: 2, height: 50 },
				] ),
				lanes: 3,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'span' )?.lane ).toBe( 0 );
		} );

		it( 'clamps span to the lane count', () => {
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', span: 99, height: 100 } ] ),
				lanes: 4,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.span ).toBe( 4 );
			expect( result.placements.get( 'a' )?.lane ).toBe( 0 );
		} );

		it( 'clamps span to a minimum of 1', () => {
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', span: 0, height: 100 } ] ),
				lanes: 4,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.span ).toBe( 1 );
		} );
	} );

	describe( 'flow tolerance', () => {
		it( 'with tolerance 0, picks the strictly shortest lane', () => {
			// Lanes after seeding: [100, 99]. Item should pick lane 1
			// because 99 < 100 by 1, exceeding tolerance 0.
			const result = computeLanePlacements( {
				items: items( [
					{ key: 's0', height: 100 },
					{ key: 's1', lane: 1, height: 99 },
					{ key: 'next', height: 30 },
				] ),
				lanes: 2,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'next' )?.lane ).toBe( 1 );
		} );

		it( 'with a generous tolerance, prefers the earlier lane', () => {
			// Lanes [100, 99]. Tolerance 5 absorbs the 1px difference;
			// reading order wins → lane 0.
			const result = computeLanePlacements( {
				items: items( [
					{ key: 's0', height: 100 },
					{ key: 's1', lane: 1, height: 99 },
					{ key: 'next', height: 30 },
				] ),
				lanes: 2,
				gap: 0,
				flowTolerance: 5,
			} );
			expect( result.placements.get( 'next' )?.lane ).toBe( 0 );
		} );

		it( 'tolerance does not override a clearly shorter lane', () => {
			// Lanes [100, 30]. Even with tolerance 5, the 70px gap
			// between baselines is decisive → lane 1.
			const result = computeLanePlacements( {
				items: items( [
					{ key: 's0', height: 100 },
					{ key: 's1', lane: 1, height: 30 },
					{ key: 'next', height: 30 },
				] ),
				lanes: 2,
				gap: 0,
				flowTolerance: 5,
			} );
			expect( result.placements.get( 'next' )?.lane ).toBe( 1 );
		} );
	} );

	describe( 'explicit placement', () => {
		it( 'honors an explicit lane index', () => {
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', lane: 2, height: 50 } ] ),
				lanes: 4,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.lane ).toBe( 2 );
			expect( result.placements.get( 'a' )?.top ).toBe( 0 );
		} );

		it( 'places explicit items first regardless of source order', () => {
			// Source order: auto, explicit. Explicit must be placed
			// first so the auto item flows around it.
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'auto', height: 100 },
					{ key: 'pinned', lane: 0, height: 50 },
				] ),
				lanes: 2,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'pinned' )?.lane ).toBe( 0 );
			expect( result.placements.get( 'pinned' )?.top ).toBe( 0 );
			// auto can't take lane 0 (occupied at top) — it lands in
			// lane 1, the only zero-baseline lane available.
			expect( result.placements.get( 'auto' )?.lane ).toBe( 1 );
			expect( result.placements.get( 'auto' )?.top ).toBe( 0 );
		} );

		it( 'clamps an out-of-range explicit lane', () => {
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', lane: 99, height: 50 } ] ),
				lanes: 4,
				gap: 0,
				flowTolerance: 0,
			} );
			// `lane: 99` clamps to `lanes - span = 4 - 1 = 3`.
			expect( result.placements.get( 'a' )?.lane ).toBe( 3 );
		} );

		it( 'clamps a negative explicit lane to 0', () => {
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', lane: -5, height: 50 } ] ),
				lanes: 4,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.lane ).toBe( 0 );
		} );

		it( 'clamps an explicit lane that would push the span off-grid', () => {
			// span 3 cannot start at lane 2 of a 4-lane grid (would
			// occupy lanes 2-3-4 but lane 4 is out of range).
			const result = computeLanePlacements( {
				items: items( [ { key: 'a', lane: 2, span: 3, height: 50 } ] ),
				lanes: 4,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.lane ).toBe( 1 );
			expect( result.placements.get( 'a' )?.span ).toBe( 3 );
		} );
	} );

	describe( 'input clamping and edge cases', () => {
		it( 'clamps lanes to a minimum of 1', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 50 },
					{ key: 'b', height: 50 },
				] ),
				lanes: 0,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'a' )?.lane ).toBe( 0 );
			expect( result.placements.get( 'b' )?.lane ).toBe( 0 );
			expect( result.totalHeight ).toBe( 100 );
		} );

		it( 'treats a negative gap as zero', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: 50 },
					{ key: 'b', height: 50 },
				] ),
				lanes: 1,
				gap: -10,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'b' )?.top ).toBe( 50 );
		} );

		it( 'treats a negative tolerance as zero', () => {
			// With tolerance treated as 0, the lane with the strictly
			// lower baseline always wins.
			const result = computeLanePlacements( {
				items: items( [
					{ key: 's0', height: 100 },
					{ key: 's1', lane: 1, height: 99 },
					{ key: 'next', height: 30 },
				] ),
				lanes: 2,
				gap: 0,
				flowTolerance: -50,
			} );
			expect( result.placements.get( 'next' )?.lane ).toBe( 1 );
		} );

		it( 'treats negative item heights as zero', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'a', height: -50 },
					{ key: 'b', height: 30 },
				] ),
				lanes: 1,
				gap: 0,
				flowTolerance: 0,
			} );
			expect( result.placements.get( 'b' )?.top ).toBe( 0 );
			expect( result.totalHeight ).toBe( 30 );
		} );
	} );

	describe( 'realistic scenarios', () => {
		it( 'packs a mixed dashboard layout into 3 lanes', () => {
			const result = computeLanePlacements( {
				items: items( [
					{ key: 'kpi', height: 120 },
					{ key: 'chart', span: 2, height: 240 },
					{ key: 'note', height: 80 },
					{ key: 'feed', height: 300 },
					{ key: 'tasks', height: 160 },
				] ),
				lanes: 3,
				gap: 16,
				flowTolerance: 16,
			} );
			expect( result.placements.size ).toBe( 5 );
			expect( result.placements.get( 'kpi' )?.top ).toBe( 0 );
			expect( result.placements.get( 'chart' )?.lane ).toBe( 1 );
			expect( result.placements.get( 'chart' )?.span ).toBe( 2 );
			expect( result.totalHeight ).toBeGreaterThan( 0 );
		} );

		it( 'is deterministic across calls with identical input', () => {
			const input = {
				items: items( [
					{ key: 'a', height: 100 },
					{ key: 'b', height: 50 },
					{ key: 'c', span: 2, height: 80 },
					{ key: 'd', height: 30 },
				] ),
				lanes: 3,
				gap: 8,
				flowTolerance: 4,
			};
			const a = computeLanePlacements( input );
			const b = computeLanePlacements( input );
			expect( Array.from( a.placements.entries() ) ).toEqual(
				Array.from( b.placements.entries() )
			);
			expect( a.totalHeight ).toBe( b.totalHeight );
		} );
	} );
} );
