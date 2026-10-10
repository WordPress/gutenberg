import { describe, expect, it } from 'vitest';
import { getGridTracks, getRowEndForResize } from '../utils';

// Three 50px rows with 10px gaps: 0-50, 60-110, 120-170.
const rowTracks = getGridTracks( '50px 50px 50px', 10 );

describe( 'getRowEndForResize()', () => {
	it( 'snaps to the closest row inside the grid', () => {
		expect( getRowEndForResize( rowTracks, 100, 10 ) ).toBe( 2 );
		expect( getRowEndForResize( rowTracks, 165, 10 ) ).toBe( 3 );
	} );

	it( 'stays on the last row when dragged a little past it', () => {
		expect( getRowEndForResize( rowTracks, 190, 10 ) ).toBe( 3 );
	} );

	it( 'adds a row for every row height dragged past the end', () => {
		expect( getRowEndForResize( rowTracks, 230, 10 ) ).toBe( 4 );
		expect( getRowEndForResize( rowTracks, 290, 10 ) ).toBe( 5 );
	} );
} );
