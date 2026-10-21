import { describe, expect, it } from 'vitest';
import { isFile } from '../is-file';

describe( 'isFile', () => {
	it( 'accepts a File from the current realm', () => {
		expect( isFile( new File( [ 'a' ], 'a.txt' ) ) ).toBe( true );
	} );

	it( 'accepts a File created by another realm', () => {
		// A File from another window (the editor canvas iframe) is not an
		// instance of this realm's `File`, but keeps the `File` string tag.
		const foreignFile = Object.create( null, {
			[ Symbol.toStringTag ]: { value: 'File' },
			name: { value: 'a.png' },
			type: { value: 'image/png' },
		} );

		expect( foreignFile instanceof File ).toBe( false );
		expect( isFile( foreignFile ) ).toBe( true );
	} );

	it( 'rejects blobs and media library objects', () => {
		expect( isFile( new Blob( [ 'a' ] ) ) ).toBe( false );
		expect( isFile( { id: 1, url: 'https://example.com/a.png' } ) ).toBe(
			false
		);
		expect( isFile( undefined ) ).toBe( false );
		expect( isFile( null ) ).toBe( false );
	} );
} );
