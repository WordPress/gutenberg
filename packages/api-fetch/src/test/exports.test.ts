import apiFetch from '..';

describe( 'apiFetch exports', () => {
	it( 'default export is callable', () => {
		expect( typeof apiFetch ).toBe( 'function' );
	} );
} );
