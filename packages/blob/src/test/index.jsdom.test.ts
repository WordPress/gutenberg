import { describe, expect, it } from 'vitest';
import { isBlobURL, getBlobTypeByURL } from '..';

describe( 'isBlobURL', () => {
	it( 'returns true if the url starts with "blob:"', () => {
		expect( isBlobURL( 'blob:thisbitdoesnotmatter' ) ).toBe( true );
	} );

	it( 'returns false if the url does not start with "blob:"', () => {
		expect( isBlobURL( 'https://www.example.com' ) ).toBe( false );
	} );

	it( 'returns false if the url is not defined', () => {
		expect(
			// @ts-expect-error This is not a valid call according to types.
			isBlobURL()
		).toBe( false );
	} );
} );

describe( 'getBlobTypeByURL', () => {
	it( 'returns undefined if the blob is not found', () => {
		expect( getBlobTypeByURL( 'blob:notexisting' ) ).toBeUndefined();
	} );

	it( 'returns undefined if the url is not defined', () => {
		expect(
			// @ts-expect-error This is not a valid call according to types.
			getBlobTypeByURL()
		).toBeUndefined();
	} );
} );
