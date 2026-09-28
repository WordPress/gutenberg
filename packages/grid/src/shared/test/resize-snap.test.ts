import { describe, expect, it } from 'vitest';
import {
	clampResizeDelta,
	clampSpan,
	gridSpanToPixelSize,
	pixelLimitsToSpanBounds,
} from '../resize-snap';

describe( 'gridSpanToPixelSize', () => {
	it( 'returns one column track width for a single-column span', () => {
		expect( gridSpanToPixelSize( 1, 1, 100, 16, null ).widthPx ).toBe(
			100
		);
	} );
} );

describe( 'pixelLimitsToSpanBounds', () => {
	it( 'rounds minimums up to whole tracks', () => {
		expect(
			pixelLimitsToSpanBounds( { minWidth: 480 }, 292, 24, 300, 4 )
		).toEqual( {
			minWidth: 2,
			minHeight: 1,
			maxWidth: 4,
			maxHeight: Infinity,
		} );
	} );

	it( 'covers both minimum axes when a row height is known', () => {
		expect(
			pixelLimitsToSpanBounds(
				{ minWidth: 480, minHeight: 360 },
				292,
				24,
				300,
				4
			)
		).toEqual( {
			minWidth: 2,
			minHeight: 2,
			maxWidth: 4,
			maxHeight: Infinity,
		} );
	} );

	it( 'rounds maximums down to whole tracks', () => {
		expect(
			pixelLimitsToSpanBounds( { maxWidth: 700 }, 292, 24, null, 4 )
		).toEqual( {
			minWidth: 1,
			minHeight: 1,
			maxWidth: 2,
			maxHeight: Infinity,
		} );
	} );

	it( 'keeps a maximum at one track or more', () => {
		expect(
			pixelLimitsToSpanBounds( { maxWidth: 100 }, 292, 24, null, 4 )
				.maxWidth
		).toBe( 1 );
	} );

	it( 'lets the minimum win over a tighter maximum', () => {
		expect(
			pixelLimitsToSpanBounds(
				{ minWidth: 480, maxWidth: 300 },
				292,
				24,
				null,
				4
			)
		).toEqual( {
			minWidth: 2,
			minHeight: 1,
			maxWidth: 2,
			maxHeight: Infinity,
		} );
	} );

	it( 'saturates width bounds at the column count', () => {
		expect(
			pixelLimitsToSpanBounds(
				{ minWidth: 4000, maxWidth: 9000 },
				292,
				24,
				null,
				4
			)
		).toEqual( {
			minWidth: 4,
			minHeight: 1,
			maxWidth: 4,
			maxHeight: Infinity,
		} );
	} );

	it( 'bounds heights against the row track', () => {
		expect(
			pixelLimitsToSpanBounds(
				{ minHeight: 360, maxHeight: 800 },
				292,
				24,
				300,
				4
			)
		).toEqual( {
			minWidth: 1,
			minHeight: 2,
			maxWidth: 4,
			maxHeight: 2,
		} );
	} );

	it( 'leaves height bounds open when rows are content-sized', () => {
		expect(
			pixelLimitsToSpanBounds(
				{ minHeight: 360, maxHeight: 600 },
				292,
				24,
				null,
				4
			)
		).toEqual( {
			minWidth: 1,
			minHeight: 1,
			maxWidth: 4,
			maxHeight: Infinity,
		} );
	} );

	it( 'falls back to the full range while the surface is unmeasured', () => {
		expect(
			pixelLimitsToSpanBounds(
				{ minWidth: 480, maxWidth: 600 },
				0,
				24,
				null,
				4
			)
		).toEqual( {
			minWidth: 1,
			minHeight: 1,
			maxWidth: 4,
			maxHeight: Infinity,
		} );
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

	it( 'leaves growth deltas unchanged without a maximum', () => {
		const initial = { width: 100, height: 48 };
		const min = { width: 100, height: 48 };
		expect(
			clampResizeDelta( { width: 80, height: 40 }, initial, min )
		).toEqual( { width: 80, height: 40 } );
	} );

	it( 'does not grow width past the maximum', () => {
		const initial = { width: 216, height: 120 };
		const min = { width: 100 };
		const max = { width: 300 };
		expect(
			clampResizeDelta( { width: 200, height: 0 }, initial, min, max )
		).toEqual( { width: 84, height: 0 } );
	} );

	it( 'does not grow height past the maximum when one applies', () => {
		const initial = { width: 200, height: 144 };
		const min = { width: 100, height: 48 };
		const max = { width: 400, height: 200 };
		expect(
			clampResizeDelta( { width: 0, height: 120 }, initial, min, max )
		).toEqual( { width: 0, height: 56 } );
	} );
} );

describe( 'clampSpan', () => {
	it( 'keeps a span inside the inclusive range', () => {
		expect( clampSpan( 0, 1, 4 ) ).toBe( 1 );
		expect( clampSpan( 3, 1, 4 ) ).toBe( 3 );
		expect( clampSpan( 9, 1, 4 ) ).toBe( 4 );
	} );

	it( 'treats an infinite maximum as open', () => {
		expect( clampSpan( 40, 1, Infinity ) ).toBe( 40 );
	} );
} );
