/**
 * External dependencies
 */
import { every } from 'lodash';

/**
 * Internal dependencies
 */
import {
	isURL,
	isEmail,
	getProtocol,
	isValidProtocol,
	getAuthority,
	isValidAuthority,
	getPath,
	isValidPath,
	getQueryString,
	isValidQueryString,
	getFragment,
	isValidFragment,
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

describe( 'isEmail', () => {
	it( 'returns true when given things that look like an email', () => {
		const emails = [
			'simple@wordpress.org',
			'very.common@wordpress.org',
			'disposable.style.email.with+symbol@wordpress.org',
			'other.email-with-hyphen@wordpress.org',
			'fully-qualified-domain@wordpress.org',
			'user.name+tag+sorting@wordpress.org',
			'x@wordpress.org',
			'wordpress-indeed@strange-wordpress.org',
			'wordpress@s.wordpress',
		];

		expect( every( emails, isEmail ) ).toBe( true );
	} );

	it( 'returns false when given things that don\'t look like an email', () => {
		const emails = [
			'Abc.wordpress.org',
			'A@b@c@wordpress.org',
			'a"b(c)d,e:f;g<h>i[j\k]l@wordpress.org',
			'just"not"right@wordpress.org',
			'this is"not\allowed@wordpress.org',
			'this\ still\"not\\allowed@wordpress.org',
			'1234567890123456789012345678901234567890123456789012345678901234+x@wordpress.org',
		];

		expect( every( emails, isEmail ) ).toBe( false );
	} );
} );

describe( 'getProtocol', () => {
	it( 'returns the protocol part of a URL', () => {
		expect( getProtocol( 'http://user:password@www.test-this.com:1020/test-path/file.extension#anchor?query=params&more' ) ).toBe( 'http:' );
		expect( getProtocol( 'https://user:password@www.test-this.com:1020/test-path/file.extension#anchor?query=params&more' ) ).toBe( 'https:' );
		expect( getProtocol( 'https://wordpress.org#test' ) ).toBe( 'https:' );
		expect( getProtocol( 'https://wordpress.org/' ) ).toBe( 'https:' );
		expect( getProtocol( 'https://wordpress.org?test' ) ).toBe( 'https:' );
		expect( getProtocol( 'https://localhost:8080' ) ).toBe( 'https:' );
		expect( getProtocol( 'tel:1234' ) ).toBe( 'tel:' );
		expect( getProtocol( 'blob:data' ) ).toBe( 'blob:' );
	} );

	it( 'returns undefined when the provided value does not contain a URL protocol', () => {
		expect( getProtocol( '' ) ).toBeUndefined();
		expect( getProtocol( 'https' ) ).toBeUndefined();
		expect( getProtocol( 'test.com' ) ).toBeUndefined();
		expect( getProtocol( ' https:// ' ) ).toBeUndefined();
	} );
} );

describe( 'isValidProtocol', () => {
	it( 'returns true if the protocol is valid', () => {
		expect( isValidProtocol( 'tel:' ) ).toBe( true );
		expect( isValidProtocol( 'http:' ) ).toBe( true );
		expect( isValidProtocol( 'https:' ) ).toBe( true );
		expect( isValidProtocol( 'file:' ) ).toBe( true );
		expect( isValidProtocol( 'test.protocol:' ) ).toBe( true );
		expect( isValidProtocol( 'test-protocol:' ) ).toBe( true );
		expect( isValidProtocol( 'test+protocol:' ) ).toBe( true );
		expect( isValidProtocol( 'test+protocol123:' ) ).toBe( true );
	} );

	it( 'returns false if the protocol is invalid', () => {
		expect( isValidProtocol() ).toBe( false );
		expect( isValidProtocol( '' ) ).toBe( false );
		expect( isValidProtocol( ' http: ' ) ).toBe( false );
		expect( isValidProtocol( 'http :' ) ).toBe( false );
		expect( isValidProtocol( 'http: //' ) ).toBe( false );
		expect( isValidProtocol( 'test protocol:' ) ).toBe( false );
		expect( isValidProtocol( 'test#protocol:' ) ).toBe( false );
		expect( isValidProtocol( 'test?protocol:' ) ).toBe( false );
		expect( isValidProtocol( '123test+protocol:' ) ).toBe( false );
	} );
} );

describe( 'getAuthority', () => {
	it( 'returns the authority part of a URL', () => {
		expect( getAuthority( 'https://user:password@www.test-this.com:1020/test-path/file.extension#anchor?query=params&more' ) ).toBe( 'user:password@www.test-this.com:1020' );
		expect( getAuthority( 'http://user:password@www.test-this.com:1020/test-path/file.extension#anchor?query=params&more' ) ).toBe( 'user:password@www.test-this.com:1020' );
		expect( getAuthority( 'https://wordpress.org#test' ) ).toBe( 'wordpress.org' );
		expect( getAuthority( 'https://wordpress.org/' ) ).toBe( 'wordpress.org' );
		expect( getAuthority( 'https://wordpress.org?test' ) ).toBe( 'wordpress.org' );
		expect( getAuthority( 'https://localhost:8080' ) ).toBe( 'localhost:8080' );
	} );

	it( 'returns undefined when the provided value does not contain a URL authority', () => {
		expect( getAuthority( '' ) ).toBeUndefined();
		expect( getAuthority( 'https://' ) ).toBeUndefined();
		expect( getAuthority( 'https:///' ) ).toBeUndefined();
		expect( getAuthority( 'https://#' ) ).toBeUndefined();
		expect( getAuthority( 'https://?' ) ).toBeUndefined();
		expect( getAuthority( 'test.com' ) ).toBeUndefined();
		expect( getAuthority( 'https://#?hello' ) ).toBeUndefined();
	} );
} );

describe( 'isValidAuthority', () => {
	it( 'returns true if the authority is valid', () => {
		expect( isValidAuthority( 'user:password@www.test-this.com:1020' ) ).toBe( true );
		expect( isValidAuthority( 'wordpress.org' ) ).toBe( true );
		expect( isValidAuthority( 'localhost' ) ).toBe( true );
		expect( isValidAuthority( 'localhost:8080' ) ).toBe( true );
		expect( isValidAuthority( 'www.the-best-website.co.uk' ) ).toBe( true );
		expect( isValidAuthority( 'WWW.VERYLOUD.COM' ) ).toBe( true );
	} );

	it( 'returns false if the authority is invalid', () => {
		expect( isValidAuthority() ).toBe( false );
		expect( isValidAuthority( '' ) ).toBe( false );
		expect( isValidAuthority( 'inv alid.website.com' ) ).toBe( false );
		expect( isValidAuthority( 'test#.com' ) ).toBe( false );
		expect( isValidAuthority( 'test?.com' ) ).toBe( false );
	} );
} );

describe( 'getPath', () => {
	it( 'returns the path part of a URL', () => {
		expect( getPath( 'https://user:password@www.test-this.com:1020/test-path/file.extension#anchor?query=params&more' ) ).toBe( 'test-path/file.extension' );
		expect( getPath( 'http://user:password@www.test-this.com:1020/test-path/file.extension#anchor?query=params&more' ) ).toBe( 'test-path/file.extension' );
		expect( getPath( 'https://wordpress.org/test-path#anchor' ) ).toBe( 'test-path' );
		expect( getPath( 'https://wordpress.org/test-path?query' ) ).toBe( 'test-path' );
		expect( getPath( 'https://www.google.com/search?source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10' ) ).toBe( 'search' );
		expect( getPath( 'https://wordpress.org/this%20is%20a%20test' ) ).toBe( 'this%20is%20a%20test' );
		expect( getPath( 'https://wordpress.org/this%20is%20a%20test?query' ) ).toBe( 'this%20is%20a%20test' );
	} );

	it( 'returns undefined when the provided value does not contain a URL path', () => {
		expect( getPath() ).toBeUndefined();
		expect( getPath( '' ) ).toBeUndefined();
		expect( getPath( 'https://wordpress.org#test' ) ).toBeUndefined();
		expect( getPath( 'https://wordpress.org/' ) ).toBeUndefined();
		expect( getPath( 'https://wordpress.org?test' ) ).toBeUndefined();
		expect( getPath( 'https://localhost:8080' ) ).toBeUndefined();
		expect( getPath( 'https://' ) ).toBeUndefined();
		expect( getPath( 'https:///test' ) ).toBeUndefined();
		expect( getPath( 'https://#' ) ).toBeUndefined();
		expect( getPath( 'https://?' ) ).toBeUndefined();
		expect( getPath( 'test.com' ) ).toBeUndefined();
		expect( getPath( 'https://#?hello' ) ).toBeUndefined();
		expect( getPath( 'https' ) ).toBeUndefined();
	} );
} );

describe( 'isValidPath', () => {
	it( 'returns true if the path is valid', () => {
		expect( isValidPath( 'test-path/file.extension' ) ).toBe( true );
		expect( isValidPath( '/absolute/path' ) ).toBe( true );
		expect( isValidPath( 'relative/path' ) ).toBe( true );
		expect( isValidPath( 'slightly/longer/path/' ) ).toBe( true );
		expect( isValidPath( 'path/with/percent%20encoding' ) ).toBe( true );
	} );

	it( 'returns false if the path is invalid', () => {
		expect( isValidPath() ).toBe( false );
		expect( isValidPath( '' ) ).toBe( false );
		expect( isValidPath( 'path /with/spaces' ) ).toBe( false );
		expect( isValidPath( 'path/with/number/symbol#' ) ).toBe( false );
		expect( isValidPath( 'path/with/question/mark?' ) ).toBe( false );
		expect( isValidPath( ' path/with/padding ' ) ).toBe( false );
	} );
} );

describe( 'getQueryString', () => {
	it( 'returns the query string of a URL', () => {
		expect( getQueryString( 'https://user:password@www.test-this.com:1020/test-path/file.extension#anchor?query=params&more' ) ).toBe( 'query=params&more' );
		expect( getQueryString( 'http://user:password@www.test-this.com:1020/test-path/file.extension?query=params&more#anchor' ) ).toBe( 'query=params&more' );
		expect( getQueryString( 'https://wordpress.org/test-path?query' ) ).toBe( 'query' );
		expect( getQueryString( 'https://www.google.com/search?source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10' ) )
			.toBe( 'source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10' );
		expect( getQueryString( 'https://wordpress.org/this%20is%20a%20test?query' ) ).toBe( 'query' );
		expect( getQueryString( 'https://wordpress.org/test?query=something%20with%20spaces' ) ).toBe( 'query=something%20with%20spaces' );
		expect( getQueryString( 'https://andalouses.example/beach?foo[]=bar&foo[]=baz' ) ).toBe( 'foo[]=bar&foo[]=baz' );
		expect( getQueryString( 'test.com?foo[]=bar&foo[]=baz' ) ).toBe( 'foo[]=bar&foo[]=baz' );
		expect( getQueryString( 'test.com?foo=bar&foo=baz?test' ) ).toBe( 'foo=bar&foo=baz?test' );
	} );

	it( 'returns undefined when the provided does not contain a url query string', () => {
		expect( getQueryString( '' ) ).toBeUndefined();
		expect( getQueryString( 'https://wordpress.org/test-path#anchor' ) ).toBeUndefined();
		expect( getQueryString( 'https://wordpress.org/this%20is%20a%20test' ) ).toBeUndefined();
		expect( getQueryString( 'https://wordpress.org#test' ) ).toBeUndefined();
		expect( getQueryString( 'https://wordpress.org/' ) ).toBeUndefined();
		expect( getQueryString( 'https://localhost:8080' ) ).toBeUndefined();
		expect( getQueryString( 'https://' ) ).toBeUndefined();
		expect( getQueryString( 'https:///test' ) ).toBeUndefined();
		expect( getQueryString( 'https://#' ) ).toBeUndefined();
		expect( getQueryString( 'https://?' ) ).toBeUndefined();
		expect( getQueryString( 'test.com' ) ).toBeUndefined();
	} );
} );

describe( 'isValidQueryString', () => {
	it( 'returns true if the query string is valid', () => {
		expect( isValidQueryString( 'test' ) ).toBe( true );
		expect( isValidQueryString( 'test=true' ) ).toBe( true );
		expect( isValidQueryString( 'test=true&another' ) ).toBe( true );
		expect( isValidQueryString( 'test=true&another=false' ) ).toBe( true );
		expect( isValidQueryString( 'test[]=true&another[]=false' ) ).toBe( true );
		expect( isValidQueryString( 'query=something%20with%20spaces' ) ).toBe( true );
		expect( isValidQueryString( 'source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10' ) ).toBe( true );
	} );

	it( 'returns false if the query string is invalid', () => {
		expect( isValidQueryString() ).toBe( false );
		expect( isValidQueryString( '' ) ).toBe( false );
		expect( isValidQueryString( '?test=false' ) ).toBe( false );
		expect( isValidQueryString( ' test=false ' ) ).toBe( false );
		expect( isValidQueryString( 'test = false' ) ).toBe( false );
		expect( isValidQueryString( 'test=f?alse' ) ).toBe( false );
		expect( isValidQueryString( 'test=f#alse' ) ).toBe( false );
		expect( isValidQueryString( 'test=f/alse' ) ).toBe( false );
		expect( isValidQueryString( 'test=f?alse' ) ).toBe( false );
		expect( isValidQueryString( '/test=false' ) ).toBe( false );
		expect( isValidQueryString( 'test=false/' ) ).toBe( false );
	} );
} );

describe( 'getFragment', () => {
	it( 'returns the fragment of a URL', () => {
		expect( getFragment( 'https://user:password@www.test-this.com:1020/test-path/file.extension#fragment?query=params&more' ) ).toBe( '#fragment' );
		expect( getFragment( 'http://user:password@www.test-this.com:1020/test-path/file.extension?query=params&more#fragment' ) ).toBe( '#fragment' );
		expect( getFragment( 'relative/url/#fragment' ) ).toBe( '#fragment' );
		expect( getFragment( '/absolute/url/#fragment' ) ).toBe( '#fragment' );
	} );

	it( 'returns undefined when the provided does not contain a url fragment', () => {
		expect( getFragment( '' ) ).toBeUndefined();
		expect( getFragment( 'https://wordpress.org/test-path?query' ) ).toBeUndefined();
		expect( getFragment( 'https://wordpress.org/test-path' ) ).toBeUndefined();
		expect( getFragment( 'https://wordpress.org/this%20is%20a%20test' ) ).toBeUndefined();
		expect( getFragment( 'https://www.google.com/search?source=hp&ei=tP7kW8-_FoK89QORoa2QBQ&q=test+url&oq=test+url&gs_l=psy-ab.3..0l10' ) ).toBeUndefined();
		expect( getFragment( 'https://wordpress.org' ) ).toBeUndefined();
		expect( getFragment( 'https://localhost:8080' ) ).toBeUndefined();
		expect( getFragment( 'https://' ) ).toBeUndefined();
		expect( getFragment( 'https:///test' ) ).toBeUndefined();
		expect( getFragment( 'https://?' ) ).toBeUndefined();
		expect( getFragment( 'test.com' ) ).toBeUndefined();
	} );
} );

describe( 'isValidFragment', () => {
	it( 'returns true if the fragment is valid', () => {
		expect( isValidFragment( '#' ) ).toBe( true );
		expect( isValidFragment( '#yesitis' ) ).toBe( true );
		expect( isValidFragment( '#yes_it_is' ) ).toBe( true );
		expect( isValidFragment( '#yes~it~is' ) ).toBe( true );
		expect( isValidFragment( '#yes-it-is' ) ).toBe( true );
	} );

	it( 'returns false if the fragment is invalid', () => {
		expect( isValidFragment( '' ) ).toBe( false );
		expect( isValidFragment( ' #no-it-isnt ' ) ).toBe( false );
		expect( isValidFragment( '#no-it-isnt#' ) ).toBe( false );
		expect( isValidFragment( '#no-it-#isnt' ) ).toBe( false );
		expect( isValidFragment( '#no-it-isnt?' ) ).toBe( false );
		expect( isValidFragment( '#no-it isnt' ) ).toBe( false );
		expect( isValidFragment( '/#no-it-isnt' ) ).toBe( false );
		expect( isValidFragment( '#no-it-isnt/' ) ).toBe( false );
	} );
} );

describe( 'addQueryArgs', () => {
	it( 'should append args to a URL without query string', () => {
		const url = 'https://andalouses.example/beach';
		const args = { sun: 'true', sand: 'false' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://andalouses.example/beach?sun=true&sand=false' );
	} );

	it( 'should append args to a URL with query string', () => {
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

	it( 'should encodes spaces by RFC 3986', () => {
		const url = 'https://andalouses.example/beach';
		const args = { activity: 'fun in the sun' };

		expect( addQueryArgs( url, args ) ).toBe( 'https://andalouses.example/beach?activity=fun%20in%20the%20sun' );
	} );

	it( 'should return only querystring when passed undefined url', () => {
		const url = undefined;
		const args = { sun: 'true' };

		expect( addQueryArgs( url, args ) ).toBe( '?sun=true' );
	} );

	it( 'should return URL argument unaffected if no query arguments to append', () => {
		[ '', 'https://example.com', 'https://example.com?' ].forEach( ( url ) => {
			[ undefined, {} ].forEach( ( args ) => {
				expect( addQueryArgs( url, args ) ).toBe( url );
			} );
		} );
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

	it( 'continues to work when an anchor follows the query string', () => {
		const url = 'https://andalouses.example/beach?foo=bar&bar=baz#foo';

		expect( getQueryArg( url, 'foo' ) ).toEqual( 'bar' );
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

