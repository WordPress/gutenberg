/**
 * Internal Dependencies
 */
import { addQueryArgs, prependHTTP } from '../';

describe( 'addQueryArgs', () => {
	it( 'should append args to an URL without query string', () => {
		const url = 'https://andalouses.example/beach';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://andalouses.example/beach?sun=true&sand=false' );
	} );

	it( 'should append args to an URL with query string', () => {
		const url = 'https://andalouses.example/beach?night=false';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://andalouses.example/beach?night=false&sun=true&sand=false' );
	} );

	it( 'should update args to an URL with conflicting query string', () => {
		const url = 'https://andalouses.example/beach?night=false&sun=false&sand=true';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://andalouses.example/beach?night=false&sun=true&sand=false' );
	} );

	it( 'should update args to an URL with array parameters', () => {
		const url = 'https://andalouses.example/beach?time[]=10&time[]=11';
		const args = { beach: [ 'sand', 'rock' ] };

		expect( decodeURI( addQueryArgs( url, args ) ) ).toBe( 'https://andalouses.example/beach?time[0]=10&time[1]=11&beach[0]=sand&beach[1]=rock' );
	} );
} );

describe( 'prependHTTP', () => {
	it( 'should prepend http to a domain', () => {
		const url = 'wordpress.org';

		expect( prependHTTP( url ) ).toBe( 'http://' + url );
	} );

	it( 'shouldn’t prepend http to an email', () => {
		const url = 'foo@wordpress.org';

		expect( prependHTTP( url ) ).toBe( url );
	} );

	it( 'shouldn’t prepend http to an absolute URL', () => {
		const url = '/wordpress';

		expect( prependHTTP( url ) ).toBe( url );
	} );

	it( 'shouldn’t prepend http to a relative URL', () => {
		const url = './wordpress';

		expect( prependHTTP( url ) ).toBe( url );
	} );

	it( 'shouldn’t prepend http to an anchor URL', () => {
		const url = '#wordpress';

		expect( prependHTTP( url ) ).toBe( url );
	} );

	it( 'shouldn’t prepend http to a URL that already has http', () => {
		const url = 'http://wordpress.org';

		expect( prependHTTP( url ) ).toBe( url );
	} );

	it( 'shouldn’t prepend http to a URL that already has https', () => {
		const url = 'https://wordpress.org';

		expect( prependHTTP( url ) ).toBe( url );
	} );

	it( 'shouldn’t prepend http to a URL that already has ftp', () => {
		const url = 'ftp://wordpress.org';

		expect( prependHTTP( url ) ).toBe( url );
	} );

	it( 'shouldn’t prepend http to a URL that already has mailto', () => {
		const url = 'mailto:foo@wordpress.org';

		expect( prependHTTP( url ) ).toBe( url );
	} );
} );
