/**
 * Internal dependencies
 */
import {
	isBlobURL,
} from '../';

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
