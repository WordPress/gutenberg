/**
 * External dependencies
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import { isBlobURL, getBlobTypeByURL, downloadBlob } from '..';

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

describe( 'downloadBlob', () => {
	const originalURL = window.URL;
	const createObjectURL = vi.fn().mockReturnValue( 'blob:pannacotta' );
	const revokeObjectURL = vi.fn().mockReturnValue( false );
	const mockAnchorElement = document.createElement( 'a' );
	mockAnchorElement.click = vi.fn();
	const createElementSpy = vi
		.spyOn( global.document, 'createElement' )
		.mockReturnValue( mockAnchorElement );

	const mockBlob = {};
	const blobSpy = vi.spyOn( window, 'Blob' ).mockImplementation(
		class MockBlob {
			constructor() {
				return mockBlob;
			}
		} as unknown as typeof Blob
	);
	vi.spyOn( document.body, 'appendChild' );
	vi.spyOn( document.body, 'removeChild' );
	beforeEach( () => {
		// Can't seem to spy on these static methods. They are `undefined`.
		// They are replaced by the shared test-environment globals setup.
		// @ts-expect-error This is not a valid URL object.
		window.URL = {
			createObjectURL,
			revokeObjectURL,
		};
	} );

	afterAll( () => {
		window.URL = originalURL;
	} );

	it( 'requires a filename argument', () => {
		downloadBlob( '', '{}', 'application/json' );
		expect( blobSpy ).not.toHaveBeenCalled();
	} );

	it( 'requires a content argument', () => {
		downloadBlob( 'text.txt', '', 'text/plain' );
		expect( blobSpy ).not.toHaveBeenCalled();
	} );

	it( 'constructs an anchor element with attributes and removes it', () => {
		downloadBlob( 'filename.json', '{}', 'application/json' );
		expect( blobSpy ).toHaveBeenCalledWith( [ '{}' ], {
			type: 'application/json',
		} );
		expect( createObjectURL ).toHaveBeenCalledWith( mockBlob );
		expect( createElementSpy ).toHaveBeenCalledWith( 'a' );
		expect( mockAnchorElement.download ).toBe( 'filename.json' );
		expect( mockAnchorElement.href ).toBe( 'blob:pannacotta' );
		expect( mockAnchorElement ).toHaveStyle( 'display:none' );
		expect( document.body.appendChild ).toHaveBeenCalledWith(
			mockAnchorElement
		);
		expect( mockAnchorElement.click ).toHaveBeenCalledTimes( 1 );
		expect( document.body.removeChild ).toHaveBeenCalledWith(
			mockAnchorElement
		);
		expect( revokeObjectURL ).toHaveBeenCalled();
	} );
} );
