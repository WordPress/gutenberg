/**
 * External dependencies
 */
import { every } from 'lodash';

/**
 * Internal dependencies
 */
import {
	isURL,
	addQueryArgs,
	getQueryArg,
	hasQueryArg,
	removeQueryArgs,
	prependHTTP,
	safeDecodeURI,
	filterURLForDisplay,
} from '../';

describe( 'isURL', () => {
	it( 'returns true when given things that look like a URL', () => {
		const urls = [
			'http://wordpress.org',
			'https://wordpress.org',
			'HTTPS://WORDPRESS.ORG',
			'https://wordpress.org/foo#bar',
			'https://localhost/foo#bar',
		];

		expect( every( urls, isURL ) ).toBe( true );
	} );

	it( 'returns false when given things that don\'t look like a URL', () => {
		const urls = [
			'HTTP: HyperText Transfer Protocol',
			'URLs begin with a http:// prefix',
			'Go here: http://wordpress.org',
			'http://',
			'',
		];

		expect( every( urls, isURL ) ).toBe( false );
	} );
} );

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

		expect( safeDecodeURI( addQueryArgs( url, args ) ) ).toBe( 'https://andalouses.example/beach?time[0]=10&time[1]=11&beach[0]=sand&beach[1]=rock' );
	} );

	it( 'should disregard keys with undefined values', () => {
		const url = 'https://andalouses.example/beach';
		const args = { sun: 'true', sand: undefined };

		expect( addQueryArgs( url, args ) ).toBe( 'https://andalouses.example/beach?sun=true' );
	} );
} );

describe( 'getQueryArg', () => {
	it( 'should get the value of an existing query arg', () => {
		const url = 'https://andalouses.example/beach?foo=bar&bar=baz';

		expect( getQueryArg( url, 'foo' ) ).toBe( 'bar' );
	} );

	it( 'should not return a value of an unknown query arg', () => {
		const url = 'https://andalouses.example/beach?foo=bar&bar=baz';

		expect( getQueryArg( url, 'baz' ) ).toBeUndefined();
	} );

	it( 'should get the value of an arry query arg', () => {
		const url = 'https://andalouses.example/beach?foo[]=bar&foo[]=baz';

		expect( getQueryArg( url, 'foo' ) ).toEqual( [ 'bar', 'baz' ] );
	} );
} );

describe( 'hasQueryArg', () => {
	it( 'should return true for an existing query arg', () => {
		const url = 'https://andalouses.example/beach?foo=bar&bar=baz';

		expect( hasQueryArg( url, 'foo' ) ).toBeTruthy();
	} );

	it( 'should return false for an unknown query arg', () => {
		const url = 'https://andalouses.example/beach?foo=bar&bar=baz';

		expect( hasQueryArg( url, 'baz' ) ).toBeFalsy();
	} );

	it( 'should return true for an arry query arg', () => {
		const url = 'https://andalouses.example/beach?foo[]=bar&foo[]=baz';

		expect( hasQueryArg( url, 'foo' ) ).toBeTruthy();
	} );
} );

describe( 'removeQueryArgs', () => {
	it( 'should not change URL not containing query args', () => {
		const url = 'https://andalouses.example/beach?foo=bar&bar=baz';

		expect( removeQueryArgs( url, 'baz', 'test' ) ).toEqual( url );
	} );

	it( 'should remove existing query args', () => {
		const url = 'https://andalouses.example/beach?foo=bar&baz=foo&bar=baz';

		expect( removeQueryArgs( url, 'foo', 'bar' ) ).toEqual( 'https://andalouses.example/beach?baz=foo' );
	} );

	it( 'should remove array query arg', () => {
		const url = 'https://andalouses.example/beach?foo[]=bar&foo[]=baz&bar=foobar';

		expect( removeQueryArgs( url, 'foo' ) ).toEqual( 'https://andalouses.example/beach?bar=foobar' );
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

describe( 'safeDecodeURI', () => {
	it( 'should decode URI if formed well', () => {
		const encoded = 'https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B';
		const decoded = 'https://mozilla.org/?x=шеллы';

		expect( safeDecodeURI( encoded ) ).toBe( decoded );
	} );

	it( 'should return URI if malformed', () => {
		const malformed = '%1';

		expect( safeDecodeURI( malformed ) ).toBe( malformed );
	} );
} );

describe( 'filterURLForDisplay', () => {
	it( 'should remove protocol', () => {
		let url = filterURLForDisplay( 'http://wordpress.org' );
		expect( url ).toBe( 'wordpress.org' );
		url = filterURLForDisplay( 'https://wordpress.org' );
		expect( url ).toBe( 'wordpress.org' );
	} );
	it( 'should remove www subdomain', () => {
		const url = filterURLForDisplay( 'http://www.wordpress.org' );
		expect( url ).toBe( 'wordpress.org' );
	} );
	it( 'should remove single trailing slash', () => {
		const url = filterURLForDisplay( 'http://www.wordpress.org/' );
		expect( url ).toBe( 'wordpress.org' );
	} );
	it( 'should preserve slashes where the url has multiple in the path', () => {
		const url = filterURLForDisplay( 'http://www.wordpress.org/something/' );
		expect( url ).toBe( 'wordpress.org/something/' );
	} );
	it( 'should preserve slash where the url has path after the initial slash', () => {
		const url = filterURLForDisplay( 'http://www.wordpress.org/something' );
		expect( url ).toBe( 'wordpress.org/something' );
	} );
} );

