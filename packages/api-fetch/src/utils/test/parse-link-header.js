/**
 * Internal dependencies
 */
import parseLinkHeader from '../parse-link-header';

describe( 'parse-link-header utility', () => {
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
