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
			case '/wp/v2/search?search=many&per_page=20&type=post':
				return Promise.resolve(
					Array.from( { length: 25 }, ( _, index ) => ( {
						id: 100 + index,
						title: `Many ${ index }`,
						url: `http://wordpress.local/many-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) )
				);
			case '/wp/v2/search?search=many&per_page=20&type=term':
				return Promise.resolve(
					Array.from( { length: 10 }, ( _, index ) => ( {
						id: 200 + index,
						// Matched by its body, so the title does not contain
						// what was typed.
						title: `Unrelated ${ index }`,
						url: `http://wordpress.local/unrelated-${ index }/`,
						type: 'category',
					} ) )
				);
			case '/wp/v2/search?search=few&per_page=20&type=post':
				return Promise.resolve(
					Array.from( { length: 5 }, ( _, index ) => ( {
						id: 300 + index,
						title: `Few ${ index }`,
						url: `http://wordpress.local/few-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) )
				);
			case '/wp/v2/search?search=few&per_page=20&type=term':
				return Promise.resolve(
					Array.from( { length: 30 }, ( _, index ) => ( {
						id: 400 + index,
						title: `Unrelated ${ index }`,
						url: `http://wordpress.local/unrelated-${ index }/`,
						type: 'category',
					} ) )
				);
			case '/wp/v2/search?search=many&per_page=20&type=post-format':
			case '/wp/v2/media?search=many&per_page=20':
			case '/wp/v2/search?search=few&per_page=20&type=post-format':
			case '/wp/v2/media?search=few&per_page=20':
				return Promise.resolve( [] );
			case '/wp/v2/search?search=&per_page=3&type=post':
			case '/wp/v2/search?search=&per_page=3&type=term':
			case '/wp/v2/search?search=&per_page=3&type=post-format':
				return Promise.resolve(
					Array.from( { length: 3 }, ( _, index ) => ( {
						id: 500 + index,
						title: `Initial ${ index }`,
						url: `http://wordpress.local/initial-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) )
				);
			case '/wp/v2/media?search=&per_page=3':
				return Promise.resolve( [] );
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
	it( 'returns every answer an unscoped search found, past the per page limit', () => {
		return fetchLinkSuggestions( 'many', { perPage: 20 } ).then(
			( suggestions ) => {
				// 25 titles contain "many" and are all returned; the 10 that
				// matched on a body rather than a title are dropped.
				expect( suggestions ).toHaveLength( 25 );
				expect(
					suggestions.every( ( { title } ) =>
						title.startsWith( 'Many' )
					)
				).toBe( true );
			}
		);
	} );

	it( 'drops results whose title does not contain what was typed', () => {
		return fetchLinkSuggestions( 'many', { perPage: 20 } ).then(
			( suggestions ) =>
				expect(
					suggestions.filter( ( { title } ) =>
						title.startsWith( 'Unrelated' )
					)
				).toHaveLength( 0 )
		);
	} );

	it( 'keeps the per page limit for a search narrowed to one type', () => {
		// One request, so `perPage` bounds it and `page` can page through it.
		return fetchLinkSuggestions( 'few', {
			type: 'term',
			perPage: 20,
		} ).then( ( suggestions ) => {
			expect( suggestions ).toHaveLength( 20 );
		} );
	} );

	describe( 'Initial search suggestions', () => {
		it( 'limits unscoped initial suggestions to the per page count', () => {
			// Nothing has been typed, so these are a preview rather than an
			// answer to a search, and there is nothing to lose by bounding
			// them. Without this an unscoped preview would show one page of
			// each type at once.
			return fetchLinkSuggestions( '', {
				isInitialSuggestions: true,
			} ).then( ( suggestions ) =>
				expect( suggestions ).toHaveLength( 3 )
			);
		} );

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
		// Only 7 contains the string "travel tips"; the others merely contain
		// one of the words, so they rank below it whatever their type.
		expect( order ).toEqual( [
			7, // begins with "travel tips"
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

		// The page outweighs the category, and both contain what was typed.
		expect(
			sortResults( results, 'contact' ).map( ( { title } ) => title )
		).toEqual( [ 'Contact us today', 'Contact', 'Hello world!' ] );
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
		// 1, 3 and 4 all begin with the search and cover all of it, so none is
		// a better answer than another and they keep the order they arrived
		// in. 2 only contains the search inside a longer word.
		expect( order ).toEqual( [ 1, 3, 4, 2 ] );
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

	it( 'ranks a page above an attachment named after a file that begins with the search', () => {
		const results = [
			{
				id: 1,
				title: 'coffee-beans',
				url: 'http://wordpress.local/wp-content/uploads/coffee-beans.jpg',
				type: 'attachment',
				kind: 'media',
			},
			{
				id: 2,
				title: 'Our Coffee',
				url: 'http://wordpress.local/our-coffee/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// An attachment is named after its file, so it very often begins with
		// what was typed. That must not lift it above a page, or a media
		// library fills the list again.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Our Coffee', 'coffee-beans' ] );
	} );

	it( 'matches the search as a string, not as whole words', () => {
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

		// "Coffeehouse Rules" begins with the string that was typed, so it
		// outranks a title that contains the same string further in.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Coffeehouse Rules', 'Notes On Coffee' ] );
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

	it( 'ranks content, then taxonomies, then post formats, then attachments', () => {
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

		// Ranked by search type, so a page and a post are worth the same, as are
		// a category and a tag. Within a band the order they arrived in stands.
		expect(
			sortResults( results, 'coffee' ).map( ( { type } ) => type )
		).toEqual( [
			'post',
			'page',
			'post_tag',
			'category',
			'post-format',
			'attachment',
		] );
	} );

	it( 'does not mark a title down for being long', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee',
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

		// Both begin with the search and cover all of it, so neither is a better
		// answer and they keep the order they arrived in.
		expect(
			sortResults( results, 'coffee' ).map( ( { id } ) => id )
		).toEqual( [ 1, 2 ] );
	} );

	it( 'does not reward a title for repeating the search term', () => {
		const results = [
			{
				id: 1,
				title: 'News Flash News',
				url: 'http://wordpress.local/1/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'News',
				url: 'http://wordpress.local/2/',
				type: 'page',
				kind: 'post-type',
			},
		];

		expect(
			sortResults( results, 'news' ).map( ( { id } ) => id )
		).toEqual( [ 1, 2 ] );
	} );

	it( 'covers more of the search before less of it', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Beans',
				url: 'http://wordpress.local/1/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffee Bean Roasting',
				url: 'http://wordpress.local/2/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// Both begin with the string typed, so the score decides: the second
		// has both words whole, the first only has "coffee" whole and finds
		// "bean" inside "beans".
		expect(
			sortResults( results, 'coffee bean' ).map( ( { id } ) => id )
		).toEqual( [ 2, 1 ] );
	} );

	it( 'ranks a title that does not contain the search below every one that does', () => {
		const results = [
			{
				id: 1,
				title: 'Morning Ritual',
				url: 'http://wordpress.local/morning-ritual/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Photo Of A Coffeehouse',
				url: 'http://wordpress.local/photo-of-a-coffeehouse.jpg',
				type: 'attachment',
				kind: 'media',
			},
		];

		// WordPress returns titles that match on a body or excerpt, so a page
		// with no sign of the search in its title reaches us. Being the
		// best-ranked type does not make it an answer, and the attachment only
		// has the search inside a longer word, which is the weakest match there
		// is — but it is still a match.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [ 'Photo Of A Coffeehouse', 'Morning Ritual' ] );
	} );

	it( 'matches a title WordPress has texturized', () => {
		const results = [
			{
				id: 1,
				title: 'Barista S Best Coffee',
				url: 'http://wordpress.local/barista-s-best-coffee/',
				type: 'page',
				kind: 'post-type',
			},
			{
				// `get_the_title()` runs `wptexturize`, so a title written with
				// straight quotes comes back with curly ones.
				id: 2,
				title: 'Barista\u2019s \u201cBest\u201d Coffee',
				url: 'http://wordpress.local/baristas-best-coffee/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// Typed with the straight quotes that are the only ones on a keyboard.
		expect(
			sortResults( results, 'barista\'s "best" coffee' ).map(
				( { id } ) => id
			)
		).toEqual( [ 2, 1 ] );
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
