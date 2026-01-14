import apiFetch, { apiFetch as namedApiFetch } from '../index';

describe( 'apiFetch exports', () => {
	it( 'default export is callable', () => {
		expect( typeof apiFetch ).toBe( 'function' );
	} );

	it( 'named export is callable', () => {
		expect( typeof namedApiFetch ).toBe( 'function' );
	} );
} );
