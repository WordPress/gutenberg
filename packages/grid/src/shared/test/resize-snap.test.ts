import { clampResizeDelta, gridSpanToPixelSize } from '../resize-snap';

describe( 'gridSpanToPixelSize', () => {
	it( 'returns one column track width for a single-column span', () => {
		expect( gridSpanToPixelSize( 1, 1, 100, 16, null ).widthPx ).toBe(
			100
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
