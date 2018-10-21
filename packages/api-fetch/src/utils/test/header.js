/**
 * Internal dependencies
 */
import {
	parseLinkHeader,
	getNextLinkFromResponse,
} from '../header';

describe( 'parse-link-header', () => {
	it( 'should return null for empty or undefined link strings', () => {
		expect.hasAssertions();

		expect( parseLinkHeader() ).toBeNull();
		expect( parseLinkHeader( '' ) ).toBeNull();
		expect( parseLinkHeader( null ) ).toBeNull();
	} );

	it( 'should return an object containing the "next" relation url', () => {
		expect.hasAssertions();

		const linkHeader = '<https://make.wordpress.org/core/wp-json/wp/v2/posts?page=2>; rel="next"';

		expect( parseLinkHeader( linkHeader ) ).toEqual( {
			next: {
				rel: 'next',
				url: 'https://make.wordpress.org/core/wp-json/wp/v2/posts?page=2',
			},
		} );
	} );
} );

describe( 'getNextLinkFromResponse', () => {
	it( 'should return the url of the "next" link relation', () => {
		expect( getNextLinkFromResponse( {
			headers: {
				get() {
					return '<https://make.wordpress.org/core/wp-json/wp/v2/posts?page=2>; rel="next"';
				},
			},
		} ) ).toBe( 'https://make.wordpress.org/core/wp-json/wp/v2/posts?page=2' );
	} );

	it( 'should return null for an invalid response object', () => {
		expect.hasAssertions();

		expect( getNextLinkFromResponse( null ) ).toBeNull();
		expect( getNextLinkFromResponse( {} ) ).toBeNull();
		expect( getNextLinkFromResponse() ).toBeNull();
	} );

	it( 'should return null for a missing link header', () => {
		expect( getNextLinkFromResponse( {
			headers: {
				get() {
					return null;
				},
			},
		} ) ).toBeNull();
	} );

	it( 'should return null for an empty link header', () => {
		expect( getNextLinkFromResponse( {
			headers: {
				get() {
					return '';
				},
			},
		} ) ).toBeNull();
	} );

	it( 'should return null for a malformed link header', () => {
		expect( getNextLinkFromResponse( {
			headers: {
				get() {
					return '<https://make.wordpress.org/core/wp-json/wp/v2/posts?page=2>: rl="next';
				},
			},
		} ) ).toBeNull();
	} );

	it( 'should return null for a link header with no "next" relation', () => {
		expect( getNextLinkFromResponse( {
			headers: {
				get() {
					return '<https://make.wordpress.org/core/wp-json/wp/v2/posts?page=2>; rel="prev"';
				},
			},
		} ) ).toBeNull();
	} );
} );
