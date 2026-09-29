import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { getQueryArgs } from '@wordpress/url';
import fetchLinkSuggestions from '../__experimental-fetch-link-suggestions';

vi.mock( '@wordpress/api-fetch', () => ( {
	default: vi.fn(),
} ) );

const ENDPOINT = '/wp-block-editor/v1/link-suggestions';

/**
 * The query arguments of the one request made.
 */
function getRequestedArgs() {
	const { path } = apiFetch.mock.calls[ 0 ][ 0 ];
	expect( path.split( '?' )[ 0 ] ).toBe( ENDPOINT );
	return getQueryArgs( path );
}

describe( 'fetchLinkSuggestions', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( [] );
	} );

	it( 'requests one page of suggestions from the link suggestions endpoint', async () => {
		await fetchLinkSuggestions( 'coffee' );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: `${ ENDPOINT }?search=coffee&per_page=20`,
		} );
	} );

	it( 'passes on the type, subtype, page and number per page asked for', async () => {
		await fetchLinkSuggestions( 'Contact', {
			type: 'post',
			subtype: 'page',
			page: 2,
			perPage: 5,
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: `${ ENDPOINT }?search=Contact&page=2&per_page=5&type=post&subtype=page`,
		} );
	} );

	it( 'leaves out post formats when they are disabled', async () => {
		await fetchLinkSuggestions(
			'gallery',
			{ typeExclude: [ 'attachment' ] },
			{ disablePostFormats: true }
		);

		expect( getRequestedArgs() ).toEqual( {
			search: 'gallery',
			per_page: '20',
			type_exclude: [ 'attachment', 'post-format' ],
		} );
	} );

	it( 'passes the types and subtypes asked for', async () => {
		await fetchLinkSuggestions( 'chai', {
			type: [ 'post', 'term' ],
			subtype: [ 'page', 'category' ],
		} );

		expect( getRequestedArgs() ).toEqual( {
			search: 'chai',
			per_page: '20',
			type: [ 'post', 'term' ],
			subtype: [ 'page', 'category' ],
		} );
	} );

	it( 'passes the types and subtypes to leave out', async () => {
		await fetchLinkSuggestions( 'chai', {
			typeExclude: [ 'attachment' ],
			subtypeExclude: [ 'post_tag' ],
		} );

		expect( getRequestedArgs() ).toEqual( {
			search: 'chai',
			per_page: '20',
			type_exclude: [ 'attachment' ],
			subtype_exclude: [ 'post_tag' ],
		} );
	} );

	it( 'passes the preferred types in the order given', async () => {
		await fetchLinkSuggestions( 'chai', {
			preferTypes: [
				{ type: 'term', subtype: 'category' },
				'attachment',
			],
		} );

		expect( getRequestedArgs() ).toEqual( {
			search: 'chai',
			per_page: '20',
			prefer_types: [
				{ type: 'term', subtype: 'category' },
				'attachment',
			],
		} );
	} );

	it( 'keeps the order the endpoint ranked the suggestions in, as links of each kind', async () => {
		apiFetch.mockResolvedValue( [
			{
				id: 2,
				title: 'Notes On Coffee',
				url: 'http://wordpress.local/notes-on-coffee/',
				type: 'post',
				subtype: 'page',
			},
			{
				id: 9,
				title: 'Coffee',
				url: 'http://wordpress.local/category/coffee/',
				type: 'term',
				subtype: 'category',
			},
			{
				id: 'gallery',
				title: 'Gallery',
				url: 'http://wordpress.local/type/gallery/',
				type: 'post-format',
				subtype: 'post-format',
			},
			{
				id: 54,
				title: 'Coffee Photo',
				url: 'http://wordpress.local/wp-content/uploads/coffee.jpg',
				type: 'attachment',
				subtype: 'attachment',
			},
		] );

		expect( await fetchLinkSuggestions( 'coffee' ) ).toEqual( [
			{
				id: 2,
				title: 'Notes On Coffee',
				url: 'http://wordpress.local/notes-on-coffee/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 9,
				title: 'Coffee',
				url: 'http://wordpress.local/category/coffee/',
				type: 'category',
				kind: 'taxonomy',
			},
			{
				id: 'gallery',
				title: 'Gallery',
				url: 'http://wordpress.local/type/gallery/',
				type: 'post-format',
				kind: 'taxonomy',
			},
			{
				id: 54,
				title: 'Coffee Photo',
				url: 'http://wordpress.local/wp-content/uploads/coffee.jpg',
				type: 'attachment',
				kind: 'media',
			},
		] );
	} );

	it( 'names untitled suggestions', async () => {
		apiFetch.mockResolvedValue( [
			{
				id: 2,
				title: '',
				url: 'http://wordpress.local/2/',
				type: 'post',
				subtype: 'page',
			},
		] );

		expect(
			( await fetchLinkSuggestions( '' ) ).map( ( { title } ) => title )
		).toEqual( [ '(no title)' ] );
	} );

	it( 'returns no suggestions when the request fails', async () => {
		apiFetch.mockRejectedValue( {
			code: 'rest_forbidden',
			message: 'Sorry, you are not allowed to search for links.',
		} );

		expect( await fetchLinkSuggestions( 'coffee' ) ).toEqual( [] );
	} );

	describe( 'Initial search suggestions', () => {
		it( 'asks for three suggestions by default', async () => {
			await fetchLinkSuggestions( '', { isInitialSuggestions: true } );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `${ ENDPOINT }?search=&per_page=3`,
			} );
		} );

		it( 'uses the options given for initial suggestions over the search options', async () => {
			await fetchLinkSuggestions( '', {
				isInitialSuggestions: true,
				type: 'term',
				perPage: 10,
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage: 5,
				},
			} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `${ ENDPOINT }?search=&per_page=5&type=post&subtype=page`,
			} );
		} );

		it( 'falls back to the search options for any initial suggestion option not given', async () => {
			await fetchLinkSuggestions( '', {
				isInitialSuggestions: true,
				type: 'post',
				subtype: 'page',
				initialSuggestionsSearchOptions: {
					perPage: 5,
				},
			} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `${ ENDPOINT }?search=&per_page=5&type=post&subtype=page`,
			} );
		} );
	} );
} );
