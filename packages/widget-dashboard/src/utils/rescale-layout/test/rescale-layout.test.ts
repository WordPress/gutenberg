import { describe, expect, it } from 'vitest';
import { layoutGeometry, rescaleLayout } from '../rescale-layout';
import type { DashboardWidget } from '../../../types';

const LEGACY = { columns: 4, rowHeight: 300 };
const DENSE = { columns: 4, rowHeight: 40 };

function placed(
	uuid: string,
	placement: DashboardWidget[ 'placement' ]
): DashboardWidget {
	return { uuid, type: 'test/tile' as DashboardWidget[ 'type' ], placement };
}

describe( 'layoutGeometry', () => {
	it( 'takes a plain count and the row height', () => {
		expect(
			layoutGeometry( { model: 'grid', columns: 3, rowHeight: 120 } )
		).toEqual( { columns: 3, rowHeight: 120 } );
	} );

	it( 'takes the widest step of a stepped count', () => {
		expect(
			layoutGeometry( {
				model: 'grid',
				columns: { 0: 1, 600: 2, 960: 4 },
				rowHeight: 40,
			} )
		).toEqual( { columns: 4, rowHeight: 40 } );
	} );

	it( 'falls back to the package defaults', () => {
		expect( layoutGeometry( { model: 'grid' } ) ).toEqual( {
			columns: 4,
			rowHeight: 300,
		} );
		expect(
			layoutGeometry( { model: 'grid', minColumnWidth: 240 } )
		).toEqual( { columns: 4, rowHeight: 300 } );
		expect( layoutGeometry( { model: 'masonry', columns: 6 } ) ).toEqual( {
			columns: 6,
			rowHeight: 300,
		} );
	} );

	it( 'takes the package count when a step leaves the count to the floor', () => {
		expect(
			layoutGeometry( {
				model: 'grid',
				columns: { 0: 1, 600: 2, 960: 'auto' },
				minColumnWidth: 240,
				rowHeight: 40,
			} )
		).toEqual( { columns: 4, rowHeight: 40 } );
	} );
} );

describe( 'rescaleLayout', () => {
	it( 'returns the same layout when the geometries match', () => {
		const layout = [ placed( 'a', { width: 2, height: 3 } ) ];
		expect( rescaleLayout( layout, LEGACY, { ...LEGACY } ) ).toBe( layout );
	} );

	it( 'keeps the pixels of a height across row heights', () => {
		// Three 300px rows and two 24px gaps are 948px; on 40px rows that
		// is fifteen rows (936px) rather than three (168px).
		expect(
			rescaleLayout(
				[ placed( 'a', { width: 1, height: 3 } ) ],
				LEGACY,
				DENSE
			)
		).toEqual( [ placed( 'a', { width: 1, height: 15 } ) ] );
		expect(
			rescaleLayout(
				[ placed( 'a', { width: 1, height: 15 } ) ],
				DENSE,
				LEGACY
			)
		).toEqual( [ placed( 'a', { width: 1, height: 3 } ) ] );
	} );

	it( 'keeps the proportion of a width across column counts', () => {
		expect(
			rescaleLayout(
				[ placed( 'a', { width: 3, height: 1 } ) ],
				{ columns: 4, rowHeight: 300 },
				{ columns: 12, rowHeight: 300 }
			)
		).toEqual( [ placed( 'a', { width: 9, height: 1 } ) ] );
	} );

	it( 'leaves fill and full alone and never drops below one', () => {
		expect(
			rescaleLayout(
				[
					placed( 'a', { width: 'full', height: 1 } ),
					placed( 'b', { width: 'fill', height: 1 } ),
					placed( 'c', { width: 1, height: 1 } ),
				],
				{ columns: 12, rowHeight: 40 },
				{ columns: 4, rowHeight: 300 }
			)
		).toEqual( [
			placed( 'a', { width: 'full', height: 1 } ),
			placed( 'b', { width: 'fill', height: 1 } ),
			placed( 'c', { width: 1, height: 1 } ),
		] );
	} );

	it( 'rescales masonry placements in width only', () => {
		expect(
			rescaleLayout(
				[ placed( 'a', { width: 2 } ) ],
				{ columns: 4, rowHeight: 300 },
				{ columns: 6, rowHeight: 40 }
			)
		).toEqual( [ placed( 'a', { width: 3 } ) ] );
	} );

	it( 'passes widgets without a placement through', () => {
		const widget = {
			uuid: 'a',
			type: 'test/tile' as DashboardWidget[ 'type' ],
		};
		const layout = [ widget ];
		expect( rescaleLayout( layout, LEGACY, DENSE ) ).toBe( layout );
	} );
} );
