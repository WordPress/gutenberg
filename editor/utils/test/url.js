/**
 * Internal dependencies
 */
import { addQueryArgs } from '../url';

describe( 'addQueryArgs', () => {
	it( 'should append args to an URL without query string', () => {
		const url = 'https://andalouses.com/beach';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toEqual( 'https://andalouses.com/beach?sun=true&sand=false' );
	} );

	it( 'should append args to an URL with query string', () => {
		const url = 'https://andalouses.com/beach?night=false';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toEqual( 'https://andalouses.com/beach?night=false&sun=true&sand=false' );
	} );

	it( 'should append args to an URL with query string and URL fragment', () => {
		const url = 'https://andalouses.com/beach?night=false#foo=bar';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toEqual( 'https://andalouses.com/beach?night=false&sun=true&sand=false#foo=bar' );
	} );
} );

describe( 'getWPAdminURL', () => {
	it( 'should append args to an URL and account for fragment', () => {
		const url = 'edit.php#content';
		const args = { post_id: 123 };

		expect( addQueryArgs( url, args ) ).toEqual( 'edit.php?post_id=123#content' );
	} );
} );
