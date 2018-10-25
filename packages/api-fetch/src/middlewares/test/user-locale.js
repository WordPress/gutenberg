/**
 * Internal dependencies
 */
import userLocaleMiddleware from '../user-locale';

describe( 'User locale middleware', () => {
	it( 'should append the _locale parameter to the path', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts',
		};

		const callback = ( options ) => {
			expect( options.path ).toBe( '/wp/v2/posts?_locale=user' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );

	it( 'should append the _locale parameter to path with existing query argument', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts?foo=bar',
		};

		const callback = ( options ) => {
			expect( options.path ).toBe( '/wp/v2/posts?foo=bar&_locale=user' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );

	it( 'does not modify existing single _locale parameter in path', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts?_locale=foo',
		};

		const callback = ( options ) => {
			expect( options.path ).toBe( '/wp/v2/posts?_locale=foo' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );

	it( 'does not modify existing _locale parameter in path', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			path: '/wp/v2/posts?foo=bar&_locale=foo',
		};

		const callback = ( options ) => {
			expect( options.path ).toBe( '/wp/v2/posts?foo=bar&_locale=foo' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );

	it( 'should append the _locale parameter to the url', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			url: 'http://wp.org/wp-json/wp/v2/posts',
		};

		const callback = ( options ) => {
			expect( options.url ).toBe( 'http://wp.org/wp-json/wp/v2/posts?_locale=user' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );

	it( 'should append the _locale parameter to url with existing query argument', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			url: 'http://wp.org/wp-json/wp/v2/posts?foo=bar',
		};

		const callback = ( options ) => {
			expect( options.url ).toBe( 'http://wp.org/wp-json/wp/v2/posts?foo=bar&_locale=user' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );

	it( 'does not modify existing single _locale parameter in url', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			url: 'http://wp.org/wp-json/wp/v2/posts?_locale=foo',
		};

		const callback = ( options ) => {
			expect( options.url ).toBe( 'http://wp.org/wp-json/wp/v2/posts?_locale=foo' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );

	it( 'does not modify existing _locale parameter in url', () => {
		expect.hasAssertions();

		const requestOptions = {
			method: 'GET',
			url: 'http://wp.org/wp-json/wp/v2/posts?foo=bar&_locale=foo',
		};

		const callback = ( options ) => {
			expect( options.url ).toBe( 'http://wp.org/wp-json/wp/v2/posts?foo=bar&_locale=foo' );
		};

		userLocaleMiddleware( requestOptions, callback );
	} );
} );
