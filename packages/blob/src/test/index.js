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
	beforeEach( () => {
		window.URL = {
			createObjectURL,
			revokeObjectURL,
		};
	} );

	afterAll( () => {
		window.URL = originalURL;
	} );
	it( 'returns expected HTML element without filename', () => {
		downloadBlob( undefined, '{}', 'application/json' );
		expect( createObjectURL ).toHaveBeenCalledWith( new window.Blob() );
		expect( revokeObjectURL ).toHaveBeenCalled();
	} );
	it( 'returns expected HTML element with filename', () => {
		expect(
			downloadBlob( 'file.json', '{}', 'application/json' ).outerHTML
		).toBe(
			'<a href="blob:pannacotta" download="file.json" style="display: none;"></a>'
		);
	} );
} );
