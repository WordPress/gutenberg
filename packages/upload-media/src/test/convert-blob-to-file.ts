/**
 * Internal dependencies
 */
import { convertBlobToFile } from '../utils';

describe( 'convertBlobToFile', () => {
	it( 'should return a File unchanged', () => {
		const file = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );
		const result = convertBlobToFile( file );
		expect( result ).toBe( file );
		expect( result.name ).toBe( 'photo.jpg' );
	} );

	it( 'should convert a Blob with a default name', () => {
		const blob = new Blob( [ 'content' ], { type: 'image/png' } );
		const result = convertBlobToFile( blob );
		expect( result ).toBeInstanceOf( File );
		expect( result.name ).toBe( 'image.png' );
		expect( result.type ).toBe( 'image/png' );
	} );

	it( 'should use "document" prefix for PDF blobs', () => {
		const blob = new Blob( [ 'content' ], { type: 'application/pdf' } );
		const result = convertBlobToFile( blob );
		expect( result.name ).toBe( 'document.pdf' );
	} );

	it( 'should preserve the name from cross-realm File objects', () => {
		// Simulate a cross-realm File object (e.g., from an iframe).
		// These objects have a `name` property but fail `instanceof File`.
		const crossRealmFile = new Blob( [ 'content' ], {
			type: 'image/jpeg',
		} );
		Object.defineProperty( crossRealmFile, 'name', {
			value: 'IMG_7977.jpg',
			writable: false,
		} );
		Object.defineProperty( crossRealmFile, 'lastModified', {
			value: 1700000000000,
			writable: false,
		} );

		const result = convertBlobToFile( crossRealmFile );
		expect( result ).toBeInstanceOf( File );
		expect( result.name ).toBe( 'IMG_7977.jpg' );
		expect( result.type ).toBe( 'image/jpeg' );
		expect( result.lastModified ).toBe( 1700000000000 );
	} );

	it( 'should preserve the name for non-image cross-realm File objects', () => {
		const crossRealmFile = new Blob( [ 'content' ], {
			type: 'application/pdf',
		} );
		Object.defineProperty( crossRealmFile, 'name', {
			value: 'my-document.pdf',
			writable: false,
		} );

		const result = convertBlobToFile( crossRealmFile );
		expect( result ).toBeInstanceOf( File );
		expect( result.name ).toBe( 'my-document.pdf' );
		expect( result.type ).toBe( 'application/pdf' );
	} );
} );
