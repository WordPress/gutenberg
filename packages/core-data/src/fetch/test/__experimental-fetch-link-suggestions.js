import { describe, expect, it, vi } from 'vitest';
import {
	default as fetchLinkSuggestions,
	sortResults,
	tokenize,
} from '../__experimental-fetch-link-suggestions';

vi.mock( '@wordpress/api-fetch', () => ( {
	default: vi.fn( ( { path } ) => {
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
	} ),
} ) );

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
				// Attachments rank above post formats by default.
				{
					id: 54,
					title: 'Some Test Media Title',
					url: 'http://localhost:8888/wp-content/uploads/2022/03/test-pdf.pdf',
					type: 'attachment',
					kind: 'media',
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

	it( 'scores results that share an id separately', () => {
		// Posts, terms and media are separate tables, so ids repeat across
		// them. On a fresh site the post "Hello world!" and the category
		// "Uncategorized" are both id 1.
		const results = [
			{
				id: 1,
				title: 'Hello world!',
				type: 'post',
				kind: 'post-type',
				url: 'http://wordpress.local/hello-world/',
			},
			{
				id: 1,
				title: 'Contact',
				type: 'category',
				kind: 'taxonomy',
				url: 'http://wordpress.local/category/contact/',
			},
			{
				id: 2,
				title: 'Contact us today',
				type: 'page',
				kind: 'post-type',
				url: 'http://wordpress.local/contact-us-today/',
			},
		];

		// "Contact" is exactly what was typed, so it leads whatever its type.
		expect(
			sortResults( results, 'contact' ).map( ( { title } ) => title )
		).toEqual( [ 'Contact', 'Contact us today', 'Hello world!' ] );
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

	it( 'orders a title that begins with the search term above a shorter title that only contains it', () => {
		const results = [
			{
				id: 1,
				title: 'Our Coffee',
				url: 'http://wordpress.local/our-coffee/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffee Roasting Guide For Beginners',
				url: 'http://wordpress.local/coffee-roasting-guide/',
				type: 'page',
				kind: 'post-type',
			},
		];

		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Coffee Roasting Guide For Beginners', 'Our Coffee' ] );
	} );

	it( 'orders a whole title match above a title that only begins with the search term', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee',
				url: 'http://wordpress.local/coffee/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffee Guide',
				url: 'http://wordpress.local/coffee-guide/',
				type: 'page',
				kind: 'post-type',
			},
		];

		expect(
			sortResults( results, 'coffee guide' ).map( ( { title } ) => title )
		).toEqual( [ 'Coffee Guide', 'Coffee' ] );
	} );

	it( 'orders by the start of a title from the first character typed', () => {
		const results = [
			{
				id: 1,
				title: 'Tips for travel with a young baby',
				url: 'http://wordpress.local/young-baby-tips/',
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
		];

		expect( sortResults( results, 'a' ).map( ( { id } ) => id ) ).toEqual( [
			2, 1,
		] );
	} );

	it( 'orders an attachment below an entity that matches the search term as well', () => {
		const results = [
			{
				id: 1,
				title: 'Sunny Beach',
				url: 'http://wordpress.local/wp-content/uploads/sunny-beach.jpg',
				type: 'attachment',
				kind: 'media',
			},
			{
				id: 2,
				title: 'A Day At The Beach',
				url: 'http://wordpress.local/a-day-at-the-beach/',
				type: 'page',
				kind: 'post-type',
			},
		];

		expect(
			sortResults( results, 'beach' ).map( ( { title } ) => title )
		).toEqual( [ 'A Day At The Beach', 'Sunny Beach' ] );
	} );

	it( 'orders a post format below an entity that matches the search term as well', () => {
		const results = [
			{
				id: 'gallery',
				title: 'Gallery',
				url: 'http://wordpress.local/type/gallery/',
				type: 'post-format',
				kind: 'taxonomy',
			},
			{
				id: 2,
				title: 'The Gallery Show Of The Year',
				url: 'http://wordpress.local/the-gallery-show-of-the-year/',
				type: 'page',
				kind: 'post-type',
			},
		];

		expect(
			sortResults( results, 'gallery show' ).map( ( { title } ) => title )
		).toEqual( [ 'The Gallery Show Of The Year', 'Gallery' ] );
	} );

	it( 'keeps an attachment first when its title is what was typed', () => {
		const results = [
			{
				id: 1,
				title: 'Day',
				url: 'http://wordpress.local/day/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Beach Day',
				url: 'http://wordpress.local/wp-content/uploads/beach-day.jpg',
				type: 'attachment',
				kind: 'media',
			},
		];

		// The page does not answer the search at all, so being a page does not
		// lift it above an attachment that does.
		expect(
			sortResults( results, 'beach day' ).map( ( { title } ) => title )
		).toEqual( [ 'Beach Day', 'Day' ] );
	} );

	it( 'ranks a preferred type that contains the whole search term above another type that begins with it', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Equipment',
				url: 'http://wordpress.local/category/coffee-equipment/',
				type: 'category',
				kind: 'taxonomy',
			},
			{
				id: 2,
				title: 'Our Coffee',
				url: 'http://wordpress.local/our-coffee/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// Both titles contain the whole word, so the type decides between them.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Our Coffee', 'Coffee Equipment' ] );
	} );

	it( 'ranks a title that contains only part of a word below one that contains all of it', () => {
		const results = [
			{
				id: 1,
				title: 'Coffeehouse Rules',
				url: 'http://wordpress.local/coffeehouse-rules/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Notes On Coffee',
				url: 'http://wordpress.local/category/notes-on-coffee/',
				type: 'category',
				kind: 'taxonomy',
			},
		];

		// "Coffeehouse" is a different word, so the page does not answer the
		// search and being a page does not lift it.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Notes On Coffee', 'Coffeehouse Rules' ] );
	} );

	it( 'requires every word typed to appear in the title', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee',
				url: 'http://wordpress.local/coffee/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Our Coffee Guide',
				url: 'http://wordpress.local/category/our-coffee-guide/',
				type: 'category',
				kind: 'taxonomy',
			},
		];

		// The page has only one of the two words typed.
		expect(
			sortResults( results, 'coffee guide' ).map( ( { title } ) => title )
		).toEqual( [ 'Our Coffee Guide', 'Coffee' ] );
	} );

	it( 'ranks an exact title match first, whatever its type', () => {
		const results = [
			{
				id: 1,
				title: 'Our Coffee',
				url: 'http://wordpress.local/1/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffee',
				url: 'http://wordpress.local/2/',
				type: 'attachment',
				kind: 'media',
			},
		];

		// An exact title is the only thing that lifts a type above its rank.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Coffee', 'Our Coffee' ] );
	} );

	it( 'does not lift an attachment that merely begins with the search term', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Cup Photo',
				url: 'http://wordpress.local/1/',
				type: 'attachment',
				kind: 'media',
			},
			{
				id: 2,
				title: 'Our Coffee',
				url: 'http://wordpress.local/2/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// Beginning with the term earns nothing across types, so the page wins.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Our Coffee', 'Coffee Cup Photo' ] );
	} );

	it( 'orders types by pages, categories, posts, tags, attachments, then post formats', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Format',
				url: 'http://wordpress.local/1/',
				type: 'post-format',
				kind: 'taxonomy',
			},
			{
				id: 2,
				title: 'Coffee Photo',
				url: 'http://wordpress.local/2/',
				type: 'attachment',
				kind: 'media',
			},
			{
				id: 3,
				title: 'Coffee Tag',
				url: 'http://wordpress.local/3/',
				type: 'post_tag',
				kind: 'taxonomy',
			},
			{
				id: 4,
				title: 'Coffee Post',
				url: 'http://wordpress.local/4/',
				type: 'post',
				kind: 'post-type',
			},
			{
				id: 5,
				title: 'Coffee Category',
				url: 'http://wordpress.local/5/',
				type: 'category',
				kind: 'taxonomy',
			},
			{
				id: 6,
				title: 'Coffee Page',
				url: 'http://wordpress.local/6/',
				type: 'page',
				kind: 'post-type',
			},
		];

		expect(
			sortResults( results, 'coffee' ).map( ( { type } ) => type )
		).toEqual( [
			'page',
			'category',
			'post',
			'post_tag',
			'attachment',
			'post-format',
		] );
	} );

	it( 'takes a caller’s own order in place of the default', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Page',
				url: 'http://wordpress.local/1/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffee Tag',
				url: 'http://wordpress.local/2/',
				type: 'post_tag',
				kind: 'taxonomy',
			},
			{
				id: 3,
				title: 'Coffee Category',
				url: 'http://wordpress.local/3/',
				type: 'category',
				kind: 'taxonomy',
			},
		];

		expect(
			sortResults( results, 'coffee', [
				'category',
				'post_tag',
				'page',
			] ).map( ( { type } ) => type )
		).toEqual( [ 'category', 'post_tag', 'page' ] );
	} );

	it( 'still prefers a title that begins with the search term within one type', () => {
		const results = [
			{
				id: 1,
				title: 'Our Coffee',
				url: 'http://wordpress.local/1/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffee Roasting Guide For Beginners',
				url: 'http://wordpress.local/2/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// The score alone would favour the shorter title.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Coffee Roasting Guide For Beginners', 'Our Coffee' ] );
	} );

	it( 'ranks a type the order does not name with the closest one it does', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Genre',
				url: 'http://wordpress.local/genre/coffee-genre/',
				type: 'genre',
				kind: 'taxonomy',
			},
			{
				id: 2,
				title: 'Coffee Event',
				url: 'http://wordpress.local/event/coffee-event/',
				type: 'event',
				kind: 'post-type',
			},
		];

		// A custom taxonomy ranks with tags, a custom post type with posts, so
		// the post type leads.
		expect(
			sortResults( results, 'coffee' ).map( ( { type } ) => type )
		).toEqual( [ 'event', 'genre' ] );
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
