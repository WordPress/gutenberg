/**
 * WordPress dependencies
 */
import { createBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import imageCorrector from '../image-corrector';
import { deepFilterHTML } from '../utils';

jest.mock( '@wordpress/blob', () => ( {
	createBlobURL: jest.fn( () => 'blob:local-url' ),
} ) );

describe( 'imageCorrector', () => {
	it( 'should correct image source', () => {
		const input = '<img src="file:LOW-RES.png">';
		const output = '<img src="">';
		expect( deepFilterHTML( input, [ imageCorrector ] ) ).toEqual( output );
	} );

	it( 'should remove trackers', () => {
		const input = '<img src="" height="1" width="1">';
		const output = '';
		expect( deepFilterHTML( input, [ imageCorrector ] ) ).toEqual( output );
	} );

	it( 'should give each pasted data-URI image a unique filename', () => {
		// 1x1 transparent PNG.
		const dataURI =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
		deepFilterHTML( `<img src="${ dataURI }"><img src="${ dataURI }">`, [
			imageCorrector,
		] );

		const names = createBlobURL.mock.calls.map( ( [ file ] ) => file.name );
		expect( names ).toHaveLength( 2 );
		expect( names[ 0 ] ).toMatch( /^image-\d+\.png$/ );
		expect( names[ 1 ] ).toMatch( /^image-\d+\.png$/ );
		// Distinct names avoid the server-side wp_unique_filename() collision.
		expect( names[ 0 ] ).not.toBe( names[ 1 ] );
	} );
} );
