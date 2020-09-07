/**
 * Internal dependencies
 */
import items, {
	categories,
	collections,
	paragraphItem,
	advancedParagraphItem,
	moreItem,
	youtubeItem,
	paragraphEmbedItem,
} from './fixtures';
import {
	getNormalizedSearchTerms,
	searchBlockItems,
	getItemSearchRank,
} from '../search-items';

describe( 'getNormalizedSearchTerms', () => {
	it( 'should return an empty array when no words detected', () => {
		expect( getNormalizedSearchTerms( ' - !? *** ' ) ).toEqual( [] );
	} );

	it( 'should remove diacritics', () => {
		expect( getNormalizedSearchTerms( 'média' ) ).toEqual( [ 'media' ] );
	} );

	it( 'should trim whitespace', () => {
		expect( getNormalizedSearchTerms( '  média  ' ) ).toEqual( [
			'media',
		] );
	} );

	it( 'should convert to lowercase', () => {
		expect( getNormalizedSearchTerms( '  Média  ' ) ).toEqual( [
			'media',
		] );
	} );

	it( 'should extract only words', () => {
		expect(
			getNormalizedSearchTerms( '  Média  &   Text Tag-Cloud > 123' )
		).toEqual( [ 'media', 'text', 'tag', 'cloud', '123' ] );
	} );
} );

describe( 'getItemSearchRank', () => {
	it( 'should return the highest rank for exact matches', () => {
		expect( getItemSearchRank( { title: 'Button' }, 'button' ) ).toEqual(
			30
		);
	} );

	it( 'should return a high rank if the start of title matches the search term', () => {
		expect(
			getItemSearchRank( { title: 'Button Advanced' }, 'button' )
		).toEqual( 20 );
	} );

	it( 'should add a bonus point to items with core namespaces', () => {
		expect(
			getItemSearchRank(
				{ name: 'core/button', title: 'Button' },
				'button'
			)
		).toEqual( 31 );
	} );

	it( 'should have a small rank if it matches keywords, category...', () => {
		expect(
			getItemSearchRank(
				{ title: 'link', keywords: [ 'button' ] },
				'button'
			)
		).toEqual( 10 );
	} );
} );

describe( 'searchBlockItems', () => {
	it( 'should return back all items when no terms detected', () => {
		expect(
			searchBlockItems( items, categories, collections, ' - ? * ' )
		).toBe( items );
	} );

	it( 'should search items using the title ignoring case', () => {
		expect(
			searchBlockItems( items, categories, collections, 'paragraph' )
		).toEqual( [
			paragraphItem,
			advancedParagraphItem,
			paragraphEmbedItem,
		] );
	} );

	it( 'should use the ranking algorithm to order the blocks', () => {
		expect(
			searchBlockItems( items, categories, collections, 'a para' )
		).toEqual( [
			paragraphEmbedItem,
			paragraphItem,
			advancedParagraphItem,
		] );
	} );

	it( 'should search items using the keywords and partial terms', () => {
		expect(
			searchBlockItems( items, categories, collections, 'GOOGL' )
		).toEqual( [ youtubeItem ] );
	} );

	it( 'should search items using the categories', () => {
		expect(
			searchBlockItems( items, categories, collections, 'DESIGN' )
		).toEqual( [ moreItem ] );
	} );

	it( 'should ignore a leading slash on a search term', () => {
		expect(
			searchBlockItems( items, categories, collections, '/GOOGL' )
		).toEqual( [ youtubeItem ] );
	} );

	it( 'should match words using the mix of the title, category and keywords', () => {
		expect(
			searchBlockItems(
				items,
				categories,
				collections,
				'youtube embed video'
			)
		).toEqual( [ youtubeItem ] );
	} );

	it( 'should match words using also variations and return all matched variations', () => {
		const filteredItems = searchBlockItems(
			items,
			categories,
			collections,
			'variation'
		);

		expect( filteredItems ).toHaveLength( 1 );
		expect( filteredItems[ 0 ].variations ).toHaveLength( 3 );
	} );

	it( 'should match words using also variations and filter out unmatched variations', () => {
		const filteredItems = searchBlockItems(
			items,
			categories,
			collections,
			'variations two three'
		);

		expect( filteredItems ).toHaveLength( 1 );
		expect( filteredItems[ 0 ].variations ).toHaveLength( 2 );
		expect( filteredItems[ 0 ].variations[ 0 ].title ).toBe(
			'Variation Two'
		);
		expect( filteredItems[ 0 ].variations[ 1 ].title ).toBe(
			'Variation Three'
		);
	} );

	it( 'should search in variation keywords if exist', () => {
		const filteredItems = searchBlockItems(
			items,
			categories,
			collections,
			'music'
		);
		expect( filteredItems ).toHaveLength( 1 );
		const [ { title, variations } ] = filteredItems;
		expect( title ).toBe( 'With Variations' );
		expect( variations[ 0 ].title ).toBe( 'Variation Three' );
	} );

	it( 'should search in both blocks/variation keywords if exist', () => {
		const filteredItems = searchBlockItems(
			items,
			categories,
			collections,
			'random'
		);
		expect( filteredItems ).toHaveLength( 2 );
		expect( filteredItems ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { title: 'Paragraph' } ),
				expect.objectContaining( {
					title: 'With Variations',
					variations: [
						{
							name: 'variation-three',
							title: 'Variation Three',
							keywords: expect.arrayContaining( [
								'music',
								'random',
							] ),
						},
					],
				} ),
			] )
		);
	} );
} );
