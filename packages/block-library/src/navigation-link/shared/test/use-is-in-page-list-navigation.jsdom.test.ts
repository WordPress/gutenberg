import { describe, expect, it } from 'vitest';
import {
	removePageSuggestions,
	getLinkSuggestionsQuery,
} from '../use-is-in-page-list-navigation';
import { getSuggestionsQuery } from '../../../utils/link-picker';

describe( 'removePageSuggestions', () => {
	it( 'leaves out pages and keeps everything else', () => {
		const suggestions = [
			{ id: 1, type: 'page' },
			{ id: 2, type: 'post' },
			{ id: 3, type: 'category' },
			{ id: 'block', type: 'block' },
		];
		expect(
			removePageSuggestions( suggestions ).map( ( { id } ) => id )
		).toEqual( [ 2, 3, 'block' ] );
	} );
} );

describe( 'getLinkSuggestionsQuery', () => {
	it( 'matches the usual query when pages are allowed', () => {
		expect( getLinkSuggestionsQuery( 'page', 'post-type', false ) ).toEqual(
			getSuggestionsQuery( 'page', 'post-type' )
		);
		expect(
			getLinkSuggestionsQuery( undefined, undefined, false )
		).toEqual( getSuggestionsQuery() );
	} );

	it( 'suggests posts instead of pages when pages are left out', () => {
		const postsQuery = getSuggestionsQuery( 'post', 'post-type' );
		expect( getLinkSuggestionsQuery( 'page', 'post-type', true ) ).toEqual(
			postsQuery
		);
		expect( getLinkSuggestionsQuery( undefined, undefined, true ) ).toEqual(
			postsQuery
		);
	} );

	it( 'keeps the query for other link types', () => {
		expect(
			getLinkSuggestionsQuery( 'category', 'taxonomy', true )
		).toEqual( getSuggestionsQuery( 'category', 'taxonomy' ) );
	} );
} );
