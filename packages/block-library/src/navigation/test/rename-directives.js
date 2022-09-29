/**
 * Internal dependencies
 */
import { rename, value } from '../vdom';

describe( 'directives name', () => {
	it( 'should do camelcase', () => {
		expect( rename( 'wp-some-directive' ) ).toBe( 'someDirective' );
	} );

	it( 'should do camelcase even it casing is mixed up', () => {
		expect( rename( 'wP-SOme-dIRECtivE' ) ).toBe( 'someDirective' );
	} );

	it( 'should remove anything after :', () => {
		expect( rename( 'wp-some-prefix:some-directive' ) ).toBe(
			'somePrefix'
		);
	} );
} );

describe( 'directives value', () => {
	it( "shouldn't do anything if name doesn't contain a colon", () => {
		expect( value( 'wp-some-directive', 123 ) ).toBe( 123 );
	} );

	it( 'should return an object if name contains a colon', () => {
		expect( value( 'wp-some-prefix:some-directive', 123 ) ).toEqual( {
			name: 'somePrefix',
			suffix: 'someDirective',
			value: 123,
		} );
	} );
} );
