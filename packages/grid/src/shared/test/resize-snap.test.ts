import {
	clampResizeDelta,
	gridSpanToPixelSize,
	pixelSizeToMinSpans,
} from '../resize-snap';

describe( 'gridSpanToPixelSize', () => {
	it( 'returns one column track width for a single-column span', () => {
		expect( gridSpanToPixelSize( 1, 1, 100, 16, null ).widthPx ).toBe(
			100
		);
	} );
} );

describe( 'pixelSizeToMinSpans', () => {
	it( 'rounds a minimum up to whole tracks', () => {
		expect(
			pixelSizeToMinSpans( { width: 480 }, 292, 24, 300, 4 )
		).toEqual( { width: 2, height: 1 } );
	} );

	it( 'covers both axes when a row height is known', () => {
		expect(
			pixelSizeToMinSpans( { width: 480, height: 360 }, 292, 24, 300, 4 )
		).toEqual( { width: 2, height: 2 } );
	} );

	it( 'keeps an exact single-track fit at one span', () => {
		expect(
			pixelSizeToMinSpans( { width: 292 }, 292, 24, null, 4 )
		).toEqual( { width: 1, height: 1 } );
	} );

	it( 'saturates width at the column count', () => {
		expect(
			pixelSizeToMinSpans( { width: 4000 }, 292, 24, null, 4 )
		).toEqual( { width: 4, height: 1 } );
	} );

	it( 'resolves height to one when rows are content-sized', () => {
		expect(
			pixelSizeToMinSpans( { width: 480, height: 360 }, 292, 24, null, 4 )
		).toEqual( { width: 2, height: 1 } );
	} );

	it( 'falls back to one span while the surface is unmeasured', () => {
		expect( pixelSizeToMinSpans( { width: 480 }, 0, 24, null, 4 ) ).toEqual(
			{ width: 1, height: 1 }
		);
	} );
} );

describe( 'clampResizeDelta', () => {
	it( 'does not shrink width below one column', () => {
		const initial = { width: 216, height: 120 };
		const min = { width: 100, height: 48 };
		expect(
			clampResizeDelta( { width: -200, height: 0 }, initial, min )
		).toEqual( { width: -116, height: 0 } );
	} );

	it( 'does not shrink height below one row when a minimum height is set', () => {
		const initial = { width: 200, height: 144 };
		const min = { width: 100, height: 48 };
		expect(
			clampResizeDelta( { width: 0, height: -120 }, initial, min )
		).toEqual( { width: 0, height: -96 } );
	} );

	it( 'leaves growth deltas unchanged', () => {
		const initial = { width: 100, height: 48 };
		const min = { width: 100, height: 48 };
		expect(
			clampResizeDelta( { width: 80, height: 40 }, initial, min )
		).toEqual( { width: 80, height: 40 } );
	} );
} );
