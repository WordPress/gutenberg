/**
 * Internal dependencies
 */
import {
	requestContainsUnboundedQuery,
	rewriteUnboundedQuery,
} from '../url';

describe( 'requestContainsUnboundedQuery', () => {
	it( 'should return true when querying wp/v2 endpoints with per_page=-1', () => {
		expect( requestContainsUnboundedQuery(
			'/wp-json/wp/v2/posts?per_page=-1'
		) ).toBe( true );
	} );

	it( 'should return false for endpoints outside the wp/v2 namespace', () => {
		expect( requestContainsUnboundedQuery(
			'/wp-json/plugin/v7/resource?per_page=-1'
		) ).toBe( false );
	} );
} );

describe( 'rewriteUnboundedQuery', () => {
	it( 'should replace per_page=-1 with the maximum allowed per_page value', () => {
		expect( rewriteUnboundedQuery(
			'/wp-json/wp/v2/posts?per_page=-1'
		) ).toBe( '/wp-json/wp/v2/posts?per_page=100' );
	} );

	it( 'should not alter unrelated query parameters', () => {
		expect( rewriteUnboundedQuery(
			'/wp-json/wp/v2/posts?_fields=id,title&per_page=-1&search=searchterm'
		) ).toBe( '/wp-json/wp/v2/posts?_fields=id,title&per_page=100&search=searchterm' );
	} );

	it( 'should not alter queries to endpoints outside the wp/v2 namespace', () => {
		expect( rewriteUnboundedQuery(
			'/wp-json/plugin/v7/resource?per_page=-1'
		) ).toBe( '/wp-json/plugin/v7/resource?per_page=-1' );
	} );
} );
