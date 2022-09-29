/**
 * Internal dependencies
 */
import { rename, value } from '../directives';

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

	it( 'should return single modifier without value if it exists', () => {
		expect( value( 'wp-some-prefix:some-directive.option1', 123 ) ).toEqual(
			{
				name: 'somePrefix',
				suffix: 'someDirective',
				modifiers: {
					option1: true,
				},
				value: 123,
			}
		);
	} );

	it( 'should return multiple modifiers without value if they exists', () => {
		expect(
			value(
				'wp-some-prefix:some-directive.option1.option2.option3',
				123
			)
		).toEqual( {
			name: 'somePrefix',
			suffix: 'someDirective',
			modifiers: {
				option1: true,
				option2: true,
				option3: true,
			},
			value: 123,
		} );
	} );

	it( 'should return single modifier with value', () => {
		expect(
			value( 'wp-some-prefix:some-directive.option1=some value', 123 )
		).toEqual( {
			name: 'somePrefix',
			suffix: 'someDirective',
			modifiers: {
				option1: 'some value',
			},
			value: 123,
		} );
	} );

	it( 'should return multiple modifiers with value', () => {
		expect(
			value(
				'wp-some-prefix:some-directive.option1=some value.option2=other value',
				123
			)
		).toEqual( {
			name: 'somePrefix',
			suffix: 'someDirective',
			modifiers: {
				option1: 'some value',
				option2: 'other value',
			},
			value: 123,
		} );
	} );
} );
