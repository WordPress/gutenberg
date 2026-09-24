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
				return Promise.resolve( [
					...Array.from( { length: 30 }, ( _, index ) => ( {
						id: 400 + index,
						title: `Few ${ index }`,
						url: `http://wordpress.local/few-${ index }/`,
						type: 'category',
					} ) ),
					// Matched on a body, so the title holds nothing typed.
					...Array.from( { length: 10 }, ( _, index ) => ( {
						id: 450 + index,
						title: `Unrelated ${ index }`,
						url: `http://wordpress.local/unrelated-${ index }/`,
						type: 'category',
					} ) ),
				] );
			case '/wp/v2/search?search=few%20notes&per_page=20&type=post':
				return Promise.resolve( [
					...Array.from( { length: 5 }, ( _, index ) => ( {
						id: 600 + index,
						title: `Few Notes ${ index }`,
						url: `http://wordpress.local/few-notes-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) ),
					// Holds neither word; WordPress matched a body. A page, so
					// it outranks the partial matches on type.
					...Array.from( { length: 30 }, ( _, index ) => ( {
						id: 800 + index,
						title: `Unrelated ${ index }`,
						url: `http://wordpress.local/unrelated-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) ),
				] );
			case '/wp/v2/search?search=few%20notes&per_page=20&type=term':
				return Promise.resolve(
					Array.from( { length: 5 }, ( _, index ) => ( {
						// Holds "notes" but not "few".
						id: 700 + index,
						title: `Notes ${ index }`,
						url: `http://wordpress.local/notes-${ index }/`,
						type: 'category',
					} ) )
				);
			case '/wp/v2/search?search=tea%20leaves&per_page=20&type=post':
				return Promise.resolve( [
					...Array.from( { length: 5 }, ( _, index ) => ( {
						id: 900 + index,
						title: `Tea Leaves ${ index }`,
						url: `http://wordpress.local/tea-leaves-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) ),
					// Holds neither word; WordPress matched a body.
					...Array.from( { length: 10 }, ( _, index ) => ( {
						id: 950 + index,
						title: `Unrelated ${ index }`,
						url: `http://wordpress.local/unrelated-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) ),
				] );
			case '/wp/v2/search?search=tea%20leaves&per_page=20&type=term':
				return Promise.resolve(
					// Holds "leaves" but not "tea".
					Array.from( { length: 20 }, ( _, index ) => ( {
						id: 1000 + index,
						title: `Leaves ${ index }`,
						url: `http://wordpress.local/leaves-${ index }/`,
						type: 'category',
					} ) )
				);
			case '/wp/v2/search?search=tea%20leaves&per_page=20&type=post-format':
			case '/wp/v2/media?search=tea%20leaves&per_page=20':
			case '/wp/v2/search?search=few%20notes&per_page=20&type=post-format':
			case '/wp/v2/media?search=few%20notes&per_page=20':
			case '/wp/v2/search?search=many&per_page=20&type=post-format':
			case '/wp/v2/media?search=many&per_page=20':
			case '/wp/v2/search?search=brewing&per_page=20&type=term':
				return Promise.resolve( [
					...Array.from( { length: 3 }, ( _, index ) => ( {
						id: 500 + index,
						title: `Brewing ${ index }`,
						url: `http://wordpress.local/brewing-${ index }/`,
						type: 'category',
					} ) ),
					...Array.from( { length: 10 }, ( _, index ) => ( {
						id: 550 + index,
						title: `Unrelated ${ index }`,
						url: `http://wordpress.local/unrelated-${ index }/`,
						type: 'category',
					} ) ),
				] );
			case '/wp/v2/search?search=few&per_page=20&type=post-format':
			case '/wp/v2/media?search=few&per_page=20':
				return Promise.resolve( [] );
			case '/wp/v2/search?search=&per_page=3&type=post':
				return Promise.resolve(
					Array.from( { length: 3 }, ( _, index ) => ( {
						id: 500 + index,
						title: `Initial Page ${ index }`,
						url: `http://wordpress.local/initial-page-${ index }/`,
						type: 'post',
						subtype: 'page',
					} ) )
				);
			case '/wp/v2/search?search=&per_page=3&type=term':
				return Promise.resolve(
					Array.from( { length: 3 }, ( _, index ) => ( {
						id: 510 + index,
						title: `Initial Category ${ index }`,
						url: `http://wordpress.local/initial-category-${ index }/`,
						type: 'category',
					} ) )
				);
			case '/wp/v2/search?search=&per_page=3&type=post-format':
				return Promise.resolve(
					Array.from( { length: 3 }, ( _, index ) => ( {
						id: 520 + index,
						title: `Initial Format ${ index }`,
						url: `http://wordpress.local/initial-format-${ index }/`,
						type: 'post-format',
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

	it( 'returns no more than the caller asked for', () => {
		return fetchLinkSuggestions( 'many', { perPage: 20 } ).then(
			( suggestions ) => expect( suggestions ).toHaveLength( 20 )
		);
	} );

	it( 'leaves out titles holding nothing that was typed, ordered by best matches first', () => {
		// 5 titles hold both words typed and 5 hold one of them. The 30
		// holding neither were matched on a body, so they are not offered at
		// all, and the whole-word matches come before the partial ones.
		const startsWith = ( titles, prefix ) =>
			titles.every( ( title ) => title.startsWith( prefix ) );

		return fetchLinkSuggestions( 'few notes', {} ).then(
			( suggestions ) => {
				const titles = suggestions.map( ( { title } ) => title );

				expect( titles ).toHaveLength( 10 );
				expect( startsWith( titles.slice( 0, 5 ), 'Few Notes' ) ).toBe(
					true
				);
				expect( startsWith( titles.slice( 5 ), 'Notes' ) ).toBe( true );
			}
		);
	} );

	it( 'keeps every title matching a word typed, past the per page limit on default searches', () => {
		// 5 titles hold both words typed and 20 hold one of them, so 25 match
		// and none of them can be cut, though the limit is 20. The 10 holding
		// neither word are what the cut takes.
		const countStartingWith = ( titles, prefix ) =>
			titles.filter( ( title ) => title.startsWith( prefix ) ).length;

		return fetchLinkSuggestions( 'tea leaves', {} ).then(
			( suggestions ) => {
				const titles = suggestions.map( ( { title } ) => title );

				expect( titles ).toHaveLength( 25 );
				expect( countStartingWith( titles, 'Tea Leaves' ) ).toBe( 5 );
				expect( countStartingWith( titles, 'Leaves' ) ).toBe( 20 );
				expect( countStartingWith( titles, 'Unrelated' ) ).toBe( 0 );
			}
		);
	} );

	it( 'leaves out titles holding nothing typed on a scoped search too', () => {
		// The endpoint offers 3 titles holding the word and 10 matched on a
		// body. Only the 3 are offered, though `perPage` allows 20.
		return fetchLinkSuggestions( 'brewing', {
			type: 'term',
			perPage: 20,
		} ).then( ( suggestions ) => expect( suggestions ).toHaveLength( 3 ) );
	} );

	it( 'specific type searches respect the per page limit', () => {
		// One request, so `perPage` bounds it and `page` can page through the
		// rest. The endpoint offers 30 here; only 20 are returned.
		return fetchLinkSuggestions( 'few', {
			type: 'term',
			perPage: 20,
		} ).then( ( suggestions ) => expect( suggestions ).toHaveLength( 20 ) );
	} );

	describe( 'Initial search suggestions', () => {
		it( 'limits unscoped initial suggestions to the per page count', () => {
			return fetchLinkSuggestions( '', {
				isInitialSuggestions: true,
			} ).then( ( suggestions ) =>
				expect( suggestions ).toHaveLength( 3 )
			);
		} );

		it( 'orders initial suggestions by the types a caller prefers', () => {
			// Nothing is typed, so the type is all there is to order them by.
			// Without a preference the usual order leads with the page.
			return fetchLinkSuggestions( '', {
				isInitialSuggestions: true,
				preferTypes: [ { type: 'term', subtype: 'category' } ],
			} ).then( ( suggestions ) =>
				expect( suggestions.map( ( { title } ) => title ) ).toEqual( [
					'Initial Category 0',
					'Initial Category 1',
					'Initial Category 2',
				] )
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

		expect(
			sortResults( results, 'contact' ).map( ( { title } ) => title )
		).toEqual( [
			'Contact us today', // begins with the search and is content (page)
			'Contact', // begins with the search and is a taxonomy term
			'Hello world!', // does not contain the search
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
			( result ) => result.title
		);
		expect( order ).toEqual( [
			'News', // begins with 'News', and has the word whole
			'News Flash News', // same as above, repeating the word does not increase the ranking
			'News', // Same as the above, ordered by original order since it ranks the same
			'Newspaper', // has the word inside a longer one, not the full word
		] );
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

		expect(
			sortResults( results, 'a' ).map( ( { title } ) => title )
		).toEqual( [
			'A day trip from Stockholm to Swedish countryside towns', // begins with it
			'Tips for travel with a young baby', // only contains it
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

		// It's more common to link to content over attachments, so pages with a
		// matching word in the title should rank above attachments, even if the
		// attachment begins with the word.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [
			'Our Coffee', // a page, which the type ranks first
			'coffee-beans', // begins with it, but that cannot lift an attachment
		] );
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
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 3,
				title: 'Coffee of the World',
				url: 'http://wordpress.local/category/notes-on-coffee/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// "Coffeehouse Rules" begins with the string that was typed, so it
		// outranks a title that contains the same string further in.
		expect(
			sortResults( results, 'coffee' ).map( ( { title } ) => title )
		).toEqual( [
			'Coffee of the World', // begins with the string, full word
			'Coffeehouse Rules', // begins with the string, inside a longer word
			'Notes On Coffee', // contains the string, further in
		] );
	} );

	it( 'ranks matches with all the words above partial matches', () => {
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
				title: 'Our Coffee is a Guide',
				url: 'http://wordpress.local/category/our-coffee-guide/',
				type: 'category',
				kind: 'taxonomy',
			},
			{
				id: 1,
				title: 'Our Coffee Guide',
				url: 'http://wordpress.local/attachment/our-coffee-is-a-guide',
				type: 'attachment',
				kind: 'media',
			},
		];

		// The page has only one of the two words typed.
		expect(
			sortResults( results, 'coffee guide' ).map( ( { title } ) => title )
		).toEqual( [
			'Our Coffee Guide', // contains "coffee guide" as a string
			'Our Coffee is a Guide', // contains "coffee" and "guide" strings
			'Coffee', // has only one of the two words typed
		] );
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
			'post', // content, in the order they arrived
			'page',
			'post_tag', // then taxonomies, likewise
			'category',
			'post-format',
			'attachment',
		] );
	} );

	it( 'handles curly quotes and quotes in searches', () => {
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
				( { title } ) => title
			)
		).toEqual( [
			'Barista\u2019s \u201cBest\u201d Coffee', // the same string, once the quotes match
			'Barista S Best Coffee', // has the words, but not as one string
		] );
	} );

	it( 'ranks a title holding both words typed above one holding a single word whole', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Beans',
				url: 'http://wordpress.local/coffee-beans/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffeehouse Guidebook',
				url: 'http://wordpress.local/coffeehouse-guidebook/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// How many of the words typed a title holds is compared before how well
		// it holds them. Both are pages, so nothing else separates them.
		expect(
			sortResults( results, 'coffee guide' ).map( ( { title } ) => title )
		).toEqual( [
			'Coffeehouse Guidebook', // holds both, each inside a longer word
			'Coffee Beans', // holds "coffee" whole, and no "guide" at all
		] );
	} );

	it( 'ranks a word found in a longer one by how much of it that word is', () => {
		const results = [
			{
				id: 1,
				title: 'Caterpillar',
				url: 'http://wordpress.local/caterpillar/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Catering',
				url: 'http://wordpress.local/catering/',
				type: 'page',
				kind: 'post-type',
			},
		];

		// "cater" is five of the eight letters of "catering" and five of the
		// eleven of "caterpillar", so it answers the shorter word better.
		expect(
			sortResults( results, 'cater' ).map( ( { title } ) => title )
		).toEqual( [ 'Catering', 'Caterpillar' ] );
	} );

	it( 'leads with a type the caller prefers', () => {
		const results = [
			{
				id: 1,
				title: 'Uncategorized Notes',
				url: 'http://wordpress.local/uncategorized-notes/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Uncategorized',
				url: 'http://wordpress.local/category/uncategorized/',
				type: 'category',
				kind: 'taxonomy',
			},
		];

		// Pages lead by default.
		expect(
			sortResults( results, 'uncategorized' ).map( ( { type } ) => type )
		).toEqual( [ 'page', 'category' ] );

		// A caller editing a category link asks for categories instead.
		expect(
			sortResults( results, 'uncategorized', [
				{ type: 'term', subtype: 'category' },
			] ).map( ( { type } ) => type )
		).toEqual( [ 'category', 'page' ] );
	} );

	it( 'keeps the usual order below the types a caller prefers', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Photo',
				url: 'http://wordpress.local/coffee-photo.jpg',
				type: 'attachment',
				kind: 'media',
			},
			{
				id: 2,
				title: 'Coffee Page',
				url: 'http://wordpress.local/coffee-page/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 3,
				title: 'Coffee Tag',
				url: 'http://wordpress.local/tag/coffee-tag/',
				type: 'post_tag',
				kind: 'taxonomy',
			},
		];

		// Tags lead; the rest keep their usual places behind them.
		expect(
			sortResults( results, 'coffee', [
				{ type: 'term', subtype: 'post_tag' },
			] ).map( ( { type } ) => type )
		).toEqual( [ 'post_tag', 'page', 'attachment' ] );
	} );

	it( 'prefers a whole search type when no subtype is named', () => {
		const results = [
			{
				id: 1,
				title: 'Coffee Page',
				url: 'http://wordpress.local/coffee-page/',
				type: 'page',
				kind: 'post-type',
			},
			{
				id: 2,
				title: 'Coffee Genre',
				url: 'http://wordpress.local/genre/coffee-genre/',
				type: 'genre',
				kind: 'taxonomy',
			},
		];

		// A custom taxonomy is covered by the bare entry, without being named.
		expect(
			sortResults( results, 'coffee', [ 'term' ] ).map(
				( { type } ) => type
			)
		).toEqual( [ 'genre', 'page' ] );
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
