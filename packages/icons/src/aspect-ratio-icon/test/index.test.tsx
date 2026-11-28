import { describe, expect, it } from 'vitest';
import getAspectRatioIcon from '..';
import aspectRatio from '../../library/aspect-ratio';
import { getAspectRatioShape } from '../utils';

describe( 'getAspectRatioShape', () => {
	it.each( [ undefined, null, 0, -1, NaN, Infinity ] )(
		'returns null for %s, which gets the generic icon',
		( ratio ) => {
			expect( getAspectRatioShape( ratio ) ).toBeNull();
		}
	);

	it( 'returns a square for a square ratio', () => {
		expect( getAspectRatioShape( 1 ) ).toEqual( {
			x: 4.25,
			y: 4.25,
			width: 15.5,
			height: 15.5,
		} );
	} );

	it( 'returns a wide shape for a landscape ratio', () => {
		expect( getAspectRatioShape( 16 / 9 ) ).toEqual( {
			x: 4.25,
			y: 7.75,
			width: 15.5,
			height: 8.5,
		} );
	} );

	it( 'returns a tall shape for a portrait ratio', () => {
		expect( getAspectRatioShape( 9 / 16 ) ).toEqual( {
			x: 7.75,
			y: 4.25,
			width: 8.5,
			height: 15.5,
		} );
	} );

	it.each( [ 1 / 10, 10 ] )( 'clamps the extreme ratio %s', ( ratio ) => {
		const { width, height } = getAspectRatioShape( ratio )!;

		expect(
			Math.max( width, height ) / Math.min( width, height )
		).toBeCloseTo( 15.5 / 5.5 );
	} );

	it.each( [ 1, 4 / 3, 3 / 2, 16 / 9, 21 / 9, 3 / 4, 2 / 3, 9 / 16, 1 / 3 ] )(
		'keeps the outline of %s on the same grid as the generic icon',
		( ratio ) => {
			const { x, y } = getAspectRatioShape( ratio )!;

			// The generic icon is drawn at 4.25, 6.25 and so on: a quarter
			// past a half pixel.
			expect( ( x - 0.25 ) % 0.5 ).toBe( 0 );
			expect( ( y - 0.25 ) % 0.5 ).toBe( 0 );
		}
	);
} );

describe( 'getAspectRatioIcon', () => {
	it.each( [ undefined, null, 0, -1, NaN ] )(
		'returns the generic aspect ratio icon for %s',
		( ratio ) => {
			expect( getAspectRatioIcon( ratio ) ).toBe( aspectRatio );
		}
	);

	it( 'returns a different icon when there is a ratio to draw', () => {
		expect( getAspectRatioIcon( 16 / 9 ) ).not.toBe( aspectRatio );
	} );

	it( 'keeps the icon unfilled even when a parent sets a fill', () => {
		const icon = getAspectRatioIcon( 16 / 9 );

		expect( icon.props.style ).toEqual( { fill: 'none' } );
	} );
} );
