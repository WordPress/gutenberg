import { describe, expect, it } from 'vitest';
import {
	getStyleLinearTransform,
	isStyleTransformAxisAligned,
} from '../transforms';

function round( matrix: Record< string, number > ) {
	return Object.fromEntries(
		Object.entries( matrix ).map( ( [ key, value ] ) => [
			key,
			Math.round( value * 1000 ) / 1000 + 0,
		] )
	);
}

describe( 'isStyleTransformAxisAligned', () => {
	it.each( [
		[ 'none', 'none', 'none' ],
		[ '0deg', 'none', 'none' ],
		[ '90deg', 'none', 'none' ],
		[ '180deg', 'none', 'none' ],
		[ '270deg', 'none', 'none' ],
		[ '360deg', 'none', 'none' ],
		[ '-180deg', 'none', 'none' ],
		[ '0.5turn', 'none', 'none' ],
		[ '200grad', 'none', 'none' ],
		[ '3.14159rad', 'none', 'none' ],
		[ 'x 30deg', 'none', 'none' ],
		[ '0 0 -1 90deg', 'none', 'none' ],
		[ '0 0 0 45deg', 'none', 'none' ],
		[ 'none', '2 0.5', 'none' ],
		[ 'none', 'none', 'matrix(1, 0, 0, 1, 40, 20)' ],
		[ 'none', 'none', 'matrix(1.5, 0, 0, 0.5, 0, 0)' ],
		[ 'none', 'none', 'matrix(0, 1, -1, 0, 0, 0)' ],
		[ '45deg', 'none', 'matrix(0.7071, -0.7071, 0.7071, 0.7071, 0, 0)' ],
	] )(
		'keeps the axes aligned for rotate %s, scale %s and transform %s',
		( rotate, scale, transform ) => {
			expect(
				isStyleTransformAxisAligned( { rotate, scale, transform } )
			).toBe( true );
		}
	);

	it.each( [
		[ '12deg', 'none', 'none' ],
		[ '45deg', 'none', 'none' ],
		[ '-0.1rad', 'none', 'none' ],
		[ 'z 45deg', 'none', 'none' ],
		[ '1 1 0 45deg', 'none', 'none' ],
		[ '0 0 -1 45deg', 'none', 'none' ],
		[
			'x 60deg',
			'none',
			'matrix3d(0.5, 0, -0.866025, 0, 0, 1, 0, 0, 0.866025, 0, 0.5, 0, 0, 0, 0, 1)',
		],
		[ '45deg', '2 3', 'none' ],
		[ 'none', 'none', 'matrix(0.978, 0.208, -0.208, 0.978, 0, 0)' ],
		[ 'none', 'none', 'matrix(1, 0, 0.268, 1, 0, 0)' ],
		[
			'none',
			'none',
			'matrix3d(0.978, 0.208, 0, 0, -0.208, 0.978, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
		],
	] )(
		'moves the edges off axis for rotate %s, scale %s and transform %s',
		( rotate, scale, transform ) => {
			expect(
				isStyleTransformAxisAligned( { rotate, scale, transform } )
			).toBe( false );
		}
	);
} );

describe( 'getStyleLinearTransform', () => {
	it( 'returns the identity for no transform', () => {
		expect(
			getStyleLinearTransform( {
				rotate: 'none',
				scale: 'none',
				transform: 'none',
			} )
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );

	it( 'applies `rotate`, then `scale`, then `transform`', () => {
		expect(
			round(
				getStyleLinearTransform( {
					rotate: '90deg',
					scale: '2 3',
					transform: 'matrix(1, 0, 1, 1, 0, 0)',
				} )
			)
		).toEqual( { a: 0, b: 2, c: -3, d: 2 } );
	} );

	it( 'projects a turn out of the page', () => {
		expect(
			round(
				getStyleLinearTransform( {
					rotate: 'x 60deg',
					scale: 'none',
					transform: 'none',
				} )
			)
		).toEqual( { a: 1, b: 0, c: 0, d: 0.5 } );
	} );

	it( 'combines `rotate` and a 3D `transform` before flattening', () => {
		expect(
			round(
				getStyleLinearTransform( {
					rotate: 'x 60deg',
					scale: 'none',
					transform:
						'matrix3d(0.5, 0, -0.866025, 0, 0, 1, 0, 0, 0.866025, 0, 0.5, 0, 0, 0, 0, 1)',
				} )
			)
		).toEqual( { a: 0.5, b: 0.75, c: 0, d: 0.5 } );
	} );

	it( 'reads every angle unit', () => {
		for ( const rotate of [ '0.25turn', '100grad', '1.5708rad' ] ) {
			expect(
				round(
					getStyleLinearTransform( {
						rotate,
						scale: '',
						transform: '',
					} )
				)
			).toEqual( { a: 0, b: 1, c: -1, d: 0 } );
		}
	} );
} );
