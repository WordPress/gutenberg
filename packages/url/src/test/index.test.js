/**
 * Internal Dependencies
 */
import { addQueryArgs } from '../';

describe( 'addQueryArgs', () => {
	test( 'should append args to an URL without query string', () => {
		const url = 'https://example.com/beach';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://example.com/beach?sun=true&sand=false' );
	} );

	test( 'should append args to an URL with query string', () => {
		const url = 'https://example.com/beach?night=false';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://example.com/beach?night=false&sun=true&sand=false' );
	} );

	test( 'should update args to an URL with conflicting query string', () => {
		const url = 'https://example.com/beach?night=false&sun=false&sand=true';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://example.com/beach?night=false&sun=true&sand=false' );
	} );
} );
