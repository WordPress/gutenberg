/**
 * Internal dependencies
 */
import { isBlobURL, getBlobTypeByURL, downloadBlob } from '../';

describe( 'isBlobURL', () => {
	it( 'returns true if the url starts with "blob:"', () => {
		expect( isBlobURL( 'blob:thisbitdoesnotmatter' ) ).toBe( true );
	} );

	it( 'returns false if the url does not start with "blob:"', () => {
		expect( isBlobURL( 'https://www.example.com' ) ).toBe( false );
	} );

	it( 'returns false if the url is not defined', () => {
		expect( isBlobURL() ).toBe( false );
	} );
} );

describe( 'getBlobTypeByURL', () => {
	it( 'returns undefined if the blob is not found', () => {
		expect( getBlobTypeByURL( 'blob:notexisting' ) ).toBe( undefined );
	} );

	it( 'returns undefined if the url is not defined', () => {
		expect( getBlobTypeByURL() ).toBe( undefined );
	} );
} );

describe( 'downloadBlob', () => {
	const originalURL = window.URL;
	const createObjectURL = jest.fn().mockReturnValue( 'blob:pannacotta' );
	const revokeObjectURL = jest.fn().mockReturnValue( false );
	const mockAnchorElement = document.createElement( 'a' );
	mockAnchorElement.click = jest.fn();
	const createElementSpy = jest
		.spyOn( global.document, 'createElement' )
		.mockReturnValue( mockAnchorElement );

	jest.spyOn( document.body, 'appendChild' );
	jest.spyOn( document.body, 'removeChild' );
	beforeEach( () => {
		// Can't seem to spy on these static methods. They are `undefined`.
		// Possibly overwritten: https://github.com/WordPress/gutenberg/blob/trunk/packages/jest-preset-default/scripts/setup-globals.js#L5
		window.URL = {
			createObjectURL,
			revokeObjectURL,
		};
	} );

	afterAll( () => {
		window.URL = originalURL;
	} );
	it( 'constructs an anchor element with attributes and removes it', () => {
		downloadBlob( 'filename.json', '{}', 'application/json' );

		expect( createObjectURL ).toHaveBeenCalledWith( new window.Blob() );
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
