import { describe, expect, it } from 'vitest';
import { isStyleTransformAxisAligned } from '../transforms';

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
