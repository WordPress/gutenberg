import browserslist from 'browserslist';
import config from '../';

it( 'should export an array', () => {
	expect( Array.isArray( config ) ).toBe( true );
} );

it( 'should not contain invalid queries', () => {
	const result = browserslist( config );

	expect( result ).toBeTruthy();
} );
