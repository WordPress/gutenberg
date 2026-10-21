import { describe, expect, it } from 'vitest';
import { getGridCellTilesImage } from '../get-grid-cell-tiles-image';
import { getGridTracks } from '../utils';

describe( 'getGridCellTilesImage()', () => {
	it( 'draws both edges of a tile for each cell, inside the cell', () => {
		// Two 100px columns and one 50px row, with a 10px gap.
		const image = getGridCellTilesImage(
			getGridTracks( '100px 100px', 10 ),
			getGridTracks( '50px', 10 )
		);
		expect( image ).toContain( "width='210' height='50'" );
		expect( image.match( /<rect /g ) ).toHaveLength( 4 );
		// The outer edge of the second cell, which starts at 110px.
		expect( image ).toContain(
			"<rect x='112.5' y='2.5' width='95' height='45' rx='3.5'/>"
		);
		// Its inner edge.
		expect( image ).toContain(
			"<rect x='113.5' y='3.5' width='93' height='43' rx='2.5'/>"
		);
	} );

	it( 'skips cells too small for a tile', () => {
		const image = getGridCellTilesImage(
			getGridTracks( '6px 100px', 0 ),
			getGridTracks( '50px', 0 )
		);
		expect( image.match( /<rect /g ) ).toHaveLength( 2 );
	} );

	it( 'rounds positions to hundredths of a pixel', () => {
		const image = getGridCellTilesImage(
			getGridTracks( '33.3333px', 0 ),
			getGridTracks( '33.3333px', 0 )
		);
		expect( image ).toContain( "width='33.33' height='33.33'" );
		expect( image ).toContain( "width='28.33'" );
	} );
} );
