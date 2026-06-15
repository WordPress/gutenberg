/**
 * Internal dependencies
 */
import {
	default as fetchLinkSuggestions,
	sortResults,
	tokenize,
} from '../__experimental-fetch-link-suggestions';

jest.mock( '@wordpress/api-fetch', () =>
	jest.fn( ( { path } ) => {
		switch ( path ) {
			case '/wp/v2/search?search=&per_page=20&type=post':
			case '/wp/v2/search?search=Contact&per_page=20&type=post&subtype=page':
				return Promise.resolve( [
					{
						id: 37,
						title: 'Contact Page',
						url: 'http://wordpress.local/contact-page/',
						type: 'post',
						subtype: 'page',
					},
				] );
			case '/wp/v2/search?search=&per_page=20&type=term':
			case '/wp/v2/search?search=cat&per_page=20&type=term&subtype=category':
				return Promise.resolve( [
					{
						id: 9,
						title: 'Cats',
						url: 'http://wordpress.local/category/cats/',
						type: 'category',
					},
					{
						id: 1,
						title: 'Uncategorized',
						url: 'http://wordpress.local/category/uncategorized/',
						type: 'category',
					},
				] );
			case '/wp/v2/search?search=&per_page=20&type=post-format':
				return Promise.resolve( [
					{
						id: 'gallery',
						title: 'Gallery',
						url: 'http://wordpress.local/type/gallery/',
						type: 'post-format',
						kind: 'taxonomy',
					},
					{
						id: 'quote',
						title: 'Quote',
						url: 'http://wordpress.local/type/quote/',
						type: 'post-format',
						kind: 'taxonomy',
					},
				] );
			case '/wp/v2/search?search=&per_page=3&type=post&subtype=page':
				return Promise.resolve( [
					{
						id: 11,
						title: 'Limit Case',
						url: 'http://wordpress.local/limit-case/',
						type: 'post',
						subtype: 'page',
					},
				] );
			case '/wp/v2/search?search=&page=11&per_page=20&type=post&subtype=page':
				return Promise.resolve( [
					{
						id: 22,
						title: 'Page Case',
						url: 'http://wordpress.local/page-case/',
						type: 'post',
						subtype: 'page',
					},
				] );
			case '/wp/v2/media?search=&per_page=20':
				return Promise.resolve( [
					{
						id: 54,
						title: {
							rendered: 'Some Test Media Title',
						},
						type: 'attachment',
						source_url:
							'http://localhost:8888/wp-content/uploads/2022/03/test-pdf.pdf',
					},
				] );
			default:
				return Promise.resolve( [
					{
						id: -1,
						title: 'missing case or failed',
						url: path,
						type: 'missing case or failed',
					},
				] );
		}
	} )
);

describe( 'fetchLinkSuggestions', () => {
	it( 'filters suggestions by post-type', () => {
		return fetchLinkSuggestions( 'Contact', {
			type: 'post',
			subtype: 'page',
		} ).then( ( suggestions ) =>
			expect( suggestions ).toEqual( [
				{
					id: 37,
					title: 'Contact Page',
					type: 'page',
					url: 'http://wordpress.local/contact-page/',
					kind: 'post-type',
				},
			] )
		);
	} );
	it( 'filters suggestions by term', () => {
		return fetchLinkSuggestions( 'cat', {
			type: 'term',
			subtype: 'category',
		} ).then( ( suggestions ) =>
			expect( suggestions ).toEqual( [
				{
					id: 9,
					title: 'Cats',
					url: 'http://wordpress.local/category/cats/',
					type: 'category',
					kind: 'taxonomy',
				},
				{
					id: 1,
					title: 'Uncategorized',
					url: 'http://wordpress.local/category/uncategorized/',
					type: 'category',
					kind: 'taxonomy',
				},
			] )
		);
	} );
	it( 'filters suggestions by post-format', () => {
		return fetchLinkSuggestions( '', {
			type: 'post-format',
		} ).then( ( suggestions ) =>
			expect( suggestions ).toEqual( [
				{
					id: 'gallery',
					title: 'Gallery',
					url: 'http://wordpress.local/type/gallery/',
					type: 'post-format',
					kind: 'taxonomy',
				},
				{
					id: 'quote',
					title: 'Quote',
					url: 'http://wordpress.local/type/quote/',
					type: 'post-format',
					kind: 'taxonomy',
				},
			] )
		);
	} );
	it( 'filters does not return post-format suggestions when formats are not supported', () => {
		return fetchLinkSuggestions(
			'',
			{
				type: 'post-format',
			},
			{ disablePostFormats: true }
		).then( ( suggestions ) => expect( suggestions ).toEqual( [] ) );
	} );

	it( 'filters suggestions by attachment', () => {
		return fetchLinkSuggestions( '', {
			type: 'attachment',
		} ).then( ( suggestions ) =>
			expect( suggestions ).toEqual( [
				{
					id: 54,
					title: 'Some Test Media Title',
					url: 'http://localhost:8888/wp-content/uploads/2022/03/test-pdf.pdf',
					type: 'attachment',
					kind: 'media',
				},
			] )
		);
	} );

	it( 'returns suggestions from post, term, post-format and media', () => {
		return fetchLinkSuggestions( '', {} ).then( ( suggestions ) =>
			expect( suggestions ).toEqual( [
				{
					id: 37,
					title: 'Contact Page',
					url: 'http://wordpress.local/contact-page/',
					type: 'page',
					kind: 'post-type',
				},
				{
					id: 9,
					title: 'Cats',
					url: 'http://wordpress.local/category/cats/',
					type: 'category',
					kind: 'taxonomy',
				},
				{
					id: 1,
					title: 'Uncategorized',
					url: 'http://wordpress.local/category/uncategorized/',
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
					id: 'quote',
					title: 'Quote',
					url: 'http://wordpress.local/type/quote/',
					type: 'post-format',
					kind: 'taxonomy',
				},
				{
					id: 54,
					title: 'Some Test Media Title',
					url: 'http://localhost:8888/wp-content/uploads/2022/03/test-pdf.pdf',
					type: 'attachment',
					kind: 'media',
				},
			] )
		);
	} );
	describe( 'Initial search suggestions', () => {
		it( 'initial search suggestions limits results', () => {
			return fetchLinkSuggestions( '', {
				type: 'post',
				subtype: 'page',
				isInitialSuggestions: true,
			} ).then( ( suggestions ) =>
				expect( suggestions ).toEqual( [
					{
						id: 11,
						title: 'Limit Case',
						url: 'http://wordpress.local/limit-case/',
						type: 'page',
						kind: 'post-type',
					},
				] )
			);
		} );

		it( 'should allow custom search options for initial suggestions', () => {
			return fetchLinkSuggestions( '', {
				type: 'term',
				subtype: 'category',
				page: 11,
				isInitialSuggestions: true,
				initialSuggestionsSearchOptions: {
					type: 'post',
					subtype: 'page',
					perPage: 20,
					page: 11,
				},
			} ).then( ( suggestions ) =>
				expect( suggestions ).toEqual( [
					{
						id: 22,
						title: 'Page Case',
						url: 'http://wordpress.local/page-case/',
						type: 'page',
						kind: 'post-type',
					},
				] )
			);
		} );

		it( 'should default any missing initial search options to those from the main search options', () => {
			return fetchLinkSuggestions( '', {
				type: 'post',
				subtype: 'page',
				page: 11,
				perPage: 20,
				isInitialSuggestions: true,
				initialSuggestionsSearchOptions: {
					// intentionally missing.
					// expected to default to those from the main search options.
				},
			} ).then( ( suggestions ) =>
				expect( suggestions ).toEqual( [
					{
						id: 22,
						title: 'Page Case',
						url: 'http://wordpress.local/page-case/',
						type: 'page',
						kind: 'post-type',
					},
				] )
			);
		} );
	} );
	it( 'allows searching from a page', () => {
		return fetchLinkSuggestions( '', {
			type: 'post',
			subtype: 'page',
			page: 11,
		} ).then( ( suggestions ) =>
			expect( suggestions ).toEqual( [
				{
					id: 22,
					title: 'Page Case',
					url: 'http://wordpress.local/page-case/',
					type: 'page',
					kind: 'post-type',
				},
			] )
		);
	} );
} );

describe( 'sortResults', () => {
	it( 'returns empty array for empty results', () => {
		expect( sortResults( [], '' ) ).toEqual( [] );
	} );

	it( 'orders results', () => {
		const results = [
			{
				id: 1,
				title: 'How to get from Stockholm to Helsinki by boat',
				url: 'http://wordpress.local/stockholm-helsinki-boat/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'A day trip from Stockholm to Swedish countryside towns',
				url: 'http://wordpress.local/day-trip-stockholm/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 3,
				title: 'The art of packing lightly: How to travel with just a cabin bag',
				url: 'http://wordpress.local/packing-lightly/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 4,
				title: 'Tips for travel with a young baby',
				url: 'http://wordpress.local/young-baby-tips/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 5,
				title: '', // Test that empty titles don't cause an error.
				url: 'http://wordpress.local/420/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 6,
				title: 'City Guides',
				url: 'http://wordpress.local/city-guides/',
				type: 'category',
				kind: 'taxonomy',
			},
			{
				id: 7,
				title: 'Travel Tips',
				url: 'http://wordpress.local/travel-tips/',
				type: 'category',
				kind: 'taxonomy',
			},
		];
		const order = sortResults( results, 'travel tips' ).map(
			( result ) => result.id
		);
		expect( order ).toEqual( [
			7, // exact match
			4, // contains: travel, tips
			3, // contains: travel
			// same order as input:
			1,
			2,
			5,
			6,
		] );
	} );

	it( 'orders results to prefer direct matches over sub matches', () => {
		const results = [
			{
				id: 1,
				title: 'News',
				url: 'http://wordpress.local/news/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Newspaper',
				url: 'http://wordpress.local/newspaper/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 3,
				title: 'News Flash News',
				url: 'http://wordpress.local/news-flash-news/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 4,
				title: 'News',
				url: 'http://wordpress.local/news-2/',
				type: 'page',
				kind: 'post-type',
			},
		];
		const order = sortResults( results, 'News' ).map(
			( result ) => result.id
		);
		expect( order ).toEqual( [ 1, 4, 3, 2 ] );
	} );
} );

describe( 'tokenize', () => {
	it( 'returns empty array for empty string', () => {
		expect( tokenize( '' ) ).toEqual( [] );
	} );

	it( 'tokenizes a string', () => {
		expect( tokenize( 'Hello, world!' ) ).toEqual( [ 'hello', 'world' ] );
	} );

	it( 'tokenizes non latin languages', () => {
		expect( tokenize( 'こんにちは、世界！' ) ).toEqual( [
			'こんにちは',
			'世界',
		] );
	} );
} );
