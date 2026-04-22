/**
 * Internal dependencies
 */
import { renameFile, cloneFile } from '../utils';

describe( 'renameFile', () => {
	it( 'should return a new File with the given name', () => {
		const original = new File( [ 'content' ], 'old-name.jpg', {
			type: 'image/jpeg',
			lastModified: 1700000000000,
		} );

		const result = renameFile( original, 'new-name.png' );

		expect( result ).toBeInstanceOf( File );
		expect( result.name ).toBe( 'new-name.png' );
		expect( result ).not.toBe( original );
	} );

	it( 'should preserve the original file type', () => {
		const original = new File( [ 'content' ], 'photo.heic', {
			type: 'image/heic',
		} );

		const result = renameFile( original, 'photo.jpeg' );

		expect( result.type ).toBe( 'image/heic' );
	} );

	it( 'should preserve lastModified timestamp', () => {
		const timestamp = 1600000000000;
		const original = new File( [ 'content' ], 'file.txt', {
			type: 'text/plain',
			lastModified: timestamp,
		} );

		const result = renameFile( original, 'renamed.txt' );

		expect( result.lastModified ).toBe( timestamp );
	} );

	it( 'should preserve file size', () => {
		const original = new File( [ 'hello world' ], 'file.txt', {
			type: 'text/plain',
		} );

		const result = renameFile( original, 'new.txt' );

		expect( result.size ).toBe( original.size );
	} );
} );

describe( 'cloneFile', () => {
	it( 'should return a new File with the same name', () => {
		const original = new File( [ 'content' ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		const result = cloneFile( original );

		expect( result ).toBeInstanceOf( File );
		expect( result ).not.toBe( original );
		expect( result.name ).toBe( 'photo.jpg' );
	} );

	it( 'should preserve type and lastModified', () => {
		const original = new File( [ 'content' ], 'doc.pdf', {
			type: 'application/pdf',
			lastModified: 1500000000000,
		} );

		const result = cloneFile( original );

		expect( result.type ).toBe( 'application/pdf' );
		expect( result.lastModified ).toBe( 1500000000000 );
	} );

	it( 'should preserve file size', () => {
		const original = new File( [ 'test data' ], 'test.bin', {
			type: 'application/octet-stream',
		} );

		const result = cloneFile( original );

		expect( result.size ).toBe( original.size );
	} );
} );
