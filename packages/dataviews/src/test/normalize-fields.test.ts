/**
 * Internal dependencies
 */
import { setValueFromId } from '../normalize-fields';

describe( 'setValueFromId', () => {
	it( 'should create a simple object for single level id', () => {
		const setter = setValueFromId( 'title' );
		const result = setter( { value: 'Hello World' } );

		expect( result ).toEqual( { title: 'Hello World' } );
	} );

	it( 'should create nested object for dot-separated id', () => {
		const setter = setValueFromId( 'name.description' );
		const result = setter( { value: 'A description' } );

		expect( result ).toEqual( {
			name: {
				description: 'A description',
			},
		} );
	} );

	it( 'should create deeply nested object for multiple dots', () => {
		const setter = setValueFromId( 'user.profile.settings.theme' );
		const result = setter( { value: 'dark' } );

		expect( result ).toEqual( {
			user: {
				profile: {
					settings: {
						theme: 'dark',
					},
				},
			},
		} );
	} );

	it( 'should handle null and undefined values', () => {
		const setter = setValueFromId( 'field' );

		expect( setter( { value: null } ) ).toEqual( { field: null } );
		expect( setter( { value: undefined } ) ).toEqual( {
			field: undefined,
		} );
	} );

	it( 'should handle complex object values', () => {
		const setter = setValueFromId( 'data.config' );
		const complexValue = { enabled: true, options: [ 'a', 'b' ] };
		const result = setter( { value: complexValue } );

		expect( result ).toEqual( {
			data: {
				config: complexValue,
			},
		} );
	} );

	it( 'should handle empty string id', () => {
		const setter = setValueFromId( '' );
		const result = setter( { value: 'test' } );

		expect( result ).toEqual( { '': 'test' } );
	} );
} );
