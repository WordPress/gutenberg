import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vipsConvertImageFormat, vipsResizeImage } from '..';

const calls: string[] = [];

vi.mock(
	import( '@wordpress/vips/worker' ),
	() =>
		( {
			vipsEnsureJxlSupport: vi.fn( async () => {
				calls.push( 'ensure' );
			} ),
			vipsResizeImage: vi.fn( async () => {
				calls.push( 'resize' );
				return {
					buffer: new ArrayBuffer( 1 ),
					width: 150,
					height: 150,
					originalWidth: 200,
					originalHeight: 150,
				};
			} ),
			vipsConvertImageFormat: vi.fn( async () => {
				calls.push( 'convert' );
				return new ArrayBuffer( 1 );
			} ),
		} ) as unknown as typeof import( '@wordpress/vips/worker' )
);

const resize = { width: 150, height: 150, crop: true };

describe( 'JPEG XL support in the vips wrappers', () => {
	beforeEach( () => {
		calls.length = 0;
	} );

	it( 'loads JXL support before resizing a JXL', async () => {
		const jxl = new File( [ 'x' ], 'photo.jxl', { type: 'image/jxl' } );

		const result = await vipsResizeImage( 'id', jxl, resize );

		expect( calls ).toEqual( [ 'ensure', 'resize' ] );
		expect( result.type ).toBe( 'image/jxl' );
	} );

	it( 'loads JXL support before converting an image to JXL', async () => {
		const jpeg = new File( [ 'x' ], 'photo.jpg', { type: 'image/jpeg' } );

		await vipsConvertImageFormat( 'id', jpeg, 'image/jxl' );

		expect( calls ).toEqual( [ 'ensure', 'convert' ] );
	} );

	it( 'does not load JXL support for other formats', async () => {
		const jpeg = new File( [ 'x' ], 'photo.jpg', { type: 'image/jpeg' } );

		await vipsResizeImage( 'id', jpeg, resize );
		await vipsConvertImageFormat( 'id', jpeg, 'image/webp' );

		expect( calls ).toEqual( [ 'resize', 'convert' ] );
	} );
} );
