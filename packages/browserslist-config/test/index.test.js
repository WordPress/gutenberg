const browserslist = require( 'browserslist' );
const config = require( '../' );

beforeEach( () => {
	jest.resetModules();
});

it( 'should export an array', () => {
	expect( Array.isArray( config ) ).toBe( true );
});

it( 'should not contain invalid queries', () => {
	jest.doMock( '@wordpress/browserslist-config', () => require( '../index' ), { virtual: true });

	const result = browserslist(['extends @wordpress/browserslist-config']);
	expect( result ).toBeTruthy();
});
