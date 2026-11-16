import { describe, expect, it } from 'vitest';
import { resolveFillWidths } from '../resolve-fill-widths';
import type { DashboardGridLayoutItem } from '../types';

function makeMap(
	items: DashboardGridLayoutItem[]
): Map< string, DashboardGridLayoutItem > {
	const map = new Map< string, DashboardGridLayoutItem >();
	items.forEach( ( item ) => map.set( item.key, item ) );
	return map;
}

function keys( items: DashboardGridLayoutItem[] ): string[] {
	return items.map( ( item ) => item.key );
}

describe( 'resolveFillWidths', () => {
	it( 'returns empty map when no items use width: "fill"', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'a', width: 2 },
			{ key: 'b', width: 4 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.size ).toBe( 0 );
	} );

	it( 'fill item takes all columns when alone', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill', width: 'fill' },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 6 );
	} );

	it( 'fill item takes remaining columns after fixed items', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'sidebar', width: 1 },
			{ key: 'fill', width: 'fill' },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 5 );
	} );

	it( 'fill item reserves space for subsequent fixed items', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'left', width: 1 },
			{ key: 'fill', width: 'fill' },
			{ key: 'right', width: 2 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 3 );
	} );

	it( 'fill after a full-width item starts a new row', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'full', width: 'full' },
			{ key: 'fill', width: 'fill' },
			{ key: 'sidebar', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 5 );
	} );

	it( 'consecutive fills each take a full row', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill-1', width: 'fill' },
			{ key: 'fill-2', width: 'fill' },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill-1' ) ).toBe( 6 );
		expect( result.get( 'fill-2' ) ).toBe( 6 );
	} );

	it( 'does not reserve items that overflow the row', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill', width: 'fill' },
			{ key: 'a', width: 3 },
			{ key: 'b', width: 4 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 3 );
	} );

	it( 'clamps item widths to maxColumns', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill', width: 'fill' },
			{ key: 'wide', width: 10 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 4 );
		expect( result.get( 'fill' ) ).toBe( 4 );
	} );

	it( 'fill in the middle of a row', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'a', width: 1 },
			{ key: 'b', width: 1 },
			{ key: 'fill', width: 'fill' },
			{ key: 'c', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 3 );
	} );

	it( 'multiple fills in different rows', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill-1', width: 'fill' },
			{ key: 'sidebar-1', width: 1 },
			{ key: 'full', width: 'full' },
			{ key: 'fill-2', width: 'fill' },
			{ key: 'sidebar-2', width: 2 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill-1' ) ).toBe( 5 );
		expect( result.get( 'fill-2' ) ).toBe( 4 );
	} );

	it( 'fill gets minimum of 1 column when row is almost full', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'a', width: 3 },
			{ key: 'b', width: 2 },
			{ key: 'fill', width: 'fill' },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 1 );
	} );

	it( 'adapts to different column counts (responsive)', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill', width: 'fill' },
			{ key: 'sidebar', width: 1 },
		];
		expect(
			resolveFillWidths( keys( items ), makeMap( items ), 6 ).get(
				'fill'
			)
		).toBe( 5 );
		expect(
			resolveFillWidths( keys( items ), makeMap( items ), 4 ).get(
				'fill'
			)
		).toBe( 3 );
		expect(
			resolveFillWidths( keys( items ), makeMap( items ), 2 ).get(
				'fill'
			)
		).toBe( 1 );
	} );

	it( 'look-ahead stops at the next fill boundary', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill-1', width: 'fill' },
			{ key: 'fill-2', width: 'fill' },
			{ key: 'sidebar', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill-1' ) ).toBe( 6 );
		expect( result.get( 'fill-2' ) ).toBe( 5 );
	} );

	it( 'look-ahead stops at the next full-width boundary', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'fill', width: 'fill' },
			{ key: 'full', width: 'full' },
			{ key: 'sidebar', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 6 );
	} );

	it( 'every item gets 1 column when maxColumns is 1', () => {
		const items: DashboardGridLayoutItem[] = [
			{ key: 'a', width: 3 },
			{ key: 'fill', width: 'fill' },
			{ key: 'b', width: 2 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 1 );
		expect( result.get( 'fill' ) ).toBe( 1 );
	} );

	it( 'returns empty map for an empty layout', () => {
		const result = resolveFillWidths( [], new Map(), 6 );
		expect( result.size ).toBe( 0 );
	} );

	describe( 'with multi-row items (height > 1)', () => {
		it( 'accounts for the shadow of a tall tile on the left', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'tall', width: 3, height: 2 },
				{ key: 'header', width: 9, height: 1 },
				{ key: 'sub', width: 3, height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12
			);
			expect( result.get( 'fill' ) ).toBe( 6 );
		} );

		it( 'accounts for the shadow of a tall tile in the middle', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'a', width: 3, height: 1 },
				{ key: 'b', width: 3, height: 2 },
				{ key: 'c', width: 6, height: 1 },
				{ key: 'd', width: 3, height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12
			);
			expect( result.get( 'fill' ) ).toBe( 6 );
		} );

		it( 'accounts for the shadow of a tall tile on the right', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'a', width: 3, height: 1 },
				{ key: 'b', width: 6, height: 1 },
				{ key: 'c', width: 3, height: 2 },
				{ key: 'd', width: 6, height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12
			);
			expect( result.get( 'fill' ) ).toBe( 3 );
		} );

		it( 'tracks shadow across multiple rows for height > 2', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'tall', width: 3, height: 3 },
				{ key: 'a', width: 9, height: 1 },
				{ key: 'b', width: 9, height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12
			);
			expect( result.get( 'fill' ) ).toBe( 9 );
		} );
	} );

	describe( 'with item bounds', () => {
		function makeBounds(
			entries: Record< string, { minWidth: number; maxWidth: number } >
		): Map< string, { minWidth: number; maxWidth: number } > {
			return new Map( Object.entries( entries ) );
		}

		it( 'reserves the fill floor when planning the row', () => {
			// Without bounds the plan is 1 + fill(2) + 3 = 6; the floor
			// pushes the trailing item out, so the fill takes the rest.
			const items: DashboardGridLayoutItem[] = [
				{ key: 'a', width: 1 },
				{ key: 'fill', width: 'fill' },
				{ key: 'b', width: 3 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				6,
				makeBounds( { fill: { minWidth: 3, maxWidth: 6 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 5 );
		} );

		it( 'caps the fill at its maximum span', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'a', width: 1 },
				{ key: 'fill', width: 'fill' },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				6,
				makeBounds( { fill: { minWidth: 1, maxWidth: 2 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 2 );
		} );

		it( 'wraps a floored fill that no longer fits the row', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'a', width: 4 },
				{ key: 'fill', width: 'fill' },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				6,
				makeBounds( { fill: { minWidth: 3, maxWidth: 6 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 6 );
		} );

		it( 'scans for a free run wide enough for the floor', () => {
			// The row-1 run beside the tall tile is nine columns; a
			// twelve-column floor sends the fill to the next empty row.
			const items: DashboardGridLayoutItem[] = [
				{ key: 'tall', width: 3, height: 2 },
				{ key: 'header', width: 9, height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12,
				makeBounds( { fill: { minWidth: 12, maxWidth: 12 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 12 );
		} );

		it( 'reserves trailing items against the floored run', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'tall', width: 3, height: 2 },
				{ key: 'header', width: 9, height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
				{ key: 'trailing', width: 3, height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12,
				makeBounds( { fill: { minWidth: 6, maxWidth: 12 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 6 );
		} );

		it( 'caps the fill inside a free run', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'tall', width: 3, height: 2 },
				{ key: 'header', width: 9, height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12,
				makeBounds( { fill: { minWidth: 1, maxWidth: 6 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 6 );
		} );

		it( 'places a capped full item like a fixed item of its capped width', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'full', width: 'full' },
				{ key: 'fill', width: 'fill' },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12,
				makeBounds( { full: { minWidth: 1, maxWidth: 4 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 8 );
		} );

		it( 'reserves a capped full item in the fill look-ahead', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'fill', width: 'fill' },
				{ key: 'full', width: 'full' },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12,
				makeBounds( { full: { minWidth: 1, maxWidth: 4 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 8 );
		} );

		it( 'places a capped full item beside a tall tile', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'tall', width: 3, height: 2 },
				{ key: 'full', width: 'full', height: 1 },
				{ key: 'fill', width: 'fill', height: 1 },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12,
				makeBounds( { full: { minWidth: 1, maxWidth: 4 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 5 );
		} );

		it( 'keeps a full item at the column count when its cap allows it', () => {
			const items: DashboardGridLayoutItem[] = [
				{ key: 'full', width: 'full' },
				{ key: 'fill', width: 'fill' },
			];
			const result = resolveFillWidths(
				keys( items ),
				makeMap( items ),
				12,
				makeBounds( { full: { minWidth: 1, maxWidth: 12 } } )
			);
			expect( result.get( 'fill' ) ).toBe( 12 );
		} );
	} );
} );
